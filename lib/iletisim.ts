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

// Mesai — parçalar tek yerde; tam metin bunlardan türetilir (sapma olmasın).
const MESAI_GUNLER = "Hafta içi, Pazartesi – Cuma";
const MESAI_SAAT = "09:00 – 17:00";

export const ILETISIM = {
  /** wa.me bağlantısı için: ülke kodlu, boşluksuz, +'sız */
  WHATSAPP_HAM: "905347488001",
  /** Metinde gösterim */
  WHATSAPP: "0534 748 80 01",
  WHATSAPP_LINK: "https://wa.me/905347488001",
  EPOSTA: "info@evemama.net",
  /** Kanal talimatı — her iletişim yüzeyinde aynı. Yanıt ZAMANI vaadi burada
   *  DEĞİL, MESAI_DISI_NOT'ta (mesai bloğuyla birlikte gösterilir; aynı söz
   *  yan yana iki kez yazılmasın — 10.10.2026). */
  NOT: "İletişim için lütfen WhatsApp'tan yazınız.",
  MESAI_GUNLER,
  MESAI_SAAT,
  /** Düz metin gerektiren yerler için tam hali. */
  MESAI: `${MESAI_GUNLER} ${MESAI_SAAT}`,
  /** Mesai dışı yazan müşteriye beklenti (kullanıcı metni, 10.10.2026). */
  MESAI_DISI_NOT: "Bu saatler dışında yazarsanız mesai saatlerinde dönüş yapılacaktır.",
} as const;

/** Önceden yazılmış mesajla WhatsApp bağlantısı (sonuç sayfası vb.). */
export function whatsappLinki(mesaj?: string): string {
  return mesaj ? `${ILETISIM.WHATSAPP_LINK}?text=${encodeURIComponent(mesaj)}` : ILETISIM.WHATSAPP_LINK;
}
