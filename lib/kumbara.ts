// Pati Kumbarası — sabitler + saf yardımcılar (server + client ortak).
//
// Model: kumbara = (en son pazar dağıtımından beri ödenmiş siparişlerin %5'i).
// Dağıtım admin'den girilince sıfırlanır; kümülatif etki (köpek/öğün/barınak)
// dağıtım kayıtlarından gelir. Başlangıç: Pazartesi 29 Haziran 2026 (TR saati).

export const KUMBARA_BASLANGIC = "2026-06-28T00:00:00+03:00"; // birikim başlangıcı (28 Haz Pazar; öncesi sayılmaz)
export const KUMBARA_ORAN = 0.05; // her ödenmiş siparişin %5'i kumbaraya

// Bir sipariş tutarının kumbara katkısı (₺). "Bu siparişinle ₺X bağışladın" için.
export function kumbaraKatkisi(tutar: number): number {
  return Math.round((Number(tutar) || 0) * KUMBARA_ORAN * 100) / 100;
}

// Teşekkür duvarı ismi — KVKK: ad + soyad BAŞ HARFİ ("Serkan Y."). Soyad yoksa
// sadece ad. Boş ad → boş string (çağıran .filter(Boolean) ile eler).
export function tesekkurAdi(ad?: string | null, soyad?: string | null): string {
  const a = (ad || "").trim().split(/\s+/)[0] || "";
  const s = (soyad || "").trim();
  if (!a) return "";
  return s ? `${a} ${s[0].toLocaleUpperCase("tr")}.` : a;
}
