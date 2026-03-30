"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function OdemeSonucIcerik() {
  const searchParams = useSearchParams();
  const durum = searchParams.get("durum");

  if (durum === "basarili") return (
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