export const runtime = 'nodejs';
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Sokak Dostları — KANIT (video) temelli. service_role ile (yoksa anon'a düşer).
// Public okuma: kumbara_dagitim RLS'i "public read". DİKKAT: ciro/sayaç EXPOSE
// EDİLMEZ — siparisler tablosu artık hiç sorgulanmıyor. Yalnız barınak
// ziyaretleri (videolar) + kümülatif SAYI (köpek/öğün/ziyaret) dışarı verilir.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

export async function GET() {
  try {
    // Barınak ziyaretleri/dağıtımlar (admin girer) — en yeni önce.
    // tutar SEÇİLMEZ: ₺ tutarını public'e hiç vermiyoruz (ciro sızıntısı olmasın).
    const { data: dagitimRaw } = await supabase
      .from("kumbara_dagitim")
      .select("tarih, barinak_adi, sehir, video_url, kopek_sayisi, ogun_sayisi, not_metni, created_at")
      .order("created_at", { ascending: false });
    const dagitimlar = dagitimRaw || [];

    // Kümülatif etki — yalnız SAYI (köpek/öğün/ziyaret); ₺ veya ciro YOK.
    const toplamKopek = dagitimlar.reduce((s, d) => s + (Number(d.kopek_sayisi) || 0), 0);
    const toplamOgun = dagitimlar.reduce((s, d) => s + (Number(d.ogun_sayisi) || 0), 0);
    const toplamBarinak = dagitimlar.length;

    return NextResponse.json({
      toplamKopek,
      toplamOgun,
      toplamBarinak,
      sonDagitim: dagitimlar[0] || null,
      dagitimlar,
    });
  } catch (e) {
    // Tablo henüz yoksa → boş güvenli state (sayfa/widget çalışmaya devam eder).
    console.error("[sokak-dostlari] hata:", e);
    return NextResponse.json({ toplamKopek: 0, toplamOgun: 0, toplamBarinak: 0, sonDagitim: null, dagitimlar: [] });
  }
}
