import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  const { data: urunler } = await supabase
    .from("urunler")
    .select("*, markalar(ad), kategoriler(ad)")
    .eq("aktif", true)
    .gt("stok", 0)
    .limit(1000);

  const items = (urunler || []).map((u) => {
    const fiyat = (u.indirimli_fiyat || u.fiyat).toFixed(2);
    const normalFiyat = parseFloat(u.fiyat).toFixed(2);
    const resim = (u.resim_url || "")
  .replace(/<[^>]*>/g, "")
  .replace(/&/g, "&amp;")
  .trim();
    const kategori = u.kategoriler?.ad || "Evcil Hayvan";
    const marka = (u.markalar?.ad || "evemama").replace(/&/g, "&amp;");
    const baslik = (u.ad || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const aciklama = (u.kisa_aciklama || u.ad || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    return [
      "  <item>",
      `    <g:id>${u.id}</g:id>`,
      `    <g:title><![CDATA[${baslik}]]></g:title>`,
      `    <g:description><![CDATA[${aciklama}]]></g:description>`,
      `    <g:link>https://evemama.net/urun/${u.slug}</g:link>`,
      `    <g:image_link>${resim}</g:image_link>`,
      `    <g:availability>in stock</g:availability>`,
      `    <g:price>${normalFiyat} TRY</g:price>`,
      u.indirimli_fiyat ? `    <g:sale_price>${fiyat} TRY</g:sale_price>` : "",
      `    <g:brand><![CDATA[${marka}]]></g:brand>`,
      `    <g:condition>new</g:condition>`,
      `    <g:product_type><![CDATA[${kategori}]]></g:product_type>`,
      `    <g:google_product_category>Animals &amp; Pet Supplies</g:google_product_category>`,
      `    <g:identifier_exists>no</g:identifier_exists>`,
      `    <g:mpn>${u.id}</g:mpn>`,
      "  </item>",
    ].filter(Boolean).join("\n");
  }).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>evemama.net Ürün Kataloğu</title>
    <link>https://evemama.net</link>
    <description>Evcil dostunuzun her ihtiyacı</description>
${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}