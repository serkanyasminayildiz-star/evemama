export const metadata = {
  title: "Giriş Yap",
  description: "evemama.net hesabınıza giriş yapın.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/giris" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
