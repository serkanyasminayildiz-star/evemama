export const metadata = {
  title: "Mama Asistanı — Dostuna En Uygun Mamayı Bul",
  description: "Kedinin veya köpeğinin özelliğini/problemini yaz, yapay zekâ destekli asistanımız stoktaki ürünlerden en uygun mamaları önersin.",
  alternates: { canonical: "/mama-asistani" },
  openGraph: {
    title: "Mama Asistanı — evemama.net",
    description: "Dostunun ihtiyacını yaz, sana en uygun mamayı önerelim.",
    url: "/mama-asistani",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
