// Kişiye özel kupon üretimi (SUNUCU tarafı — service_role gerektirir).
//
// Kampanya kuponları artık paylaşımlı gönderilmez: her alıcı için ŞABLON
// kupondan türetilmiş, TEK KULLANIMLIK ve o e-postaya BAĞLI yeni bir satır
// açılır. Kod sızsa bile başkası kullanamaz (bkz. lib/kupon.ts).
import { kisiselKod } from "./kupon";

// supabase-js'i tipe bağlamamak için yapısal tip — bu dosya hem route'lardan
// hem cron'dan aynı istemciyle çağrılır.
// PromiseLike: supabase-js builder'ı thenable'dır, gerçek Promise değildir.
type Tablo = {
  insert(satir: Record<string, unknown>): PromiseLike<{ error: { message?: string; code?: string } | null }>;
};
type Istemci = { from(tablo: string): Tablo };

export type KuponSablon = {
  kod: string;
  indirim_tipi: string;
  indirim_degeri: number | string;
  min_sepet?: number | null;
};

/**
 * Şablon kupondan bu e-postaya özel, tek kullanımlık kupon üretir.
 * @returns üretilen kod; başarısızsa null (çağıran mail göndermemeli).
 */
export async function kisiselKuponOlustur(
  sb: Istemci,
  sablon: KuponSablon,
  email: string,
  gunGecerli = 30,
): Promise<string | null> {
  const hedef = String(email || "").trim().toLocaleLowerCase("tr-TR");
  if (!hedef) return null;
  const bitis = new Date(Date.now() + gunGecerli * 24 * 60 * 60 * 1000).toISOString();

  // Çakışma olasılığı yok denecek kadar düşük (32^6 ≈ 1 milyar) ama kod
  // benzersiz olmak ZORUNDA — bir kez yeniden dener.
  for (let deneme = 0; deneme < 2; deneme++) {
    const kod = kisiselKod(sablon.kod);
    const { error } = await sb.from("kuponlar").insert({
      kod,
      indirim_tipi: sablon.indirim_tipi,
      indirim_degeri: sablon.indirim_degeri,
      min_sepet: sablon.min_sepet ?? 0,
      kullanim_limiti: 1,      // tek kullanımlık
      kullanim_sayisi: 0,
      bitis_tarihi: bitis,
      aktif: true,
      hedef_email: hedef,      // ← kodu sızsa bile yalnız bu kişi kullanabilir
    });
    if (!error) return kod;
    console.error("[kupon] kisisel kupon uretilemedi:", { deneme, kod, hata: error.message });
  }
  return null;
}
