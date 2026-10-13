// Haftalık alım limiti (13 Eki 2026) — TEK KAYNAK.
//
// KURAL: Aynı müşteri aynı üründen KAYAN 7 gün içinde en fazla N adet alabilir.
// N bütün ürünlerde aynıdır; admin → Site Ayarları'ndan girilir
// (site_ayarlari.haftalik_alim_limiti). Boş / 0 / geçersiz = limit KAPALI.
//
// Neden 7 gün (kullanıcı kararı): toplu alıp yeniden satanı keser ama düzenli
// mama alan müşteriyi sınırlamaz — sınır her hafta kendiliğinden yenilenir.
//
// "Aynı müşteri" = aynı e-posta VEYA aynı telefon: farklı e-postayla aynı
// telefonu (ya da tersini) kullanan da yakalanır. E-postada büyük/küçük harf,
// "+etiket" ve Gmail noktaları; telefonda "+90 / 0 / boşluk" farkı yok sayılır.
//
// Sayılan siparişler: iptal/iade EDİLMEMİŞ olanların hepsi — ödemesi bekleyen
// havale/kapıda/elden dahil (yoksa ödenmemiş siparişlerle sınır aşılırdı).
//
// Kontrol YALNIZ /api/odeme'de, ödeme BAŞLAMADAN yapılır. Kart siparişi
// siparisler'e iyzico callback'inde yazılır; orada reddetmek parası alınmış
// müşteriyi siparişsiz bırakırdı.
//
// Dosya istemci-güvenlidir (admin Site Ayarları da okur): saf fonksiyonlar +
// DB istemcisini parametre alan sunucu kontrolü.

import type { SupabaseClient } from "@supabase/supabase-js";

export const ALIM_LIMITI = {
  AYAR_ANAHTARI: "haftalik_alim_limiti",
  GUN: 7,
} as const;

const GUN_MS = 86_400_000;

/** Ayar değerini limite çevirir: pozitif tam sayı değilse null (= limit kapalı). */
export function limitCoz(deger: unknown): number | null {
  const metin = String(deger ?? "").trim();
  if (!/^\d+$/.test(metin)) return null;
  const n = parseInt(metin, 10);
  return n > 0 ? n : null;
}

/** E-posta kimliği: küçük harf, "+etiket" atılır, Gmail'de noktalar yok sayılır
 *  (a.li+x@gmail.com = ali@gmail.com — Gmail ikisini aynı kutuya teslim eder). */
export function emailKimlik(e: unknown): string {
  const temiz = String(e ?? "").trim().toLowerCase();
  const at = temiz.lastIndexOf("@");
  if (at < 1) return "";
  const alan = temiz.slice(at + 1) === "googlemail.com" ? "gmail.com" : temiz.slice(at + 1);
  let yerel = temiz.slice(0, at).split("+")[0];
  if (alan === "gmail.com") yerel = yerel.replace(/\./g, "");
  return yerel && alan ? `${yerel}@${alan}` : "";
}

/** Telefon kimliği: son 10 hane (5XXXXXXXXX) — "+90 532…", "0532…", "532…" aynı kişi. */
export function telefonKimlik(t: unknown): string {
  const rakam = String(t ?? "").replace(/\D/g, "");
  return rakam.length >= 10 ? rakam.slice(-10) : "";
}

type SepetKalemi = { id: number; name: string; quantity: number };

type GecmisSiparis = {
  email?: string | null;
  telefon?: string | null;
  urunler?: unknown;
  durum?: string | null;
  odeme_durumu?: string | null;
  created_at?: string | null;
};

export type Musteri = { emailler: unknown[]; telefon: unknown };

export type LimitAsimi = {
  ad: string;
  limit: number;
  kalan: number;           // bu siparişte daha alınabilecek adet (0 = hiç)
  yenilenme: Date | null;  // kalan 0 ise: en az 1 adet yeniden alınabileceği an
};

const SAYILMAZ = new Set(["iptal", "iade"]);

/** siparisler.created_at ofsetsiz gelir ("2026-10-13T12:10:55.132" — UTC duvar
 *  saati, timestamp without time zone). Date.parse ofsetsiz metni YEREL saat
 *  sayar → ofset yoksa UTC ("Z") eklenir; sunucunun saat diliminden bağımsız. */
function zamanCoz(deger: unknown): number {
  const metin = String(deger ?? "");
  return Date.parse(/[zZ]|[+-]\d\d:?\d\d$/.test(metin) ? metin : `${metin}Z`);
}

/** siparisler.urunler JSON metni de olabilir dizi de — güvenle diziye çevirir. */
function kalemler(urunler: unknown): Array<{ id?: unknown; quantity?: unknown }> {
  let v = urunler;
  if (typeof v === "string") {
    try { v = JSON.parse(v); } catch { return []; }
  }
  return Array.isArray(v) ? v : [];
}

/**
 * SAF hesap: sepetteki her ürün için müşterinin son 7 gündeki alımı + bu
 * sepetteki adet limiti aşıyor mu? İlk aşımı döndürür, yoksa null.
 * gecmis kimliğe göre süzülmemiş olabilir — eşleme burada yapılır.
 */
export function limitAsiminiBul(
  limit: number,
  sepet: SepetKalemi[],
  gecmis: GecmisSiparis[],
  musteri: Musteri,
  simdi: Date = new Date(),
): LimitAsimi | null {
  const emailler = new Set(musteri.emailler.map(emailKimlik).filter(Boolean));
  const tel = telefonKimlik(musteri.telefon);
  const pencereBasi = simdi.getTime() - ALIM_LIMITI.GUN * GUN_MS;

  // Bu müşterinin sayılan siparişlerindeki alımlar: ürün id → [{ zaman, adet }]
  const alimlar = new Map<number, Array<{ zaman: number; adet: number }>>();
  for (const s of gecmis) {
    const zaman = zamanCoz(s.created_at);
    if (!Number.isFinite(zaman) || zaman < pencereBasi) continue;
    if (SAYILMAZ.has(String(s.durum || "")) || SAYILMAZ.has(String(s.odeme_durumu || ""))) continue;
    const ayniMusteri =
      (emailler.size > 0 && emailler.has(emailKimlik(s.email))) ||
      (tel !== "" && telefonKimlik(s.telefon) === tel);
    if (!ayniMusteri) continue;
    for (const k of kalemler(s.urunler)) {
      const id = Number(k.id);
      const adet = Number(k.quantity);
      if (!Number.isFinite(id) || !(adet > 0)) continue;
      const liste = alimlar.get(id) || [];
      liste.push({ zaman, adet });
      alimlar.set(id, liste);
    }
  }

  for (const k of sepet) {
    const onceki = (alimlar.get(k.id) || []).sort((a, b) => a.zaman - b.zaman);
    const oncekiAdet = onceki.reduce((t, x) => t + x.adet, 0);
    if (oncekiAdet + k.quantity <= limit) continue;
    const kalan = Math.max(0, limit - oncekiAdet);
    // Kalan 0 ise: en eski alımlar pencereden düştükçe sayaç azalır; en az 1
    // adede yer açıldığı an = yenilenme.
    let yenilenme: Date | null = null;
    if (kalan === 0) {
      let sayac = oncekiAdet;
      for (const x of onceki) {
        sayac -= x.adet;
        if (sayac <= limit - 1) { yenilenme = new Date(x.zaman + ALIM_LIMITI.GUN * GUN_MS); break; }
      }
    }
    return { ad: k.name, limit, kalan, yenilenme };
  }
  return null;
}

const TARIH = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul",
});

/** Müşteriye gösterilen mesaj. Önceki alımların adedi yazılmaz; yalnız
 *  müşterinin ne yapabileceği (kalan adet / yenilenme zamanı). */
export function limitMesaji(a: LimitAsimi): string {
  const bas = `“${a.ad}” ürününden bir haftada en fazla ${a.limit} adet satın alınabilir.`;
  if (a.kalan >= a.limit) return `${bas} Lütfen sepetinizdeki adedi ${a.limit} veya daha aza düşürün.`;
  if (a.kalan > 0) return `${bas} Son 7 gündeki siparişleriniz de sayıldığından bu siparişte en fazla ${a.kalan} adet alabilirsiniz; lütfen sepetinizdeki adedi düşürün.`;
  const ne = a.yenilenme ? `${TARIH.format(a.yenilenme)} itibarıyla` : "birkaç gün sonra";
  return `${bas} Son 7 gündeki siparişlerinizle bu sınıra ulaştınız; bu ürünü ${ne} yeniden alabilirsiniz. Diğer ürünlerle devam etmek için bu ürünü sepetinizden çıkarın.`;
}

/**
 * Sunucu kontrolü (/api/odeme). Aşım varsa müşteriye gösterilecek mesajı,
 * yoksa null döndürür. FAIL-OPEN: ayar ya da geçmiş okunamazsa satış durmaz —
 * limit bir iş kuralıdır, fiyat doğrulaması gibi bir güvenlik kapısı değil.
 */
export async function alimLimitiKontrol(
  db: SupabaseClient,
  sepet: SepetKalemi[],
  musteri: Musteri,
): Promise<string | null> {
  try {
    const { data: ayar, error: ayarHata } = await db
      .from("site_ayarlari").select("deger").eq("anahtar", ALIM_LIMITI.AYAR_ANAHTARI).maybeSingle();
    if (ayarHata) throw ayarHata;
    const limit = limitCoz(ayar?.deger);
    if (!limit) return null; // limit kapalı

    const simdi = new Date();
    // Penceredeki TÜM siparişler çekilip müşteri JS'te eşlenir: telefon DB'de
    // farklı biçimlerde ("+90…", "0…", "5…") duruyor ve müşteri girdisini
    // PostgREST filtresine gömmek enjeksiyon riski. Hacim küçük (haftada
    // onlarca sipariş); 1000'i geçerse sayfalama gerekir.
    const { data: gecmis, error } = await db
      .from("siparisler")
      .select("email, telefon, urunler, durum, odeme_durumu, created_at")
      .gte("created_at", new Date(simdi.getTime() - ALIM_LIMITI.GUN * GUN_MS).toISOString())
      .order("created_at", { ascending: false })
      .range(0, 999);
    if (error) throw error;

    const asim = limitAsiminiBul(limit, sepet, (gecmis || []) as GecmisSiparis[], musteri, simdi);
    return asim ? limitMesaji(asim) : null;
  } catch (e) {
    console.error("[alim-limiti] kontrol yapilamadi (fail-open):", e);
    return null;
  }
}
