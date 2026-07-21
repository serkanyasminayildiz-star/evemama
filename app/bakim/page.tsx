import { HAVALE_HESAP } from "../../lib/havale";

export const metadata = {
  title: "Kısa Bir Ara — evemama.net",
  description: "Stok güncellemesi nedeniyle kısa süreliğine kapalıyız. Çok yakında tekrar buradayız.",
  robots: { index: false, follow: false },
};

// Bakım sayfası — middleware BAKIM_MODU=true iken tüm vitrini buraya yönlendirir.
// Sunucu bileşeni: JS/veritabanı gerektirmez, her koşulda açılır.
export default function Bakim() {
  return (
    <main style={{ minHeight: "100vh", background: "#FDF6EE", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", padding: 20 }}>
      <div style={{ background: "white", borderRadius: 24, padding: "48px 32px", width: "100%", maxWidth: 480, boxShadow: "0 20px 60px rgba(92,61,46,0.1)", textAlign: "center" }}>
        <div style={{ fontSize: 60, marginBottom: 14 }}>🐾</div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 28, fontWeight: 700, color: "#5C3D2E" }}>
          evemama<span style={{ color: "#E8845A", fontStyle: "italic" }}>.net</span>
        </div>

        <h1 style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: "#5C3D2E", margin: "22px 0 10px" }}>
          Kısa bir ara veriyoruz
        </h1>
        <p style={{ fontSize: 14.5, color: "#5C3D2E", opacity: 0.75, lineHeight: 1.7, margin: 0 }}>
          Stoklarımızı güncelliyoruz — dostlarınıza doğru ürünü doğru stokla sunabilmek için.
          Çok kısa süre içinde tekrar buradayız.
        </p>

        <div style={{ background: "#FDF6EE", borderRadius: 16, padding: "16px 18px", margin: "24px 0 18px", fontSize: 13.5, color: "#5C3D2E", lineHeight: 1.8, textAlign: "left" }}>
          📦 <strong>Mevcut siparişleriniz etkilenmedi</strong> — hazırlanmaya ve kargolanmaya devam ediyor.<br />
          📞 Acil ihtiyacınız varsa bize ulaşabilirsiniz.
        </div>

        <div style={{ fontSize: 14, color: "#5C3D2E", lineHeight: 2 }}>
          📧 <a href="mailto:info@evemama.net" style={{ color: "#E8845A", fontWeight: 700, textDecoration: "none" }}>info@evemama.net</a><br />
          📞 <a href="tel:+905520908001" style={{ color: "#E8845A", fontWeight: 700, textDecoration: "none" }}>+90 552 090 80 01</a>
        </div>

        <div style={{ marginTop: 26, paddingTop: 18, borderTop: "1px solid #F0E8E0", fontSize: 12, color: "#5C3D2E", opacity: 0.5 }}>
          {HAVALE_HESAP.unvan}
        </div>
      </div>
    </main>
  );
}
