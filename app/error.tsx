"use client";
import Link from "next/link";

// Global error boundary — herhangi bir client component'te yakalanmayan
// hata bu ekrana dusurur. console.error otomatik calisir (Next.js); ayrica
// kullaniciya sayfayi yenileme/anasayfaya donme secenegi verir.
//
// Bu sadece "yakalanmayan exception"lari yakalar. Supabase'in dondurdugu
// { data, error } yapisindaki "error" field'i bir exception degil; o
// sayfa-icinde try/catch ya da error kontrolu ile yonetilir.

import { useEffect } from "react";

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[evemama global error]", error);
  }, [error]);

  return (
    <main style={{ minHeight: "100vh", background: "#FDF6EE", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", padding: 20 }}>
      <div style={{ background: "white", borderRadius: 24, padding: "48px 40px", maxWidth: 480, textAlign: "center", boxShadow: "0 20px 60px rgba(92,61,46,0.08)" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🐾</div>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: "#5C3D2E", marginBottom: 12 }}>Bir şeyler ters gitti</h1>
        <p style={{ fontSize: 14, color: "#5C3D2E", opacity: 0.7, lineHeight: 1.6, marginBottom: 24 }}>
          Sayfayı yüklerken beklenmeyen bir hata oluştu. Yeniden deneyebilir veya ana sayfaya dönebilirsin.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => reset()} style={{ background: "#E8845A", color: "white", border: "none", borderRadius: 12, padding: "12px 22px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            🔄 Yeniden Dene
          </button>
          <Link href="/" style={{ background: "#FDF6EE", color: "#5C3D2E", border: "2px solid #E8D5B7", borderRadius: 12, padding: "10px 22px", fontSize: 14, fontWeight: 700, cursor: "pointer", textDecoration: "none", fontFamily: "inherit" }}>
            🏠 Ana Sayfa
          </Link>
        </div>
        {process.env.NODE_ENV === "development" && (
          <details style={{ marginTop: 24, textAlign: "left", fontSize: 12, color: "#5C3D2E", opacity: 0.6 }}>
            <summary style={{ cursor: "pointer" }}>Geliştirici detayı</summary>
            <pre style={{ marginTop: 8, padding: 12, background: "#FAF5EF", borderRadius: 8, overflow: "auto", fontSize: 11 }}>
              {error.message}
              {error.digest ? `\n\nDigest: ${error.digest}` : ""}
            </pre>
          </details>
        )}
      </div>
    </main>
  );
}
