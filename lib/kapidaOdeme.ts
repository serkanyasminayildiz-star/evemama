// Kapıda ödeme — TEK KAYNAK (2 Eyl 2026).
//
// Kart tarafında yaşanan aralıklı retler yüzünden müşteriye kart dışında
// çalışan bir yol daha açıldı. Kargo entegrasyonu henüz yok; sipariş
// "ödeme bekliyor" olarak açılır, tahsilat kuryede yapılır, admin "Ödendi"
// işaretleyince stok düşer ve sadakat puanı yüklenir (havale ile aynı akış).
//
// elden teslimattan FARKI: elden = İzmir merkez, aynı gün, bizim kuryemiz,
// kargo ücreti YOK. Kapıda ödeme = tüm Türkiye, normal kargo, kargo ücreti VAR.

export const KAPIDA = {
  /**
   * ANA ANAHTAR — 6 Eyl 2026'da KAPATILDI.
   * Sebep: müşterilerin bir kısmı kargoyu teslim almıyor; paket geri dönüyor ve
   * gidiş+dönüş kargo bedeli işletmede kalıyor. Kapıda ödemenin getirdiği
   * dönüşüm, teslim alınmayan paketlerin maliyetini karşılamadı.
   *
   * Özellik SİLİNMEDİ, kapatıldı: panelde bekleyen kapıda siparişleri var ve
   * onların rozeti, "Ödendi" akışı (stok düşümü + sadakat puanı + onay maili)
   * ve komisyon ayıklaması çalışmaya devam etmeli. Yeniden açmak = burayı true
   * yapmak; başka hiçbir yere dokunmak gerekmez.
   */
  ACIK: false,
  /** Kapıda ödemenin üst sınırı. 268 ödenmiş siparişin %97'si bu bandın
   *  altında — pratikte müşteri kesmez, ama kapıda reddedilen büyük paketin
   *  iade kargo + stok riskini sınırlar. Üstü kart/havale ile devam eder. */
  UST_SINIR: 10000,
  /** Kapıda KARTLA ödemede POS/komisyon karşılığı eklenen oran. Nakitte YOK.
   *  Kapalıyken de gerekli: geçmiş siparişlerin puan tabanı bundan ayıklanır. */
  KART_KOMISYON_ORANI: 0.02,
} as const;

export type KapidaTuru = "kapida-nakit" | "kapida-kart";

/** Yöntem kapıda ödeme mi? (dar tip koruması — string karşılaştırmasını tek yerde tut) */
export function kapidaMi(yontem: string | undefined | null): yontem is KapidaTuru {
  return yontem === "kapida-nakit" || yontem === "kapida-kart";
}

/**
 * Kapıda KARTLA ödeme komisyonu. Taban = kapıda tahsil edilecek tutar
 * (ürünler + kargo − indirimler), çünkü komisyon kartla çekilen tutar
 * üzerinden oluşur. Nakitte ve diğer yöntemlerde 0.
 * Kuruşa yuvarlanır — gösterilen tutar ile tahsil edilen tutar birebir olsun.
 */
export function kapidaKomisyonu(yontem: string | undefined | null, tahsilEdilecek: number): number {
  if (yontem !== "kapida-kart" || !(tahsilEdilecek > 0)) return 0;
  return Math.round(tahsilEdilecek * KAPIDA.KART_KOMISYON_ORANI * 100) / 100;
}

/**
 * Komisyon DAHİL bir toplamdan komisyonu geri çıkarır (siparişin `toplam`
 * alanı komisyonu içerdiği için gerekir). kapida-kart dışında 0 döner.
 * Kullanım: sadakat puanı tabanı — komisyon hizmet bedelidir, mal bedeli
 * değildir; puan kazanımına dahil edilmemeli.
 */
export function kapidaKomisyonuAyikla(yontem: string | undefined | null, komisyonDahilToplam: number): number {
  if (yontem !== "kapida-kart" || !(komisyonDahilToplam > 0)) return 0;
  const taban = komisyonDahilToplam / (1 + KAPIDA.KART_KOMISYON_ORANI);
  return Math.round((komisyonDahilToplam - taban) * 100) / 100;
}

/**
 * Kapıda ödeme bu sepet için sunulabilir mi?
 * Ana anahtar kapalıyken HER ZAMAN false — checkout seçeneği göstermez,
 * sunucu da doğrudan API çağrısını reddeder (fail-closed).
 */
export function kapidaUygun(odenecekToplam: number): boolean {
  if (!KAPIDA.ACIK) return false;
  return odenecekToplam > 0 && odenecekToplam <= KAPIDA.UST_SINIR;
}

/** Müşteriye gösterilecek etiketler — arayüz ve e-postada aynı metin kullanılsın. */
export const KAPIDA_ETIKET: Record<KapidaTuru, string> = {
  "kapida-nakit": "Kapıda Nakit Ödeme",
  "kapida-kart": "Kapıda Kredi Kartı ile Ödeme",
};
