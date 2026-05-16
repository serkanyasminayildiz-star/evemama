// Sibling layout — page.tsx "use client" oldugu icin metadata buradan
// export ediliyor. UI eklemiyor, sadece SEO icin.
export const metadata = {
  title: "Sıkça Sorulan Sorular",
  description: "evemama.net hakkında sıkça sorulan sorular — kargo, ödeme, iade, üyelik ve ürünler hakkında merak ettikleriniz.",
  alternates: { canonical: "/sikca-sorulan-sorular" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
