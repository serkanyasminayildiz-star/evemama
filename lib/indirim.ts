// evemama indirim / sadakat SABİTLERİ — TEK KAYNAK.
//
// Hem client (sepet/odeme GÖSTERİM) hem server (api/odeme paidPrice,
// api/odeme/sonuc bonus KAZANIMI) bu dosyadan okur ki değerler ASLA drift
// etmesin. Bir eşiği/tutarı DEĞİŞTİRMEK için yalnızca burayı düzenle — her yere
// yansır. (Bu dosya yalnız SABİT içerir; indirim MANTIĞI ileride ortak saf bir
// fonksiyona taşınabilir — şimdilik mantık yerinde, sadece sayılar merkezi.)
//
// NOT: Gösterimdeki metinler (örn. "5.000₺ üzeri indirim") hâlâ sayıyı metin
// olarak içerir; eşik değişirse o metinler de elle güncellenmeli (ileride
// şablonlaştırılabilir).

// Kargo
export const KARGO = {
  BEDAVA_ESIK: 1000, // ≥ bu sepet tutarında kargo ücretsiz
  UCRET: 29.90,      // altındaysa uygulanan kargo ücreti
} as const;

// Sepet tutarına göre otomatik kademeli indirim (herkese; üyelik gerektirmez)
export const TUTAR_INDIRIMI = {
  ESIK_1: 5000,   INDIRIM_1: 200, // ≥5.000₺ → 200₺
  ESIK_2: 10000,  INDIRIM_2: 500, // ≥10.000₺ → 500₺
} as const;

// İlk sipariş indirimi — yalnız ÜYE + bu hesapla hiç siparişi olmayan
export const ILK_SIPARIS = {
  INDIRIM: 200,
  MIN_SEPET: 1000, // bu tutarın altında uygulanmaz
} as const;

// Sadakat bonusu — ÜYE, ÖDENEN tutara göre KAZANIR; sonraki alışverişte KULLANIR
export const SADAKAT = {
  KAZAN_ESIK_1: 3000, KAZAN_1: 150, // ödenen ≥3.000₺ → 150₺ bonus
  KAZAN_ESIK_2: 5000, KAZAN_2: 200, // ödenen ≥5.000₺ → 200₺ bonus
  MIN_SEPET: 1000,                  // bonusu KULLANMAK için minimum sepet (varsayılan)
  GECERLILIK_GUN: 60,               // kazanım tarihinden itibaren geçerlilik (gün)
} as const;
