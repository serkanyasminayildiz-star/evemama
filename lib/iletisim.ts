// Müşteri iletişim kanalları — TEK KAYNAK (14 Eyl 2026).
//
// Telefon hattı (0552 090 80 01) kaldırıldı; müşteri iletişimi WhatsApp'a
// taşındı. Eskiden numara 10 dosyada elle gömülüydü (ana sayfa, iletişim,
// SSS, iade, kargo, kullanım koşulları, mesafeli satış, hakkımızda, bakım
// sayfası) ve değişiklikte hepsini tek tek taramak gerekiyordu. Artık hepsi
// buradan okur — numara/metin değişirse YALNIZ burası güncellenir.
//
// Ünvan/adres/vergi no gibi şirket kimliği bilgileri BURADA DEĞİL — onlar
// yasal sayfalarda ayrıca duruyor (mesafeli-satis, kvkk, gizlilik...).

export const ILETISIM = {
  /** wa.me bağlantısı için: ülke kodlu, boşluksuz, +'sız */
  WHATSAPP_HAM: "905347488001",
  /** Metinde gösterim */
  WHATSAPP: "0534 748 80 01",
  WHATSAPP_LINK: "https://wa.me/905347488001",
  EPOSTA: "info@evemama.net",
  /** Her iletişim yüzeyinde aynı cümle — müşteri beklentisi tek olsun. */
  NOT: "İletişim için lütfen WhatsApp'tan yazınız. Mesai saatleri içerisinde dönüş yapılacaktır.",
  MESAI: "Pazartesi – Cuma 09:00 – 17:00",
} as const;

/** Önceden yazılmış mesajla WhatsApp bağlantısı (sonuç sayfası vb.). */
export function whatsappLinki(mesaj?: string): string {
  return mesaj ? `${ILETISIM.WHATSAPP_LINK}?text=${encodeURIComponent(mesaj)}` : ILETISIM.WHATSAPP_LINK;
}
