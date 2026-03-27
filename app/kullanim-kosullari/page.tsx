export default function KullanimKosullari() {
  return (
    <main style={{ minHeight: "100vh", background: "#FDF6EE", fontFamily: "sans-serif" }}>
      <header style={{ background: "white", padding: "16px 48px", borderBottom: "1px solid #E8D5B7", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <a href="/" style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: "#5C3D2E", textDecoration: "none" }}>evemama<span style={{ color: "#E8845A", fontStyle: "italic" }}>.net</span></a>
      </header>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: 36, fontWeight: 700, color: "#5C3D2E", marginBottom: 8 }}>Kullanım Koşulları</h1>
        <div style={{ width: 60, height: 4, background: "#E8845A", borderRadius: 2, marginBottom: 8 }} />
        <p style={{ fontSize: 13, color: "#5C3D2E", opacity: 0.5, marginBottom: 40 }}>Son güncelleme tarihi: 01/02/2026</p>
        <div style={{ background: "white", borderRadius: 24, padding: "40px 48px", boxShadow: "0 4px 24px rgba(92,61,46,0.07)" }}>
          <p style={{ fontSize: 15, color: "#5C3D2E", opacity: 0.75, lineHeight: 1.8, marginBottom: 32 }}>
            Hoş geldiniz! "www.evemama.net" web sitesini veya mobil uygulamasını kullanarak, aşağıdaki Kullanım Koşulları ve şartlarına uymayı kabul etmiş olursunuz.
          </p>
          {[
            { no: "1", baslik: "Üyelik ve Hesap", icerik: "Web sitemizi kullanmak için üyelik oluşturmanız gerekebilir. Hesap bilgilerinizin güncel ve doğru olduğundan emin olun. Hesabınızın güvenliğinden siz sorumlusunuz. Hesabınızı başka bir kişiye devretmek veya paylaşmak yasaktır." },
            { no: "2", baslik: "İçerik ve Telif Hakkı", icerik: "Web sitemizde bulunan tüm içerikler (metin, görseller, videolar vb.) firmamıza aittir veya izin alınarak kullanılmıştır. İçeriklerimizi izinsiz olarak kopyalamak, dağıtmak veya kullanmak yasaktır." },
            { no: "3", baslik: "Siparişler ve Ödemeler", icerik: "Sipariş verirken doğru ve güncel bilgileri sağladığınızdan emin olun. Ödeme işlemleri güvenli bir şekilde işlenir. Ödeme işlemleri sırasında sorun yaşarsanız müşteri hizmetleri ekibimizle iletişime geçin." },
            { no: "4", baslik: "İptal, İade ve Değişim", icerik: "İptal, iade ve değişim politikalarımız hakkında daha fazla bilgi almak için İptal & İade & Değişim Politikası sayfamızı ziyaret edin." },
            { no: "5", baslik: "Gizlilik ve Güvenlik", icerik: "Gizlilik politikamızı inceleyerek, kişisel bilgilerinizin nasıl işlendiği ve korunduğu hakkında daha fazla bilgi edinin." },
            { no: "6", baslik: "Sorumluluk Reddi", icerik: "Web sitemizde bulunan içeriklerin doğruluğu ve eksiksizliği konusunda garanti vermemekteyiz. Web sitemizi kullanmanız sonucunda ortaya çıkan herhangi bir kayıp veya zarardan firmamız sorumlu tutulamaz." },
            { no: "7", baslik: "Değişiklikler ve Güncellemeler", icerik: "Kullanım koşullarımızı zaman zaman güncelleyebiliriz. Bu nedenle, periyodik olarak bu sayfayı ziyaret ederek güncellemeleri kontrol etmelisiniz." },
          ].map((item) => (
            <div key={item.no} style={{ marginBottom: 28 }}>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: "#5C3D2E", marginBottom: 10 }}>{item.no}. {item.baslik}</h2>
              <p style={{ fontSize: 15, color: "#5C3D2E", opacity: 0.75, lineHeight: 1.8 }}>{item.icerik}</p>
            </div>
          ))}
          <div style={{ background: "#FFF5F0", borderRadius: 16, padding: "20px 24px" }}>
            <h2 style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: "#5C3D2E", marginBottom: 8 }}>8. İletişim</h2>
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