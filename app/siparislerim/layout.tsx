// Siparişlerim sayfası kullanici-spesifik → indexlenmesin.
export const metadata = {
  title: "Siparişlerim",
  description: "evemama.net üzerindeki sipariş geçmişiniz ve durumları.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
