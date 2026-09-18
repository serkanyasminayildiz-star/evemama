export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import * as crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { sendSiparisOnayMaili } from "../../../../lib/email";

// ÖDEME MUTABAKATI (18 Eyl 2026). Callback tek nokta arıza: iyzico bazı
// ödemelerde (yüksek tutar / 3DS) callback'i göndermiyor → kart çekiliyor ama
// sipariş oluşmuyor (17-18 Eyl'de Ferhat/Şeniz/Fatma böyle kayboldu). Bu cron
// iyzico'yu KAYNAK-DOĞRU kabul eder: odeme_gecici'de bekleyen (callback'in
// silemediği) her token'ı iyzico'ya doğrular ve BAŞARILI olanların siparişini
// oluşturur. Callback yine denenir; bu yalnız güvenlik ağı.
//
// İDEMPOTENT: sipariş iyzico_payment_id (gerçek çekim kimliği) VE iyzico_token
// ile kontrol edilir → callback ya da önceki cron zaten oluşturduysa atlanır,
// aynı oturumun farklı token'ları tek paymentId'de birleşir (mükerrer yok).
//
// Vercel cron: 10 dk'da bir. Manuel: ?secret=<CRON_SECRET> veya Bearer ADMIN_SIFRE.
const ADMIN_SIFRE = "evemama2025";
const noStore = { "Cache-Control": "no-store" };

const IYZICO_API_KEY = process.env.IYZICO_API_KEY || "";
const IYZICO_SECRET_KEY = process.env.IYZICO_SECRET_KEY || "";
const IYZICO_BASE_URL = process.env.IYZICO_BASE_URL || "https://api.iyzipay.com";
const ENDPOINT = "/payment/iyzipos/checkoutform/auth/ecom/detail";

const YENI_ESIK_MS = 3 * 60_000;  // 3 dk'dan yeni gecici'ye dokunma (canlı callback ile yarışma)
const KAP = 50;                    // koşu başına en fazla token (süre sınırı)

function rnd(): string { return process.hrtime()[0] + Math.random().toString(8).slice(2); }
function auth(randomString: string, body: Record<string, unknown>): string {
  const sig = crypto.createHmac("sha256", IYZICO_SECRET_KEY).update(randomString + ENDPOINT + JSON.stringify(body)).digest("hex");
  return "IYZWSv2 " + Buffer.from([`apiKey:${IYZICO_API_KEY}`, `randomKey:${randomString}`, `signature:${sig}`].join("&")).toString("base64");
}
async function iyzicoDetay(token: string): Promise<Record<string, unknown>> {
  const reqBody = { locale: "tr", token };
  for (let d = 0; d < 2; d++) {
    const rs = rnd();
    try {
      const r = await fetch(`${IYZICO_BASE_URL}${ENDPOINT}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: auth(rs, reqBody), "x-iyzi-rnd": rs, "x-iyzi-client-version": "iyzipay-node-2.0.65" },
        body: JSON.stringify(reqBody),
      });
      return await r.json();
    } catch (e) { if (d === 1) return { _fetchHata: e instanceof Error ? e.message : String(e) }; }
  }
  return {};
}

type Kalem = { id?: number | string; quantity?: number; adet?: number };
function kalemleriCoz(ham: unknown): Kalem[] {
  if (typeof ham === "string") { try { return JSON.parse(ham); } catch { return []; } }
  return Array.isArray(ham) ? ham : [];
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const cronSecret = process.env.CRON_SECRET || "";
  const authHdr = req.headers.get("authorization") || "";
  const yetkili =
    (!!cronSecret && (authHdr === `Bearer ${cronSecret}` || url.searchParams.get("secret") === cronSecret)) ||
    authHdr === `Bearer ${ADMIN_SIFRE}`;
  if (!yetkili) return NextResponse.json({ error: "yetkisiz" }, { status: 401, headers: noStore });

  const dry = url.searchParams.get("dry") === "1";
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  // Callback'in silemediği (bekleyen) geçici kayıtlar — 3 dk'dan eski olanlar.
  const esik = new Date(Date.now() - YENI_ESIK_MS).toISOString();
  const { data: geciciler, error } = await db
    .from("odeme_gecici").select("*").lt("created_at", esik).order("created_at", { ascending: true }).limit(KAP);
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: noStore });
  if (!geciciler?.length) return NextResponse.json({ ok: true, taranan: 0, olusan: 0, mesaj: "bekleyen kayıt yok" }, { headers: noStore });

  const gorulen = new Set<string>();
  const rapor: Array<Record<string, unknown>> = [];
  let olusan = 0;

  for (const g of geciciler) {
    const token = String(g.token);
    const data = await iyzicoDetay(token);
    if (data._fetchHata) { rapor.push({ token: token.slice(0, 8) + "…", hata: data._fetchHata }); continue; }
    const basarili = data.status === "success" && data.paymentStatus === "SUCCESS";
    if (!basarili) { continue; } // başarısız/beklemede → geçici kalsın (terk edilen)

    const paymentId = data.paymentId ? String(data.paymentId) : "";

    // İDEMPOTENT: bu ödeme zaten sipariş oldu mu? (paymentId → token)
    let zaten: { siparis_no: string } | null = null;
    if (paymentId) {
      const { data: m } = await db.from("siparisler").select("siparis_no").eq("iyzico_payment_id", paymentId).limit(1);
      zaten = m?.[0] || null;
    }
    if (!zaten) {
      const { data: m } = await db.from("siparisler").select("siparis_no").eq("iyzico_token", token).limit(1);
      zaten = m?.[0] || null;
    }
    if (zaten || (paymentId && gorulen.has(paymentId))) {
      if (!dry) await db.from("odeme_gecici").delete().eq("token", token); // işlenmiş → temizle
      rapor.push({ token: token.slice(0, 8) + "…", paymentId, sonuc: "zaten var/işlendi → gecici silindi", siparis_no: zaten?.siparis_no });
      if (paymentId) gorulen.add(paymentId);
      continue;
    }

    if (dry) { rapor.push({ token: token.slice(0, 8) + "…", paymentId, tutar: data.paidPrice, sonuc: "KURTARILABİLİR (dry)" }); if (paymentId) gorulen.add(paymentId); continue; }

    // SİPARİŞ OLUŞTUR
    const siparisNo = "EVE" + Date.now().toString().slice(-8);
    const { error: insErr } = await db.from("siparisler").insert({
      siparis_no: siparisNo, durum: "hazirlaniyor", odeme_yontemi: "kredi_karti", odeme_durumu: "odendi",
      toplam: data.paidPrice, ara_toplam: data.price ?? g.ara_toplam ?? null, iyzico_token: token, iyzico_payment_id: paymentId || null,
      ad: g.ad || "", soyad: g.soyad || "", email: g.email || "", telefon: g.telefon || "",
      adres: g.adres || "", sehir: g.sehir || "", urunler: g.urunler || null, created_at: new Date().toISOString(),
    });
    if (insErr) { rapor.push({ token: token.slice(0, 8) + "…", paymentId, sonuc: "KAYIT HATASI", detay: insErr.message }); continue; }

    // Stok düş
    for (const k of kalemleriCoz(g.urunler)) {
      const id = Number(k.id); const adet = Number(k.quantity ?? k.adet ?? 1) || 1;
      if (!id || adet <= 0) continue;
      const { data: u } = await db.from("urunler").select("stok").eq("id", id).maybeSingle();
      if (u) await db.from("urunler").update({ stok: Math.max(0, (Number(u.stok) || 0) - adet) }).eq("id", id);
    }
    // Kullanılan bonus/kupon işaretle (callback ile aynı — double-spend koruması)
    if (g.kullanilan_bonus_id) {
      try { await db.from("sadakat_bonuslari").update({ kullanildi: true, kullanildi_siparis_no: siparisNo }).eq("id", g.kullanilan_bonus_id).eq("kullanildi", false); } catch { /* yut */ }
    }
    if (g.kullanilan_kupon_kod) {
      try { const { data: k } = await db.from("kuponlar").select("kullanim_sayisi").eq("kod", g.kullanilan_kupon_kod).maybeSingle(); await db.from("kuponlar").update({ kullanim_sayisi: (Number(k?.kullanim_sayisi) || 0) + 1 }).eq("kod", g.kullanilan_kupon_kod); } catch { /* yut */ }
    }
    // Onay maili (callback'ten geçmediği için burada gönderilir)
    if (g.email) {
      try {
        await sendSiparisOnayMaili({
          siparisNo, ad: g.ad || "", soyad: g.soyad || "", email: g.email,
          urunler: kalemleriCoz(g.urunler), toplam: Number(data.paidPrice) || 0, araToplam: Number(data.price ?? g.ara_toplam) || undefined,
          adres: g.adres || "", sehir: g.sehir || "", telefon: g.telefon || "",
        });
      } catch { /* mail hatası siparişi bozmaz */ }
    }
    await db.from("odeme_gecici").delete().eq("token", token);
    if (paymentId) gorulen.add(paymentId);
    olusan++;
    console.log("[odeme-mutabakat] KURTARILDI:", siparisNo, "paymentId:", paymentId, "₺" + data.paidPrice);
    rapor.push({ token: token.slice(0, 8) + "…", paymentId, sonuc: "SIPARIS OLUSTU ✅", siparis_no: siparisNo, tutar: data.paidPrice });
  }

  if (olusan > 0) console.warn(`[odeme-mutabakat] ${olusan} kayıp sipariş kurtarıldı — callback bunları kaçırdı`);
  return NextResponse.json({ ok: true, taranan: geciciler.length, olusan, dry, islem: rapor }, { headers: noStore });
}
