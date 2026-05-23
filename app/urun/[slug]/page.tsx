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
import { URUN_SSS } from "../../../lib/sss";

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
        priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      },
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
    // FAQPage — urun sayfasinda gosterilen "Sikca Sorulanlar" sekmesi
    // ayni icerigi server HTML'e de gomeriz; Google bunu rich result
    // olarak arama sonuclarinda accordion (acilir kapanir SSS) seklinde
    // gosterir. CTR ortalama %30-40 artar.
    //
    // Google sarti: gosterilen UI ile ayni metni server-side rendered
    // HTML'de de bulmali (cloaking yasak). lib/sss.ts ortak kaynak.
    const faqLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: URUN_SSS.map((item) => ({
        "@type": "Question",
        name: item.soru,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.cevap,
        },
      })),
    };
    jsonLdScript = (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
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
