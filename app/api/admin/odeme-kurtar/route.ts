export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SITE_KOK } from "../../../../lib/site";

// TEK SEFERLİK KURTARMA (18 Eyl 2026). callbackUrl non-www 307 redirect'i
// yüzünden 17 Eyl 16:07 sonrası kart ödemeleri çekildi ama sipariş oluşmadı
// (bkz. d4e2b0d). Bu uç, verilen e-postaya ait TÜM odeme_gecici token'larını
// alır ve her birini GERÇEK callback'e (/api/odeme/sonuc) yeniden gönderir:
// callback iyzico'ya token'ı doğrulatır, yalnız BAŞARILI olanlar sipariş olur
// (tutar iyzico'dan gelir), başarısız denemeler sipariş olmaz. Callback artık
// iyzico_token ile idempotent → aynı token iki kez işlenmez.
//
// GÜVENLİK: yeni sipariş oluşturma kodu YOK — sadece test edilmiş callback'i
// tetikler. İş bitince bu dosya kaldırılır.
//
// Kullanım: POST /api/admin/odeme-kurtar  { "email": "musteri@ornek.com" }
//           Authorization: Bearer <ADMIN_SIFRE>
const ADMIN_SIFRE = "evemama2025";
const noStore = { "Cache-Control": "no-store" };

export async function POST(req: NextRequest) {
  if ((req.headers.get("authorization") || "") !== `Bearer ${ADMIN_SIFRE}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: noStore });
  }

  let body: { email?: string } = {};
  try { body = await req.json(); } catch { /* boş gövde */ }
  const email = String(body.email || "").trim().toLocaleLowerCase("tr-TR");
  if (!email) return NextResponse.json({ error: "email gerekli" }, { status: 400, headers: noStore });

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  // Bu e-postaya ait tüm takılı geçici kayıtlar (her ödeme denemesi = 1 token).
  const { data: geciciler, error } = await sb
    .from("odeme_gecici")
    .select("token, toplam, created_at")
    .eq("email", email);
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: noStore });
  if (!geciciler?.length) {
    return NextResponse.json({ email, mesaj: "Bu e-postaya ait takılı geçici kayıt yok.", islem: [] }, { headers: noStore });
  }

  const rapor: Array<Record<string, unknown>> = [];
  for (const g of geciciler) {
    const token = String(g.token);
    // Gerçek callback'i iyzico'nun yaptığı gibi çağır (form-urlencoded token).
    // Callback iyzico'ya doğrulatır; başarılıysa siparişi oluşturur.
    try {
      await fetch(`${SITE_KOK}/api/odeme/sonuc`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token }).toString(),
        redirect: "manual", // 303 redirect'i takip etme; sadece çalışsın
      });
    } catch (e) {
      rapor.push({ token: token.slice(0, 10) + "…", sonuc: "callback-hatasi", detay: e instanceof Error ? e.message : String(e) });
      continue;
    }
    // Callback çalıştıktan sonra bu token'a sipariş düştü mü?
    const { data: sip } = await sb
      .from("siparisler").select("siparis_no, toplam, odeme_durumu").eq("iyzico_token", token).maybeSingle();
    rapor.push(sip
      ? { token: token.slice(0, 10) + "…", geciciTutar: g.toplam, sonuc: "SIPARIS OLUSTU", siparis_no: sip.siparis_no, tutar: sip.toplam }
      : { token: token.slice(0, 10) + "…", geciciTutar: g.toplam, sonuc: "siparis olusmadi (iyzico basarisiz/beklemede)" });
  }

  const olusan = rapor.filter(r => r.sonuc === "SIPARIS OLUSTU");
  return NextResponse.json({ email, taranan: geciciler.length, olusanSiparis: olusan.length, islem: rapor }, { headers: noStore });
}
