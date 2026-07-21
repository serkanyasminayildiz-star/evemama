// Bezos B2B XML tedarikçi feed'i — AKIŞLI okuma + petshop filtresi.
//
// NEDEN AKIŞ: feed 104 MB / ~74 sn. Ama petshop ürünleri feed'in İÇİNDE
// KÜMELENMİŞ (ölçüldü: 9.001–10.972. sıralar = ilk ~22 MB). Bu yüzden akışı
// okur, petshop bloğu bittiğinde ERKEN KESERİZ → ~16 sn. Böylece serverless
// süre sınırına (maxDuration) rahat sığar ve tüm feed'i belleğe almayız.
//
// FİYAT: feed yalnız alış fiyatı verir (KDV HARİÇ) → satış = alış × 1,20 × 1,35.

export const BEZOS_FEED_URL = "https://www.bezos.com.tr/xml-bayi/?xml=BAY%DD%20XML&B2BXML=1";
export const BEZOS_KDV = 1.20;
export const BEZOS_KAR = 1.35;

/** Tedarikçi alış fiyatından evemama satış fiyatı (KDV dahil + kâr). */
export function bezosSatisFiyati(alisFiyati: number): number {
  return Math.round(alisFiyati * BEZOS_KDV * BEZOS_KAR * 100) / 100;
}

export type BezosUrun = { barkod: string; isim: string; alis: number; stok: number };

export type BezosCekimSonuc = {
  urunler: BezosUrun[];
  taranan: number;      // taranan ürün bloğu
  okunanMb: number;
  saniye: number;
  erkenKesildi: boolean; // petshop bloğu bitince kesildi mi (beklenen davranış)
  sureDoldu: boolean;    // zaman bütçesi doldu → veri EKSİK olabilir
};

function alanCek(blok: string, etiket: string): string {
  const m = blok.match(new RegExp(`<${etiket}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${etiket}>`));
  return m ? m[1].trim() : "";
}
function sayi(s: string): number {
  return parseFloat((s || "").replace(/\./g, "").replace(",", ".")) || 0;
}

/**
 * Feed'i akışla okur, YALNIZ petshop ürünlerini döndürür.
 * @param offset  feed sayfası (0 = ilk 50.000, 50000 = kalanlar)
 * @param sureButcesiMs  bu süreyi aşarsa okumayı bırakır (sureDoldu=true)
 * @param bosSabir  petshop bulunduktan sonra bu kadar ardışık petshop-dışı
 *                  ürün görülürse blok bitti sayılır ve akış kesilir.
 */
export async function bezosPetshopCek(
  offset = 0,
  sureButcesiMs = 40_000,
  bosSabir = 3000,
): Promise<BezosCekimSonuc> {
  const t0 = Date.now();
  const url = offset > 0 ? `${BEZOS_FEED_URL}&OFFSET=${offset}` : BEZOS_FEED_URL;
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok || !r.body) throw new Error(`Bezos feed ${r.status} ${r.statusText}`);

  const okuyucu = r.body.getReader();
  const cozucu = new TextDecoder("utf-8");
  const urunler: BezosUrun[] = [];
  let tampon = "", taranan = 0, byte = 0, bosSayac = 0, bulundu = false;
  let erkenKesildi = false, sureDoldu = false;

  try {
    for (;;) {
      const { done, value } = await okuyucu.read();
      if (done) break;
      byte += value.byteLength;
      tampon += cozucu.decode(value, { stream: true });

      let kesim: number;
      while ((kesim = tampon.indexOf("</urun>")) !== -1) {
        const parca = tampon.slice(0, kesim);
        tampon = tampon.slice(kesim + 7);
        const bas = parca.lastIndexOf("<urun>");
        if (bas === -1) continue;
        const blok = parca.slice(bas + 6);
        taranan++;

        if (!blok.includes("Petshop Ürünleri")) { if (bulundu) bosSayac++; continue; }
        bulundu = true; bosSayac = 0;
        const barkod = alanCek(blok, "barkod");
        const alis = sayi(alanCek(blok, "alis_fiyat"));
        if (!barkod || alis <= 0) continue; // bozuk satır → atla (fiyatı 0 yazmayalım)
        urunler.push({ barkod, isim: alanCek(blok, "isim"), alis, stok: parseInt(alanCek(blok, "stok")) || 0 });
      }

      if (bulundu && bosSayac > bosSabir) { erkenKesildi = true; break; }
      if (Date.now() - t0 > sureButcesiMs) { sureDoldu = true; break; }
    }
  } finally {
    try { await okuyucu.cancel(); } catch { /* akış zaten kapanmış olabilir */ }
  }

  return {
    urunler, taranan,
    okunanMb: Math.round(byte / 1e5) / 10,
    saniye: Math.round((Date.now() - t0) / 100) / 10,
    erkenKesildi, sureDoldu,
  };
}
