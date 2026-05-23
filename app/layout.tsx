import { CartProvider } from "../context/CartContext";
import Script from "next/script";
import "./globals.css";

// Google Ads conversion tracking Tag ID (AW-...).
// Bu tek bir yerde tanimli — odeme/sonuc sayfasinda da gtag('event', 'conversion', ...) icin kullanilir.
export const GOOGLE_ADS_ID = "AW-18167277898";

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
      <head>
        <script
          src="https://www.etbis.org.tr/etbis-widget.min.js"
          data-etbis-key="e01ba170-9f7d-4c02-bd5f-983a7c5e3a0f"
          async
        />
      </head>
      <body>
        {/* Google Ads (gtag.js) — tum sayfalarda yuklenir.
            Conversion event'leri /odeme/sonuc sayfasinda window.gtag ile tetiklenir. */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`}
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GOOGLE_ADS_ID}');
          `}
        </Script>
        {/* iyzico Alıcı Koruma rozeti — sayfanin sol altinda "Alici Koruma"
            badge'i gosterir. Iyzico ile guvenli odeme yapildigini belirten
            guven sinyali; cevirim oranina pozitif etkisi olur.
            iyz config script'inin buyer-protection.js'ten ONCE yuklenmesi
            gerekiyor — beforeInteractive bunu garanti eder. */}
        <Script id="iyzico-config" strategy="beforeInteractive">
          {`window.iyz = { token: '94870e88-8639-4167-8044-2defb3b45ded', position: 'bottomLeft', ideaSoft: false, pwi: true };`}
        </Script>
        <Script
          src="https://static.iyzipay.com/buyer-protection/buyer-protection.js"
          strategy="afterInteractive"
        />
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}