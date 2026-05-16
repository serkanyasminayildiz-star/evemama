export const metadata = {
  title: "Tüm Ürünler — Kedi, Köpek Maması ve Aksesuarlar",
  description: "Royal Canin, Acana, Pro Plan ve yüzlerce markada kedi köpek maması, ödüllü besinler, aksesuar. Ücretsiz kargo 1000₺ üzeri.",
  alternates: { canonical: "/urunler" },
  openGraph: {
    title: "Tüm Ürünler — evemama.net",
    description: "Geniş ürün yelpazesi, hızlı kargo, güvenli alışveriş.",
    url: "/urunler",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
