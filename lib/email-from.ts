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

// Hardcoded FROM adresi. Resend'in kabul ettigi format: "Name <email>".
// Env var lookup'i tamamen kaldirildi cunku Vercel UI'da degerin
// duzgun yapistirilamadigi durumlar tekrar tekrar yasandi (whitespace
// vs underscore vs Turkce karakter). Domain (evemama.net) Resend'de
// dogrulandi → siparis@evemama.net gonderim icin yetkili.
//
// Degistirmek isteyince burayi editle, redeploy et — env var degil.
const HARDCODED_FROM = "evemama.net <siparis@evemama.net>";

export function resolveFromEmail(): string {
  return HARDCODED_FROM;
}
