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

import { supabase } from "../../../lib/supabase";
import UrunDetayClient from "./UrunDetayClient";

export const dynamic = "force-dynamic";

type UrunRow = {
  id: number | string;
  ad: string;
  slug: string;
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
    .select("id, ad, slug, fiyat, indirimli_fiyat, stok, kisa_aciklama, resim_url, markalar(ad), kategoriler(ad, slug)")
    .eq("slug", slug)
    .single();
  return (data as unknown as UrunRow) || null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const urun = await urunGetir(slug);
  if (!urun) return { title: "Ürün bulunamadı — evemama" };
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

  // Urun yoksa client component "Urun bulunamadi" ekraniyla halleder.
  // JSON-LD sadece urun bulundugunda inject edilir.
  let jsonLdScript: React.ReactNode = null;
  if (urun) {
    const fiyat = Number(urun.indirimli_fiyat || urun.fiyat || 0);
    const stok = Number(urun.stok ?? 0);
    const jsonLd = {
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
    jsonLdScript = (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    );
  }

  return (
    <>
      {jsonLdScript}
      <UrunDetayClient />
    </>
  );
}
