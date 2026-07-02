export const metadata = {
  title: "Kampanyalar — İndirimli Kedi ve Köpek Ürünleri",
  description: "evemama.net'te şu an indirimde olan tüm kedi köpek maması ve pet ürünleri. Kaçırmadan yakala, 1000₺ üzeri kargo bedava.",
  alternates: { canonical: "/kampanyalar" },
  openGraph: {
    title: "Kampanyalar — evemama.net",
    description: "Tüm indirimli ürünler bir arada.",
    url: "/kampanyalar",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
