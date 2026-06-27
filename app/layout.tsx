import { CartProvider } from "../context/CartContext";
import Script from "next/script";
import ClarityScript from "./ClarityScript";
import "./globals.css";

// Google Ads conversion tracking Tag ID (AW-...).
// Bu tek bir yerde tanimli — odeme/sonuc sayfasinda da gtag('event', 'conversion', ...) icin kullanilir.
export const GOOGLE_ADS_ID = "AW-18167277898";
// GA4 (analytics — huni + trafik kalitesi) + Microsoft Clarity (oturum kayıtları
// + heatmap — ziyaretçinin ne yaptığını İZLE). Kimlik yoksa YÜKLENMEZ.
const GA4_ID = "G-79X4BTDVC2";                          // GA4 ölçüm kimliği
const CLARITY_ID = "xd9ukngcay";                        // Clarity proje kimliği

export const metadata = {
  title: { default: "evemama.net — Evcil Dostunuzun Dükkânı", template: "%s | evemama.net" },
  description: "Kedi ve köpek mamaları, aksesuarları ve daha fazlası. Royal Canin, Acana, Pro Plan ve yüzlerce marka. Ücretsiz kargo 1000₺ üzeri.",
  keywords: ["kedi maması", "köpek maması", "pet shop", "evcil hayvan", "royal canin", "acana", "evemama"],
  metadataBase: new URL("https://www.evemama.net"),
  verification: {
    google: "bqc7oMFgoT893e8DvOBnjtSPoHUYb6J3bAasYIyekP8",
  },
  openGraph: { title: "evemama.net", description: "Evcil dostunuzun her ihtiyacı", url: "https://www.evemama.net", siteName: "evemama.net", locale: "tr_TR", type: "website" },
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
            ${GA4_ID ? `gtag('config', '${GA4_ID}');` : ""}
          `}
        </Script>
        {/* iyzico Alıcı Koruma rozeti — sol altta "Alici Koruma" guven seali.
            pwi:false => "iyzico ile Ode" (Pay With Iyzico) CTA'si KAPALI:
            tek odeme yontemi zaten iyzico (gereksiz), mobilde alt navigasyonu
            kapatiyordu ve tiklanabilir gorunup tiklanmiyordu. Bu rozet gercek
            odeme akisini ETKILEMEZ (odeme CheckoutForm/api ile yapilir).
            iyz config buyer-protection.js'ten ONCE yuklenmeli — beforeInteractive. */}
        <Script id="iyzico-config" strategy="beforeInteractive">
          {`window.iyz = { token: '94870e88-8639-4167-8044-2defb3b45ded', position: 'bottomLeft', ideaSoft: false, pwi: false };`}
        </Script>
        <Script
          src="https://static.iyzipay.com/buyer-protection/buyer-protection.js"
          strategy="afterInteractive"
        />
        {/* Microsoft Clarity — oturum kayıtları + heatmap. /admin HARİÇ
            (admin müşteri verisi içerir; KVKK — kayda PII düşmesin). */}
        <ClarityScript id={CLARITY_ID} />
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}