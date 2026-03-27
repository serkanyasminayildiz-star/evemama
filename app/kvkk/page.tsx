export default function KVKK() {
  return (
    <main style={{ minHeight: "100vh", background: "#FDF6EE", fontFamily: "sans-serif" }}>
      <header style={{ background: "white", padding: "16px 48px", borderBottom: "1px solid #E8D5B7", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <a href="/" style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: "#5C3D2E", textDecoration: "none" }}>evemama<span style={{ color: "#E8845A", fontStyle: "italic" }}>.net</span></a>
      </header>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: 36, fontWeight: 700, color: "#5C3D2E", marginBottom: 8 }}>KVKK Aydınlatma Metni</h1>
        <div style={{ width: 60, height: 4, background: "#E8845A", borderRadius: 2, marginBottom: 8 }} />
        <p style={{ fontSize: 13, color: "#5C3D2E", opacity: 0.5, marginBottom: 40 }}>Son güncelleme tarihi: 01/02/2026</p>

        <div style={{ background: "white", borderRadius: 24, padding: "40px 48px", boxShadow: "0 4px 24px rgba(92,61,46,0.07)" }}>
          <p style={{ fontSize: 15, color: "#5C3D2E", opacity: 0.75, lineHeight: 1.8, marginBottom: 24 }}>
            6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") ve ilgili mevzuatlar kapsamında, kişisel verileriniz veri sorumlusu sıfatıyla <strong>TNB Pet Mamaları ve Aksesuarları İthalat İhracat Sanayi ve Ticaret Limited Şirketi</strong> tarafından işlenmektedir.
          </p>

          {[
            { baslik: "Veri Sorumlusu", icerik: "TNB Pet Mamaları ve Aksesuarları İthalat İhracat Sanayi ve Ticaret Limited Şirketi\nAtilla Mahallesi 349. Sokak No: 55/A İç Kapı No: A KONAK/İZMİR\nVergi No: 9381208717" },
            { baslik: "Kişisel Verilerin İşlenme Amaçları", icerik: "Kişisel verileriniz; hizmetlerimizin sunulabilmesi, iletişim faaliyetlerinin yürütülmesi, talep ve şikayetlerin değerlendirilmesi, yasal yükümlülüklerin yerine getirilmesi, hukuki ve ticari güvenliğin sağlanması, iş süreçlerinin yürütülmesi ve denetimi amacıyla işlenmektedir." },
            { baslik: "Toplanan Kişisel Veriler", icerik: "Kimlik bilgileri (ad, soyad, T.C. kimlik numarası), iletişim bilgileri (telefon, e-posta, adres), işlem güvenliği verileri ve diğer işlenen kişisel veriler." },
            { baslik: "Veri Toplama Yöntemi ve Hukuki Sebebi", icerik: "Kişisel verileriniz, sözlü, yazılı veya elektronik ortamda; telefon, e-posta, web sitesi formları, sözleşmeler ve diğer kanallar aracılığıyla, KVKK'nın 5. ve 6. maddelerine dayanılarak toplanmaktadır." },
            { baslik: "Kişisel Verilerin Aktarılabileceği Kişi ve Kuruluşlar", icerik: "Kişisel verileriniz, yalnızca yasal yükümlülükler kapsamında ve iş süreçlerinin gerektirdiği ölçüde, yetkili kamu kurumları, iş ortakları ve hizmet sağlayıcıları ile paylaşılabilir." },
          ].map((item, i) => (
            <div key={i} style={{ marginBottom: 28 }}>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: "#5C3D2E", marginBottom: 10 }}>{item.baslik}</h2>
              <p style={{ fontSize: 15, color: "#5C3D2E", opacity: 0.75, lineHeight: 1.8, whiteSpace: "pre-line" }}>{item.icerik}</p>
            </div>
          ))}

          <div style={{ background: "#FDF6EE", borderRadius: 16, padding: "20px 24px", marginBottom: 28 }}>
            <h2 style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: "#5C3D2E", marginBottom: 12 }}>KVKK Kapsamındaki Haklarınız</h2>
            {[
              "Kişisel verilerinizin işlenip işlenmediğini öğrenme",
              "İşlenmişse buna ilişkin bilgi talep etme",
              "İşleme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme",
              "Yurt içi veya yurt dışına aktarılan kişisel veriler hakkında bilgi alma",
              "Eksik veya yanlış işlenmişse düzeltilmesini isteme",
              "Kişisel verilerinizin silinmesini veya yok edilmesini isteme",
              "İşlemenin hukuka aykırı olması nedeniyle zarara uğramanız halinde tazminat talep etme",
            ].map((hak, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                <span style={{ color: "#E8845A", fontWeight: 700, flexShrink: 0 }}>–</span>
                <span style={{ fontSize: 15, color: "#5C3D2E", opacity: 0.75, lineHeight: 1.6 }}>{hak}</span>
              </div>
            ))}
          </div>

          <div style={{ background: "#FFF5F0", borderRadius: 16, padding: "20px 24px" }}>
            <h2 style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: "#5C3D2E", marginBottom: 8 }}>İletişim</h2>
            <p style={{ fontSize: 15, color: "#5C3D2E", opacity: 0.75, lineHeight: 1.7, margin: 0 }}>
              KVKK kapsamındaki taleplerinizi 📧 <strong>info@evemama.net</strong> adresi üzerinden tarafımıza iletebilirsiniz.
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