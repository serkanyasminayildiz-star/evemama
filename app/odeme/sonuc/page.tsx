"use client";
import { Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Script from "next/script";

// Google Ads tag ID — layout.tsx'te yuklendi. Buradaki conversion label
// 'Satin Alma' islemine ozel.
const GOOGLE_ADS_TAG = "AW-18167277898";
const PURCHASE_LABEL = "DPE6CN-7oa4cEMrS6tZD";

// Google Merchant Center'da kayitli magaza ID. Customer Reviews opt-in
// widget'i bu ID'yi gerektiriyor.
const GMC_MERCHANT_ID = 5590576519;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    renderOptIn?: () => void;
    gapi?: { load: (api: string, cb: () => void) => void; surveyoptin?: { render: (opts: Record<string, unknown>) => void } };
  }
}

function OdemeSonucIcerik() {
  const searchParams = useSearchParams();
  const durum = searchParams.get("durum");
  const siparis = searchParams.get("siparis") || "";
  const tutar = parseFloat(searchParams.get("tutar") || "0");
  const email = searchParams.get("email") || "";
  // Ayni siparis sayfaya birden fazla kez render edilirse conversion event'i
  // sadece bir kez tetiklenmeli; useRef ile flag tutuyoruz.
  const conversionFired = useRef(false);

  useEffect(() => {
    if (durum !== "basarili" || conversionFired.current) return;
    if (typeof window === "undefined" || typeof window.gtag !== "function") return;
    conversionFired.current = true;
    // Enhanced Conversions — email'i user_data icinde gondeririz.
    // gtag client-side'da SHA256 hash atip Google'a iletir, bizim
    // gondermemize gerek yok. Boylece cerez bloklanmis kullanicilar
    // icin de attribution dogru tutulur, Ads dashboard'undaki "Gelismis
    // donusumler - mudahale edilmesi gerekiyor" uyarisi kapanir.
    window.gtag("set", "user_data", {
      email_address: email || undefined,
    });
    window.gtag("event", "conversion", {
      send_to: `${GOOGLE_ADS_TAG}/${PURCHASE_LABEL}`,
      value: tutar > 0 ? tutar : 1.0,
      currency: "TRY",
      transaction_id: siparis,
    });
  }, [durum, siparis, tutar, email]);

  // Google Customer Reviews opt-in fonksiyonu — Google'in apis.google.com'dan
  // yuklenen script'i sayfa yuklendiginde window.renderOptIn'i cagiriyor.
  // Bu fonksiyon gapi.surveyoptin'i baslatip alt sayfa kosesinde "Anket
  // istiyor musunuz" pop-up'i gosterir; kabul ederse Google 10-30 gun sonra
  // anketi e-postayla gonderir.
  useEffect(() => {
    if (durum !== "basarili" || !email) return;
    // Tahmini teslimat tarihi: 5 is gunu sonrasi (kargo + paketleme buffer'i)
    const teslimatT = new Date();
    teslimatT.setDate(teslimatT.getDate() + 5);
    const teslimatStr = teslimatT.toISOString().slice(0, 10); // YYYY-MM-DD

    window.renderOptIn = function () {
      window.gapi?.load("surveyoptin", function () {
        window.gapi?.surveyoptin?.render({
          merchant_id: GMC_MERCHANT_ID,
          order_id: siparis,
          email,
          delivery_country: "TR",
          estimated_delivery_date: teslimatStr,
        });
      });
    };
  }, [durum, email, siparis]);

  if (durum === "basarili") return (
    <>
      {/* Google Customer Reviews opt-in widget — script async yuklenir,
          onload="renderOptIn" parametresiyle window.renderOptIn'i tetikler.
          renderOptIn yukaridaki useEffect'te tanimli. */}
      {email && (
        <Script
          src="https://apis.google.com/js/platform.js?onload=renderOptIn"
          strategy="afterInteractive"
          async
          defer
        />
      )}
      <main style={{ minHeight: "100vh", background: "#FDF6EE", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
        <div style={{ background: "white", borderRadius: 24, padding: "48px 40px", maxWidth: 440, width: "100%", textAlign: "center", boxShadow: "0 20px 60px rgba(92,61,46,0.1)" }}>
          <div style={{ fontSize: 72, marginBottom: 16 }}>🎉</div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 24, fontWeight: 700, color: "#5C3D2E", marginBottom: 10 }}>Siparişiniz Alındı!</div>
          <div style={{ fontSize: 14, color: "#5C3D2E", opacity: 0.6, marginBottom: 10, lineHeight: 1.6 }}>
            Ödemeniz başarıyla tamamlandı. Siparişiniz hazırlanmaya başlandı.
          </div>
          <div style={{ background: "#E8F5E9", borderRadius: 12, padding: "12px 16px", marginBottom: 28, fontSize: 13, color: "#2E7D32" }}>
            📧 Sipariş onayı e-posta adresinize gönderildi.
          </div>
          <a href="/" style={{ background: "#E8845A", color: "white", padding: "14px 32px", borderRadius: 50, textDecoration: "none", fontWeight: 700, fontSize: 15, display: "inline-block" }}>
            Alışverişe Devam Et 🐾
          </a>
        </div>
      </main>
    </>
  );

  return (
    <main style={{ minHeight: "100vh", background: "#FDF6EE", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
      <div style={{ background: "white", borderRadius: 24, padding: "48px 40px", maxWidth: 440, width: "100%", textAlign: "center", boxShadow: "0 20px 60px rgba(92,61,46,0.1)" }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>😢</div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 24, fontWeight: 700, color: "#5C3D2E", marginBottom: 10 }}>Ödeme Başarısız</div>
        <div style={{ fontSize: 14, color: "#5C3D2E", opacity: 0.6, marginBottom: 28, lineHeight: 1.6 }}>
          Ödeme işlemi tamamlanamadı. Lütfen tekrar deneyin veya farklı bir kart kullanın.
        </div>
        <a href="/odeme" style={{ background: "#E8845A", color: "white", padding: "14px 32px", borderRadius: 50, textDecoration: "none", fontWeight: 700, fontSize: 15, display: "inline-block" }}>
          Tekrar Dene →
        </a>
        <div style={{ marginTop: 16 }}>
          <a href="/sepet" style={{ fontSize: 13, color: "#E8845A", textDecoration: "none" }}>← Sepete Dön</a>
        </div>
      </div>
    </main>
  );
}

export default function OdemeSonuc() {
  return (
    <Suspense fallback={
      <main style={{ minHeight: "100vh", background: "#FDF6EE", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 48 }}>⏳</div>
      </main>
    }>
      <OdemeSonucIcerik />
    </Suspense>
  );
}