// Tek seferlik / on-demand admin endpoint:
//   GET /api/admin/maili-tekrar-gonder?gun=7
//   GET /api/admin/maili-tekrar-gonder?gun=7&dryRun=true   (kac kisiye gidecek onizleme)
//   GET /api/admin/maili-tekrar-gonder?siparis=EVE12345    (tek siparis test)
//
// Resend API key / FROM email konfigurasyonu sorunlari yuzunden geçmiş
// siparişlere onay maili gitmedi. Bu endpoint son N gunluk siparişleri
// Supabase'den okur, her birine sendSiparisOnayMaili çağırır.
//
// Auth: Bearer CRON_SECRET (mevcut env var). Yoksa public — production'da
// CRON_SECRET set olmali; aksi takdirde herkes tetikleyebilir.
//
// Rate limit: Resend free tier 5 req/sec. 250ms gecikme ile 4 req/sec kaliyor.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendSiparisOnayMaili } from "../../../../lib/email";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_SECRET = process.env.CRON_SECRET || "";

// Cart item shape farkliligi yuzunden urun isimleri "Urun" olarak gosterilir
// (lib/email.ts ad/isim/baslik bekliyor ama cart name/quantity/price gonderiyor).
// Burada normalize edip emailHTML'in dogru render etmesini sagliyoruz.
type RawItem = {
  name?: string; ad?: string; isim?: string; baslik?: string;
  quantity?: number; adet?: number; miktar?: number;
  price?: number; fiyat?: number; birim_fiyat?: number;
};
function normalizeUrunler(raw: unknown): Array<{ ad: string; adet: number; fiyat: number }> {
  let arr: RawItem[] = [];
  if (Array.isArray(raw)) arr = raw as RawItem[];
  else if (typeof raw === "string") {
    try { arr = JSON.parse(raw) || []; } catch { arr = []; }
  }
  return arr.map((u) => ({
    ad: u.name || u.ad || u.isim || u.baslik || "Ürün",
    adet: Number(u.quantity || u.adet || u.miktar || 1),
    fiyat: Number(u.price || u.fiyat || u.birim_fiyat || 0),
  }));
}

export async function GET(req: NextRequest) {
  // Auth
  if (ADMIN_SECRET) {
    const auth = req.headers.get("authorization") || "";
    if (auth !== `Bearer ${ADMIN_SECRET}`) {
      return NextResponse.json(
        { error: "unauthorized" },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }
  }

  const { searchParams } = new URL(req.url);
  const gun = parseInt(searchParams.get("gun") || "7", 10);
  const dryRun = searchParams.get("dryRun") === "true";
  const tekSiparis = searchParams.get("siparis"); // ornek: EVE05823721

  // Supabase sorgusu
  let query = supabase.from("siparisler").select("*").order("created_at", { ascending: false });
  if (tekSiparis) {
    query = query.eq("siparis_no", tekSiparis);
  } else {
    const since = new Date(Date.now() - gun * 24 * 60 * 60 * 1000).toISOString();
    query = query.gte("created_at", since);
  }
  const { data: siparisler, error } = await query;

  if (error) {
    console.error("[admin/maili-tekrar-gonder] supabase error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }

  const liste = siparisler || [];
  console.log(`[admin/maili-tekrar-gonder] ${liste.length} siparis bulundu`);

  // Dry-run: kac sipariste mail gidecek onizleme, mail GONDERME
  if (dryRun) {
    return NextResponse.json(
      {
        ok: true,
        dryRun: true,
        count: liste.length,
        orders: liste.map((s: any) => ({
          siparis_no: s.siparis_no,
          email: s.email,
          toplam: s.toplam,
          created_at: s.created_at,
        })),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  // Gercek gonderim — 250ms rate limit ile
  const RATE_LIMIT_DELAY_MS = 250;
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  let sent = 0;
  let failed = 0;
  const results: Array<{ siparis_no: string; email: string; ok: boolean; reason?: string }> = [];

  for (let i = 0; i < liste.length; i++) {
    const s: any = liste[i];
    if (i > 0) await sleep(RATE_LIMIT_DELAY_MS);

    if (!s.email) {
      failed++;
      results.push({ siparis_no: s.siparis_no, email: "", ok: false, reason: "email yok" });
      continue;
    }

    try {
      const ok = await sendSiparisOnayMaili({
        siparisNo: s.siparis_no,
        ad: s.ad || "",
        soyad: s.soyad || "",
        email: s.email,
        urunler: normalizeUrunler(s.urunler),
        toplam: parseFloat(s.toplam) || 0,
        araToplam: parseFloat(s.ara_toplam) || 0,
        adres: s.adres || "",
        sehir: s.sehir || "",
        telefon: s.telefon || "",
      });
      if (ok) {
        sent++;
        results.push({ siparis_no: s.siparis_no, email: s.email, ok: true });
      } else {
        failed++;
        results.push({ siparis_no: s.siparis_no, email: s.email, ok: false, reason: "send_failed" });
      }
    } catch (e: any) {
      failed++;
      results.push({ siparis_no: s.siparis_no, email: s.email, ok: false, reason: e?.message || "exception" });
    }
  }

  console.log(`[admin/maili-tekrar-gonder] tamamlandi: sent=${sent}, failed=${failed}, total=${liste.length}`);

  return NextResponse.json(
    {
      ok: true,
      total: liste.length,
      sent,
      failed,
      results,
      runAt: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
