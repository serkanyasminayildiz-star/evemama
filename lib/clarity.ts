// Microsoft Clarity istemci API yardımcıları — güvenli sarmalayıcılar.
//
// Clarity script'i ClarityScript.tsx ile (admin hariç) yüklenir; buradaki
// çağrılar script yoksa sessizce no-op olur (SSR/erken çağrı/engelleyici).
//
// KVKK notu: "identify" custom-id'yi Clarity İSTEMCİDE HASH'LEYİP gönderir
// (düz e-posta Clarity'ye gitmez) → aynı müşteriyi cihaz/oturum genelinde
// birleştirir. friendly-name PII olarak düz gider — o yüzden GÖNDERMİYORUZ.
type ClarityFn = (...args: unknown[]) => void;

function clarity(): ClarityFn | null {
  if (typeof window === "undefined") return null;
  const c = (window as unknown as { clarity?: ClarityFn }).clarity;
  return typeof c === "function" ? c : null;
}

/** Üyeyi tanıt (e-posta → Clarity istemcide hash'ler). Oturum/cihaz birleştirme. */
export function clarityIdentify(email: string): void {
  if (!email) return;
  clarity()?.("identify", email);
}

/** Özel olay — kayıt/filtre/panoda "Smart events" olarak görünür. */
export function clarityEvent(ad: string): void {
  clarity()?.("event", ad);
}

/** Özel etiket — oturumları filtrelemek için anahtar/değer. */
export function claritySet(anahtar: string, deger: string): void {
  clarity()?.("set", anahtar, deger);
}
