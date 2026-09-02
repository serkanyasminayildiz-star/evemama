// Kupon kuralları — TEK KAYNAK (2 Eyl 2026).
//
// NEDEN: kuponlar herkese açıktı. kupon-dogrula yalnız aktif/limit/min_sepet/
// bitiş tarihine bakıyordu; üyelik, sipariş geçmişi ve kampanya hedefi
// kontrol edilmiyordu. Sonuç: YENILE10 ("28 gündür dönmeyen müşteri") ve
// ABONE10 (aboneler) kodunu duyan HERKES kullanabiliyordu. Üstüne kupon
// tarayıcıda kalıcı olduğu için bir kez giren müşteri her siparişte indirim
// alıyordu (2077a2c ile düzeltildi). Kaldırılmış ₺200 ilk-sipariş indirimi de
// ILK_SIPARIS kuponu olarak canlıda duruyordu.
//
// KURAL: kupon KİŞİYE BAĞLIDIR. hedef_email'i olmayan kupon geçersizdir —
// genel/paylaşımlı kupon diye bir şey yoktur. İki kat koruma:
//   1) kod benzersiz ve tek kullanımlık (YENILE10-K7M4XR)
//   2) kod sızsa bile yalnız hedef e-posta kullanabilir
//
// ŞEMA GEREKSİNİMİ: kuponlar.hedef_email (text, null yapılabilir).

/** Karışması olası harfler yok: I/İ/1, O/0. Türkçe toUpperCase tuzağına da kapalı. */
const ALFABE = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Kişiye özel kupon kodu üretir: "YENILE10" → "YENILE10-K7M4XR". */
export function kisiselKod(temelKod: string, uzunluk = 6): string {
  let ek = "";
  for (let i = 0; i < uzunluk; i++) ek += ALFABE[Math.floor(Math.random() * ALFABE.length)];
  return `${String(temelKod || "KUPON").trim().toUpperCase()}-${ek}`;
}

/** E-posta karşılaştırması — Türkçe duyarlı küçültme + kırpma. */
export function epostaEsit(a: unknown, b: unknown): boolean {
  const n = (v: unknown) => String(v ?? "").toLocaleLowerCase("tr-TR").trim();
  const x = n(a);
  return !!x && x === n(b);
}

// hedefKontrol yalnız hedef_email'e bakar — geniş bir kupon tipine bağlanmasın
// ki farklı yerlerdeki kupon tipleriyle (KuponKaydi vb.) uyumlu kalsın.
export type KuponSatir = { hedef_email?: string | null };

export type HedefSonuc =
  | { durum: "uygun" }
  | { durum: "eposta-gerekli" }        // hedefli kupon ama e-posta henüz bilinmiyor (sepette misafir)
  | { durum: "baska-kisiye"; }         // e-posta biliniyor ama eşleşmiyor
  | { durum: "genel-kapali" };         // hedefi olmayan (paylaşımlı) kupon → kapalı

/**
 * Kuponun bu e-postaya ait olup olmadığını söyler.
 * email boş/bilinmiyorsa "eposta-gerekli" döner — çağıran buna göre mesaj verir
 * (sepette misafir müşteri e-postasını henüz girmemiş olabilir).
 */
export function hedefKontrol(kupon: KuponSatir, email?: string | null): HedefSonuc {
  const hedef = String(kupon.hedef_email ?? "").trim();
  if (!hedef) return { durum: "genel-kapali" };
  if (!String(email ?? "").trim()) return { durum: "eposta-gerekli" };
  return epostaEsit(hedef, email) ? { durum: "uygun" } : { durum: "baska-kisiye" };
}

/** Müşteriye gösterilecek mesaj (tek yerde tutulsun, her yüzey aynı dili konuşsun). */
export function hedefMesaji(s: HedefSonuc): string {
  switch (s.durum) {
    case "eposta-gerekli":
      return "Bu kupon size özel gönderildi. Kullanmak için e-posta adresinizi girin veya giriş yapın.";
    case "baska-kisiye":
      return "Bu kupon başka bir e-posta adresine tanımlı.";
    case "genel-kapali":
      return "Bu kupon artık geçerli değil.";
    default:
      return "";
  }
}
