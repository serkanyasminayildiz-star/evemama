export const runtime = 'nodejs';
// force-dynamic + revalidate=0: Next.js'in route handler data cache'i
// devre disi → her istekte Supabase'den canli veri cek. Aksi halde
// build time'da static cache → fiyat/stok degisiklikleri yansimaz.
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextResponse } from "next/server";
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

// Aciklama zenginlestirme — Google Shopping description alani icin yapisal
// metin uretir. Promosyon ifadelerinden kaciniyor (Google penalty), doga ve
// yapisal bilgi (marka + kategori + ozellikler) ekliyor.
//
// Strateji:
// 1) Mevcut aciklama 120+ karakter ise dokunmuyoruz (kullanici elden
//    yazmis, kaliteli).
// 2) Aksi halde: urun adi + "marka X kategorisinde yer alan ürünüdür" +
//    urun adindan cikartilan ozellikler (yas, tahilsiz, kisir vs.).
function aciklamaZenginlestir(u: { kisa_aciklama?: string; ad?: string; markalar?: { ad?: string } | null; kategoriler?: { ad?: string } | null }): string {
  const mevcut = (u.kisa_aciklama || "").trim();
  const ad = (u.ad || "").trim();
  const marka = (u.markalar?.ad || "").trim();
  const kategori = (u.kategoriler?.ad || "").trim();

  // Mevcut aciklama dolu ve adi tekrar etmiyorsa onu kullan
  if (mevcut.length >= 120 && mevcut.toLowerCase() !== ad.toLowerCase()) {
    return mevcut;
  }

  const parcalar: string[] = [ad];

  // Marka + kategori cumlesi (dogal Turkce)
  if (marka && kategori) {
    parcalar.push(`${marka} markasinin ${kategori} kategorisinde yer alan bir ürünüdür.`);
  } else if (marka) {
    parcalar.push(`${marka} markasinin ürünüdür.`);
  } else if (kategori) {
    parcalar.push(`${kategori} kategorisinde bir üründür.`);
  }

  // Mevcut kisa aciklama varsa (kisa ama bilgili)
  if (mevcut && mevcut.toLowerCase() !== ad.toLowerCase()) {
    parcalar.push(mevcut);
  }

  // Hayvan turu tespiti: "evcil hayvan" yerine spesifik "kedi"/"kopek"
  // kullanarak musterilerin aradigi dogal ifadeleri ("kedi mamasi",
  // "kisir kedi mamasi", "yavru kopek mamasi") CUMLE ICINDE kapsar — etiket/
  // liste DEGIL (Google keyword stuffing saymaz). Rakip marka adi (purina,
  // proplan vb.) ASLA eklenmez; her urun yalniz kendi markasiyla anilir.
  const tip = `${ad} ${kategori}`.toLowerCase();
  const tur = /kedi|cat|kitten/.test(tip) ? "kedi" : /k[oö]pek|dog|puppy/.test(tip) ? "köpek" : "evcil hayvan";

  // Urun adindan cikarilabilen ozellikler — Shopping arama eslesmesi icin.
  // Regex'ler Turkce karakteri de yakalar (kisir/kısır, yasli/yaşlı...).
  const adLow = ad.toLowerCase();
  const ozellikler: string[] = [];
  if (/yavru|kitten|puppy/.test(adLow)) ozellikler.push(`yavru ${tur}ler için`);
  if (/yeti[sş]kin|adult/.test(adLow)) ozellikler.push(`yetişkin ${tur}ler için`);
  if (/ya[sş]l[iı]|senior|mature/.test(adLow)) ozellikler.push(`yaşlı ${tur}ler için`);
  if (/tah[iı]l ?s[iı]z|grain ?free/.test(adLow)) ozellikler.push("tahılsız formül");
  if (/k[iı]s[iı]r|sterilised/.test(adLow)) ozellikler.push(`kısırlaştırılmış (kısır) ${tur}ler için`);
  if (/hipoaler|hypoallergenic/.test(adLow)) ozellikler.push("hipoalerjenik");
  if (/ila[cç]|sa[gğ]l[iı]k|tedavi|veterinary/.test(adLow)) ozellikler.push("sağlık desteği");
  if (ozellikler.length > 0) {
    parcalar.push(`Özellikler: ${ozellikler.join(", ")}.`);
  }

  // Mama urunlerinde dogal kapanis cumlesi — "kedi mamasi"/"kopek mamasi"
  // ifadesi musteri araminda dogal eslessin (tam cumle, etiket degil).
  if (/mama|food/.test(tip) && tur !== "evcil hayvan") {
    parcalar.push(`Evcil dostunuz için kaliteli bir ${tur} mamasıdır.`);
  }

  // Google description limit 5000 ama 1000 cevresi optimal
  return parcalar.join(" ").trim().slice(0, 1500);
}

export async function GET() {
  // Stoku 0 olanlari da feed'de tut → Google Merchant'ta history korunur,
  // sadece availability "out of stock" gosterilir. Stok 0 -> feed'den
  // cikinca Merchant 30 gun "in stock" cache'ler, yanlis bilgi yansir.
  // SAYFALAMA ŞART: PostgREST varsayılanı max 1000 satır ve .limit(1000) bunu
  // AŞAMAZ (urunler.xml'de aynı tuzak yaşandı). Katalog 2.120 ürüne çıkınca bu
  // feed 1.000'de kilitlenmişti → Merchant/Cimri eksik ürün görüyordu.
  type UrunSatir = {
    id: number; ad: string; slug: string;
    fiyat: number | string; indirimli_fiyat: number | string | null;
    stok: number | string | null; gtin: string | null; barkod?: string | null;
    resim_url: string | null; resimler: string[] | null; oncelikli: boolean | null;
    kisa_aciklama?: string; aciklama?: string;
    kategoriler: { ad: string } | null; markalar: { ad: string } | null;
  };
  const urunler: UrunSatir[] = [];
  for (let bas = 0; bas < 20000; bas += 1000) {
    const { data, error } = await supabase
      .from("urunler")
      .select("*, kategoriler(ad), markalar(ad)")
      .eq("aktif", true)
      .gt("fiyat", 0)
      .order("id", { ascending: true })
      .range(bas, bas + 999);
    if (error) { console.error("[cimri.xml] sayfa okunamadi:", bas, error.message); break; }
    urunler.push(...((data || []) as UrunSatir[]));
    if (!data || data.length < 1000) break;
  }

  const items = (urunler || []).map(u => {
    // String() sarma: Supabase sayısal kolonu number döner, parseFloat string
    // bekler (tip önceden 'any' olduğu için derleyici görmüyordu). Runtime AYNI.
    const normalFiyat = parseFloat(String(u.fiyat || 0));
    const indirimli = parseFloat(String(u.indirimli_fiyat || 0));
    const hasDiscount = indirimli > 0 && indirimli < normalFiyat;
    const stokSayisi = parseInt(String(u.stok ?? 0));
    const availability = stokSayisi > 0 ? "in stock" : "out of stock";

    if (normalFiyat <= 0) return "";

    const imageUrl = xmlEscape(u.resim_url || "");
    const slug = xmlEscape(u.slug || String(u.id));
    const title = xmlEscape(u.ad || "");
    const description = xmlEscape(aciklamaZenginlestir(u));
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
      <link>https://www.evemama.net/urun/${slug}</link>
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
    <link>https://www.evemama.net</link>
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