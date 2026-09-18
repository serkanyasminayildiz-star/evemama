export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import * as crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// TEK SEFERLİK KURTARMA + TEŞHİS (18 Eyl 2026, non-www callback olayı, d4e2b0d).
// İş bitince bu dosya kaldırılır.
//
// DERS: aynı checkout oturumunun BİRDEN FAZLA token'ı iyzico retrieve'de
// "başarılı" döner (hepsi tek paymentId). Token bazlı dedup mükerrer sipariş
// üretti (Ferhat 2 sipariş / 1 ödeme). Bu yüzden dedup iyzico paymentId'ye göre.
//
// POST { email, kurtar?:bool }  → teşhis (kurtar yok) ya da kurtarma (kurtar:true)
// POST { action:"iptal", siparis_no } → mükerrer siparişi iptal + stok iade
// Authorization: Bearer <ADMIN_SIFRE>
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
function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

// iyzico retrieve — callback ile aynı header seti + 1 retry ("fetch failed" transient).
async function iyzicoDetay(token: string): Promise<Record<string, unknown>> {
  const reqBody = { locale: "tr", token };
  for (let deneme = 0; deneme < 2; deneme++) {
    const randomString = rnd();
    try {
      const r = await fetch(`${IYZICO_BASE_URL}${ENDPOINT}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: auth(randomString, reqBody),
          "x-iyzi-rnd": randomString,
          "x-iyzi-client-version": "iyzipay-node-2.0.65",
        },
        body: JSON.stringify(reqBody),
      });
      return await r.json();
    } catch (e) {
      if (deneme === 1) return { _fetchHata: e instanceof Error ? e.message : String(e) };
    }
  }
  return {};
}

type Kalem = { id?: number | string; quantity?: number; adet?: number };
function kalemleriCoz(ham: unknown): Kalem[] {
  if (typeof ham === "string") { try { return JSON.parse(ham); } catch { return []; } }
  return Array.isArray(ham) ? ham : [];
}

export async function POST(req: NextRequest) {
  if ((req.headers.get("authorization") || "") !== `Bearer ${ADMIN_SIFRE}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: noStore });
  }
  let body: { email?: string; kurtar?: boolean; action?: string; siparis_no?: string } = {};
  try { body = await req.json(); } catch { /* boş */ }
  const db = sb();

  // ── EYLEM: mükerrer siparişi iptal + stok iade ──────────────────────────
  if (body.action === "iptal") {
    const sipNo = String(body.siparis_no || "").trim();
    if (!sipNo) return NextResponse.json({ error: "siparis_no gerekli" }, { status: 400, headers: noStore });
    const { data: sip } = await db.from("siparisler").select("*").eq("siparis_no", sipNo).maybeSingle();
    if (!sip) return NextResponse.json({ error: "sipariş bulunamadı" }, { status: 404, headers: noStore });
    if (sip.durum === "iptal") return NextResponse.json({ sipNo, sonuc: "zaten iptal (idempotent)" }, { headers: noStore });

    await db.from("siparisler").update({ durum: "iptal", odeme_durumu: "iade" }).eq("siparis_no", sipNo);
    // STOK İADE — mükerrer sipariş stoğu 2 kez düşürmüştü; bu iptalle 1 geri gelir.
    const iade: Array<Record<string, unknown>> = [];
    for (const k of kalemleriCoz(sip.urunler)) {
      const id = Number(k.id); const adet = Number(k.quantity ?? k.adet ?? 1) || 1;
      if (!id || adet <= 0) continue;
      const { data: u } = await db.from("urunler").select("stok, ad").eq("id", id).maybeSingle();
      if (u) {
        await db.from("urunler").update({ stok: (Number(u.stok) || 0) + adet }).eq("id", id);
        iade.push({ id, ad: u.ad, eskiStok: u.stok, yeniStok: (Number(u.stok) || 0) + adet });
      }
    }
    return NextResponse.json({ sipNo, sonuc: "İPTAL EDİLDİ + stok iade", stokIade: iade }, { headers: noStore });
  }

  // ── KURTARMA / TEŞHİS (email) ───────────────────────────────────────────
  const email = String(body.email || "").trim().toLocaleLowerCase("tr-TR");
  const kurtar = body.kurtar === true;
  if (!email) return NextResponse.json({ error: "email gerekli" }, { status: 400, headers: noStore });

  const { data: geciciler, error } = await db.from("odeme_gecici").select("*").eq("email", email);
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: noStore });
  if (!geciciler?.length) return NextResponse.json({ email, mesaj: "takılı geçici kayıt yok", islem: [] }, { headers: noStore });

  const rapor: Array<Record<string, unknown>> = [];
  const gorulenOdeme = new Set<string>(); // paymentId dedup — bir ödeme = bir sipariş
  let olusan = 0;

  for (const g of geciciler) {
    const token = String(g.token);
    const data = await iyzicoDetay(token);
    if (data._fetchHata) { rapor.push({ token: token.slice(0, 10) + "…", iyzicoHata: data._fetchHata }); continue; }

    const basarili = data.status === "success" && data.paymentStatus === "SUCCESS";
    const paymentId = String(data.paymentId ?? "");
    const satir: Record<string, unknown> = {
      token: token.slice(0, 10) + "…", geciciTutar: g.toplam,
      iyzico_status: data.status ?? null, iyzico_paymentStatus: data.paymentStatus ?? null,
      paymentId: paymentId || null, iyzico_paidPrice: data.paidPrice ?? null, iyzico_errorMessage: data.errorMessage ?? null,
    };
    if (!basarili) { rapor.push({ ...satir, sonuc: "iyzico BAŞARILI değil → sipariş yok" }); continue; }

    // Aynı paymentId zaten işlendi mi? (aynı oturumun ikinci token'ı)
    if (paymentId && gorulenOdeme.has(paymentId)) {
      if (kurtar) await db.from("odeme_gecici").delete().eq("token", token);
      rapor.push({ ...satir, sonuc: "AYNI ÖDEME (paymentId) → atlandı (dedup)" }); continue;
    }
    // Bu token için sipariş zaten var mı?
    const { data: mevcut } = await db.from("siparisler").select("siparis_no").eq("iyzico_token", token).maybeSingle();
    if (mevcut) { gorulenOdeme.add(paymentId); rapor.push({ ...satir, sonuc: "zaten var", siparis_no: mevcut.siparis_no }); continue; }

    if (!kurtar) { gorulenOdeme.add(paymentId); rapor.push({ ...satir, sonuc: "KURTARILABİLİR (kurtar:true ile oluştur)" }); continue; }

    // SİPARİŞ OLUŞTUR — tutar iyzico'dan.
    const siparisNo = "EVE" + Date.now().toString().slice(-8);
    const { error: insErr } = await db.from("siparisler").insert({
      siparis_no: siparisNo, durum: "hazirlaniyor", odeme_yontemi: "kredi_karti", odeme_durumu: "odendi",
      toplam: data.paidPrice, ara_toplam: data.price ?? g.ara_toplam ?? null, iyzico_token: token,
      ad: g.ad || "", soyad: g.soyad || "", email: g.email || "", telefon: g.telefon || "",
      adres: g.adres || "", sehir: g.sehir || "", urunler: g.urunler || null, created_at: new Date().toISOString(),
    });
    if (insErr) { rapor.push({ ...satir, sonuc: "SIPARIS KAYIT HATASI", detay: insErr.message }); continue; }

    for (const k of kalemleriCoz(g.urunler)) {
      const id = Number(k.id); const adet = Number(k.quantity ?? k.adet ?? 1) || 1;
      if (!id || adet <= 0) continue;
      const { data: u } = await db.from("urunler").select("stok").eq("id", id).maybeSingle();
      if (u) await db.from("urunler").update({ stok: Math.max(0, (Number(u.stok) || 0) - adet) }).eq("id", id);
    }
    await db.from("odeme_gecici").delete().eq("token", token);
    gorulenOdeme.add(paymentId);
    olusan++;
    rapor.push({ ...satir, sonuc: "SIPARIS OLUSTU ✅", siparis_no: siparisNo, tutar: data.paidPrice });
  }

  return NextResponse.json({ email, mod: kurtar ? "KURTARMA" : "teşhis", taranan: geciciler.length, olusanSiparis: olusan, islem: rapor }, { headers: noStore });
}
