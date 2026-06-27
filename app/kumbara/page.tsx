import KumbaraIcerik from "./KumbaraIcerik";

export const metadata = {
  title: "Pati Kumbarası — Her Alışveriş Sokak Köpeklerine Mama",
  description:
    "evemama'da her alışverişin %5'i barınak ve sokak köpeklerine orijinal Royal Canin mama oluyor. Her pazar barınak ziyareti + video. Şeffaf kumbara, gerçek etki — sen al, bir sokak dostu doysun.",
  alternates: { canonical: "https://www.evemama.net/kumbara" },
  openGraph: {
    title: "Pati Kumbarası — evemama",
    description: "Her alışverişin %5'i sokak ve barınak köpeklerine orijinal mama. Her pazar video.",
    url: "https://www.evemama.net/kumbara",
    type: "website",
  },
};

export default function KumbaraPage() {
  return <KumbaraIcerik />;
}
