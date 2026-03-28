"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function OdemeSonuc() {
  const searchParams = useSearchParams();
  const [durum, setDurum] = useState<"yukleniyor" | "basarili" | "basarisiz">("yukleniyor");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) { setDurum("basarisiz"); return; }

    fetch("/api/odeme/sonuc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === "success" && data.paymentStatus === "SUCCESS") {
          setDurum("basarili");
        } else {
          setDurum("basarisiz");
        }
      })
      .catch(() => setDurum("basarisiz"));
  }, []);

  if (durum === "yukleniyor") return (
    <main style={{ minHeight: "100vh", background: "#FDF6EE", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 20, color: "#5C3D2E" }}>Ödeme kontrol ediliyor...</div>
      </div>
    </main>
  );

  if (durum === "basarili") return (
    <main style={{ minHeight: "100vh", background: "#FDF6EE", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
      <div style={{ background: "white", borderRadius: 24, padding: "48px 40px", maxWidth: 440, width: "100%", textAlign: "center", boxShadow: "0 20px 60px rgba(92,61,46,0.1)" }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>🎉</div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 24, fontWeight: 700, color: "#5C3D2E", marginBottom: 10 }}>Siparişiniz Alındı!</div>
        <div style={{ fontSize: 14, color: "#5C3D2E", opacity: 0.6, marginBottom: 28, lineHeight: 1.6 }}>
          Ödemeniz başarıyla tamamlandı. Siparişiniz hazırlanmaya başlandı.
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
          Ödeme işlemi tamamlanamadı. Lütfen tekrar deneyin.
        </div>
        <a href="/odeme" style={{ background: "#E8845A", color: "white", padding: "14px 32px", borderRadius: 50, textDecoration: "none", fontWeight: 700, fontSize: 15, display: "inline-block" }}>
          Tekrar Dene →
        </a>
      </div>
    </main>
  );
}
```

**Ctrl+S** bas! Sonra terminalde:
```
git add .
git commit -m "iyzipay temizlendi"
git push