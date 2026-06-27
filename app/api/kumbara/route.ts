export const runtime = 'nodejs';
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { KUMBARA_BASLANGIC, KUMBARA_ORAN, tesekkurAdi } from "../../../lib/kumbara";

// service_role ile (yoksa anon'a düşer). Public okuma: kumbara_dagitim RLS'i
// "public read"; siparisler aggregate'i server'da hesaplanıp SADECE toplam
// sayı dışarı verilir (tekil sipariş/PII dışarı çıkmaz).
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

export async function GET() {
  try {
    // Pazar dağıtımları (admin girer) — en yeni önce.
    const { data: dagitimRaw } = await supabase
      .from("kumbara_dagitim")
      .select("tarih, tutar, barinak_adi, sehir, video_url, kopek_sayisi, ogun_sayisi, not_metni, created_at")
      .order("created_at", { ascending: false });
    const dagitimlar = dagitimRaw || [];

    // Sıfırlama noktası = en son dağıtım zamanı (yoksa başlangıç). Kumbara bu
    // noktadan SONRA ödenmiş siparişlerin %5'ini gösterir.
    const sonZaman = dagitimlar.length ? dagitimlar[0].created_at : null;
    const resetNoktasi = sonZaman && sonZaman > KUMBARA_BASLANGIC ? sonZaman : KUMBARA_BASLANGIC;

    const { data: siparisler } = await supabase
      .from("siparisler")
      .select("toplam")
      .eq("odeme_durumu", "odendi")
      .gte("created_at", resetNoktasi);
    const haftaCiro = (siparisler || []).reduce((s, o) => s + (Number(o.toplam) || 0), 0);
    const guncelKumbara = Math.round(haftaCiro * KUMBARA_ORAN * 100) / 100;

    // Kümülatif etki — dağıtım kayıtlarından (ciroyu ifşa etmez).
    const toplamKopek = dagitimlar.reduce((s, d) => s + (Number(d.kopek_sayisi) || 0), 0);
    const toplamOgun = dagitimlar.reduce((s, d) => s + (Number(d.ogun_sayisi) || 0), 0);
    const toplamBarinak = dagitimlar.length;

    // Teşekkür duvarı — yalnız onay vermiş (kumbara_tesekkur) siparişlerin "Ad S."si.
    const { data: tesekkurRaw } = await supabase
      .from("siparisler")
      .select("ad, soyad")
      .eq("kumbara_tesekkur", true)
      .gte("created_at", KUMBARA_BASLANGIC)
      .order("created_at", { ascending: false })
      .limit(120);
    const tesekkurIsimleri = (tesekkurRaw || []).map(t => tesekkurAdi(t.ad, t.soyad)).filter(Boolean);

    // Katkıda bulunan toplam sipariş (onaylı + onaysız) — ölçek mesajı için.
    const { count: katkiSayisi } = await supabase
      .from("siparisler")
      .select("*", { count: "exact", head: true })
      .eq("odeme_durumu", "odendi")
      .gte("created_at", KUMBARA_BASLANGIC);

    return NextResponse.json({
      guncelKumbara,
      toplamKopek,
      toplamOgun,
      toplamBarinak,
      katkiSayisi: katkiSayisi || 0,
      sonDagitim: dagitimlar[0] || null,
      dagitimlar,
      tesekkurIsimleri,
    });
  } catch (e) {
    // Tablo/kolon henüz yoksa → boş güvenli state (sayfa çalışmaya devam eder).
    console.error("[kumbara] hata:", e);
    return NextResponse.json({ guncelKumbara: 0, toplamKopek: 0, toplamOgun: 0, toplamBarinak: 0, katkiSayisi: 0, sonDagitim: null, dagitimlar: [], tesekkurIsimleri: [] });
  }
}
