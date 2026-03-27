export default function Hakkimizda() {
  return (
    <main style={{ minHeight: "100vh", background: "#FDF6EE", fontFamily: "sans-serif" }}>
      
      {/* Header */}
      <header style={{ background: "white", padding: "16px 48px", borderBottom: "1px solid #E8D5B7", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <a href="/" style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: "#5C3D2E", textDecoration: "none" }}>
          evemama<span style={{ color: "#E8845A", fontStyle: "italic" }}>.net</span>
        </a>
        <a href="/" style={{ fontSize: 13, color: "#E8845A", textDecoration: "none", fontWeight: 600 }}>← Ana Sayfa</a>
      </header>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}>
        
        {/* Hero */}
        <div style={{ background: "linear-gradient(135deg, #5C3D2E, #8B5E42)", borderRadius: 28, padding: "48px", marginBottom: 48, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", right: 40, top: "50%", transform: "translateY(-50%)", fontSize: 120, opacity: 0.1 }}>🐾</div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 36, fontWeight: 700, color: "white", marginBottom: 12 }}>
            evemama<span style={{ color: "#F4C09A", fontStyle: "italic" }}>.net</span>
          </div>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.75)", lineHeight: 1.7, maxWidth: 600 }}>
            Evcil hayvanların sağlıklı, mutlu ve kaliteli bir yaşam sürmesi için ihtiyaç duydukları ürünleri güvenilir, hızlı ve ekonomik şekilde sunmak amacıyla kurulmuş bir e-ticaret platformudur.
          </p>
        </div>

        {/* İçerik */}
        <div style={{ background: "white", borderRadius: 24, padding: "40px", marginBottom: 24, boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: 24, fontWeight: 700, color: "#5C3D2E", marginBottom: 20 }}>Biz Kimiz?</h2>
          <p style={{ fontSize: 15, color: "#5C3D2E", opacity: 0.75, lineHeight: 1.8, marginBottom: 16 }}>
            TNB Pet Mamaları ve Aksesuarları İthalat İhracat Sanayi ve Ticaret Limited Şirketi bünyesinde faaliyet gösteren EVEmama.net, kedi ve köpek başta olmak üzere tüm evcil dostlarımız için mama, bakım ve aksesuar ürünlerini titizlikle seçerek müşterilerine ulaştırmaktadır.
          </p>
          <p style={{ fontSize: 15, color: "#5C3D2E", opacity: 0.75, lineHeight: 1.8 }}>
            Hayvansever bir ekip olarak, patili dostlarımızın yalnızca beslenme değil, bakım, sağlık ve mutluluk ihtiyaçlarını da önemsiyoruz. Bu doğrultuda hem bireysel evcil hayvan sahiplerine hem de sokak hayvanlarına yönelik sosyal sorumluluk projelerinde yer almayı ve bu alanda sürdürülebilir katkılar sağlamayı hedefliyoruz.
          </p>
        </div>

        {/* Önceliklerimiz */}
        <div style={{ background: "white", borderRadius: 24, padding: "40px", marginBottom: 24, boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: 24, fontWeight: 700, color: "#5C3D2E", marginBottom: 24 }}>Önceliklerimiz</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 }}>
            {[
              { icon: "✅", title: "Güvenilir Markalar", desc: "Dünya ve Türkiye'nin önde gelen pet markalarının ürünlerini sunuyoruz." },
              { icon: "📦", title: "Orijinal ve Faturalı Ürünler", desc: "Tüm ürünlerimiz orijinaldir ve faturalı olarak teslim edilir." },
              { icon: "🚀", title: "Hızlı Kargo", desc: "Saat 14:00'a kadar verilen siparişler aynı gün kargoya verilir." },
              { icon: "💬", title: "Güçlü Müşteri Desteği", desc: "Satış öncesi ve sonrası her aşamada yanınızdayız." },
            ].map((item, i) => (
              <div key={i} style={{ background: "#FDF6EE", borderRadius: 16, padding: "20px" }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{item.icon}</div>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 700, color: "#5C3D2E", marginBottom: 6 }}>{item.title}</div>
                <p style={{ fontSize: 13, color: "#5C3D2E", opacity: 0.65, lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Taahhüdümüz */}
        <div style={{ background: "white", borderRadius: 24, padding: "40px", marginBottom: 24, boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: 24, fontWeight: 700, color: "#5C3D2E", marginBottom: 20 }}>Taahhüdümüz</h2>
          <p style={{ fontSize: 15, color: "#5C3D2E", opacity: 0.75, lineHeight: 1.8, marginBottom: 16 }}>
            EVEmama.net'te her sipariş, güvenli ödeme altyapısı ile korunur, ürünleriniz özenle paketlenerek en kısa sürede adresinize ulaştırılır. Müşteri memnuniyetini merkeze alan bu anlayışımızla, alışveriş sürecinin her aşamasında yanınızda olmaya devam ederiz.
          </p>
          <div style={{ background: "#FDF6EE", borderRadius: 16, padding: "20px 24px", borderLeft: "4px solid #E8845A" }}>
            <p style={{ fontSize: 14, color: "#5C3D2E", fontStyle: "italic", lineHeight: 1.7, margin: 0 }}>
              "EVEmama.net, Türkiye Cumhuriyeti mevzuatına uygun olarak faaliyet gösteren, faturalı satış yapan bir e-ticaret sitesidir."
            </p>
          </div>
        </div>

        {/* Firma Bilgileri */}
        <div style={{ background: "#5C3D2E", borderRadius: 24, padding: "40px", boxShadow: "0 4px 16px rgba(92,61,46,0.1)" }}>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: 24, fontWeight: 700, color: "white", marginBottom: 24 }}>Firma Bilgileri</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 }}>
            {[
              { label: "Ticaret Ünvanı", value: "TNB Pet Mamaları ve Aksesuarları İthalat İhracat Sanayi ve Ticaret Limited Şirketi" },
              { label: "Vergi Dairesi / No", value: "Kemeraltı / 9381208717" },
              { label: "Mersis No", value: "0938120871700001" },
              { label: "Ticaret Sicil No", value: "233886" },
              { label: "Adres", value: "Atilla Mahallesi 349. Sokak No: 55/A İç Kapı No: A KONAK/İZMİR" },
              { label: "Telefon", value: "+90 552 090 80 01" },
              { label: "E-Posta", value: "info@evemama.net" },
            ].map((item, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "16px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#F4C09A", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 }}>{item.label}</div>
                <div style={{ fontSize: 14, color: "white", lineHeight: 1.5 }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer style={{ background: "#2C1A0E", padding: "32px 48px", marginTop: 48, textAlign: "center" }}>
        <div style={{ fontSize: 13, color: "white", opacity: 0.3 }}>© 2025 evemama.net — Tüm hakları saklıdır.</div>
      </footer>

    </main>
  );
}