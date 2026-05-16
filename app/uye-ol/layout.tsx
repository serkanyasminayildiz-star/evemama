export const metadata = {
  title: "Üye Ol",
  description: "evemama.net'te ücretsiz üye olun, alışverişinize başlayın.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/uye-ol" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
