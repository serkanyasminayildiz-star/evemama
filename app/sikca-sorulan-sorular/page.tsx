"use client";
import { useState } from "react";

const sorular = [
  { kategori: "Siparişler & Satın Almalar", items: [
    { soru: "Siparişim nerede?", cevap: "Siparişiniz kargoya verildikten sonra size e-posta ile takip numarası gönderilecektir. MNG Kargo web sitesi veya uygulaması üzerinden siparişinizi takip edebilirsiniz." },
    { soru: "Siparişimi nasıl iptal edebilirim?", cevap: "Siparişinizi iptal etmek için sipariş tarihinden itibaren 24 saat içinde info@evemama.net adresine e-posta gönderebilir veya +90 552 090 80 01 numaralı hattı arayabilirsiniz." },
    { soru: "Siparişim neden iptal edildi?", cevap: "Siparişiniz; ödeme onaylanamaması, stok yetersizliği veya teslimat adresiyle ilgili sorunlar nedeniyle iptal edilmiş olabilir. Detaylı bilgi için müşteri hizmetlerimizle iletişime geçin." },
    { soru: "Siparişimin tamamını alamadım, neden?", cevap: "Bazı durumlarda ürünler farklı kargolarla gönderilebilir. Lütfen takip numaranızı kontrol edin veya müşteri hizmetlerimizle iletişime geçin." },
    { soru: "Siparişimle ilgili bir sorun olursa ne olur?", cevap: "Siparişinizle ilgili herhangi bir sorun yaşamanız halinde info@evemama.net adresine e-posta gönderebilir veya +90 552 090 80 01 numaralı hattı arayabilirsiniz. En kısa sürede çözüm sağlanacaktır." },
    { soru: "İade barkodunu nasıl alabilirim?", cevap: "İade talebinizi müşteri hizmetlerimize iletmeniz halinde size iade barkodu gönderilecektir." },
  ]},
  { kategori: "Üyelik", items: [
    { soru: "Şifremi nasıl sıfırlarım?", cevap: "Giriş sayfasındaki 'Şifremi Unuttum' bağlantısına tıklayarak e-posta adresinize şifre sıfırlama bağlantısı gönderebilirsiniz." },
    { soru: "Şifremi nasıl değiştirebilirim?", cevap: "Hesabım sayfasından 'Şifre Değiştir' seçeneğini kullanarak şifrenizi güncelleyebilirsiniz." },
    { soru: "Hesabımı nasıl iptal edebilirim?", cevap: "Hesabınızı iptal etmek için info@evemama.net adresine talebinizi iletebilirsiniz." },
  ]},
  { kategori: "İadeler & Geri Ödemeler", items: [
    { soru: "Geri ödemem nerede?", cevap: "İade onaylandıktan sonra ödeme yönteminize göre 3-14 iş günü içinde geri ödeme yapılır. Kredi kartı iadeleri bankanıza bağlı olarak 2-3 haftayı bulabilir." },
    { soru: "Siparişimi nasıl iade edebilirim?", cevap: "Ürünü teslim aldıktan sonraki 14 gün içinde info@evemama.net adresine iade talebinizi iletebilirsiniz. Onay sonrası ürünü Atilla Mah. 349. Sok. No:55/A Konak/İzmir adresine gönderebilirsiniz." },
    { soru: "İade politikası nedir?", cevap: "Ürünü teslim aldıktan sonraki 14 gün içinde, kullanılmamış ve orijinal ambalajında olmak koşuluyla iade edebilirsiniz. Detaylar için İade Politikası sayfamızı inceleyebilirsiniz." },
  ]},
  { kategori: "Kargo & Takip", items: [
    { soru: "Kargo ücreti ne kadar?", cevap: "1000₺ ve üzeri siparişlerde kargo ücretsizdir. 1000₺ altındaki siparişlerde kargo ücreti sepet sayfasında gösterilir." },
    { soru: "Teslimat adresimi nasıl değiştiririm?", cevap: "Sipariş henüz kargoya verilmemişse, müşteri hizmetlerimizi arayarak adres değişikliği talep edebilirsiniz." },
    { soru: "Siparişim henüz gelmedi. Ne yapmalıyım?", cevap: "Tahmini teslimat süresi geçmişse MNG Kargo takip numaranızla durumu sorgulayabilir veya müşteri hizmetlerimizle iletişime geçebilirsiniz." },
    { soru: "Kargom kaç günde gelir?", cevap: "Saat 14:00'a kadar verilen siparişler aynı gün kargoya verilir. Teslimat süresi genellikle 1-3 iş günüdür." },
  ]},
  { kategori: "Ücretler & Faturalandırma", items: [
    { soru: "Satın aldığım ürünün faturası ne zaman kesilir?", cevap: "Fatura, siparişiniz kargoya verildiğinde e-posta adresinize gönderilir ve ürünle birlikte paket içinde de yer alır." },
    { soru: "Faturam hala kesilmedi, ne yapmalıyım?", cevap: "Lütfen info@evemama.net adresine sipariş numaranızı belirterek e-posta gönderin, en kısa sürede faturanız düzenlenecektir." },
  ]},
  { kategori: "Diğer", items: [
    { soru: "Anlık indirimleri nasıl öğrenebilirim?", cevap: "E-bültenimize abone olarak ve sosyal medya hesaplarımızı takip ederek anlık indirimlerden haberdar olabilirsiniz." },
    { soru: "Daha fazla bilgiyi nereden alabilirim?", cevap: "Tüm bilgilere web sitemizden ulaşabilir, sorularınız için info@evemama.net adresine yazabilirsiniz." },
  ]},
];

export default function SSS() {
  const [acik, setAcik] = useState<string | null>(null);

  return (
    <main style={{ minHeight: "100vh", background: "#FDF6EE", fontFamily: "sans-serif" }}>
      <header style={{ background: "white", padding: "16px 48px", borderBottom: "1px solid #E8D5B7", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <a href="/" style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: "#5C3D2E", textDecoration: "none" }}>evemama<span style={{ color: "#E8845A", fontStyle: "italic" }}>.net</span></a>
      </header>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: 36, fontWeight: 700, color: "#5C3D2E", marginBottom: 8 }}>Sıkça Sorulan Sorular</h1>
        <div style={{ width: 60, height: 4, background: "#E8845A", borderRadius: 2, marginBottom: 40 }} />

        {sorular.map((grup, gi) => (
          <div key={gi} style={{ marginBottom: 40 }}>
            <h2 style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: "#5C3D2E", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 32, height: 32, background: "#E8845A", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>{gi + 1}</span>
              {grup.kategori}
            </h2>
            {grup.items.map((item, ii) => {
              const key = `${gi}-${ii}`;
              const isAcik = acik === key;
              return (
                <div key={ii} style={{ background: "white", borderRadius: 16, marginBottom: 8, overflow: "hidden", boxShadow: "0 2px 8px rgba(92,61,46,0.05)", border: isAcik ? "2px solid #E8845A" : "2px solid transparent", transition: "border .2s" }}>
                  <button onClick={() => setAcik(isAcik ? null : key)}
                    style={{ width: "100%", padding: "18px 20px", background: "none", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "inherit", textAlign: "left" }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: "#5C3D2E" }}>{item.soru}</span>
                    <span style={{ fontSize: 20, color: "#E8845A", fontWeight: 700, flexShrink: 0, marginLeft: 16, transition: "transform .2s", transform: isAcik ? "rotate(45deg)" : "rotate(0)" }}>+</span>
                  </button>
                  {isAcik && (
                    <div style={{ padding: "0 20px 18px", fontSize: 14, color: "#5C3D2E", opacity: 0.75, lineHeight: 1.7 }}>
                      {item.cevap}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        <div style={{ background: "#5C3D2E", borderRadius: 24, padding: "32px 40px", textAlign: "center", marginTop: 40 }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: "white", marginBottom: 8 }}>Sorunuzu Bulamadınız mı?</div>
          <p style={{ fontSize: 14, color: "#F4C09A", opacity: 0.8, marginBottom: 20 }}>Müşteri hizmetlerimiz size yardımcı olmaktan mutluluk duyar.</p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/iletisim" style={{ background: "#E8845A", color: "white", padding: "12px 24px", borderRadius: 50, textDecoration: "none", fontWeight: 700, fontSize: 14 }}>📧 Bize Yazın</a>
            <a href="tel:+905520908001" style={{ background: "rgba(255,255,255,0.1)", color: "white", padding: "12px 24px", borderRadius: 50, textDecoration: "none", fontWeight: 700, fontSize: 14 }}>📞 +90 552 090 80 01</a>
          </div>
        </div>
      </div>
      <footer style={{ background: "#2C1A0E", padding: "32px 48px", textAlign: "center" }}>
        <div style={{ fontSize: 13, color: "#FDF6EE", opacity: 0.3 }}>© 2025 evemama.net — Tüm hakları saklıdır.</div>
      </footer>
    </main>
  );
}