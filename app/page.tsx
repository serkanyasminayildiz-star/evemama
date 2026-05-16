// Server component: ana sayfa metadata'sini export ediyor.
// Layout'un "default" title'i fallback; bu ozel metadata gelirse override eder.
// UI/state AnaSayfaClient.tsx icinde (eski page.tsx) — regression riski yok.

import AnaSayfaClient from "./AnaSayfaClient";

export const metadata = {
  title: "evemama.net — Evcil Dostunuzun Dükkânı",
  description: "Royal Canin, Acana, Pro Plan ve yüzlerce markada kedi köpek maması, ödüllü mama, aksesuar. Hızlı kargo, güvenli ödeme. 1000₺ üzeri ücretsiz kargo.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "evemama.net — Evcil Dostunuzun Dükkânı",
    description: "Yüzlerce markada kedi köpek maması ve aksesuar. Ücretsiz kargo 1000₺ üzeri.",
    url: "/",
    siteName: "evemama.net",
    type: "website",
    locale: "tr_TR",
  },
};

export default function HomePage() {
  return <AnaSayfaClient />;
}
