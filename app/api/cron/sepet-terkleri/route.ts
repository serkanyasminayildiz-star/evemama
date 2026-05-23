// Sepet terk maili cron job.
//
// Vercel Cron tarafindan saatlik tetiklenir (vercel.json'da tanimli).
// Calistiginda:
//   1) odeme_gecici'de 1+ saattir kayitli + 7 gunden yeni + mail
//      atilmamis + email'i olan kayitlari cek
//   2) Her birine sepet-terk maili gonder
//   3) Basarili gondermeler icin terk_maili_gonderildi=true yap (idempotent)
//
// Neden 1 saat? Cok erken gonderirsen iyzico cekme sirasinda zaten
// donmek uzere olan musteriye spam atmis olursun. Cok gec gonderirsen
// musterinin niyeti sogur. Standart e-ticaret pratiginde 1-2 saat optimal.
//
// Neden 7 gun ust limit? Olusturulmus ama hic temizlenmemis cok eski
// kayitlari (test verisi, edge case) email ile bombardimani onler.
//
// Guvenlik: Vercel Cron her istegi "Authorization: Bearer <CRON_SECRET>"
// header'i ile gonderir. CRON_SECRET tanimliysa header'i kontrol ederiz;
// yanlissa 401 doneriz. Tanimli degilse (dev) kontrol pasif.
export const runtime = 'nodejs';
// Cache'lemeyi ZORLA kapat — Vercel CDN bu GET endpoint'inin cevabini
// cache'lerse her cron tetiklemesi/manuel test ayni eski JSON'u doner,
// fonksiyon hic calismaz. force-dynamic Next.js'e "bu route'u her seferinde
// fresh calistir" der; revalidate=0 ile birlikte cache atlanir.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendSepetTerkMaili } from "../../../../lib/email-sepet-terk";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CRON_SECRET = process.env.CRON_SECRET || "";

export async function GET(req: NextRequest) {
  if (CRON_SECRET) {
    const auth = req.headers.get("authorization") || "";
    if (auth !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json(
        { error: "unauthorized" },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // PostgREST: terk_maili_gonderildi is.null OR eq.false birlestirmesi
  // ".or()" syntax'i ile. Email zorunlu (null/bos gecmesin).
  const { data: terkler, error } = await supabase
    .from("odeme_gecici")
    .select("token, ad, email, urunler, toplam, created_at")
    .lt("created_at", oneHourAgo)
    .gt("created_at", sevenDaysAgo)
    .or("terk_maili_gonderildi.is.null,terk_maili_gonderildi.eq.false")
    .not("email", "is", null)
    .neq("email", "")
    .limit(100); // tek run'da max 100 mail (rate limit guvenli)

  if (error) {
    console.error("[cron/sepet-terk] supabase error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const liste = terkler || [];
  console.log("[cron/sepet-terk] islenecek kayit sayisi:", liste.length);

  let sent = 0;
  let failed = 0;

  // Resend free tier rate limit: 5 istek/saniye. Bir for loop'ta peş peşe
  // gönderirsek 5'inciden sonra 429 yiyoruz. 250ms gecikme ile saniyede
  // 4 mail atariz — guvenli marj.
  const RATE_LIMIT_DELAY_MS = 250;
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  for (let idx = 0; idx < liste.length; idx++) {
    const t = liste[idx];
    if (idx > 0) await sleep(RATE_LIMIT_DELAY_MS);
    // urunler kolonu JSON string olarak kaydedilmis (api/odeme'de
    // JSON.stringify ile insert ediliyor); parse et.
    let urunler: any[] = [];
    try {
      urunler = typeof t.urunler === "string" ? JSON.parse(t.urunler) : (t.urunler || []);
    } catch {
      urunler = [];
    }

    const ok = await sendSepetTerkMaili({
      email: t.email,
      ad: t.ad || "Müşterimiz",
      urunler,
      toplam: Number(t.toplam || 0),
    });

    if (ok) {
      // Basarili gondermeyi isaretle ki bir sonraki cron'da tekrar
      // gonderilmesin (idempotent).
      const { error: updateErr } = await supabase
        .from("odeme_gecici")
        .update({
          terk_maili_gonderildi: true,
          terk_maili_gonderilme_tarihi: new Date().toISOString(),
        })
        .eq("token", t.token);
      if (updateErr) {
        console.error("[cron/sepet-terk] update flag error:", { token: t.token, updateErr });
      }
      sent++;
    } else {
      failed++;
    }
  }

  console.log("[cron/sepet-terk] tamamlandi:", { sent, failed, total: liste.length });
  return NextResponse.json(
    { ok: true, sent, failed, total: liste.length, runAt: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } },
  );
}
