// Sepet doğrulama (13 Eki 2026) — fiyat ve ad TARAYICIDAN DEĞİL veritabanından.
//
// AÇIK: /api/odeme tarayıcının gönderdiği item.price'ı doğrudan iyzico tutarına
// ve havale/kapıda/elden siparişine yazıyordu — tarayıcıda fiyatı değiştiren
// biri ürünü istediği fiyata alabilirdi (geçmiş 441 kalem tarandı, istismar
// izi yok). Kargo ürün ADINDAN (kg) hesaplandığı için ad da DB'den alınır.
//
// Sepet localStorage'da günlerce durabildiği için fiyatı sonradan değişmiş ürün
// normaldir: sipariş REDDEDİLİR (409) ve istemci sepeti DB'deki güncel değerle
// düzeltir (CartContext.sepetiDuzelt) — müşteri ekranda gördüğünden farklı
// tutar ödemez, yeni tutarı görüp tekrar onaylar.
//
// Saf modül: DB okumasını çağıran (/api/odeme) yapar.

import { urunAgirligiKg } from "./indirim";

/** /api/odeme'nin urunler tablosundan çektiği alanlar. */
export type DbUrun = {
  id: number;
  ad: string;
  slug: string | null;
  fiyat: number | null;
  indirimli_fiyat: number | null;
  resim_url: string | null;
  aktif: boolean | null;
};

/** Siparişe yazılan kalem — eskiden istemciden gelen şekille AYNI anahtarlar
 *  (admin, e-postalar, stok düşümü bunları okur). */
export type DogruKalem = {
  id: number;
  name: string;
  price: number;
  emoji: string;
  resim_url?: string;
  slug?: string;
  quantity: number;
};

/** 409 yanıtında istemciye giden düzeltme (CartContext.sepetiDuzelt uygular). */
export type SepetDuzeltme = {
  fiyat: Array<{ id: number; price: number; name: string }>;
  kaldir: number[];
};

type HamKalem = { id: number; adet: number; fiyat: number; ad: string };

export const SEPET_SINIR = { MAKS_KALEM: 100, MAKS_ADET: 999 } as const;

/** Satış fiyatı — istemcideki addItem ile AYNI kural: indirimli || liste fiyatı. */
export function satisFiyati(u: Pick<DbUrun, "fiyat" | "indirimli_fiyat">): number {
  return Number(u.indirimli_fiyat) || Number(u.fiyat) || 0;
}

/** İstemci sepetini ayrıştırır: id + adet bağlayıcı; fiyat/ad yalnız
 *  karşılaştırma için. Aynı ürün iki satırda gelirse birleşir (limit doğru sayılsın). */
export function sepetiAyristir(ham: unknown): { ok: true; kalemler: HamKalem[] } | { ok: false; hata: string } {
  if (!Array.isArray(ham) || ham.length === 0) {
    return { ok: false, hata: "Sepetiniz boş görünüyor. Lütfen ürün ekleyip tekrar deneyin." };
  }
  if (ham.length > SEPET_SINIR.MAKS_KALEM) {
    return { ok: false, hata: "Sepetinizde çok fazla ürün var. Lütfen sepetinizi küçültüp tekrar deneyin." };
  }
  const gecersiz = { ok: false as const, hata: "Sepetinizdeki bir ürünün adedi geçersiz. Lütfen sepetinizi kontrol edin." };
  const birlesik = new Map<number, HamKalem>();
  for (const x of ham) {
    const r = (x ?? {}) as Record<string, unknown>;
    const id = Number(r.id);
    const adet = Number(r.quantity);
    if (!Number.isInteger(id) || id <= 0 || !Number.isInteger(adet) || adet < 1) return gecersiz;
    const onceki = birlesik.get(id);
    const toplam = (onceki?.adet || 0) + adet;
    if (toplam > SEPET_SINIR.MAKS_ADET) return gecersiz;
    if (onceki) onceki.adet = toplam;
    // Ad KESİLMEZ: ağırlık addan okunur, uzun adın sonundaki "13 Kg" kesilirse
    // ağırlık farklı çıkıp yersiz düzeltme doğuyordu (id 2075, 121 karakter).
    else birlesik.set(id, { id, adet, fiyat: Number(r.price), ad: String(r.name ?? "") });
  }
  return { ok: true, kalemler: [...birlesik.values()] };
}

/** DB satırlarıyla karşılaştırır: satıştan kalkan ürün ya da istemcinin
 *  gördüğünden farklı fiyat/ağırlık varsa düzeltmeyle reddeder; yoksa DB
 *  değerleriyle kurulmuş sepeti döndürür. */
export function sepetiKarsilastir(
  kalemler: HamKalem[],
  dbUrunler: DbUrun[],
): { ok: true; sepet: DogruKalem[] } | { ok: false; hata: string; duzelt: SepetDuzeltme } {
  const dbMap = new Map(dbUrunler.map(u => [Number(u.id), u]));
  const duzelt: SepetDuzeltme = { fiyat: [], kaldir: [] };
  const kaldirilanAdlar: string[] = [];
  const sepet: DogruKalem[] = [];

  for (const k of kalemler) {
    const u = dbMap.get(k.id);
    const fiyat = u ? satisFiyati(u) : 0;
    if (!u || u.aktif === false || !(fiyat > 0)) {
      duzelt.kaldir.push(k.id);
      kaldirilanAdlar.push(u?.ad || k.ad.slice(0, 120) || "Bir ürün");
      continue;
    }
    // Fiyat ya da kargoyu belirleyen ağırlık (addan) istemcinin gösterdiğinden
    // farklıysa müşteri ekrandakinden farklı tutar öderdi → düzelt.
    if (Math.abs(k.fiyat - fiyat) > 0.005 || urunAgirligiKg(k.ad) !== urunAgirligiKg(u.ad)) {
      duzelt.fiyat.push({ id: k.id, price: fiyat, name: u.ad });
    }
    sepet.push({
      id: k.id,
      name: u.ad,
      price: fiyat,
      emoji: "🐾",
      ...(u.resim_url ? { resim_url: u.resim_url } : {}),
      ...(u.slug ? { slug: u.slug } : {}),
      quantity: k.adet,
    });
  }

  if (duzelt.kaldir.length || duzelt.fiyat.length) {
    const parcalar: string[] = [];
    if (kaldirilanAdlar.length) {
      parcalar.push(`${kaldirilanAdlar.map(a => `“${a}”`).join(", ")} artık satışta değil, sepetinizden çıkarıldı.`);
    }
    if (duzelt.fiyat.length) {
      parcalar.push("Sepetinizdeki bazı ürünlerin fiyatı güncellendi; sepetiniz güncel fiyatlarla yenilendi.");
    }
    parcalar.push("Lütfen tutarı kontrol edip tekrar deneyin.");
    return { ok: false, hata: parcalar.join(" "), duzelt };
  }
  return { ok: true, sepet };
}
