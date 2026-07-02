import { createClient } from "@supabase/supabase-js";
import type { MetadataRoute } from "next";
import { blogYazilari } from "./blog/yazilar";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const BASE = "https://www.evemama.net";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Dinamik: aktif urunler + aktif kategoriler.
  const [{ data: urunler }, { data: kategoriler }] = await Promise.all([
    supabase.from("urunler").select("slug, updated_at").eq("aktif", true).gt("fiyat", 0).limit(1000),
    supabase.from("kategoriler").select("slug").eq("aktif", true),
  ]);

  const now = new Date();

  const urunUrls = (urunler || []).map(u => ({
    url: `${BASE}/urun/${u.slug}`,
    lastModified: u.updated_at ? new Date(u.updated_at) : now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const kategoriUrls = (kategoriler || []).map(k => ({
    url: `${BASE}/kategori/${k.slug}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.9,
  }));

  // Statik sayfalar — yasal + bilgi sayfalari. Indexlenmeli ki kullanicilar
  // arama sonucundan ulasabilsin.
  const statikSayfalar: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/urunler`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/kampanyalar`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/hakkimizda`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/iletisim`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/sikca-sorulan-sorular`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/kargo`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/iade`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/kvkk`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/gizlilik`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/mesafeli-satis`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/acik-riza`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/kullanim-kosullari`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/cerez-politikasi`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  // Blog makaleleri — gerçek /blog/[slug] sayfaları (artık modal değil).
  const blogUrls: MetadataRoute.Sitemap = blogYazilari.map(y => ({
    url: `${BASE}/blog/${y.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...statikSayfalar, ...blogUrls, ...kategoriUrls, ...urunUrls];
}
