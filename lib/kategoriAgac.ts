// Kategori ağacı — SAF yardımcılar, TEK KAYNAK (22 Eyl 2026).
//
// NEDEN VAR: kategori sayfası `kategoriler` tablosuna sayfa başına ~11 ayrı
// sorgu atıyordu — sunucuda 5 (kategoriGetir metadata + sayfa için iki kez,
// artı seviye1/2/3 için üç sorgu), istemcide 6. Oysa tablo 72 satır ve tüm
// liste zaten tek sorguda çekiliyordu; diğerlerinin istediği her şey o
// listeden türetilebilir.
//
// ÖLÇÜM (22 Eyl, pg_stat_user_tables): kategoriler = 849.925 tam tarama /
// 54,7 milyon satır okuma → Supabase Disk IO bütçesinin EN BÜYÜK tüketicisi
// (toplamın ~%55'i). "Disk IO Budget tükenmek üzere" uyarısının kökü buydu.
// 72 satırlık tabloda indeks çözüm değildir (Postgres o boyutta zaten seq
// scan seçer) — sorun sorgu SAYISI, sorgu maliyeti değil.
//
// DAVRANIŞ BİREBİR KORUNUR: `aktif` süzgeci YOKTUR — eski seviye1/2/3
// sorgularında da yoktu (pasif kategorilerin ürünleri de listeleniyordu).
// Buradaki değişiklik yalnızca "nerede hesaplandığı"dır, "ne hesaplandığı" değil.

export type KategoriDugum = {
  id: number | string;
  ust_kategori_id?: number | string | null;
};

// id'ler DB'den sayı ya da metin gelebilir; SQL eşitliğiyle aynı davranmak
// için normalize karşılaştırma.
const ayni = (a: unknown, b: unknown) => String(a) === String(b);

/** Verilen üst id'lerin DOĞRUDAN çocukları. */
export function cocuklar<T extends KategoriDugum>(
  tum: T[],
  ustIdler: Array<number | string>,
): T[] {
  const kume = new Set(ustIdler.map(String));
  return tum.filter(k => k.ust_kategori_id != null && kume.has(String(k.ust_kategori_id)));
}

/**
 * Kök kategori + 3 seviye altındaki TÜM kategori id'leri.
 *
 * Eski üç sorgunun birebir karşılığı:
 *   seviye1 = id.eq(kök) OR ust_kategori_id.eq(kök)   → kök + doğrudan çocuklar
 *   seviye2 = ust_kategori_id IN seviye1
 *   seviye3 = ust_kategori_id IN (seviye1 ∪ seviye2)
 * Sonuç: üçünün tekilleştirilmiş birleşimi.
 */
export function altAgacIdleri(
  tum: KategoriDugum[],
  kokId: number | string,
): Array<number | string> {
  const bulunan = tum
    .filter(k => ayni(k.id, kokId) || ayni(k.ust_kategori_id, kokId))
    .map(k => k.id);
  // Kök listede yoksa (beklenmez) en azından kendisiyle devam et — eski koddaki
  // `|| [kat.id]` yedeğinin karşılığı.
  const idler1 = bulunan.length ? bulunan : [kokId];
  const idler2 = cocuklar(tum, idler1).map(k => k.id);
  const idler3 = cocuklar(tum, [...idler1, ...idler2]).map(k => k.id);
  return Array.from(new Set([...idler1, ...idler2, ...idler3]));
}

/** Slug ile kategori bul (DB'deki .eq("slug", x).limit(1) karşılığı). */
export function slugIleBul<T extends KategoriDugum & { slug?: string }>(
  tum: T[],
  slug: string,
): T | null {
  return tum.find(k => k.slug === slug) || null;
}
