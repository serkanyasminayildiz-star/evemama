// Kanonik site adresi — TEK KAYNAK (18 Eyl 2026).
//
// KÖK NEDEN (canlı olay): iyzico ödeme geri çağrısı (callbackUrl) POST ile
// gelir. callbackUrl `NEXT_PUBLIC_SITE_URL || "https://evemama.net"` ile
// kuruluyordu; bu değer NON-WWW'ydi. Sitenin kanonik host'u www.evemama.net
// ve non-www → www 307 yönlendirmesi var. POST bir 307'ye çarpınca iyzico'nun
// token gövdesi kayboluyor → /api/odeme/sonuc handler'ı HİÇ çalışmıyor →
// kart çekiliyor ama sipariş oluşmuyor, hata bile loglanmıyor.
//
// Bu yüzden ödeme yolu env değişkenine GÜVENMEZ: host DAİMA kanonik www'ye
// sabittir ki callback tek hop'ta, yönlendirmesiz, gövde bozulmadan handler'a
// ulaşsın. Alan adı ileride değişirse SADECE burası güncellenir.
export const SITE_KOK = "https://www.evemama.net";

/** iyzico ödeme geri çağrı adresi — yönlendirmesiz, kanonik host. */
export const ODEME_CALLBACK_URL = `${SITE_KOK}/api/odeme/sonuc`;
