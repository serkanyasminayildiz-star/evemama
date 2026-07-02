export const metadata = {
  title: "Öne Çıkan Ürünler — Seçilmiş Kedi ve Köpek Ürünleri",
  description: "evemama.net'in öne çıkan kedi köpek maması ve pet ürünleri — stoklu, hızlı kargolu favoriler. 1000₺ üzeri kargo bedava.",
  alternates: { canonical: "/one-cikanlar" },
  openGraph: {
    title: "Öne Çıkan Ürünler — evemama.net",
    description: "Sizin için seçtiklerimiz bir arada.",
    url: "/one-cikanlar",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
