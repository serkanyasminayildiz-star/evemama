export default function CerezPolitikasi() {
  return (
    <main style={{ minHeight: "100vh", background: "#FDF6EE", fontFamily: "sans-serif" }}>
      <header style={{ background: "white", padding: "16px 48px", borderBottom: "1px solid #E8D5B7", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <a href="/" style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: "#5C3D2E", textDecoration: "none" }}>evemama<span style={{ color: "#E8845A", fontStyle: "italic" }}>.net</span></a>
      </header>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: 36, fontWeight: 700, color: "#5C3D2E", marginBottom: 8 }}>Çerez Politikası</h1>
        <div style={{ width: 60, height: 4, background: "#E8845A", borderRadius: 2, marginBottom: 8 }} />
        <p style={{ fontSize: 13, color: "#5C3D2E", opacity: 0.5, marginBottom: 40 }}>Son güncelleme tarihi: 01/02/2026</p>
        <div style={{ background: "white", borderRadius: 24, padding: "40px 48px", boxShadow: "0 4px 24px rgba(92,61,46,0.07)" }}>
          <p style={{ fontSize: 15, color: "#5C3D2E", opacity: 0.75, lineHeight: 1.8, marginBottom: 32 }}>
            Bu çerez politikası, TNB Pet Mamaları ve Aksesuarları İthalat İhracat Sanayi ve Ticaret Limited Şirketi web sitesi tarafından kullanılan çerezlerle ilgili bilgileri açıklamaktadır.
          </p>
          {[
            { baslik: "Çerez Nedir?", icerik: "Çerezler, bir web sitesini ziyaret ettiğinizde tarayıcınıza kaydedilen küçük metin dosyalarıdır. Bu dosyalar, web sitesinin sizinle etkileşimde bulunmasını ve size özel bir deneyim sunmasını sağlamak için kullanılır." },
            { baslik: "Zorunlu Çerezler", icerik: "Web sitemizin temel işlevselliğini sağlamak için kullanılır. Örneğin, oturum açma bilgilerinizi hatırlayarak size kişiselleştirilmiş bir deneyim sunarlar." },
            { baslik: "Analitik ve Performans Çerezleri", icerik: "Ziyaretçi trafiğini analiz eder ve web sitemizin performansını ölçer. Bu çerezler, hangi sayfaların daha popüler olduğunu anlamamıza ve kullanıcı deneyimini iyileştirmemize yardımcı olur." },
            { baslik: "Reklam ve Hedefleme Çerezleri", icerik: "Sizin ilgi alanlarınıza dayalı olarak reklamları kişiselleştirmek için kullanılır. Bu çerezler, size daha ilgi çekici içerikler sunmamıza olanak tanır." },
            { baslik: "Çerezleri Nasıl Kontrol Edebilirsiniz?", icerik: "Tarayıcınızın ayarları üzerinden çerezleri kabul etmeyi veya reddetmeyi seçebilirsiniz. Ancak, zorunlu çerezleri devre dışı bırakmak, web sitemizin bazı temel özelliklerinin çalışmasını engelleyebilir." },
          ].map((item, i) => (
            <div key={i} style={{ marginBottom: 28 }}>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: "#5C3D2E", marginBottom: 10 }}>{item.baslik}</h2>
              <p style={{ fontSize: 15, color: "#5C3D2E", opacity: 0.75, lineHeight: 1.8 }}>{item.icerik}</p>
            </div>
          ))}
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