// Sepet kullanici-spesifik / transaksiyonel → Google'da indexlenmesin.
export const metadata = {
  title: "Sepetim",
  description: "Sepetinizdeki ürünler ve toplam tutar.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/sepet" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
