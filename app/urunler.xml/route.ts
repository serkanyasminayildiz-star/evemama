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
    const normalFiyat = u.fiyat.toFixed(2);
    const resim = u.resim_url || "";
    const kategori = u.kategoriler?.ad || "Evcil Hayvan";
    const marka = u.markalar?.ad || "evemama";

    return `
  <item>
    <g:id>${u.id}</g:id>
    <g:title><![CDATA[${u.ad}]]></g:title>
    <g:description><![CDATA[${u.kisa_aciklama || u.ad}]]></g:description>
    <g:link>https://evemama.net/urun/${u.slug}</g:link>
    <g:image_link>${resim}</g:image_link>
    <g:availability>${u.stok > 0 ? "in stock" : "out of stock"}</g:availability>
    <g:price>${normalFiyat} TRY</g:price>
    ${u.indirimli_fiyat ? `<g:sale_price>${fiyat} TRY</g:sale_price>` : ""}
    <g:brand>${marka}</g:brand>
    <g:condition>new</g:condition>
    <g:product_type><![CDATA[${kategori}]]></g:product_type>
    <g:google_product_category>Animals &amp; Pet Supplies</g:google_product_category>
    <g:identifier_exists>no</g:identifier_exists>
    <g:mpn>${u.id}</g:mpn>
  </item>`;
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