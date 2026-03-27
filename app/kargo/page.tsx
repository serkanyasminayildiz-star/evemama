export default function Kargo() {
  return (
    <main style={{ minHeight: "100vh", background: "#FDF6EE", fontFamily: "sans-serif" }}>
      <header style={{ background: "white", padding: "16px 48px", borderBottom: "1px solid #E8D5B7", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <a href="/" style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: "#5C3D2E", textDecoration: "none" }}>evemama<span style={{ color: "#E8845A", fontStyle: "italic" }}>.net</span></a>
      </header>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: 36, fontWeight: 700, color: "#5C3D2E", marginBottom: 8 }}>Kargo & Teslimat</h1>
        <div style={{ width: 60, height: 4, background: "#E8845A", borderRadius: 2, marginBottom: 8 }} />
        <p style={{ fontSize: 13, color: "#5C3D2E", opacity: 0.5, marginBottom: 40 }}>Son güncelleme tarihi: 01/02/2026</p>

        <div style={{ background: "white", borderRadius: 24, padding: "40px 48px", boxShadow: "0 4px 24px rgba(92,61,46,0.07)" }}>
          {[
            { baslik: "1. Kargo Seçenekleri", icerik: "Siparişleriniz anlaşmalı olduğumuz MNG Kargo ile gönderilir. Farklı kargo seçenekleri hız, maliyet ve teslimat zamanı açısından değişiklik gösterebilir." },
            { baslik: "2. Teslimat Süresi", icerik: "Ürünlerinizin teslimat süresi, sipariş verilen ürünlerin türüne ve seçtiğiniz kargo seçeneğine bağlı olarak değişebilir. Siparişinizin tahmini teslimat tarihini alışveriş sepetinizde görebilirsiniz." },
            { baslik: "3. Sipariş İzleme", icerik: "Siparişiniz kargoya verildiğinde, size bir takip numarası ve kargo şirketi bilgisi sağlanacaktır. Bu bilgileri kullanarak siparişinizin nerede olduğunu kolayca izleyebilirsiniz." },
            { baslik: "4. Teslimat Adresi", icerik: "Lütfen sipariş verirken doğru teslimat adresi ve iletişim bilgilerini sağladığınızdan emin olun. Yanlış teslimat adresi verilmesi durumunda sorumluluk kabul edilmez." },
          ].map((item, i) => (
            <div key={i} style={{ marginBottom: 32 }}>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, color: "#5C3D2E", marginBottom: 12 }}>{item.baslik}</h2>
              <p style={{ fontSize: 15, color: "#5C3D2E", opacity: 0.75, lineHeight: 1.8 }}>{item.icerik}</p>
            </div>
          ))}

          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, color: "#5C3D2E", marginBottom: 16 }}>5. Teslimat Ücretleri</h2>
            <div style={{ background: "#FDF6EE", borderRadius: 16, padding: "24px" }}>
              {[
                { icon: "🎁", text: "1000₺ ve üzeri siparişlerde kargo ücretsizdir." },
                { icon: "💰", text: "1000₺ altındaki siparişlerde kargo ücreti ödeme adımında sepet ekranında açık şekilde gösterilir." },
                { icon: "📅", text: "Ücretsiz kargo kampanyaları dönemsel olarak değişiklik gösterebilir." },
                { icon: "↩️", text: "İade ve değişim işlemlerinde kargo ücreti, İptal ve İade politikası kapsamında değerlendirilir." },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                  <span style={{ fontSize: 20 }}>{item.icon}</span>
                  <span style={{ fontSize: 15, color: "#5C3D2E", opacity: 0.75, lineHeight: 1.6 }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "#FFF5F0", borderRadius: 16, padding: "20px 24px" }}>
            <h2 style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: "#5C3D2E", marginBottom: 8 }}>6. İletişim</h2>
            <p style={{ fontSize: 15, color: "#5C3D2E", opacity: 0.75, lineHeight: 1.7, margin: 0 }}>
              Kargo ve teslimat süreci hakkında herhangi bir sorunuz varsa müşteri hizmetleri ekibimiz size yardımcı olur.<br />
              📞 <strong>+90 552 090 80 01</strong> &nbsp;|&nbsp; 📧 <strong>info@evemama.net</strong>
            </p>
          </div>
        </div>
      </div>
      <footer style={{ background: "#2C1A0E", padding: "32px 48px", textAlign: "center" }}>
        <div style={{ fontSize: 13, color: "#FDF6EE", opacity: 0.3 }}>© 2025 evemama.net — Tüm hakları saklıdır.</div>
      </footer>
    </main>
  );
}