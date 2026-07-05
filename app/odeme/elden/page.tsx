"use client";
import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ELDEN_TESLIMAT } from "../../../lib/eldenTeslimat";

// İzmir elden teslimat onay sayfası. Elden teslim siparişi tamamlanınca buraya
// yönlendirilir (/odeme/elden?siparis=...&tutar=...&teslim=...). Sipariş
// /api/odeme'de "ödeme bekliyor (elden)" oluşturulmuştur; e-posta da gönderilir.
function EldenIcerik() {
  const sp = useSearchParams();
  const siparis = sp.get("siparis") || "";
  const tutar = sp.get("tutar") || "";
  const teslim = sp.get("teslim") || `${ELDEN_TESLIMAT.TESLIM_ARALIGI} arası kapında`;

  return (
    <main style={{ minHeight: "100vh", background: "#FDF6EE", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", padding: 20 }}>
      <div style={{ background: "white", borderRadius: 24, padding: "40px 32px", width: "100%", maxWidth: 480, boxShadow: "0 20px 60px rgba(92,61,46,0.1)", textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>🛵</div>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: 24, fontWeight: 700, color: "#5C3D2E", marginBottom: 8 }}>Siparişin Alındı!</h1>
        <p style={{ fontSize: 14, color: "#5C3D2E", opacity: 0.7, marginBottom: 20 }}>İzmir içi <strong>elden teslimat</strong> kapsamında hazırlanıyor.</p>

        {siparis && (
          <div style={{ background: "#FDF6EE", borderRadius: 14, padding: "14px 16px", marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: "#5C3D2E", opacity: 0.5, marginBottom: 4 }}>SİPARİŞ NUMARASI</div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, color: "#E8845A" }}>#{siparis}</div>
          </div>
        )}

        <div style={{ background: "#F0FAF1", border: "1.5px solid #8BAF8E", borderRadius: 14, padding: "16px 18px", marginBottom: 18, textAlign: "left", fontSize: 13.5, color: "#5C3D2E", lineHeight: 1.9 }}>
          📦 Teslimat: <strong>{teslim}</strong><br />
          💵 Ödeme: <strong>kapıda nakit{tutar ? ` — ₺${tutar}` : ""}</strong><br />
          📞 Teslimattan önce telefonla haber vereceğiz.
        </div>

        <div style={{ fontSize: 12, color: "#5C3D2E", opacity: 0.55, lineHeight: 1.6, marginBottom: 22 }}>
          Detaylar e-posta adresine de gönderildi. Teslimat günleri: {ELDEN_TESLIMAT.GUNLER}.
        </div>

        <Link href="/" style={{ display: "inline-block", background: "#E8845A", color: "white", padding: "13px 32px", borderRadius: 50, textDecoration: "none", fontWeight: 700, fontSize: 14 }}>
          Ana Sayfaya Dön 🐾
        </Link>
      </div>
    </main>
  );
}

export default function EldenOnay() {
  return (
    <Suspense fallback={<main style={{ minHeight: "100vh", background: "#FDF6EE" }} />}>
      <EldenIcerik />
    </Suspense>
  );
}
