export const runtime = 'nodejs';
// force-dynamic + revalidate=0: Next.js'in route handler data cache'i
// devre disi → her istekte Supabase'den canli veri cek. Aksi halde
// build time'da static cache → fiyat/stok degisiklikleri yansimaz.
export const dynamic = 'force-dynamic';
export const revalidate = 0;
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
  // Stoku 0 olan urunleri feed'den CIKARMAK yerine icinde tutup
  // availability'yi out_of_stock isaretliyoruz. Aksi halde Google
  // Merchant urunun feed'den kaybolmasini 30 gun gecikme ile islerken
  // o sure boyunca eski "in stock" degerini gosterir → admin panelde
  // stoku 0 yapilan urun Merchant'ta hala "stokta var" gozukur.
  const { data: urunler } = await supabase
    .from("urunler")
    .select("*, kategoriler(ad), markalar(ad)")
    .eq("aktif", true)
    .gt("fiyat", 0)
    .limit(1000);

  const entries = (urunler || []).map(u => {
    const fiyat = parseFloat(u.indirimli_fiyat || u.fiyat || 0);
    const normalFiyat = parseFloat(u.fiyat || 0);
    const stokSayisi = parseInt(u.stok ?? 0);
    const availability = stokSayisi > 0 ? "in stock" : "out of stock";

    // custom_label_0 = "oncelikli" → Google Ads Shopping kampanyasinda
    // bu etikete gore reklam grubu kurulup yuksek TBM tanimlanabilir;
    // oncelikli urunler daha cok gosterilir.
    const oncelikliEtiket = u.oncelikli ? `<g:custom_label_0>oncelikli</g:custom_label_0>` : "";

    // Ek resimler — Google Shopping max 10 additional_image_link kabul eder;
    // bizim formda max 5 ek resim oluyor (toplam 6).
    const ekResimler = (Array.isArray(u.resimler) ? u.resimler : [])
      .slice(0, 10)
      .map((url: string) => `<g:additional_image_link>${xmlEscape(duzeltResim(url))}</g:additional_image_link>`)
      .join("\n    ");

    // GTIN — Google Shopping'in onay sürecinde çok yardımcı olur (yoksa
    // identifier_exists=no demek gerek ama bu Shopping ranking'i düşürür).
    const gtinEtiket = u.gtin?.trim() ? `<g:gtin>${xmlEscape(u.gtin.trim())}</g:gtin>` : `<g:identifier_exists>no</g:identifier_exists>`;

    return `  <entry>
    <g:id>${u.id}</g:id>
    <title>${xmlEscape(u.ad)}</title>
    <g:price>${normalFiyat.toFixed(2)} TRY</g:price>
    ${fiyat < normalFiyat ? `<g:sale_price>${fiyat.toFixed(2)} TRY</g:sale_price>` : ""}
    <g:availability>${availability}</g:availability>
    <g:condition>new</g:condition>
    <g:image_link>${xmlEscape(duzeltResim(u.resim_url || ""))}</g:image_link>
    ${ekResimler}
    <link>https://evemama.net/urun/${xmlEscape(u.slug)}</link>
    <g:product_type>${xmlEscape(u.kategoriler?.ad || "Evcil Hayvan")}</g:product_type>
    <g:brand>${xmlEscape(u.markalar?.ad || "evemama")}</g:brand>
    ${gtinEtiket}
    <description>${xmlEscape(u.kisa_aciklama || u.ad)}</description>
    ${oncelikliEtiket}
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
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      // 5 dk edge cache + 1 dk SWR — fiyat/stok degisiklikleri max 5 dk
      // icinde yansir, CDN gereksiz yere DB ezilmesini onler.
      "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
    },
  });
}