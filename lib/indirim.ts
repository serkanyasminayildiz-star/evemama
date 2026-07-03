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

// Kargo — AĞIRLIK TARİFELİ (3 Tem 2026): sepet < BEDAVA_ESIK ise toplam
// ağırlığa göre ücret. İlk kademe (0-5 kg) BASLANGIC; sonraki her başlanmış
// KADEME_KG için +KADEME_UCRET → 0-5→150, 5-10→250, 10-15→350, 15-20→450...
// Ürün ağırlığı ürün ADINDAN okunur ("12 kg", "400 gr"); okunamazsa varsayılan.
export const KARGO = {
  BEDAVA_ESIK: 1000,     // ≥ bu sepet tutarında kargo ücretsiz
  BASLANGIC: 150,        // ilk kademe (0-5 kg) ücreti
  KADEME_KG: 5,          // kademe boyu (kg)
  KADEME_UCRET: 100,     // her ek kademe ücreti
  VARSAYILAN_URUN_KG: 1, // adında ağırlık okunamayan ürün için varsayım
} as const;

/** Ürün adından ağırlık (kg): "12 kg" / "12kg" / "1,5 Kg" / "400 gr". Okunamazsa varsayılan. */
export function urunAgirligiKg(urunAdi: string): number {
  const kg = urunAdi.match(/(\d+[.,]?\d*)\s*[Kk][Gg]/);
  if (kg) return parseFloat(kg[1].replace(",", "."));
  const gr = urunAdi.match(/(\d+[.,]?\d*)\s*[Gg][Rr]/);
  if (gr) return parseFloat(gr[1].replace(",", ".")) / 1000;
  return KARGO.VARSAYILAN_URUN_KG;
}

/** Sepet kalemlerinin toplam ağırlığı (kg) — kalem adı × adet. */
export function sepetAgirligiKg(kalemler: Array<{ name: string; quantity: number }>): number {
  return kalemler.reduce((t, k) => t + urunAgirligiKg(k.name) * (k.quantity || 1), 0);
}

/** Toplam ağırlığa göre kargo ücreti (bedava eşiği hesaba KATMAZ; hesaplaIndirim uygular). */
export function kargoUcretiKg(toplamKg: number): number {
  const kademe = Math.max(1, Math.ceil(toplamKg / KARGO.KADEME_KG));
  return KARGO.BASLANGIC + (kademe - 1) * KARGO.KADEME_UCRET;
}

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

// ── Ortak indirim hesabı (SAF fonksiyon) ───────────────────────────────────
// Hem client (sepet/odeme GÖSTERİM) hem server (api/odeme paidPrice) AYNI
// hesabı buradan yapar → mantık drift'i biter. GİRDİLER (üyelik, ilk sipariş
// hakkı, geçerli bonus, doğrulanmış kupon) ÇAĞIRAN tarafça çözülür — bunlar
// async DB/token gerektirir, saf fonksiyona giremez. Bu fonksiyon yalnız
// aritmetik yapar; yan etkisi yoktur, aynı girdiye hep aynı sonucu verir.
//
// Kurallar:
//  • kargo: sepet ≥ eşik ise 0; altındaysa toplam AĞIRLIĞA göre tarife (kargoUcretiKg)
//  • tutar indirimi: kademeli (≥5000 / ≥10000)
//  • otomatikToplam = tutar + ilk sipariş + sadakat bonusu (hepsi birikir)
//  • EN AVANTAJLISI: kupon vs otomatik ÜST ÜSTE BİNMEZ → büyük olan uygulanır
//  • genelToplam (ödenecek) = max(0, sepet + kargo - uygulanan indirim)

export type IndirimGirdi = {
  sepetTutari: number;      // ürünler toplamı (kargo hariç) = basketTotal / totalPrice
  toplamAgirlikKg: number;  // sepet toplam ağırlığı (kg) — sepetAgirligiKg(items) ile hesapla
  ilkSiparis: boolean;      // ilk sipariş indirimi HAK EDİLDİ mi (çağıran: üye + ilk sipariş + min sepet)
  bonusTutar: number;       // uygulanabilir sadakat bonusu tutarı (çağıran çözer; 0 = yok/uygulanamaz)
  kuponIndirimi: number;    // doğrulanmış kupon indirimi (çağıran çözer; 0 = yok)
};

export type IndirimSonuc = {
  kargo: number;
  tutarIndirimi: number;
  ilkSiparisIndirimi: number;
  bonusIndirimi: number;
  otomatikToplam: number; // tutar + ilk sipariş + bonus
  kuponIndirimi: number;
  kuponKazandi: boolean;  // kupon otomatikten avantajlı mı (en avantajlısı kuralı)
  indirimMiktari: number; // uygulanan indirim = max(otomatik, kupon)
  genelToplam: number;    // ödenecek tutar = max(0, sepet + kargo - indirim)
};

export function hesaplaIndirim(g: IndirimGirdi): IndirimSonuc {
  const sepetTutari = g.sepetTutari;
  const kargo = sepetTutari >= KARGO.BEDAVA_ESIK ? 0 : kargoUcretiKg(g.toplamAgirlikKg);
  const tutarIndirimi =
    sepetTutari >= TUTAR_INDIRIMI.ESIK_2 ? TUTAR_INDIRIMI.INDIRIM_2
    : sepetTutari >= TUTAR_INDIRIMI.ESIK_1 ? TUTAR_INDIRIMI.INDIRIM_1
    : 0;
  const ilkSiparisIndirimi = g.ilkSiparis ? ILK_SIPARIS.INDIRIM : 0;
  const bonusIndirimi = g.bonusTutar > 0 ? g.bonusTutar : 0;
  const otomatikToplam = tutarIndirimi + ilkSiparisIndirimi + bonusIndirimi;
  const kuponIndirimi = g.kuponIndirimi > 0 ? g.kuponIndirimi : 0;
  const kuponKazandi = kuponIndirimi > otomatikToplam;
  const indirimMiktari = Math.max(otomatikToplam, kuponIndirimi);
  const genelToplam = Math.max(0, sepetTutari + kargo - indirimMiktari);
  return { kargo, tutarIndirimi, ilkSiparisIndirimi, bonusIndirimi, otomatikToplam, kuponIndirimi, kuponKazandi, indirimMiktari, genelToplam };
}
