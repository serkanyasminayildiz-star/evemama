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

/** Ürün adındaki birimi kg'a çevirir. Lt ≈ 1 kg/L (bentonit kedi kumu/mama yoğunluğu). */
function birimKg(miktar: number, birim: string): number {
  const b = birim.toLowerCase();
  if (b === "gr" || b === "g" || b === "ml") return miktar / 1000;
  return miktar; // kg, lt, l
}

/** Ürün adından ağırlık (kg): "12 kg", "1,5 Kg", "400 gr", "10 Lt", "250 Ml"
 *  ve ÇARPANLI paketler: "2x10 Kg" → 20, "9x3,6 Lt" → 32,4, "6 x 60 Gr" → 0,36.
 *
 *  Ürün ağırlığı OLMAYAN sayılar elenir (yoksa kargo saçmalıyordu):
 *   • hayvan ağırlık aralığı: "Deri Damlası 10-20 Kg" → ürün 8 ml, 20 kg değil
 *   • debi/akış: "Akvaryum Filtresi 1200 Lt/h" → 1200 kg sanılıp ₺24.050 kargo çıkıyordu
 *  Güvenlik tavanı MAKS_KG: ayrıştırma hatası müşteriye fahiş kargo yazmasın.
 *  Okunamazsa KARGO.VARSAYILAN_URUN_KG. */
const MAKS_KG = 40;
export function urunAgirligiKg(urunAdi: string): number {
  const temiz = String(urunAdi || "")
    .replace(/\d+\s*[-–]\s*\d+\s*(kg|g)\b/gi, " ")
    .replace(/\d+[.,]?\d*\s*(lt|l)\s*\/\s*(h|s|saat|dk|dak)/gi, " ");
  const sinirla = (kg: number) => Math.min(MAKS_KG, Math.max(0.01, kg));

  const carpan = temiz.match(/(\d+)\s*[xX*]\s*(\d+[.,]?\d*)\s*(kg|gr|g|lt|l|ml)\b/i);
  if (carpan) {
    return sinirla((parseInt(carpan[1]) || 1) * birimKg(parseFloat(carpan[2].replace(",", ".")), carpan[3]));
  }
  const tek = temiz.match(/(\d+[.,]?\d*)\s*(kg|gr|lt|ml)\b/i);
  if (tek) return sinirla(birimKg(parseFloat(tek[1].replace(",", ".")), tek[2]));

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

// Sadakat puanı — ÜYE her siparişte KAZANIR; SONRAKİ alışverişte KULLANIR.
//
// 24 Ağu 2026'da kademeli yapıdan (≥3.000→150, ≥5.000→200) ORAN tabanlı yapıya
// geçildi. Sebebi: eski kural hem eşik altındaki siparişleri hiç ödüllendirmiyor
// hem de TERS çalışıyordu (₺3.000'e %5, ₺5.000'e %4 — çok alan az kazanıyordu).
// Oran tabanlı yapı her siparişi ödüllendirir, 2. siparişi tetikler (müşteri
// kaybının olduğu yer) ve sorumluluk cironun sabit bir yüzdesi olarak kalır.
//
// Aynı tarihte ABONELİK sistemi yeni kayıtlara kapatıldı: abonelik %10'u
// checkout'ta veremediği için müşteri sepeti bırakıyordu ve ABONE10 herkesin
// kullanabildiği açık bir kupondu. Puan bunun yerini alır — tek seferlik indirim
// alınıp kaçılabilir, ORAN kaçırılamaz (değeri ancak devam edince ortaya çıkar).
export const SADAKAT = {
  KAZANIM_ORANI: 0.05,  // her siparişte KARGO HARİÇ ödenen tutarın %5'i
  KAZANIM_TAVAN: 500,   // sipariş başına en fazla puan (uç sepetlere karşı koruma)
  MIN_SEPET: 1000,      // puanı KULLANMAK için minimum sepet (varsayılan)
  GECERLILIK_GUN: 60,   // kazanım tarihinden itibaren geçerlilik (gün)
} as const;

/**
 * Bir siparişten kazanılacak puan. Taban KARGO HARİÇ tutardır — kargo maliyet
 * aktarımıdır, ona puan vermek marjdan vermek olur. Aşağı yuvarlanır ki
 * müşteriye gösterilen sayı ile yüklenen sayı birebir aynı olsun.
 * TEK KAYNAK: hem gösterim (sepet/ödeme) hem kazanım (odeme/sonuc, havale) burayı çağırır.
 */
export function kazanilacakPuan(kargoHaricTutar: number): number {
  if (!(kargoHaricTutar > 0)) return 0;
  return Math.min(SADAKAT.KAZANIM_TAVAN, Math.floor(kargoHaricTutar * SADAKAT.KAZANIM_ORANI));
}

// ── Ortak indirim hesabı (SAF fonksiyon) ───────────────────────────────────
// Hem client (sepet/odeme GÖSTERİM) hem server (api/odeme paidPrice) AYNI
// hesabı buradan yapar → mantık drift'i biter. GİRDİLER (geçerli bonus,
// doğrulanmış kupon) ÇAĞIRAN tarafça çözülür — bunlar
// async DB/token gerektirir, saf fonksiyona giremez. Bu fonksiyon yalnız
// aritmetik yapar; yan etkisi yoktur, aynı girdiye hep aynı sonucu verir.
//
// Kurallar:
//  • kargo: sepet ≥ eşik ise 0; altındaysa toplam AĞIRLIĞA göre tarife (kargoUcretiKg)
//  • tutar indirimi: kademeli (≥5000 / ≥10000)
//  • otomatikToplam = tutar indirimi + sadakat bonusu (birikir)
//  • EN AVANTAJLISI: kupon vs otomatik ÜST ÜSTE BİNMEZ → büyük olan uygulanır
//  • genelToplam (ödenecek) = max(0, sepet + kargo - uygulanan indirim)

export type IndirimGirdi = {
  sepetTutari: number;      // ürünler toplamı (kargo hariç) = basketTotal / totalPrice
  toplamAgirlikKg: number;  // sepet toplam ağırlığı (kg) — sepetAgirligiKg(items) ile hesapla
  bonusTutar: number;       // uygulanabilir sadakat bonusu tutarı (çağıran çözer; 0 = yok/uygulanamaz)
  kuponIndirimi: number;    // doğrulanmış kupon indirimi (çağıran çözer; 0 = yok)
};

export type IndirimSonuc = {
  kargo: number;
  tutarIndirimi: number;
  bonusIndirimi: number;
  otomatikToplam: number; // tutar indirimi + sadakat bonusu
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
  const bonusIndirimi = g.bonusTutar > 0 ? g.bonusTutar : 0;
  const otomatikToplam = tutarIndirimi + bonusIndirimi;
  const kuponIndirimi = g.kuponIndirimi > 0 ? g.kuponIndirimi : 0;
  const kuponKazandi = kuponIndirimi > otomatikToplam;
  const indirimMiktari = Math.max(otomatikToplam, kuponIndirimi);
  const genelToplam = Math.max(0, sepetTutari + kargo - indirimMiktari);
  return { kargo, tutarIndirimi, bonusIndirimi, otomatikToplam, kuponIndirimi, kuponKazandi, indirimMiktari, genelToplam };
}
