// Server component: generateMetadata ile kategori adi title'a giriyor.
// UI/state KategoriClient.tsx icinde (eski page.tsx) — regression riski yok.

import { supabase } from "../../../lib/supabase";
import KategoriClient from "./KategoriClient";

export const dynamic = "force-dynamic";

async function kategoriGetir(slug: string) {
  const { data } = await supabase
    .from("kategoriler")
    .select("ad, slug, aciklama")
    .eq("slug", slug)
    .single();
  return data;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const kat = await kategoriGetir(slug);
  if (!kat) {
    return { title: "Kategori bulunamadı", robots: { index: false, follow: false } };
  }
  const desc = kat.aciklama || `${kat.ad} kategorisindeki tüm ürünler — kedi, köpek, evcil hayvan ürünleri. evemama.net'te uygun fiyat ve hızlı kargo.`;
  return {
    title: `${kat.ad}`,
    description: desc,
    alternates: { canonical: `/kategori/${kat.slug}` },
    openGraph: {
      title: `${kat.ad} — evemama.net`,
      description: desc,
      url: `/kategori/${kat.slug}`,
      type: "website",
    },
  };
}

export default function KategoriPage() {
  return <KategoriClient />;
}
