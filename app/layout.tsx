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
        {/* WhatsApp destek butonu — tum sayfalarda sag altta floating.
            Tiklayinca pre-filled mesajla wa.me acilir. Mobilde bottom-nav
            ile cakismamasi icin media query ile yukseltilir. */}
        <style>{`
          .wa-fab {
            position: fixed; bottom: 24px; right: 24px;
            width: 56px; height: 56px; border-radius: 50%;
            background: #25D366; box-shadow: 0 4px 16px rgba(0,0,0,0.18);
            display: flex; align-items: center; justify-content: center;
            color: white; text-decoration: none;
            z-index: 9998; transition: transform .2s, box-shadow .2s;
          }
          .wa-fab:hover { transform: scale(1.08); box-shadow: 0 6px 22px rgba(0,0,0,0.25); }
          .wa-fab svg { width: 30px; height: 30px; }
          @media (max-width: 768px) {
            .wa-fab { bottom: 88px !important; right: 16px !important; width: 50px !important; height: 50px !important; }
            .wa-fab svg { width: 26px; height: 26px; }
          }
        `}</style>
        <a
          className="wa-fab"
          href="https://wa.me/905520908001?text=Merhaba%2C%20evemama.net%27ten%20bir%20sorum%20var."
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp Destek"
          title="WhatsApp ile yazın"
        >
          <svg viewBox="0 0 24 24" fill="white" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0 0 20.464 3.488"/>
          </svg>
        </a>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}