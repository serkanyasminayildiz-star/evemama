import { CartProvider } from "../context/CartContext";
import "./globals.css";

export const metadata = {
  title: { default: "evemama.net — Evcil Dostunuzun Dükkânı", template: "%s | evemama.net" },
  description: "Kedi ve köpek mamaları, aksesuarları ve daha fazlası. Royal Canin, Acana, Pro Plan ve yüzlerce marka. Ücretsiz kargo 1000₺ üzeri.",
  keywords: ["kedi maması", "köpek maması", "pet shop", "evcil hayvan", "royal canin", "acana", "evemama"],
  metadataBase: new URL("https://evemama.net"),
  verification: {
    google: "bqc7oMFgoT893e8DvOBnjtSPoHUYb6J3bAasYIyekP8",
  },
  openGraph: { title: "evemama.net", description: "Evcil dostunuzun her ihtiyacı", url: "https://evemama.net", siteName: "evemama.net", locale: "tr_TR", type: "website" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}