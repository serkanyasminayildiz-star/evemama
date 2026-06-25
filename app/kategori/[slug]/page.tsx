// Server component: kategori sayfasinin metadata + JSON-LD'sini server-side
// render eder. Google/Merchant Center kategori urunlerini structured data
// olarak gorur (ItemList) — kategori sayfalari da Shopping/Search'te
// zenginlestirilmis sonuc verebilir.
//
// UI tarafi tamamen KategoriClient.tsx icinde (eski page.tsx). Server
// burada VERIYI BAGIMSIZ olarak ayrica cekiyor — client kendi fetch'ini
// yapmaya devam ediyor; regression yok.

import { supabase } from "../../../lib/supabase";
import KategoriClient from "./KategoriClient";
import { kategoriSeo } from "./seoIcerik";

export const dynamic = "force-dynamic";

type Kategori = { id: number | string; ad: string; slug: string; ust_kategori_id?: number | string | null };
type Urun = { id: number | string; ad: string; slug: string; fiyat: number; indirimli_fiyat?: number | null; resim_url?: string | null; stok?: number | null };

async function kategoriGetir(slug: string): Promise<Kategori | null> {
  // .single() yerine .limit(1) — duplicate slug veya RLS hatasi durumunda
  // sayfa 404'e dusmesin, client component fetch'i devraisin.
  // NOT: kategoriler tablosunda 'aciklama' kolonu yok — SELECT'ten cikarildi.
  const { data, error } = await supabase
    .from("kategoriler")
    .select("id, ad, slug, ust_kategori_id")
    .eq("slug", slug)
    .limit(1);
  if (error) {
    console.error("[kategoriGetir] supabase error:", slug, error);
    return null;
  }
  return (data?.[0] as unknown as Kategori) || null;
}

// Kategori + tum alt kategorilerin (3 seviyeye kadar) urunlerini doner.
// KategoriClient.tsx ile ayni mantik — sonuc tutarli olsun.
async function altKategorilerVeUrunler(katId: Kategori["id"]): Promise<Urun[]> {
  const { data: seviye1 } = await supabase.from("kategoriler").select("id")
    .or(`id.eq.${katId},ust_kategori_id.eq.${katId}`);
  const idler1: (number | string)[] = seviye1?.map((k: { id: number | string }) => k.id) || [katId];

  const { data: seviye2 } = await supabase.from("kategoriler").select("id")
    .in("ust_kategori_id", idler1);
  const idler2: (number | string)[] = seviye2?.map((k: { id: number | string }) => k.id) || [];

  const { data: seviye3 } = await supabase.from("kategoriler").select("id")
    .in("ust_kategori_id", [...idler1, ...idler2]);
  const idler3: (number | string)[] = seviye3?.map((k: { id: number | string }) => k.id) || [];

  const tumIdler = Array.from(new Set([...idler1, ...idler2, ...idler3]));

  const { data: urunler } = await supabase
    .from("urunler")
    .select("id, ad, slug, fiyat, indirimli_fiyat, resim_url, stok")
    .in("kategori_id", tumIdler)
    .neq("aktif", false)
    .gt("fiyat", 0)
    .limit(100); // ItemList'te 100 urun yeterli — Google ilk N'i okuyor.
  return (urunler as unknown as Urun[]) || [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const kat = await kategoriGetir(slug);
  if (!kat) {
    return { title: "Kategori bulunamadı", robots: { index: false, follow: false } };
  }
  const seo = kategoriSeo[slug];
  const desc = seo?.description ?? `${kat.ad} kategorisindeki tüm ürünler — kedi, köpek, evcil hayvan ürünleri. evemama.net'te uygun fiyat ve hızlı kargo.`;
  return {
    title: seo?.title ?? `${kat.ad}`,
    description: desc,
    alternates: { canonical: `/kategori/${kat.slug}` },
    openGraph: {
      title: seo?.title ?? `${kat.ad} — evemama.net`,
      description: desc,
      url: `/kategori/${kat.slug}`,
      type: "website",
    },
  };
}

export default async function KategoriPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const kat = await kategoriGetir(slug);

  // Eger kategori server-side bulunamazsa notFound() yerine client'a
  // render et — client kendi fetch'iyle sayfayi yukleyecek. notFound()
  // cok agresif: gercekten yoksa bile client tarafi calismaya devam etmeli.
  if (!kat) {
    return <KategoriClient />;
  }

  const urunler = await altKategorilerVeUrunler(kat.id);

  // BreadcrumbList — Google arama sonuclarinda breadcrumb gosterimi icin.
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Ana Sayfa", item: "https://www.evemama.net" },
      { "@type": "ListItem", position: 2, name: kat.ad, item: `https://www.evemama.net/kategori/${kat.slug}` },
    ],
  };

  // ItemList — Google Shopping ve Search'te zenginlestirilmis kategori
  // sonuclari icin. Her urun mini-Product schema'siyla cikar.
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: kat.ad,
    numberOfItems: urunler.length,
    itemListElement: urunler.map((u, idx) => {
      const fiyat = Number(u.indirimli_fiyat || u.fiyat || 0);
      const stok = Number(u.stok ?? 0);
      return {
        "@type": "ListItem",
        position: idx + 1,
        item: {
          "@type": "Product",
          name: u.ad,
          url: `https://www.evemama.net/urun/${u.slug}`,
          image: u.resim_url || undefined,
          offers: {
            "@type": "Offer",
            price: fiyat.toFixed(2),
            priceCurrency: "TRY",
            availability: stok > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          },
        },
      };
    }),
  };

  const seoIcerigi = kategoriSeo[slug];
  const faqJsonLd = seoIcerigi?.faq?.length ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: seoIcerigi.faq.map(f => ({
      "@type": "Question",
      name: f.soru,
      acceptedAnswer: { "@type": "Answer", text: f.cevap },
    })),
  } : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      {faqJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />}
      <KategoriClient />
    </>
  );
}
