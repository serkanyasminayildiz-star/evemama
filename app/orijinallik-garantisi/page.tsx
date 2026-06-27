/* eslint-disable @next/next/no-img-element -- orijinallik kanıt fotoğrafları:
   kullanıcı yüklemesi, doğal en-boy oranı korunmalı, lazy-load; next/image
   optimizasyonu burada gerekli değil + sabit boyut bozulmaya yol açar. */
import Link from "next/link";

export const metadata = {
  title: "Orijinallik Garantisi — %100 Orijinal, Bandrollü",
  description:
    "Tüm ürünlerimiz %100 orijinal: resmi ithalatçı bandrollü, faturalı ve markanın kendi sistemiyle doğrulanabilir. Orijinal değilse ürün bedelinin 2 katını iade ediyoruz. Sahte mamayı nasıl ayırt edersiniz?",
  alternates: { canonical: "https://www.evemama.net/orijinallik-garantisi" },
};

export default function OrijinallikGarantisi() {
  return (
    <main style={{ minHeight: "100vh", background: "#FDF6EE", fontFamily: "sans-serif", color: "#5C3D2E" }}>
      <header style={{ background: "white", borderBottom: "1px solid #E8D5B7", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 50 }}>
        <Link href="/" style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, color: "#5C3D2E", textDecoration: "none" }}>evemama<span style={{ color: "#E8845A", fontStyle: "italic" }}>.net</span></Link>
        <Link href="/urunler" style={{ color: "#E8845A", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>Ürünler →</Link>
      </header>

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "32px 20px 64px" }}>
        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 48 }}>🛡️</div>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 30, fontWeight: 700, margin: "8px 0" }}>%100 Orijinal Ürün Garantisi</h1>
          <p style={{ fontSize: 16, opacity: 0.85, lineHeight: 1.6, maxWidth: 640, margin: "0 auto" }}>
            Mağazamızdaki <strong>tüm ürünler orijinaldir</strong> — resmi ithalatçı/distribütör kaynaklı, <strong>bandrollü</strong>, <strong>faturalı</strong> ve markanın kendi sistemiyle <strong>doğrulanabilir</strong>.
          </p>
        </div>

        {/* 2 KAT garanti — sahtecinin veremeyeceği söz */}
        <div style={{ background: "linear-gradient(135deg,#2E7D32,#43A047)", color: "white", borderRadius: 20, padding: "28px 24px", textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 13, letterSpacing: 1, opacity: 0.9, marginBottom: 6 }}>SÖZÜMÜZ</div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 25, fontWeight: 700, lineHeight: 1.35 }}>Orijinal değilse ürün bedelinin<br /><span style={{ fontSize: 36 }}>2 KATINI</span> iade ederiz</div>
          <div style={{ fontSize: 14, opacity: 0.92, marginTop: 12, lineHeight: 1.6, maxWidth: 560, marginLeft: "auto", marginRight: "auto" }}>Sahte ürün satan hiçbir mağaza bu sözü veremez. Biz veriyoruz — çünkü her ürünün orijinalliğini <strong>siz de</strong> kendi telefonunuzdan doğrulayabilirsiniz.</div>
        </div>

        {/* Neden orijinal şart — güvenlik */}
        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Neden orijinal şart?</h2>
          <p style={{ fontSize: 15, lineHeight: 1.7, opacity: 0.9 }}>
            Taklit mamalar ucuz görünür ama içeriği belirsizdir: yanlış besin değerleri, bozuk hammadde, hatalı saklama. Bu da dostunuzda <strong>sindirim, böbrek ve cilt sorunlarına</strong> yol açabilir. Birkaç yüz lira &quot;tasarruf&quot;, veteriner masrafı ve en kötüsü dostunuzun sağlığı olarak geri döner. <strong>Orijinal mama, pazarlık konusu değildir.</strong>
          </p>
        </section>

        {/* 3 kanıt */}
        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Orijinalliğin 3 kanıtı</h2>
          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ background: "white", borderRadius: 16, padding: 18, border: "1px solid #E8D5B7" }}>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>1) Resmi ithalatçı bandrolü 🏷️</div>
              <p style={{ fontSize: 14, lineHeight: 1.6, opacity: 0.9, marginBottom: 12 }}>Her ürün, resmi ithalatçının işletme kayıt numarasıyla etiketlidir — yasal ithalat, kaçak ya da merdiven altı değil.</p>
              <img loading="lazy" src="/orijinal-bandrol.jpg" alt="Resmi ithalatçı bandrolü ve işletme kayıt numarası" style={{ maxWidth: "100%", height: "auto", borderRadius: 12, border: "1px solid #E8D5B7", display: "block" }} />
            </div>
            <div style={{ background: "white", borderRadius: 16, padding: 18, border: "1px solid #E8D5B7" }}>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>2) Hologram + QR doğrulama 🔐</div>
              <p style={{ fontSize: 14, lineHeight: 1.6, opacity: 0.9, marginBottom: 12 }}>Royal Canin ürünlerinde üreticinin kendi hologram + QR etiketi bulunur. <strong>Bizim sözümüze güvenmek zorunda değilsiniz</strong> — Royal Canin Up uygulamasıyla, kendi telefonunuzda orijinalliği doğrularsınız.</p>
              <img loading="lazy" src="/orijinal-hologram.jpg" alt="Royal Canin Up hologram ve QR doğrulama etiketi" style={{ maxWidth: "100%", height: "auto", borderRadius: 12, border: "1px solid #E8D5B7", display: "block" }} />
            </div>
            <div style={{ background: "white", borderRadius: 16, padding: 18, border: "1px solid #E8D5B7" }}>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>3) Faturalı satış 🧾</div>
              <p style={{ fontSize: 14, lineHeight: 1.6, opacity: 0.9 }}>Her siparişiniz faturalıdır. Faturalı ürün; kaynağı belli, izlenebilir ve garantili üründür.</p>
            </div>
          </div>
        </section>

        {/* RC Up doğrulama adımları */}
        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Royal Canin Up ile 4 adımda SİZ doğrulayın</h2>
          <div style={{ display: "grid", gap: 10 }}>
            {[
              ["1", "Royal Canin Up uygulamasını indirin", "App Store veya Google Play'den ücretsiz."],
              ["2", "Hologramı kaldırın", "Üründeki hologram etiketini belirtilen yerden kaldırın."],
              ["3", "QR kodu okutun", "Altından çıkan QR kodu uygulamayla okutun."],
              ["4", "Orijinal ürünü doğrulayın", "Uygulama, ürünün orijinal olduğunu anında teyit eder."],
            ].map(([n, t, d]) => (
              <div key={n} style={{ display: "flex", gap: 12, background: "white", borderRadius: 12, padding: "14px 16px", border: "1px solid #E8D5B7", alignItems: "flex-start" }}>
                <span style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 50, background: "#E8845A", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>{n}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{t}</div>
                  <div style={{ fontSize: 13, opacity: 0.8 }}>{d}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Sahteyi nasıl ayırt edersiniz — suçlamasız, eğitici */}
        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Sahteyi nasıl ayırt edersiniz?</h2>
          <p style={{ fontSize: 14, opacity: 0.8, marginBottom: 14 }}>Nereden alırsanız alın, satın almadan önce şunlara dikkat edin:</p>
          <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 10 }}>
            {[
              "Fiyat piyasanın çok altındaysa dikkatli olun — orijinal ürünün bir maliyeti vardır.",
              "Resmi ithalatçı bandrolü ve işletme kayıt numarası var mı?",
              "Hologram + QR doğrulama etiketi var mı, uygulamayla doğrulanıyor mu?",
              "Ambalaj baskısı kaliteli mi; yazılar silik, yamuk ya da hatalı mı?",
              "Satıcı fatura veriyor mu?",
            ].map((t, i) => (
              <li key={i} style={{ display: "flex", gap: 10, fontSize: 14, lineHeight: 1.5, background: "white", borderRadius: 12, padding: "12px 14px", border: "1px solid #E8D5B7" }}>
                <span style={{ flexShrink: 0 }}>✅</span><span>{t}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* CTA */}
        <div style={{ textAlign: "center" }}>
          <Link href="/urunler" style={{ display: "inline-block", background: "#E8845A", color: "white", padding: "15px 34px", borderRadius: 50, fontWeight: 700, fontSize: 15, textDecoration: "none", boxShadow: "0 8px 20px rgba(232,132,90,0.3)" }}>Orijinal ürünleri keşfet →</Link>
        </div>
      </div>
    </main>
  );
}
