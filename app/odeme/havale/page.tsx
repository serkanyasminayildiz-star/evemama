"use client";
import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { HAVALE_HESAP } from "../../../lib/havale";

// Havale/EFT onay sayfası. Müşteri ödeme yöntemi olarak havaleyi seçip siparişi
// tamamlayınca buraya yönlendirilir (/odeme/havale?siparis=...&tutar=...).
// Sipariş /api/odeme'de "ödeme bekliyor" olarak oluşturulmuştur; burada sadece
// IBAN + sipariş no + talimat gösterilir (ayrıca e-posta da gönderilir).
function HavaleIcerik() {
  const sp = useSearchParams();
  const siparis = sp.get("siparis") || "";
  const tutar = sp.get("tutar") || "";
  const [kopyalandi, setKopyalandi] = useState(false);

  const ibanKopyala = () => {
    try {
      navigator.clipboard?.writeText(HAVALE_HESAP.iban.replace(/\s/g, ""));
      setKopyalandi(true);
      setTimeout(() => setKopyalandi(false), 2000);
    } catch { /* pano erişimi yoksa sessiz geç */ }
  };

  return (
    <main style={{ minHeight: "100vh", background: "#FDF6EE", fontFamily: "sans-serif", color: "#2C1A0E" }}>
      <header style={{ padding: "16px 24px", background: "white", borderBottom: "1px solid #E8D5B7", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/" style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, color: "#5C3D2E", textDecoration: "none" }}>
          evemama<span style={{ color: "#E8845A", fontStyle: "italic" }}>.net</span>
        </Link>
        <Link href="/urunler" style={{ fontSize: 13, color: "#E8845A", textDecoration: "none", fontWeight: 600 }}>Alışverişe Devam →</Link>
      </header>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "32px 16px 90px" }}>
        <div style={{ background: "white", borderRadius: 24, padding: "32px 24px", boxShadow: "0 8px 32px rgba(92,61,46,0.08)" }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 52, marginBottom: 8 }}>🏦</div>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: 24, fontWeight: 700, color: "#5C3D2E", margin: "0 0 8px" }}>Siparişiniz alındı!</h1>
            <p style={{ fontSize: 14, color: "#5C3D2E", opacity: 0.7, lineHeight: 1.6, margin: 0 }}>
              Ödemenizi aşağıdaki hesaba yaptığınızda, onayladıktan sonra siparişiniz kargoya verilecektir.
            </p>
          </div>

          {(siparis || tutar) && (
            <div style={{ display: "flex", justifyContent: "space-around", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
              {siparis && (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "#5C3D2E", opacity: 0.5, marginBottom: 2 }}>Sipariş No</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#5C3D2E" }}>{siparis}</div>
                </div>
              )}
              {tutar && (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "#5C3D2E", opacity: 0.5, marginBottom: 2 }}>Tutar</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#E8845A" }}>₺{tutar}</div>
                </div>
              )}
            </div>
          )}

          {/* IBAN kutusu */}
          <div style={{ border: "2px solid #E8D5B7", borderRadius: 16, padding: "18px", background: "#FDF6EE" }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#5C3D2E", marginBottom: 12 }}>🏦 Banka Hesap Bilgileri</div>
            <div style={{ fontSize: 13, color: "#5C3D2E", lineHeight: 1.5, marginBottom: 4 }}><span style={{ opacity: 0.6 }}>Banka:</span> <strong>{HAVALE_HESAP.banka}</strong></div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, color: "#5C3D2E" }}><span style={{ opacity: 0.6 }}>IBAN:</span> <strong style={{ letterSpacing: "0.5px" }}>{HAVALE_HESAP.iban}</strong></span>
              <button onClick={ibanKopyala} style={{ background: kopyalandi ? "#8BAF8E" : "#E8845A", color: "white", border: "none", borderRadius: 8, padding: "4px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                {kopyalandi ? "✓ Kopyalandı" : "Kopyala"}
              </button>
            </div>
            <div style={{ fontSize: 13, color: "#5C3D2E", lineHeight: 1.5 }}><span style={{ opacity: 0.6 }}>Alıcı:</span> <strong>{HAVALE_HESAP.unvan}</strong></div>
          </div>

          {/* Uyarı */}
          <div style={{ background: "#FFF3E0", borderRadius: 12, padding: "12px 16px", marginTop: 16, fontSize: 13, color: "#E65100", fontWeight: 600, lineHeight: 1.5 }}>
            ⚠️ Açıklamaya mutlaka <strong>sipariş numaranızı{siparis ? ` (${siparis})` : ""}</strong> yazın — ödemenizi eşleştirebilmemiz için gereklidir.
          </div>

          <div style={{ textAlign: "center", marginTop: 16, fontSize: 12.5, color: "#5C3D2E", opacity: 0.65, lineHeight: 1.6 }}>
            📧 Havale bilgileri e-posta adresinize de gönderildi.<br />
            Ödemeniz onaylanınca bilgilendirileceksiniz.
          </div>

          <div style={{ textAlign: "center", marginTop: 24 }}>
            <Link href="/" style={{ display: "inline-block", background: "#5C3D2E", color: "white", padding: "12px 28px", borderRadius: 50, textDecoration: "none", fontSize: 14, fontWeight: 700 }}>
              Ana Sayfaya Dön
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function HavalePage() {
  return (
    <Suspense fallback={<div style={{ padding: 48, textAlign: "center", fontFamily: "sans-serif", color: "#5C3D2E" }}>⏳ Yükleniyor...</div>}>
      <HavaleIcerik />
    </Suspense>
  );
}
