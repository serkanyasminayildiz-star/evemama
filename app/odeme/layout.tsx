// Odeme ve odeme sonuc sayfalari kullanici-spesifik + hassas → noindex.
// Bu layout /odeme'nin altindaki tum route'lara (/odeme, /odeme/sonuc)
// uygulanir.
export const metadata = {
  title: "Ödeme",
  description: "Güvenli ödeme sayfası.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
