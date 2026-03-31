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

function duzeltResim(url: string): string {
  if (!url) return "";
  return url.replace("https://evemama.net", "https://www.sepetmama.com");
}

export async function GET(req: NextRequest) {
  const { data: urunler } = await supabase
    .from("urunler")
    .select("*, kategoriler(ad), markalar(ad)")
    .eq("aktif", true)
    .gt("stok", 0)
    .gt("fiyat", 0)
    .limit(1000);

  const entries = (urunler || []).map(u => {
    const fiyat = parseFloat(u.indirimli_fiyat || u.fiyat || 0);
    const normalFiyat = parseFloat(u.fiyat || 0);
    
    return `  <entry>
    <g:id>${u.id}</g:id>
    <title>${xmlEscape(u.ad)}</title>
    <g:price>${normalFiyat.toFixed(2)} TRY</g:price>
    ${fiyat < normalFiyat ? `<g:sale_price>${fiyat.toFixed(2)} TRY</g:sale_price>` : ""}
    <g:availability>in stock</g:availability>
    <g:condition>new</g:condition>
    <g:image_link>${xmlEscape(duzeltResim(u.resim_url || ""))}</g:image_link>
    <link>https://evemama.net/urun/${xmlEscape(u.slug)}</link>
    <g:product_type>${xmlEscape(u.kategoriler?.ad || "Evcil Hayvan")}</g:product_type>
    <g:brand>${xmlEscape(u.markalar?.ad || "evemama")}</g:brand>
    <description>${xmlEscape(u.kisa_aciklama || u.ad)}</description>
  </entry>`;
  }).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:g="http://base.google.com/ns/1.0">
  <title>evemama.net Ürün Kataloğu</title>
  <link>https://evemama.net</link>
  <updated>${new Date().toISOString()}</updated>
${entries}
</feed>`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}