import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function sitemap() {
  const { data: urunler } = await supabase.from("urunler").select("slug, updated_at").eq("aktif", true).limit(1000);
  const { data: kategoriler } = await supabase.from("kategoriler").select("slug").eq("aktif", true);

  const urunUrls = (urunler || []).map(u => ({
    url: `https://evemama.net/urun/${u.slug}`,
    lastModified: u.updated_at || new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const kategoriUrls = (kategoriler || []).map(k => ({
    url: `https://evemama.net/kategori/${k.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.9,
  }));

  return [
    { url: "https://evemama.net", lastModified: new Date(), changeFrequency: "daily" as const, priority: 1 },
    { url: "https://evemama.net/urunler", lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.9 },
    { url: "https://evemama.net/blog", lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.7 },
    ...kategoriUrls,
    ...urunUrls,
  ];
}