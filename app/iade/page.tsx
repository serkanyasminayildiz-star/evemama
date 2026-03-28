export default function Iade() {
  return (
    <main style={{ minHeight: "100vh", background: "#FDF6EE", fontFamily: "sans-serif" }}>
      <header style={{ background: "white", padding: "16px 48px", borderBottom: "1px solid #E8D5B7", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <a href="/" style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: "#5C3D2E", textDecoration: "none" }}>evemama<span style={{ color: "#E8845A", fontStyle: "italic" }}>.net</span></a>
      </header>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: 36, fontWeight: 700, color: "#5C3D2E", marginBottom: 8 }}>İptal & İade & Değişim</h1>
        <div style={{ width: 60, height: 4, background: "#E8845A", borderRadius: 2, marginBottom: 8 }} />
        <p style={{ fontSize: 13, color: "#5C3D2E", opacity: 0.5, marginBottom: 40 }}>Son güncelleme tarihi: 01/02/2026</p>

        <div style={{ background: "white", borderRadius: 24, padding: "40px 48px", boxShadow: "0 4px 24px rgba(92,61,46,0.07)" }}>
          <p style={{ fontSize: 15, color: "#5C3D2E", opacity: 0.75, lineHeight: 1.8, marginBottom: 32 }}>
            EVEmama.net üzerinden yapılan alışverişlerde, 6502 sayılı Tüketicinin Korunması Hakkında Kanun kapsamında iptal, iade ve değişim haklarınız güvence altındadır.
          </p>

          {[
            {
              no: "1", baslik: "İptal Politikası",
              maddeler: [
                { harf: "a", baslik: "Sipariş İptali Süresi", icerik: "Siparişinizi iptal etmek için, siparişi verdikten sonraki 24 saat içinde bize bildirmeniz gerekmektedir." },
                { harf: "b", baslik: "İptal İşlemi", icerik: "Siparişinizi iptal etmek için info@evemama.net veya +905520908001 üzerinden bizimle iletişime geçebilirsiniz. İptal işlemi sonrasında ödemeniz ödeme yönteminize iade edilecektir." },
              ]
            },
            {
              no: "2", baslik: "İade Politikası",
              maddeler: [
                { harf: "a", baslik: "İade Süresi", icerik: "Ürünü teslim aldıktan sonraki 14 gün içinde iade talebinizi bizimle iletebilirsiniz." },
                { harf: "b", baslik: "İade Durumu", icerik: "İade edilecek ürünlerin kullanılmamış, ambalajı hasar görmemiş ve satılabilir durumda olması gerekmektedir." },
                { harf: "c", baslik: "İade İşlemi", icerik: "İade talebinizi oluşturduktan sonra ürünlerinizi Atilla Mah. 349. Sok. No:55/A Konak/İzmir adresine gönderebilirsiniz. İade işlemi onaylandığında ödemeniz iade edilecektir." },
                { harf: "d", baslik: "Kargo Ücreti", icerik: "Ayıplı veya hatalı ürünlerde iade ve değişim kargo ücreti firmamıza aittir. Diğer iade ve değişim durumlarında kargo ücreti müşteriye aittir." },
              ]
            },
            {
              no: "3", baslik: "Değişim Politikası",
              maddeler: [
                { harf: "a", baslik: "Değişim Süresi", icerik: "Ürünü teslim aldıktan sonraki 14 gün içinde değişim talebinizi bizimle iletebilirsiniz." },
                { harf: "b", baslik: "Değişim Durumu", icerik: "Değiştirmek istediğiniz ürün, kullanılmamış, ambalajı hasar görmemiş ve satılabilir durumda olmalıdır." },
                { harf: "c", baslik: "Değişim İşlemi", icerik: "Değişim talebinizi oluşturduktan sonra ürünlerinizi Atilla Mah. 349. Sok. No:55/A Konak/İzmir adresine göndermelisiniz." },
              ]
            },
          ].map((bolum) => (
            <div key={bolum.no} style={{ marginBottom: 36 }}>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, color: "#5C3D2E", marginBottom: 16 }}>{bolum.no}. {bolum.baslik}</h2>
              {bolum.maddeler.map((madde) => (
                <div key={madde.harf} style={{ marginBottom: 16, paddingLeft: 20, borderLeft: "3px solid #E8D5B7" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#5C3D2E", marginBottom: 4 }}>{madde.harf}. {madde.baslik}</div>
                  <div style={{ fontSize: 15, color: "#5C3D2E", opacity: 0.75, lineHeight: 1.7 }}>{madde.icerik}</div>
                </div>
              ))}
            </div>
          ))}

          <div style={{ background: "#FFF5F0", borderRadius: 16, padding: "20px 24px" }}>
            <h2 style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: "#5C3D2E", marginBottom: 8 }}>4. İletişim</h2>
            <p style={{ fontSize: 15, color: "#5C3D2E", opacity: 0.75, lineHeight: 1.7, margin: 0 }}>
              📧 <strong>info@evemama.net</strong> &nbsp;|&nbsp; 📞 <strong>+90 552 090 80 01</strong>
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