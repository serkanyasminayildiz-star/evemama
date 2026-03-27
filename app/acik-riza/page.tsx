export default function AcikRiza() {
  return (
    <main style={{ minHeight: "100vh", background: "#FDF6EE", fontFamily: "sans-serif" }}>
      <header style={{ background: "white", padding: "16px 48px", borderBottom: "1px solid #E8D5B7", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <a href="/" style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: "#5C3D2E", textDecoration: "none" }}>evemama<span style={{ color: "#E8845A", fontStyle: "italic" }}>.net</span></a>
      </header>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: 36, fontWeight: 700, color: "#5C3D2E", marginBottom: 8 }}>Açık Rıza Metni</h1>
        <div style={{ width: 60, height: 4, background: "#E8845A", borderRadius: 2, marginBottom: 8 }} />
        <p style={{ fontSize: 13, color: "#5C3D2E", opacity: 0.5, marginBottom: 40 }}>Son güncelleme tarihi: 01/02/2026</p>
        <div style={{ background: "white", borderRadius: 24, padding: "40px 48px", boxShadow: "0 4px 24px rgba(92,61,46,0.07)" }}>
          <p style={{ fontSize: 15, color: "#5C3D2E", opacity: 0.75, lineHeight: 1.8, marginBottom: 24 }}>
            6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında, <a href="/kvkk" style={{ color: "#E8845A", textDecoration: "none", fontWeight: 700 }}>KVKK Aydınlatma Metni</a>'ni okuduğumu ve anladığımı,
          </p>
          <div style={{ background: "#FDF6EE", borderRadius: 16, padding: "24px", marginBottom: 24 }}>
            <p style={{ fontSize: 15, color: "#5C3D2E", fontWeight: 600, marginBottom: 12 }}>Kimlik, iletişim ve işlem güvenliğine ilişkin kişisel verilerimin:</p>
            {[
              "Talep ve şikayet süreçlerinin yürütülmesi",
              "İletişim faaliyetlerinin gerçekleştirilmesi",
              "Hizmet süreçlerinin iyileştirilmesi",
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ color: "#E8845A", fontWeight: 700 }}>–</span>
                <span style={{ fontSize: 15, color: "#5C3D2E", opacity: 0.75 }}>{item}</span>
              </div>
            ))}
            <p style={{ fontSize: 15, color: "#5C3D2E", opacity: 0.75, marginTop: 12, marginBottom: 0 }}>
              amaçlarıyla işlenmesine açık rıza verdiğimi kabul ve beyan ederim.
            </p>
          </div>
          <p style={{ fontSize: 15, color: "#5C3D2E", opacity: 0.75, lineHeight: 1.8, marginBottom: 24 }}>
            Açık rızamı dilediğim zaman geri çekebileceğimi bildiğimi kabul ederim.
          </p>
          <div style={{ background: "#FFF5F0", borderRadius: 16, padding: "20px 24px" }}>
            <h2 style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: "#5C3D2E", marginBottom: 8 }}>İletişim</h2>
            <p style={{ fontSize: 15, color: "#5C3D2E", opacity: 0.75, lineHeight: 1.7, margin: 0 }}>📧 <strong>info@evemama.net</strong></p>
          </div>
        </div>
      </div>
      <footer style={{ background: "#2C1A0E", padding: "32px 48px", textAlign: "center" }}>
        <div style={{ fontSize: 13, color: "#FDF6EE", opacity: 0.3 }}>© 2025 evemama.net — Tüm hakları saklıdır.</div>
      </footer>
    </main>
  );
}