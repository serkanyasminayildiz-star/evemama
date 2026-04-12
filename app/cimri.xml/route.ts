export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function xmlEscape(str: string): string {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(req: NextRequest) {
  const { data: urunler } = await supabase
    .from("urunler")
    .select("*, kategoriler(ad), markalar(ad)")
    .eq("aktif", true)
    .gt("stok", 0)
    .gt("fiyat", 0)
    .limit(1000);

  const items = (urunler || []).map(u => {
    const normalFiyat = parseFloat(u.fiyat || 0);
    const indirimli = parseFloat(u.indirimli_fiyat || 0);
    const hasDiscount = indirimli > 0 && indirimli < normalFiyat;

    if (normalFiyat <= 0) return "";

    const imageUrl = xmlEscape(u.resim_url || "");
    const slug = xmlEscape(u.slug || String(u.id));
    const title = xmlEscape(u.ad || "");
    const description = xmlEscape(u.kisa_aciklama || u.ad || "");
    const kategori = xmlEscape(u.kategoriler?.ad || "Evcil Hayvan");
    const marka = xmlEscape(u.markalar?.ad || "evemama");

    return `    <item>
      <g:id>${u.id}</g:id>
      <title>${title}</title>
      <link>https://evemama.net/urun/${slug}</link>
      <description>${description}</description>
      <g:price>${normalFiyat.toFixed(2)} TRY</g:price>
      ${hasDiscount ? `<g:sale_price>${indirimli.toFixed(2)} TRY</g:sale_price>` : ""}
      <g:availability>in stock</g:availability>
      <g:condition>new</g:condition>
      <g:image_link>${imageUrl}</g:image_link>
      <g:product_type>${kategori}</g:product_type>
      <g:brand>${marka}</g:brand>
    </item>`;
  }).filter(Boolean).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Evemama Ürün Kataloğu</title>
    <link>https://evemama.net</link>
    <description>Evemama ürün feed - Cimri</description>
${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=600",
    },
  });
}