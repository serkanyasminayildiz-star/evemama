export const metadata = {
  title: "Blog & Sorularınız",
  description: "evcil hayvan bakımı, beslenme, sağlık ve davranış hakkında yararlı bilgiler ve okuyucu sorularına yanıtlar.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "evemama.net Blog",
    description: "Evcil hayvanlar için bilgi ve ipuçları.",
    url: "/blog",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
