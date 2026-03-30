export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  const { data: urunler } = await supabase
    .from("urunler")
    .select("*, kategoriler(ad)")
    .eq("aktif", true)
    .gt("stok", 0)
    .limit(500);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:g="http://base.google.com/ns/1.0">
${(urunler || []).map(u => `
  <entry>
    <g:id>${u.id}</g:id>
    <title>${u.ad}</title>
    <g:price>${u.fiyat} TRY</g:price>
    <g:availability>in stock</g:availability>
    <g:condition>new</g:condition>
    <g:image_link>${u.resim_url || ""}</g:image_link>
    <link>https://evemama.net/urun/${u.slug}</link>
    <g:product_type>${u.kategoriler?.ad || "Evcil Hayvan"}</g:product_type>
  </entry>`).join("")}
</feed>`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}