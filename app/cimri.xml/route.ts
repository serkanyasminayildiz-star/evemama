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

export async function GET(req: NextRequest) {
  // Stoku 0 olanlari da feed'de tut → Google Merchant'ta history korunur,
  // sadece availability "out of stock" gosterilir. Stok 0 -> feed'den
  // cikinca Merchant 30 gun "in stock" cache'ler, yanlis bilgi yansir.
  const { data: urunler } = await supabase
    .from("urunler")
    .select("*, kategoriler(ad), markalar(ad)")
    .eq("aktif", true)
    .gt("fiyat", 0)
    .limit(1000);

  const items = (urunler || []).map(u => {
    const normalFiyat = parseFloat(u.fiyat || 0);
    const indirimli = parseFloat(u.indirimli_fiyat || 0);
    const hasDiscount = indirimli > 0 && indirimli < normalFiyat;
    const stokSayisi = parseInt(u.stok ?? 0);
    const availability = stokSayisi > 0 ? "in stock" : "out of stock";

    if (normalFiyat <= 0) return "";

    const imageUrl = xmlEscape(u.resim_url || "");
    const slug = xmlEscape(u.slug || String(u.id));
    const title = xmlEscape(u.ad || "");
    const description = xmlEscape(u.kisa_aciklama || u.ad || "");
    const kategori = xmlEscape(u.kategoriler?.ad || "Evcil Hayvan");
    const marka = xmlEscape(u.markalar?.ad || "evemama");

    // Oncelikli isaretli urunler icin Google Ads Shopping kampanyasinda
    // ayri reklam grubu + yuksek TBM tanimlanmasi icin custom_label_0.
    const oncelikliEtiket = u.oncelikli ? `<g:custom_label_0>oncelikli</g:custom_label_0>` : "";

    // Ek resimler (max 5 ek) — feed'i sisirmemek icin sadece dolu URL'leri.
    const ekResimler = (Array.isArray(u.resimler) ? u.resimler : [])
      .filter((url: string) => url && url.trim().length > 0)
      .slice(0, 5)
      .map((url: string) => `<g:additional_image_link>${xmlEscape(url)}</g:additional_image_link>`)
      .join("\n      ");

    // GTIN — varsa Shopping ranking'i artirir. Yoksa hicbir sey emit etme
    // (identifier_exists=no marka urunler icin sinirli statusune dusurur).
    const gtinEtiket = u.gtin?.trim() ? `<g:gtin>${xmlEscape(u.gtin.trim())}</g:gtin>` : "";

    return `    <item>
      <g:id>${u.id}</g:id>
      <title>${title}</title>
      <link>https://evemama.net/urun/${slug}</link>
      <description>${description}</description>
      <g:price>${normalFiyat.toFixed(2)} TRY</g:price>
      ${hasDiscount ? `<g:sale_price>${indirimli.toFixed(2)} TRY</g:sale_price>` : ""}
      <g:availability>${availability}</g:availability>
      <g:condition>new</g:condition>
      <g:image_link>${imageUrl}</g:image_link>
      ${ekResimler}
      <g:product_type>${kategori}</g:product_type>
      <g:brand>${marka}</g:brand>
      ${gtinEtiket}
      ${oncelikliEtiket}
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
      // 1 saat cache CDN/Cimri tarafinda eski deger tutuyordu. 5 dk + 1 dk
      // SWR yeterli — Cimri gunde birkac cekim yapar, degisiklikler max 5 dk
      // icinde yansir.
      "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
    },
  });
}