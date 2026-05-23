// Urun sayfasinda gosterilen "Sikca Sorulanlar" verilerinin tek dogruluk
// kaynagi. Hem client UI (UrunDetayClient.tsx accordion) hem server-side
// JSON-LD (page.tsx FAQPage schema) buradan okur. Tek yerde duzeltirsen
// iki tarafta da otomatik yansir.
//
// Google FAQ rich snippet sartlari:
//  - Soru ve cevap publicly accessible olmali (login arkasinda olamaz)
//  - Cevap kullaniciya gosterilen metnin aynisi olmali (cloaking yasak)
//  - Her cevap min ~50, max ~3000 char olmasi onerilir
//  - Cevaplar HTML allowed (b/i/p/ul) ama burada plain text tutuyoruz.
export type SssItem = {
  soru: string;
  cevap: string;
};

export const URUN_SSS: SssItem[] = [
  {
    soru: "Ürün orijinal mi?",
    cevap:
      "Evet. Tüm ürünlerimizi markaların Türkiye resmi distribütörlerinden tedarik ediyoruz. Faturalı satış yapıyoruz; ürün barkodundan üreticinin Türkiye temsilcisinden de teyit alabilirsiniz.",
  },
  {
    soru: "Son kullanma tarihi (SKT) ne kadar?",
    cevap:
      "Gönderdiğimiz tüm mamaların SKT'si minimum 6 ay, çoğu üründe 12 ay ve üzeridir. Stoklarımızı sürekli rotasyonda tutarız — eskisi gitmeden yenisi gelmez.",
  },
  {
    soru: "Kargo ne zaman gelir?",
    cevap:
      "Saat 14:00'a kadar verilen siparişler aynı gün kargoya verilir. Anlaşmalı kargo firmamızla çoğu şehre 1-2 iş günü içinde teslim edilir. 1000₺ üzeri siparişlerde kargo ücretsizdir.",
  },
  {
    soru: "İade ve değişim nasıl olur?",
    cevap:
      "Ambalajı açılmamış ürünleri teslim aldıktan sonra 14 gün içinde koşulsuz iade edebilirsiniz. İade kargosunu da biz karşılıyoruz. Yanlış ürün gelirse aynı gün değişim yapılır.",
  },
  {
    soru: "Ödeme güvenli mi?",
    cevap:
      "Tüm ödemeler iyzico altyapısı üzerinden 3D Secure ile işlenir. Kart bilgileriniz tarafımıza ulaşmaz, banka tarafında saklanır. Ayrıca iyzico Alıcı Koruma kapsamında siparişiniz teminat altındadır.",
  },
];
