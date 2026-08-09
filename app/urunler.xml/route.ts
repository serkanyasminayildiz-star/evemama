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

function duzeltResim(url: string): string {
  if (!url) return "";
  return url.replace("https://evemama.net", "https://www.sepetmama.com");
}

// Aciklama zenginlestirme — cimri.xml ile ayni mantik. Mevcut aciklama
// 120+ karakter ise dokunmaz; aksi halde yapisal sablonla doldurur.
function aciklamaZenginlestir(u: { kisa_aciklama?: string; ad?: string; markalar?: { ad?: string } | null; kategoriler?: { ad?: string } | null }): string {
  const mevcut = (u.kisa_aciklama || "").trim();
  const ad = (u.ad || "").trim();
  const marka = (u.markalar?.ad || "").trim();
  const kategori = (u.kategoriler?.ad || "").trim();

  if (mevcut.length >= 120 && mevcut.toLowerCase() !== ad.toLowerCase()) {
    return mevcut;
  }

  const parcalar: string[] = [ad];
  if (marka && kategori) {
    parcalar.push(`${marka} markasinin ${kategori} kategorisinde yer alan bir ürünüdür.`);
  } else if (marka) {
    parcalar.push(`${marka} markasinin ürünüdür.`);
  } else if (kategori) {
    parcalar.push(`${kategori} kategorisinde bir üründür.`);
  }

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

  // Regex'ler Turkce karakteri de yakalar (kisir/kısır, yasli/yaşlı, yetiskin/
  // yetişkin) — aksi halde Turkce yazilmis urun adlari kacirilirdi.
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

  return parcalar.join(" ").trim().slice(0, 1500);
}

// Google Shopping basliklarini zenginlestirir: marka basta + kategori sonda.
// Mevcut adda zaten geciyorsa tekrarlamaz (kelime smiari case-insensitive).
// Cikti max 150 karakter (Google limit) — 70 karakter sonrasi kullanici
// goruntusunde kesilir ama tum 150 indeksleme icin kullanilir.
function basliZenginlestir(ad: string, marka?: string, kategori?: string): string {
  let baslik = (ad || "").trim();
  const dum = baslik.toLowerCase();

  // Marka basta: marka adi adda gecmiyorsa basa ekle
  if (marka) {
    const m = marka.trim();
    if (m && !dum.includes(m.toLowerCase())) {
      baslik = `${m} ${baslik}`;
    }
  }

  // Kategori sonda: kategori adi adda gecmiyorsa sona ekle (em-dash ile ayrac)
  if (kategori) {
    const k = kategori.trim();
    if (k && !baslik.toLowerCase().includes(k.toLowerCase())) {
      baslik = `${baslik} — ${k}`;
    }
  }

  // 150 karakter Google limiti — guvenli tarafta kalmak icin 145'te kes
  if (baslik.length > 150) {
    baslik = baslik.slice(0, 145).trim() + "…";
  }

  return baslik;
}

export async function GET() {
  // Stoku 0 olan urunleri feed'den CIKARMAK yerine icinde tutup
  // availability'yi out_of_stock isaretliyoruz. Aksi halde Google
  // Merchant urunun feed'den kaybolmasini 30 gun gecikme ile islerken
  // o sure boyunca eski "in stock" degerini gosterir → admin panelde
  // stoku 0 yapilan urun Merchant'ta hala "stokta var" gozukur.
  // SAYFALAMA ŞART: Supabase/PostgREST varsayılanı en fazla 1000 satır döner ve
  // .limit(1000) bunu AŞAMAZ. Katalog 2.120 aktif ürüne çıkınca feed'de yalnız
  // 1.000 ürün kalmıştı → 1.120 ürün Google Merchant'a HİÇ gitmiyordu (Shopping
  // gösterim havuzu yarıya düştü, kampanya günlük bütçesini harcayamıyordu).
  type UrunSatir = {
    id: number; ad: string; slug: string;
    fiyat: number | string; indirimli_fiyat: number | string | null;
    stok: number | string | null; gtin: string | null;
    resim_url: string | null; resimler: string[] | null; oncelikli: boolean | null;
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
    if (error) { console.error("[urunler.xml] sayfa okunamadi:", bas, error.message); break; }
    urunler.push(...((data || []) as UrunSatir[]));
    if (!data || data.length < 1000) break;
  }

  const entries = (urunler || []).map(u => {
    // String() sarma: Supabase sayısal kolonları number döner, parseFloat string
    // bekler (eski kodda tip 'any' olduğu için derleyici görmüyordu). Runtime AYNI.
    const fiyat = parseFloat(String(u.indirimli_fiyat || u.fiyat || 0));
    const normalFiyat = parseFloat(String(u.fiyat || 0));
    const stokSayisi = parseInt(String(u.stok ?? 0));
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

    // GTIN — varsa ekle. Yoksa identifier_exists=no EMIT ETME — bu Google'a
    // "bu urun gercekten markasiz/handmade" der ve marka urunler icin
    // sinirli statusune dusurur. Sadece etiketi bos birakmak daha guvenli:
    // Google "missing recommended" diye uyari verir ama Onayli kalir.
    const gtinEtiket = u.gtin?.trim() ? `<g:gtin>${xmlEscape(u.gtin.trim())}</g:gtin>` : "";

    // Baslik zenginlestirme: marka basa + kategori sona (yoksa) — Shopping
    // arama eslesmesini artirir, ozellikle Turkce uzun-kuyruk sorgularda.
    const zenginBaslik = basliZenginlestir(u.ad, u.markalar?.ad, u.kategoriler?.ad);

    return `  <entry>
    <g:id>${u.id}</g:id>
    <title>${xmlEscape(zenginBaslik)}</title>
    <g:price>${normalFiyat.toFixed(2)} TRY</g:price>
    ${fiyat < normalFiyat ? `<g:sale_price>${fiyat.toFixed(2)} TRY</g:sale_price>` : ""}
    <g:availability>${availability}</g:availability>
    <g:condition>new</g:condition>
    <g:image_link>${xmlEscape(duzeltResim(u.resim_url || ""))}</g:image_link>
    ${ekResimler}
    <link>https://www.evemama.net/urun/${xmlEscape(u.slug)}</link>
    <g:product_type>${xmlEscape(u.kategoriler?.ad || "Evcil Hayvan")}</g:product_type>
    <g:brand>${xmlEscape(u.markalar?.ad || "evemama")}</g:brand>
    ${gtinEtiket}
    <description>${xmlEscape(aciklamaZenginlestir(u))}</description>
    ${oncelikliEtiket}
  </entry>`;
  }).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:g="http://base.google.com/ns/1.0">
  <title>evemama.net Ürün Kataloğu</title>
  <link>https://www.evemama.net</link>
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