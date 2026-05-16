// Parent /odeme/layout.tsx zaten noindex'i miras veriyor; burada sadece
// title'i daha spesifik tanimliyoruz.
export const metadata = {
  title: "Ödeme Sonucu",
  description: "Ödeme işleminizin sonucu.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
