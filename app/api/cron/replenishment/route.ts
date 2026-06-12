export const runtime = 'nodejs';
export const maxDuration = 60;
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendReplenishmentMaili, sendAbonelikHatirlatma } from "../../../../lib/email";

// "Maman bitiyor" otomatik hatırlatma (replenishment).
// Vercel cron her gün çağırır (vercel.json). ~28 gün önce ödeme yapıp DAHA
// SONRA sipariş vermemiş (yani hâlâ "son siparişi o olan") müşterilere %10
// kuponlu yenileme e-postası atar.
//
// TEKRAR GÖNDERMEZ: 1 günlük bant (28-29 gün önce) + günlük cron = her sipariş
// tam olarak bir kez yakalanır; ekstra "gönderildi" tablosuna gerek yok.
//
// GÜVENLİK: Vercel cron, CRON_SECRET env'i set ise isteğe
// `Authorization: Bearer <CRON_SECRET>` ekler. Manuel test için
// `?secret=<CRON_SECRET>` query'si de kabul edilir. CRON_SECRET yoksa 401.
//
// TEST: GET /api/cron/replenishment?secret=...&dry=1  → kimlere gideceğini
// listeler, MAİL ATMAZ. limit=N ile sınırla.

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const HATIRLATMA_GUN = 28;
const KUPON_KOD = "YENILE10";
const ABONE_KOD = "ABONE10";
const GUN_MS = 24 * 60 * 60 * 1000;

type SiparisRow = { siparis_no: string; ad: string | null; email: string | null; urunler: unknown; created_at: string };

// Siparişteki ilk ürünün adını (kişiselleştirme için) güvenle çıkar.
function ilkUrunAdi(urunler: unknown): string | undefined {
  let arr: unknown = urunler;
  if (typeof arr === "string") { try { arr = JSON.parse(arr); } catch { return undefined; } }
  if (!Array.isArray(arr) || arr.length === 0) return undefined;
  const u = arr[0] as Record<string, unknown>;
  const ad = (u.ad || u.isim || u.name || u.baslik) as string | undefined;
  return typeof ad === "string" && ad.trim() ? ad.trim() : undefined;
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET || "";
  const auth = req.headers.get("authorization") || "";
  const url = new URL(req.url);
  const yetkili = !!cronSecret && (auth === `Bearer ${cronSecret}` || url.searchParams.get("secret") === cronSecret);
  if (!yetkili) return NextResponse.json({ error: "yetkisiz" }, { status: 401, headers: { "Cache-Control": "no-store" } });

  const dry = url.searchParams.get("dry") === "1";
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "100", 10) || 100, 1), 500);

  // 1) YENILE10 kuponunu garanti et (%10, 60 gün geçerli). Yoksa oluştur,
  //    varsa süresini/aktifliğini tazele. (kod tekilliğine güvenmeden.)
  try {
    const bitis = new Date(Date.now() + 60 * GUN_MS).toISOString();
    const { data: mevcut } = await supabaseAdmin.from("kuponlar").select("kod").eq("kod", KUPON_KOD).maybeSingle();
    if (!mevcut) {
      await supabaseAdmin.from("kuponlar").insert({ kod: KUPON_KOD, indirim_tipi: "yuzde", indirim_degeri: 10, min_sepet: 0, aktif: true, bitis_tarihi: bitis });
    } else {
      await supabaseAdmin.from("kuponlar").update({ aktif: true, bitis_tarihi: bitis }).eq("kod", KUPON_KOD);
    }
  } catch (e) {
    console.error("[cron/replenishment] kupon hazirlama hatasi:", e);
  }

  // Önizleme modu: ?onizleme=email → sipariş taraması yapmadan verilen adrese
  // ÖRNEK bir replenishment maili atar (şablon/tasarımı görmek için test).
  const onizleme = (url.searchParams.get("onizleme") || "").trim();
  if (onizleme) {
    if (!onizleme.includes("@")) {
      return NextResponse.json({ error: "gecersiz email" }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }
    const tip = url.searchParams.get("tip"); // "abone" → abonelik maili; aksi → replenishment
    const ok = tip === "abone"
      ? await sendAbonelikHatirlatma({ email: onizleme, ad: "Değerli Müşterimiz", urunAdi: "Royal Canin Kitten 10 Kg", urunSlug: "", kod: ABONE_KOD })
      : await sendReplenishmentMaili({ email: onizleme, ad: "Değerli Müşterimiz", sonUrun: "Royal Canin Kitten 10 Kg", kod: KUPON_KOD });
    return NextResponse.json({ ok, onizleme, tip: tip === "abone" ? "abonelik" : "replenishment", mesaj: "Örnek mail gönderildi (gelen kutunu/spam'i kontrol et)" }, { headers: { "Cache-Control": "no-store" } });
  }

  // 1b) ABONELİKLER: ABONE10 kuponunu garanti et; dönemi gelen abonelere
  //     hatırlatma at + sonraki_tarih'i ilerlet. Aktif abone e-postalarını da
  //     topla → replenishment blanket mailinden hariç tut (çift mail olmasın).
  //     (abonelikler tablosu yoksa try/catch yutar, replenishment'a devam eder.)
  let aboneGonderildi = 0;
  const aktifAboneEmailler = new Set<string>();
  const aboneGidecekler: string[] = [];
  try {
    const bitisA = new Date(Date.now() + 60 * GUN_MS).toISOString();
    const { data: mevcutA } = await supabaseAdmin.from("kuponlar").select("kod").eq("kod", ABONE_KOD).maybeSingle();
    if (!mevcutA) await supabaseAdmin.from("kuponlar").insert({ kod: ABONE_KOD, indirim_tipi: "yuzde", indirim_degeri: 10, min_sepet: 0, aktif: true, bitis_tarihi: bitisA });
    else await supabaseAdmin.from("kuponlar").update({ aktif: true, bitis_tarihi: bitisA }).eq("kod", ABONE_KOD);

    const { data: aktifAboneler } = await supabaseAdmin.from("abonelikler").select("email").eq("aktif", true);
    for (const a of (aktifAboneler || []) as { email: string | null }[]) {
      if (a.email) aktifAboneEmailler.add(a.email.trim().toLowerCase());
    }

    const { data: dueAbone } = await supabaseAdmin
      .from("abonelikler")
      .select("id, email, urun_adi, urun_slug, cadence_gun")
      .eq("aktif", true)
      .lte("sonraki_tarih", new Date().toISOString())
      .limit(limit);
    for (const ab of (dueAbone || []) as { id: number; email: string | null; urun_adi: string | null; urun_slug: string | null; cadence_gun: number }[]) {
      if (!ab.email) continue;
      if (dry) { aboneGidecekler.push(`${ab.email} (${ab.urun_adi || "ürün"})`); aboneGonderildi++; continue; }
      await sendAbonelikHatirlatma({ email: ab.email, urunAdi: ab.urun_adi || undefined, urunSlug: ab.urun_slug || undefined, kod: ABONE_KOD });
      const yeniSonraki = new Date(Date.now() + (ab.cadence_gun || 28) * GUN_MS).toISOString();
      await supabaseAdmin.from("abonelikler").update({ sonraki_tarih: yeniSonraki, son_hatirlatma: new Date().toISOString() }).eq("id", ab.id);
      aboneGonderildi++;
      await new Promise((r) => setTimeout(r, 600));
    }
  } catch (e) {
    console.error("[cron/replenishment] abonelik islem hatasi (tablo yoksa normal):", e);
  }

  // 2) ~28 gün önce (1 günlük bant) ödenmiş siparişler.
  const ustSinir = new Date(Date.now() - HATIRLATMA_GUN * GUN_MS).toISOString();
  const altSinir = new Date(Date.now() - (HATIRLATMA_GUN + 1) * GUN_MS).toISOString();
  const { data: adaylar, error } = await supabaseAdmin
    .from("siparisler")
    .select("siparis_no, ad, email, urunler, created_at")
    .eq("odeme_durumu", "odendi")
    .gte("created_at", altSinir)
    .lt("created_at", ustSinir)
    .not("email", "is", null)
    .neq("email", "")
    .limit(limit);

  if (error) {
    console.error("[cron/replenishment] sorgu hatasi:", error);
    return NextResponse.json({ error: "sorgu hatasi" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }

  const gorulen = new Set<string>();
  let gonderildi = 0, atlandi = 0;
  const gidecekler: string[] = [];

  for (const s of (adaylar || []) as SiparisRow[]) {
    const email = (s.email || "").trim().toLowerCase();
    // Zaten görülmüş veya AKTİF ABONE ise atla (abone, abonelik mailini alır).
    if (!email || gorulen.has(email) || aktifAboneEmailler.has(email)) { atlandi++; continue; }
    gorulen.add(email);

    // Bu siparişten SONRA başka sipariş vermiş mi? Vermişse müşteri zaten
    // aktif → hatırlatma gönderme.
    const { count } = await supabaseAdmin
      .from("siparisler")
      .select("*", { count: "exact", head: true })
      .eq("email", s.email!)
      .gt("created_at", s.created_at);
    if (count && count > 0) { atlandi++; continue; }

    const sonUrun = ilkUrunAdi(s.urunler);
    if (dry) {
      gidecekler.push(`${email} (${s.siparis_no}${sonUrun ? " · " + sonUrun : ""})`);
      gonderildi++;
      continue;
    }
    const ok = await sendReplenishmentMaili({ email: s.email!, ad: s.ad || undefined, sonUrun, kod: KUPON_KOD });
    if (ok) gonderildi++; else atlandi++;
    await new Promise((r) => setTimeout(r, 600)); // Resend rate limit (~2/sn)
  }

  console.log("[cron/replenishment] bitti:", { dry, taranan: (adaylar || []).length, replenishment: gonderildi, abone: aboneGonderildi, atlandi });
  return NextResponse.json(
    {
      ok: true, dry,
      abone_gonderildi: aboneGonderildi,
      replenishment_gonderildi: gonderildi,
      taranan: (adaylar || []).length, atlandi,
      ...(dry ? { abone_gidecekler: aboneGidecekler, replenishment_gidecekler: gidecekler } : {}),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
