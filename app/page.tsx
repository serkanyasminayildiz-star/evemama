// Server component: ana sayfa metadata + Organization/WebSite JSON-LD.
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

// Organization schema — Google'a "bu sitenin sahibi kim, logosu nedir"
// soylegisi. Knowledge Graph icin onemli.
const organizationLd = {
  "@context": "https://schema.org",
  "@type": "OnlineStore",
  name: "evemama.net",
  url: "https://www.evemama.net",
  logo: "https://www.evemama.net/favicon.ico",
  description: "Türkiye'nin evcil hayvan dostlarinin guvendigi online dukkân — kedi köpek maması, aksesuar.",
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    areaServed: "TR",
    availableLanguage: ["Turkish"],
  },
};

// WebSite schema — site arama kutusunu Google Search'te etkinlestirir
// (sitelink searchbox). Kullanici Google'da "evemama" arayinca arama
// kutusu cikar -> direkt site icinde arama.
const websiteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "evemama.net",
  url: "https://www.evemama.net",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://www.evemama.net/urunler?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
};

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }} />
      <AnaSayfaClient />
    </>
  );
}
