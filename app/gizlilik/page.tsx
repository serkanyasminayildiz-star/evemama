export default function Gizlilik() {
  return (
    <main style={{ minHeight: "100vh", background: "#FDF6EE", fontFamily: "sans-serif" }}>
      <header style={{ background: "white", padding: "16px 48px", borderBottom: "1px solid #E8D5B7", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <a href="/" style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: "#5C3D2E", textDecoration: "none" }}>evemama<span style={{ color: "#E8845A", fontStyle: "italic" }}>.net</span></a>
      </header>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: 36, fontWeight: 700, color: "#5C3D2E", marginBottom: 8 }}>Gizlilik Politikası</h1>
        <div style={{ width: 60, height: 4, background: "#E8845A", borderRadius: 2, marginBottom: 8 }} />
        <p style={{ fontSize: 13, color: "#5C3D2E", opacity: 0.5, marginBottom: 40 }}>Son güncelleme tarihi: 02/01/2026</p>
        <div style={{ background: "white", borderRadius: 24, padding: "40px 48px", boxShadow: "0 4px 24px rgba(92,61,46,0.07)" }}>
          {[
            { no: "1", baslik: "Genel Bilgiler", icerik: "EVEmama.net (bundan sonra 'biz', 'bizim' veya 'firma' olarak anılacaktır), müşterilerinin ve ziyaretçilerinin gizliliğini korumayı taahhüt eder. Bu gizlilik politikası, firmanın web sitesi veya mobil uygulama üzerinden sunulan hizmetlerle ilgili olarak kişisel bilgilerin nasıl toplandığını, kullanıldığını, paylaşıldığını ve korunduğunu açıklar." },
            { no: "2", baslik: "Toplanan Bilgiler", icerik: "Firma aşağıdaki türden bilgileri toplayabilir:\n\na. Kişisel Bilgiler: Adınız, soyadınız, e-posta adresiniz, telefon numaranız gibi doğrudan sizi tanımlayan bilgiler.\n\nb. Kullanıcı Bilgileri: Site veya uygulama kullanımınıza ilişkin veriler, IP adresi, tarayıcı türü, kullanıcıların siteyi nasıl kullandığına dair istatistikler gibi teknik bilgiler." },
            { no: "3", baslik: "Bilgilerin Kullanımı", icerik: "a. Hizmet Sunumu: Sipariş işleme, müşteri hizmetleri sağlama ve kullanıcı deneyimini geliştirme.\n\nb. Pazarlama ve İletişim: Ürün ve kampanya duyuruları gönderme, anketler ve geri bildirimler için iletişim.\n\nc. Analiz ve İyileştirme: Site ve uygulama kullanımını analiz etme, hizmetlerimizi ve içeriğimizi geliştirme." },
            { no: "4", baslik: "Bilgi Paylaşımı", icerik: "Firma, kişisel bilgilerinizi yasal gereksinimler ve aşağıdaki durumlar haricinde üçüncü taraflarla paylaşmaz:\n\na. İzin: Kullanıcı izni ile.\n\nb. Hizmet Sağlayıcılar: İşimizi desteklemek için hizmet sağlayıcıları ile paylaşabiliriz.\n\nc. Yasal Gereksinimler: Yürürlükteki yasalar ve düzenlemelere uyum sağlamak amacıyla." },
            { no: "5", baslik: "Güvenlik", icerik: "Firma, kişisel bilgilerinizi korumak için endüstri standartlarına uygun güvenlik önlemleri alır. Ancak internet üzerinden iletişim veya veri depolama tamamen güvende değildir." },
            { no: "6", baslik: "Çerezler", icerik: "Firma, site ve uygulama kullanımınızı analiz etmek ve iyileştirmek amacıyla çerezler kullanabilir. Daha fazla bilgi için Çerez Politikamıza başvurabilirsiniz." },
            { no: "7", baslik: "Değişiklikler", icerik: "Bu gizlilik politikası zaman zaman güncellenebilir. Herhangi bir güncelleme hakkında sizi bilgilendirmek amacıyla politikanın en son güncelleme tarihini belirtiriz." },
          ].map((item) => (
            <div key={item.no} style={{ marginBottom: 28 }}>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: "#5C3D2E", marginBottom: 10 }}>{item.no}. {item.baslik}</h2>
              <p style={{ fontSize: 15, color: "#5C3D2E", opacity: 0.75, lineHeight: 1.8, whiteSpace: "pre-line" }}>{item.icerik}</p>
            </div>
          ))}
          <div style={{ background: "#FFF5F0", borderRadius: 16, padding: "20px 24px", marginTop: 16 }}>
            <h2 style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: "#5C3D2E", marginBottom: 8 }}>8. İletişim</h2>
            <p style={{ fontSize: 15, color: "#5C3D2E", opacity: 0.75, lineHeight: 1.7, margin: 0 }}>
              Veri Sorumlusu: TNB Pet Mamaları ve Aksesuarları İthalat İhracat Sanayi ve Ticaret Limited Şirketi<br />
              📧 <strong>info@evemama.net</strong>
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