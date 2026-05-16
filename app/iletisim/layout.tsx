export const metadata = {
  title: "İletişim",
  description: "evemama.net iletişim — telefon, e-posta, WhatsApp ve mesaj formu üzerinden bize ulaşın.",
  alternates: { canonical: "/iletisim" },
  openGraph: {
    title: "İletişim — evemama.net",
    description: "Sorularınız için bize ulaşın.",
    url: "/iletisim",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
