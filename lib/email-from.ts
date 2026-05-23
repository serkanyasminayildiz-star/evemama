// Resend "from" adresi resolver — RESEND_FROM_EMAIL env var'ini okur,
// formatini valide eder, bozuksa guvenli default'a duser.
//
// Tarihce: Vercel UI'da env var degerini yapistirirken Turkce karakter
// (sipariş) veya gizli whitespace gelip "Invalid `from` field" hatasiyla
// tum mailleri patlatti. Bu modul kotu env var'in tum sistemi cokertmesini
// engeller — env var dogru ise onu kullanir, degilse log atip default'a
// duser, mail gonderimi devam eder.
//
// Default: domain Resend'de dogrulandi (May 2026), siparis@evemama.net
// kullanilabilir.

const SAFE_DEFAULT = "evemama.net <siparis@evemama.net>";

// Resend kabul ettigi iki format:
//  1) email@example.com           → sadece email
//  2) Display Name <email@x.com>  → isim + acili parantezde email
// Email kismi ASCII olmali (Resend Turkce karaktere izin vermiyor).
const PLAIN_EMAIL = /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/;
const NAMED_EMAIL = /^.+\s<[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+>$/;

export function resolveFromEmail(): string {
  const raw = process.env.RESEND_FROM_EMAIL;
  if (!raw) return SAFE_DEFAULT;

  // Tirnak ve whitespace temizle — bazi panellerden kopya/yapistirmada
  // gizli karakterler gelebiliyor.
  const cleaned = raw.trim().replace(/^['"]|['"]$/g, "");
  if (!cleaned) return SAFE_DEFAULT;

  if (PLAIN_EMAIL.test(cleaned) || NAMED_EMAIL.test(cleaned)) {
    return cleaned;
  }

  // Bozuk format — log at, default'a dus (her invocation'da bir kez).
  console.warn(
    "[email-from] RESEND_FROM_EMAIL malformed, falling back to default. Raw length:",
    cleaned.length,
    "starts:",
    JSON.stringify(cleaned.slice(0, 8)),
  );
  return SAFE_DEFAULT;
}
