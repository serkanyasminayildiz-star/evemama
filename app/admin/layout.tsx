// Admin panel kullanici-spesifik + hassas + auth gerektirir → noindex.
export const metadata = {
  title: "Yönetim Paneli",
  description: "evemama.net yönetim paneli.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
