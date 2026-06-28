import KumbaraIcerik from "./KumbaraIcerik";

export const metadata = {
  title: "Sokak Dostları — evemama'dan Sokak Köpeklerine Mama",
  description:
    "Gelirimizin %5'i ile her hafta sokak ve barınak köpeklerine orijinal Royal Canin mama veriyoruz — ve her ziyareti videoyla belgeliyoruz. Söz değil, kanıt. Sen al, bir sokak dostu doysun.",
  alternates: { canonical: "https://www.evemama.net/kumbara" },
  openGraph: {
    title: "Sokak Dostları — evemama",
    description: "Gelirimizin %5'i ile sokak ve barınak köpeklerine orijinal mama. Her ziyaret videoyla belgeleniyor.",
    url: "https://www.evemama.net/kumbara",
    type: "website",
  },
};

export default function KumbaraPage() {
  return <KumbaraIcerik />;
}
