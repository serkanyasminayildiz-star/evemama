"use client";
import Script from "next/script";
import { usePathname } from "next/navigation";

// Clarity'yi /admin DIŞINDA yükler. Admin paneli müşteri verisi (sipariş,
// e-posta, adres) içerir → session kayıtlarına PII düşmesin (KVKK). Admin'e
// doğrudan URL ile girilir (shop'tan client-side link yok) → pathname yeterli.
export default function ClarityScript({ id }: { id: string }) {
  const pathname = usePathname();
  if (!id || pathname?.startsWith("/admin")) return null;
  return (
    <Script id="ms-clarity" strategy="afterInteractive">
      {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window, document, "clarity", "script", "${id}");`}
    </Script>
  );
}
