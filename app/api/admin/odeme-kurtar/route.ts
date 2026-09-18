export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import * as crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// TEK SEFERLİK KURTARMA + TEŞHİS (18 Eyl 2026). callbackUrl non-www 307 redirect'i
// yüzünden 17 Eyl 16:07 sonrası kart ödemeleri çekildi ama sipariş oluşmadı
// (bkz. d4e2b0d). Bu uç, verilen e-postaya ait TÜM odeme_gecici token'larını
// iyzico'ya DOĞRUDAN doğrulatır (ham yanıtı raporlar) ve yalnız BAŞARILI
// olanlar için siparişi oluşturur (tutar iyzico'dan). iyzico_token idempotent.
//
// İş bitince bu dosya kaldırılır.
// POST /api/admin/odeme-kurtar { "email": "...", "kurtar": true }  Bearer <ADMIN_SIFRE>
//   kurtar yoksa/false → SADECE teşhis (iyzico ne diyor), yazma YOK.
const ADMIN_SIFRE = "evemama2025";
const noStore = { "Cache-Control": "no-store" };

const IYZICO_API_KEY = process.env.IYZICO_API_KEY || "";
const IYZICO_SECRET_KEY = process.env.IYZICO_SECRET_KEY || "";
const IYZICO_BASE_URL = process.env.IYZICO_BASE_URL || "https://api.iyzipay.com";
const ENDPOINT = "/payment/iyzipos/checkoutform/auth/ecom/detail";

function rnd(): string { return process.hrtime()[0] + Math.random().toString(8).slice(2); }
function auth(randomString: string, body: Record<string, unknown>): string {
  const sig = crypto.createHmac("sha256", IYZICO_SECRET_KEY).update(randomString + ENDPOINT + JSON.stringify(body)).digest("hex");
  return "IYZWSv2 " + Buffer.from([`apiKey:${IYZICO_API_KEY}`, `randomKey:${randomString}`, `signature:${sig}`].join("&")).toString("base64");
}

export async function POST(req: NextRequest) {
  if ((req.headers.get("authorization") || "") !== `Bearer ${ADMIN_SIFRE}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: noStore });
  }
  let body: { email?: string; kurtar?: boolean } = {};
  try { body = await req.json(); } catch { /* boş */ }
  const email = String(body.email || "").trim().toLocaleLowerCase("tr-TR");
  const kurtar = body.kurtar === true;
  if (!email) return NextResponse.json({ error: "email gerekli" }, { status: 400, headers: noStore });

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { data: geciciler, error } = await sb
    .from("odeme_gecici").select("*").eq("email", email);
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: noStore });
  if (!geciciler?.length) return NextResponse.json({ email, mesaj: "takılı geçici kayıt yok", islem: [] }, { headers: noStore });

  const rapor: Array<Record<string, unknown>> = [];
  let olusan = 0;

  for (const g of geciciler) {
    const token = String(g.token);
    const reqBody = { locale: "tr", token };
    const randomString = rnd();
    let data: Record<string, unknown> = {};
    try {
      const r = await fetch(`${IYZICO_BASE_URL}${ENDPOINT}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: auth(randomString, reqBody), "x-iyzi-rnd": randomString },
        body: JSON.stringify(reqBody),
      });
      data = await r.json();
    } catch (e) {
      rapor.push({ token: token.slice(0, 10) + "…", iyzicoHata: e instanceof Error ? e.message : String(e) });
      continue;
    }

    const basarili = data.status === "success" && data.paymentStatus === "SUCCESS";
    const satir: Record<string, unknown> = {
      token: token.slice(0, 10) + "…",
      geciciTutar: g.toplam,
      iyzico_status: data.status ?? null,
      iyzico_paymentStatus: data.paymentStatus ?? null,
      iyzico_paidPrice: data.paidPrice ?? null,
      iyzico_errorMessage: data.errorMessage ?? null,
    };

    if (!basarili) { rapor.push({ ...satir, sonuc: "iyzico BAŞARILI değil → sipariş yok" }); continue; }

    // Zaten sipariş var mı? (idempotent)
    const { data: mevcut } = await sb.from("siparisler").select("siparis_no").eq("iyzico_token", token).maybeSingle();
    if (mevcut) { rapor.push({ ...satir, sonuc: "zaten var", siparis_no: mevcut.siparis_no }); continue; }

    if (!kurtar) { rapor.push({ ...satir, sonuc: "KURTARILABİLİR (kurtar:true ile oluştur)" }); continue; }

    // SİPARİŞ OLUŞTUR — tutar iyzico'dan. Callback ile aynı alanlar.
    const siparisNo = "EVE" + Date.now().toString().slice(-8);
    const { error: insErr } = await sb.from("siparisler").insert({
      siparis_no: siparisNo, durum: "hazirlaniyor", odeme_yontemi: "kredi_karti", odeme_durumu: "odendi",
      toplam: data.paidPrice, ara_toplam: data.price ?? g.ara_toplam ?? null, iyzico_token: token,
      ad: g.ad || "", soyad: g.soyad || "", email: g.email || "", telefon: g.telefon || "",
      adres: g.adres || "", sehir: g.sehir || "", urunler: g.urunler || null, created_at: new Date().toISOString(),
    });
    if (insErr) { rapor.push({ ...satir, sonuc: "SIPARIS KAYIT HATASI", detay: insErr.message }); continue; }

    // Stok düş (best-effort, idempotent değil ama gecici sonra silinir)
    try {
      let kalemler: { id?: number | string; quantity?: number; adet?: number }[] = [];
      const ham = g.urunler;
      if (typeof ham === "string") { try { kalemler = JSON.parse(ham); } catch { kalemler = []; } }
      else if (Array.isArray(ham)) kalemler = ham;
      for (const k of kalemler) {
        const id = Number(k.id); const adet = Number(k.quantity ?? k.adet ?? 1) || 1;
        if (!id || adet <= 0) continue;
        const { data: u } = await sb.from("urunler").select("stok").eq("id", id).maybeSingle();
        if (u) await sb.from("urunler").update({ stok: Math.max(0, (Number(u.stok) || 0) - adet) }).eq("id", id);
      }
    } catch { /* stok hatası siparişi bozmaz */ }

    await sb.from("odeme_gecici").delete().eq("token", token);
    olusan++;
    rapor.push({ ...satir, sonuc: "SIPARIS OLUSTU ✅", siparis_no: siparisNo, tutar: data.paidPrice });
  }

  return NextResponse.json({ email, mod: kurtar ? "KURTARMA" : "teşhis", taranan: geciciler.length, olusanSiparis: olusan, islem: rapor }, { headers: noStore });
}
