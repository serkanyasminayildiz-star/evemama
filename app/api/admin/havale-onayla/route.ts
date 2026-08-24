export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendSiparisOnayMaili } from "../../../../lib/email";
import { SADAKAT, KARGO, kazanilacakPuan, kargoUcretiKg, sepetAgirligiKg } from "../../../../lib/indirim";

// Havale/EFT siparişini "ödendi" olarak onaylar: STOK DÜŞÜRÜR + sipariş onay maili
// gönderir. Admin panelden (ödeme durumu → "Ödendi") çağrılır. Stok düşüşü
// service_role gerektirdiği (urunler.stok RLS) için bu işlem SERVER'da yapılır;
// admin client'ı (anon) tek başına stok düşüremez.
//
// İDEMPOTENT: zaten "odendi" ise stok tekrar düşmez (çift tıklama/çağrı güvenli).
// Yalnız havale siparişleri için (kart zaten odeme/sonuc'ta stok düşürür).
const ADMIN_SIFRE = "evemama2025";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

export async function POST(req: NextRequest) {
  if ((req.headers.get("authorization") || "") !== `Bearer ${ADMIN_SIFRE}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  let body: { siparis_no?: string } = {};
  try { body = await req.json(); } catch { /* boş gövde */ }
  const siparisNo = (body.siparis_no || "").trim();
  if (!siparisNo) return NextResponse.json({ error: "siparis_no gerekli" }, { status: 400 });

  const { data: sip, error: sipErr } = await supabaseAdmin
    .from("siparisler").select("*").eq("siparis_no", siparisNo).maybeSingle();
  if (sipErr || !sip) return NextResponse.json({ error: "siparis bulunamadi" }, { status: 404 });

  if (sip.odeme_yontemi !== "havale" && sip.odeme_yontemi !== "elden") {
    return NextResponse.json({ error: "Bu işlem yalnız havale/elden teslim siparişleri içindir." }, { status: 400 });
  }
  // Zaten ödendiyse → çift stok düşürme YOK (idempotent).
  if (sip.odeme_durumu === "odendi") {
    return NextResponse.json({ ok: true, zaten: true });
  }

  await supabaseAdmin.from("siparisler")
    .update({ odeme_durumu: "odendi", durum: "hazirlaniyor" })
    .eq("siparis_no", siparisNo);

  // STOK DÜŞ — sipariş kalemlerini parse et, her ürünün stoğunu adedi kadar azalt.
  try {
    let kalemler: { id?: number | string; quantity?: number; adet?: number; miktar?: number }[] = [];
    const ham = sip.urunler;
    if (typeof ham === "string") { try { kalemler = JSON.parse(ham); } catch { kalemler = []; } }
    else if (Array.isArray(ham)) kalemler = ham;
    for (const k of kalemler) {
      const urunId = Number(k.id);
      const adet = Number(k.quantity ?? k.adet ?? k.miktar ?? 1) || 1;
      if (!urunId || adet <= 0) continue;
      const { data: u } = await supabaseAdmin.from("urunler").select("stok").eq("id", urunId).maybeSingle();
      if (u) {
        const yeniStok = Math.max(0, (Number(u.stok) || 0) - adet);
        await supabaseAdmin.from("urunler").update({ stok: yeniStok }).eq("id", urunId);
      }
    }
  } catch (e) {
    console.error("[havale-onayla] stok dusurme hatasi:", e);
  }

  // SADAKAT PUANI — havale/elden siparişleri de "her alışverişte %5" sözüne
  // dahildir. Kart siparişleri bunu odeme/sonuc'ta alır; bu iki yöntemde ödeme
  // admin onayıyla kesinleştiği için kazanım buraya bağlandı. Yukarıdaki
  // "zaten odendi" erken dönüşü sayesinde çift puan yüklenmez (idempotent).
  //
  // Üyelik kontrolü: bu siparişlerde uye_email saklanmıyor, o yüzden e-posta
  // auth.users içinde aranır (terk-edilen route'undaki desenin aynısı).
  // Misafir sipariş puan kazanmaz. 1000 kullanıcıdan sonrası taranmaz —
  // liste büyürse sayfalama gerekir.
  try {
    const alici = String(sip.email || "").toLowerCase().trim();
    if (alici && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { data: liste } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const uye = (liste?.users || []).some(u => (u.email || "").toLowerCase() === alici);
      if (uye) {
        // Taban = ödenen − kargo (kart tarafıyla birebir aynı kural).
        const odenen = Number(sip.toplam) || 0;
        const araToplam = Number(sip.ara_toplam) || 0;
        let kargoTutari = 0;
        if (sip.odeme_yontemi !== "elden" && araToplam > 0 && araToplam < KARGO.BEDAVA_ESIK) {
          let kalemler: { name?: string; quantity?: number }[] = [];
          const ham = sip.urunler;
          if (typeof ham === "string") { try { kalemler = JSON.parse(ham); } catch { kalemler = []; } }
          else if (Array.isArray(ham)) kalemler = ham;
          if (kalemler.length) {
            kargoTutari = kargoUcretiKg(sepetAgirligiKg(kalemler as Array<{ name: string; quantity: number }>));
          }
        }
        const puan = kazanilacakPuan(odenen - kargoTutari);
        if (puan > 0) {
          await supabaseAdmin.from("sadakat_bonuslari").insert({
            email: alici,
            tutar: puan,
            min_sepet: SADAKAT.MIN_SEPET,
            bitis_tarihi: new Date(Date.now() + SADAKAT.GECERLILIK_GUN * 24 * 60 * 60 * 1000).toISOString(),
            kaynak_siparis_no: siparisNo,
          });
          console.log("[havale-onayla] sadakat puani yuklendi:", { siparisNo, puan });
        }
      }
    }
  } catch (e) {
    console.error("[havale-onayla] sadakat puani hatasi:", e);
  }

  // Sipariş onay maili (best-effort — hata akışı bozmaz).
  try {
    await sendSiparisOnayMaili({
      siparisNo,
      ad: sip.ad || "",
      soyad: sip.soyad || "",
      email: sip.email || "",
      urunler: sip.urunler || [],
      toplam: sip.toplam,
      araToplam: sip.ara_toplam,
      adres: sip.adres || "",
      sehir: sip.sehir || "",
      telefon: sip.telefon || "",
    });
  } catch (e) {
    console.error("[havale-onayla] onay maili hatasi:", e);
  }

  console.log("[havale-onayla] havale odendi + stok dustu:", siparisNo);
  return NextResponse.json({ ok: true });
}
