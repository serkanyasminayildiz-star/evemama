// Server component: ürün sayfasının HEAD'ine JSON-LD Product schema
// inject eder. Aksi halde sayfa "use client" oldugu icin Googlebot ve
// Google Merchant crawler'i fiyat/availability HTML'de goremiyor →
// Merchant Center "fiyat eksik" hatasi veriyor (646/689 onayli, 42
// urunde fiyat eksik uyarisi). JSON-LD ile fiyat/stok/marka
// server-rendered HTML'de teslim edilir, Merchant + Google Shopping
// rich results calisir.
//
// UI/state tarafi tamamen UrunDetayClient.tsx icinde (eski page.tsx)
// — regression riski yok.

import { notFound } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import UrunDetayClient from "./UrunDetayClient";

export const dynamic = "force-dynamic";

type UrunRow = {
  id: number | string;
  ad: string;
  slug: string;
  aktif: boolean | null;
  fiyat: number | string | null;
  indirimli_fiyat: number | string | null;
  stok: number | null;
  kisa_aciklama: string | null;
  resim_url: string | null;
  markalar?: { ad: string } | null;
  kategoriler?: { ad: string; slug: string } | null;
};

async function urunGetir(slug: string): Promise<UrunRow | null> {
  const { data } = await supabase
    .from("urunler")
    .select("id, ad, slug, aktif, fiyat, indirimli_fiyat, stok, kisa_aciklama, resim_url, markalar(ad), kategoriler(ad, slug)")
    .eq("slug", slug)
    .single();
  return (data as unknown as UrunRow) || null;
}

type YorumOzetiSatir = { puan: number; yorum: string; ad: string; created_at: string };
type YorumOzeti = { adet: number; ortalama: number; sonYorumlar: YorumOzetiSatir[] };

// Onaylı yorumların özeti — JSON-LD AggregateRating (Google'da ⭐ yıldız) için.
// urun_yorumlari tablosu henüz yoksa (SQL çalıştırılmadıysa) try/catch sessizce
// boş döner → JSON-LD'ye rating eklenmez, sayfa normal çalışır.
async function yorumOzetiGetir(urunId: number | string): Promise<YorumOzeti> {
  try {
    const { data } = await supabase
      .from("urun_yorumlari")
      .select("puan, yorum, ad, created_at")
      .eq("urun_id", urunId)
      .eq("onayli", true)
      .order("created_at", { ascending: false })
      .limit(500);
    const rows = (data as YorumOzetiSatir[]) || [];
    if (rows.length === 0) return { adet: 0, ortalama: 0, sonYorumlar: [] };
    const toplam = rows.reduce((s, r) => s + (Number(r.puan) || 0), 0);
    return { adet: rows.length, ortalama: toplam / rows.length, sonYorumlar: rows.slice(0, 5) };
  } catch {
    return { adet: 0, ortalama: 0, sonYorumlar: [] };
  }
}

// Date.now() server component gövdesinde doğrudan çağrılırsa react-hooks/purity
// "impure during render" hatası verir; modül seviyesi helper'a alınca temizlenir
// (davranış aynı: bugünden gunSonra gün ileri, YYYY-MM-DD).
function gelecekTarihISO(gunSonra: number): string {
  return new Date(Date.now() + gunSonra * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const urun = await urunGetir(slug);
  // Silinmis veya pasif urunler icin noindex + temel baslik. notFound()
  // burada cagrilamaz (Next 16: generateMetadata'da notFound() destekli
  // degil), o yuzden noindex ile bot'lara "indekslemeyin" deriz; HTTP 404
  // ise default exportta donulur.
  if (!urun || urun.aktif === false) {
    return { title: "Ürün bulunamadı — evemama", robots: { index: false, follow: false } };
  }
  const fiyat = Number(urun.indirimli_fiyat || urun.fiyat || 0).toFixed(2);
  // Layout zaten "%s | evemama.net" template'i ekliyor; biz sadece urun
  // adi + fiyatla doldurursak final: "Urun Adi — ₺X | evemama.net".
  return {
    title: `${urun.ad} — ₺${fiyat}`,
    description: urun.kisa_aciklama || urun.ad,
    openGraph: {
      title: urun.ad,
      description: urun.kisa_aciklama || urun.ad,
      images: urun.resim_url ? [urun.resim_url] : [],
      url: `https://www.evemama.net/urun/${urun.slug}`,
      type: "website",
    },
  };
}

export default async function UrunPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const urun = await urunGetir(slug);

  // Silinmis veya pasif urunler icin HTTP 404 don. Aksi halde Google
  // Merchant'in otomatik urun kesfi (web crawl) bu sayfalari "stokta var"
  // sayar — admin'den sildigimiz urunler Merchant Center'da gunlerce
  // hayalet olarak kalir. 404 donersek Google bir sonraki crawl'da
  // otomatik kaynaktan dusurur. Stok=0 olan urunler aktif kalmaya devam
  // eder, sadece availability "out of stock" gosterilir (zaten oyle).
  if (!urun || urun.aktif === false) {
    notFound();
  }

  let jsonLdScript: React.ReactNode = null;
  if (urun) {
    const fiyat = Number(urun.indirimli_fiyat || urun.fiyat || 0);
    const stok = Number(urun.stok ?? 0);
    const yorumOzeti = await yorumOzetiGetir(urun.id);
    const productLd = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: urun.ad,
      description: urun.kisa_aciklama || urun.ad,
      sku: String(urun.id),
      brand: { "@type": "Brand", name: urun.markalar?.ad || "evemama" },
      image: urun.resim_url || undefined,
      offers: {
        "@type": "Offer",
        url: `https://www.evemama.net/urun/${urun.slug}`,
        price: fiyat.toFixed(2),
        priceCurrency: "TRY",
        availability: stok > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        itemCondition: "https://schema.org/NewCondition",
        priceValidUntil: gelecekTarihISO(365),
      },
      // Yıldız rich snippet — YALNIZ gerçek yorum varsa. Boş/sahte rating
      // Google tarafından cezalandırılır; bu yüzden adet>0 şartı zorunlu.
      // Sayfada gösterilen yorumlarla AYNI veri (onayli=true) → politika uyumlu.
      ...(yorumOzeti.adet > 0
        ? {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: yorumOzeti.ortalama.toFixed(1),
              reviewCount: yorumOzeti.adet,
              bestRating: 5,
              worstRating: 1,
            },
            review: yorumOzeti.sonYorumlar.map((r) => ({
              "@type": "Review",
              reviewRating: { "@type": "Rating", ratingValue: Math.min(Math.max(Number(r.puan) || 5, 1), 5), bestRating: 5, worstRating: 1 },
              author: { "@type": "Person", name: r.ad || "evemama müşterisi" },
              reviewBody: r.yorum || "",
              datePublished: (r.created_at || "").slice(0, 10),
            })),
          }
        : {}),
    };
    // BreadcrumbList — Google arama sonuclarinda urun karti uzerinde
    // "Ana Sayfa > Kategori > Urun" breadcrumb gosterimi icin.
    const breadcrumbLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Ana Sayfa", item: "https://www.evemama.net" },
        ...(urun.kategoriler ? [
          { "@type": "ListItem", position: 2, name: urun.kategoriler.ad, item: `https://www.evemama.net/kategori/${urun.kategoriler.slug}` },
          { "@type": "ListItem", position: 3, name: urun.ad, item: `https://www.evemama.net/urun/${urun.slug}` },
        ] : [
          { "@type": "ListItem", position: 2, name: urun.ad, item: `https://www.evemama.net/urun/${urun.slug}` },
        ]),
      ],
    };
    jsonLdScript = (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      </>
    );
  }

  return (
    <>
      {jsonLdScript}
      <UrunDetayClient />
    </>
  );
}
