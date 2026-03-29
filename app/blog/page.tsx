"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

const blogYazilari = [
  {
    id: 1,
    kategori: "Kedi Bakımı",
    emoji: "🐱",
    renk: "linear-gradient(135deg,#FFF0E0,#F4C09A)",
    baslik: "Kedinizin Mutlu ve Sağlıklı Olması İçin 10 Altın Kural",
    ozet: "Kediler bağımsız hayvanlar olsa da sevgi ve bakıma ihtiyaçları vardır. İşte kedinizi mutlu etmenin püf noktaları...",
    icerik: [
      { baslik: "Düzenli Veteriner Kontrolü", metin: "Kedinizi yılda en az 1-2 kez veterinere götürün. Erken teşhis birçok hastalığı önler. Aşı takvimine mutlaka uyun." },
      { baslik: "Kaliteli Mama Seçimi", metin: "Kedinizin yaşına ve sağlık durumuna uygun mama seçin. Yavru, yetişkin ve yaşlı kediler için farklı formüller mevcuttur. Her zaman taze su bulundurun." },
      { baslik: "Koku Kutusunu Temiz Tutun", metin: "Günde en az bir kez koku kutusunu temizleyin. Kirli koku kutusu kedinin stres yaşamasına ve sağlık sorunlarına yol açabilir." },
      { baslik: "Oyun ve Aktivite", metin: "Kediler günde 15-20 dakika aktif oyun oynamalıdır. Tüy, lazer pointer ve fare oyuncakları hem zihinsel hem fiziksel sağlık için önemlidir." },
      { baslik: "Tüy Bakımı", metin: "Uzun tüylü kedileri hergün, kısa tüylüleri haftada 2-3 kez tarayın. Bu hem tüy yutmayı önler hem de sizi kediyle bağlar." },
    ]
  },
  {
    id: 2,
    kategori: "Köpek Bakımı",
    emoji: "🐶",
    renk: "linear-gradient(135deg,#E0F0E8,#8BAF8E)",
    baslik: "Köpeğinizle Güçlü Bir Bağ Kurmanın Sırları",
    ozet: "Köpekler sadık dostlarımızdır. Onlarla derin bir bağ kurmak hem sizin hem de onların hayat kalitesini artırır...",
    icerik: [
      { baslik: "Düzenli Egzersiz Şart", metin: "Köpek ırkına göre günde 30 dakika ile 2 saat arası yürüyüş gerekir. Yetersiz egzersiz yıkıcı davranışlara yol açar." },
      { baslik: "Pozitif Pekiştirme ile Eğitim", metin: "Asla ceza vermeden, ödül bazlı eğitim uygulayın. Köpekler sevildiklerinde ve ödüllendirildiklerinde çok daha hızlı öğrenir." },
      { baslik: "Sosyalleştirme", metin: "Yavru yaştan itibaren farklı insanlar, hayvanlar ve ortamlarla tanıştırın. İyi sosyalleşmiş köpekler daha dengeli ve mutlu olur." },
      { baslik: "Diş Sağlığı", metin: "Haftada en az 2-3 kez köpek diş fırçası ve macunuyla dişlerini fırçalayın. Diş taşı ciddi sağlık sorunlarına yol açabilir." },
      { baslik: "Kaliteli Uyku Alanı", metin: "Köpeğinize ait, rahat ve güvenli bir uyku köşesi oluşturun. Bu ona güvenlik hissi verir ve anksiyeteyi azaltır." },
    ]
  },
  {
    id: 3,
    kategori: "Kızgınlık Dönemleri",
    emoji: "🌸",
    renk: "linear-gradient(135deg,#FFE0F0,#E88AB8)",
    baslik: "Kedi ve Köpeklerde Kızgınlık Dönemi Rehberi",
    ozet: "Evcil hayvanınızın kızgınlık dönemini tanımak ve bu süreçte doğru davranmak hem sizin hem onun için önemlidir...",
    icerik: [
      { baslik: "Kedilerde Kızgınlık (Östrus)", metin: "Dişi kediler genellikle 6-10 ayda ilk kızgınlığa girer. Her 2-3 haftada bir tekrarlar. Sürekli miyavlama, yuvarlanma ve arkasını kaldırma belirtileri görülür." },
      { baslik: "Köpeklerde Kızgınlık", metin: "Dişi köpekler genellikle 6-12 ayda ilk döngüye girer, yılda 2 kez tekrarlar. Vulva şişmesi ve kanlı akıntı başlıca belirtilerdir." },
      { baslik: "Kısırlaştırmanın Önemi", metin: "Kısırlaştırma sahipsiz hayvan nüfusunu azaltır, üreme sistemi kanserlerini önler ve davranış sorunlarını azaltır. Veterinerinizle konuşun." },
      { baslik: "Bu Dönemde Ne Yapmalı", metin: "Kısırlaştırmayacaksanız dişiyi dışarı çıkarmayın. Köpekleri için özel koruyucu kullanabilirsiniz. Kedileri kapalı tutun." },
      { baslik: "Veteriner Danışmanlığı", metin: "En doğru karar için veterinerinizle görüşün. Kısırlaştırma zamanlaması, ırk ve sağlık durumuna göre değişir." },
    ]
  },
  {
    id: 4,
    kategori: "Besleme Önerileri",
    emoji: "🍖",
    renk: "linear-gradient(135deg,#FFF0C0,#F4C04A)",
    baslik: "Evcil Hayvanınıza En Doğru Beslenme Planı",
    ozet: "Doğru beslenme evcil hayvanınızın uzun ve sağlıklı bir yaşam sürmesinin temel taşıdır...",
    icerik: [
      { baslik: "Yaşa Göre Mama Seçimi", metin: "Yavru, yetişkin ve yaşlı hayvanlar farklı besin ihtiyaçlarına sahiptir. Yavru mamalar protein açısından zenginken, yaşlı mamalar eklem sağlığını destekler." },
      { baslik: "Kuru mu Yaş Mama mı?", metin: "Her ikisinin de avantajları vardır. Kuru mama diş sağlığına katkıda bulunur, yaş mama su alımını artırır. İkisini birlikte vermek idealdir." },
      { baslik: "Kesinlikle Verilmemesi Gerekenler", metin: "Çikolata, soğan, sarımsak, üzüm, avokado, alkol ve xylitol içeren yiyecekler hem kedi hem köpekler için zehirlidir." },
      { baslik: "Su Tüketimi", metin: "Kediler çok az su içer, bu böbrek sorunlarına yol açabilir. Çeşme suyu akan su içiciler kullanın. Köpekler günde vücut ağırlığının 50ml/kg suya ihtiyaç duyar." },
      { baslik: "Porsiyon Kontrolü", metin: "Obezite evcil hayvanlarda yaygın bir sorun. Mama paketindeki önerilen miktarlara uyun ve fazla ödül vermekten kaçının." },
    ]
  },
  {
    id: 5,
    kategori: "Sağlık İpuçları",
    emoji: "💊",
    renk: "linear-gradient(135deg,#D8F8F0,#4AB8A0)",
    baslik: "Evcil Hayvanınızı Hasta Etmeden Önce Bilmeniz Gerekenler",
    ozet: "Hastalığı erken teşhis etmek ve önlemek, tedaviden çok daha kolay ve ucuzdur. İşte dikkat etmeniz gereken işaretler...",
    icerik: [
      { baslik: "Hastalık Belirtilerini Tanıyın", metin: "İştahsızlık, letarji, kusma, ishal, aşırı su içme veya idrar yapmama ciddi belirtilerdir. Bu durumları gözlemleyip veterinere bildirin." },
      { baslik: "Parazit Önlemi", metin: "Pire, kene ve iç parazitlere karşı düzenli ilaçlama yapın. Özellikle dışarı çıkan hayvanlarda aylık uygulama önerilir." },
      { baslik: "Aşı Takvimi", metin: "Kediler için kuduz, panleukopeni ve calicivirus aşıları zorunludur. Köpekler için kuduz, distemper, parvo ve hepatit aşıları şarttır." },
      { baslik: "Ağız-Diş Sağlığı", metin: "Kötü ağız kokusu, diş taşı ve dişeti hastalığının belirtisidir. Yıllık diş bakımı ve evde fırçalama hayvan ömrünü uzatır." },
      { baslik: "Acil Durumları Bilin", metin: "Nefes darlığı, bilinç kaybı, aşırı kanama, zehirlenme şüphesi durumunda vakit kaybetmeden acil veterinere gidin." },
    ]
  },
  {
    id: 6,
    kategori: "Eğitim",
    emoji: "🎓",
    renk: "linear-gradient(135deg,#E8E0FF,#9A88E8)",
    baslik: "Köpeğinizi Eğitmenin Temel Prensipleri",
    ozet: "İyi eğitilmiş bir köpek hem daha mutlu hem de daha güvenlidir. Eğitime erken başlamak başarının anahtarıdır...",
    icerik: [
      { baslik: "Otur, Yat, Gel Komutları", metin: "Bu temel komutlar güvenlik için şarttır. Kısa (5-10 dk) ama sık seanslarla çalışın. Her başarıyı anında ödüllendirin." },
      { baslik: "Tuvalet Eğitimi", metin: "Yavru köpekler her 2 saatte bir dışarı çıkarılmalı. Başarılı her tuvalete büyük ödül verin. Kaza olduğunda ceza vermeyin, sessizce temizleyin." },
      { baslik: "Tasma Eğitimi", metin: "Tasmayla yürümeyi küçük yaşta öğretin. Çekerse durun, sizi takip edince ilerleyin. Asla tasmayla sürüklemeyin." },
      { baslik: "Yalnız Kalma Eğitimi", metin: "Köpekler paket hayvanıdır, yalnızlık onları zorlar. Kısa ayrılıklarla başlayarak yavaş yavaş süreyi uzatın. Kong veya bulmaca oyuncaklar yardımcı olur." },
      { baslik: "Kedilerde Eğitim Mümkün mü?", metin: "Evet! Kediler de eğitilebilir. Clicker eğitimi ile otur, beşlik ve hatta tuvalete gitme gibi davranışlar öğretilebilir. Sabır ve ödül şarttır." },
    ]
  },
];

const kategoriler = ["Tümü", "Kedi Bakımı", "Köpek Bakımı", "Kızgınlık Dönemleri", "Besleme Önerileri", "Sağlık İpuçları", "Eğitim"];

const soruKategorileri = ["Kedi Bakımı", "Köpek Bakımı", "Besleme", "Sağlık", "Eğitim", "Diğer"];

export default function Blog() {
  const [aktifKat, setAktifKat] = useState("Tümü");
  const [acikYazi, setAcikYazi] = useState<number | null>(null);
  const [sorular, setSorular] = useState<any[]>([]);
  const [yeniSoru, setYeniSoru] = useState({ ad: "", soru: "", kategori: "Kedi Bakımı" });
  const [soruGonderildi, setSoruGonderildi] = useState(false);
  const [soruYukleniyor, setSoruYukleniyor] = useState(true);

  useEffect(() => {
    supabase.from("blog_sorular")
      .select("*")
      .eq("onaylandi", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setSorular(data || []);
        setSoruYukleniyor(false);
      });
  }, []);

  const soruGonder = async () => {
    if (!yeniSoru.ad.trim() || !yeniSoru.soru.trim()) return;
    await supabase.from("blog_sorular").insert({
      ad: yeniSoru.ad,
      soru: yeniSoru.soru,
      kategori: yeniSoru.kategori,
      onaylandi: false,
    });
    setSoruGonderildi(true);
    setYeniSoru({ ad: "", soru: "", kategori: "Kedi Bakımı" });
  };

  const filtrelenmis = aktifKat === "Tümü" ? blogYazilari : blogYazilari.filter(y => y.kategori === aktifKat);
  const acikYaziDetay = blogYazilari.find(y => y.id === acikYazi);

  return (
    <main style={{ minHeight: "100vh", background: "#FDF6EE", fontFamily: "sans-serif", color: "#2C1A0E" }}>

      <style>{`
        .blog-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 24px; }
        .soru-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .blog-header-pad { padding: 16px 48px; }
        .blog-hero-pad { padding: 60px 48px 40px; }
        .blog-content-pad { padding: 0 48px 60px; }
        @media (max-width: 768px) {
          .blog-grid { grid-template-columns: 1fr !important; gap: 16px; }
          .soru-grid { grid-template-columns: 1fr !important; }
          .blog-header-pad { padding: 13px 16px !important; }
          .blog-hero-pad { padding: 32px 16px 24px !important; }
          .blog-content-pad { padding: 0 16px 80px !important; }
        }
      `}</style>

      {/* Header */}
      <header className="blog-header-pad" style={{ background: "white", borderBottom: "1px solid #E8D5B7", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100 }}>
        <a href="/" style={{ fontFamily: "Georgia,serif", fontSize: 20, fontWeight: 700, color: "#5C3D2E", textDecoration: "none" }}>
          evemama<span style={{ color: "#E8845A", fontStyle: "italic" }}>.net</span>
        </a>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <a href="/urunler" style={{ fontSize: 13, fontWeight: 600, color: "#5C3D2E", opacity: 0.6, textDecoration: "none" }}>Ürünler</a>
          <a href="/sepet" style={{ background: "#5C3D2E", color: "white", padding: "9px 18px", borderRadius: 50, textDecoration: "none", fontSize: 13, fontWeight: 700 }}>🛒 Sepet</a>
        </div>
      </header>

      {/* Detay Modal */}
      {acikYaziDetay && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 500, display: "flex", alignItems: "flex-start", justifyContent: "center", overflowY: "auto", padding: "24px 16px" }}
          onClick={() => setAcikYazi(null)}>
          <div style={{ background: "white", borderRadius: 24, maxWidth: 720, width: "100%", padding: "40px", position: "relative" }}
            onClick={e => e.stopPropagation()}>
            <button onClick={() => setAcikYazi(null)}
              style={{ position: "absolute", top: 16, right: 16, background: "#FDF6EE", border: "none", borderRadius: 50, width: 36, height: 36, fontSize: 18, cursor: "pointer", color: "#5C3D2E" }}>✕</button>
            <div style={{ display: "inline-block", background: "#FFF5F0", color: "#E8845A", fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 50, marginBottom: 16 }}>{acikYaziDetay.kategori}</div>
            <h2 style={{ fontFamily: "Georgia,serif", fontSize: 26, fontWeight: 700, color: "#5C3D2E", marginBottom: 20, lineHeight: 1.3 }}>{acikYaziDetay.baslik}</h2>
            {acikYaziDetay.icerik.map((blok, i) => (
              <div key={i} style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: acikYaziDetay.renk, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{acikYaziDetay.emoji}</div>
                  <h3 style={{ fontFamily: "Georgia,serif", fontSize: 17, fontWeight: 700, color: "#5C3D2E", margin: 0 }}>{blok.baslik}</h3>
                </div>
                <p style={{ fontSize: 15, color: "#5C3D2E", opacity: 0.75, lineHeight: 1.7, margin: 0, paddingLeft: 42 }}>{blok.metin}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hero */}
      <div className="blog-hero-pad" style={{ background: "linear-gradient(135deg,#5C3D2E,#8B5E42)", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🐾</div>
        <h1 style={{ fontFamily: "Georgia,serif", fontSize: 36, fontWeight: 700, color: "white", marginBottom: 12 }}>
          Evcil Dostlar <em style={{ color: "#F4C09A" }}>Rehberi</em>
        </h1>
        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.7)", maxWidth: 560, margin: "0 auto" }}>
          Kedi ve köpeklerinizin bakımı, sağlığı ve mutluluğu için uzman bilgileri ve topluluk deneyimleri
        </p>
      </div>

      {/* Kategori Filtreleri */}
      <div className="blog-content-pad" style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: "28px 0 24px", overflowX: "auto" }}>
          {kategoriler.map((kat, i) => (
            <button key={i} onClick={() => setAktifKat(kat)}
              style={{ padding: "9px 18px", borderRadius: 50, border: `2px solid ${aktifKat === kat ? "#E8845A" : "#E8D5B7"}`, background: aktifKat === kat ? "#E8845A" : "white", color: aktifKat === kat ? "white" : "#5C3D2E", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
              {kat}
            </button>
          ))}
        </div>

        {/* Blog Kartları */}
        <div className="blog-grid">
          {filtrelenmis.map((yazi, i) => (
            <div key={i} style={{ background: "white", borderRadius: 24, overflow: "hidden", boxShadow: "0 4px 20px rgba(92,61,46,0.08)", cursor: "pointer", transition: "transform .2s, box-shadow .2s" }}
              onClick={() => setAcikYazi(yazi.id)}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 16px 40px rgba(92,61,46,0.15)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(92,61,46,0.08)"; }}>
              <div style={{ height: 120, background: yazi.renk, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 56 }}>
                {yazi.emoji}
              </div>
              <div style={{ padding: "20px 22px 24px" }}>
                <div style={{ display: "inline-block", background: "#FFF5F0", color: "#E8845A", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 50, marginBottom: 10 }}>{yazi.kategori}</div>
                <h3 style={{ fontFamily: "Georgia,serif", fontSize: 17, fontWeight: 700, color: "#5C3D2E", marginBottom: 10, lineHeight: 1.35 }}>{yazi.baslik}</h3>
                <p style={{ fontSize: 13, color: "#5C3D2E", opacity: 0.6, lineHeight: 1.6, marginBottom: 16 }}>{yazi.ozet}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#E8845A", fontSize: 13, fontWeight: 700 }}>
                  Devamını Oku <span>→</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Soru-Cevap Bölümü */}
        <div style={{ marginTop: 64 }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <h2 style={{ fontFamily: "Georgia,serif", fontSize: 30, fontWeight: 700, color: "#5C3D2E", marginBottom: 10 }}>
              Topluluk <span style={{ color: "#E8845A", fontStyle: "italic" }}>Soru & Cevap</span>
            </h2>
            <p style={{ fontSize: 15, color: "#5C3D2E", opacity: 0.6 }}>Merak ettiklerinizi sorun, deneyimlerinizi paylaşın</p>
          </div>

          {/* Sorular */}
          {soruYukleniyor ? (
            <div style={{ textAlign: "center", padding: "40px 0", opacity: 0.4 }}>⏳ Yükleniyor...</div>
          ) : sorular.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", background: "white", borderRadius: 20, marginBottom: 32 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
              <div style={{ fontFamily: "Georgia,serif", fontSize: 16, color: "#5C3D2E" }}>Henüz soru yok. İlk soruyu sen sor!</div>
            </div>
          ) : (
            <div className="soru-grid" style={{ marginBottom: 40 }}>
              {sorular.map((s, i) => (
                <div key={i} style={{ background: "white", borderRadius: 20, padding: "22px", boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#F4C09A,#E8845A)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "white", flexShrink: 0 }}>
                        {s.ad[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#5C3D2E" }}>{s.ad}</div>
                        <div style={{ fontSize: 11, color: "#E8845A", fontWeight: 600 }}>{s.kategori}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: "#5C3D2E", opacity: 0.4 }}>
                      {new Date(s.created_at).toLocaleDateString("tr-TR")}
                    </div>
                  </div>
                  <p style={{ fontSize: 14, color: "#5C3D2E", lineHeight: 1.6, marginBottom: s.cevap ? 14 : 0, fontWeight: 600 }}>❓ {s.soru}</p>
                  {s.cevap && (
                    <div style={{ background: "#FFF5F0", borderRadius: 12, padding: "12px 14px", borderLeft: "3px solid #E8845A" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#E8845A", marginBottom: 4 }}>💬 evemama.net Yanıtı</div>
                      <p style={{ fontSize: 13, color: "#5C3D2E", lineHeight: 1.6, margin: 0 }}>{s.cevap}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Soru Formu */}
          <div style={{ background: "linear-gradient(135deg,#F4C09A,#E8D5B7)", borderRadius: 24, padding: "36px 40px" }}>
            <h3 style={{ fontFamily: "Georgia,serif", fontSize: 22, fontWeight: 700, color: "#5C3D2E", marginBottom: 6 }}>
              🐾 Siz de Sorun!
            </h3>
            <p style={{ fontSize: 14, color: "#5C3D2E", opacity: 0.7, marginBottom: 24 }}>
              Evcil dostunuz hakkında merak ettiğiniz her şeyi sorabilirsiniz. Uzman ekibimiz ve topluluk yardımcı olacak!
            </p>
            {soruGonderildi ? (
              <div style={{ background: "#8BAF8E", borderRadius: 16, padding: "20px", textAlign: "center", color: "white" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                <div style={{ fontFamily: "Georgia,serif", fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Sorunuz alındı!</div>
                <div style={{ fontSize: 14, opacity: 0.85 }}>İncelendikten sonra yayınlanacak ve yanıtlanacak.</div>
                <button onClick={() => setSoruGonderildi(false)}
                  style={{ marginTop: 16, background: "white", color: "#5C3D2E", border: "none", borderRadius: 50, padding: "10px 24px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  Başka Soru Sor
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <input placeholder="Adınız *" value={yeniSoru.ad} onChange={e => setYeniSoru({ ...yeniSoru, ad: e.target.value })}
                    style={{ padding: "12px 16px", border: "2px solid rgba(92,61,46,0.15)", borderRadius: 12, fontSize: 14, outline: "none", fontFamily: "inherit", background: "white" }} />
                  <select value={yeniSoru.kategori} onChange={e => setYeniSoru({ ...yeniSoru, kategori: e.target.value })}
                    style={{ padding: "12px 16px", border: "2px solid rgba(92,61,46,0.15)", borderRadius: 12, fontSize: 14, outline: "none", fontFamily: "inherit", background: "white", color: "#5C3D2E", cursor: "pointer" }}>
                    {soruKategorileri.map((k, i) => <option key={i} value={k}>{k}</option>)}
                  </select>
                </div>
                <textarea placeholder="Sorunuzu yazın... *" value={yeniSoru.soru} onChange={e => setYeniSoru({ ...yeniSoru, soru: e.target.value })}
                  rows={4} style={{ padding: "12px 16px", border: "2px solid rgba(92,61,46,0.15)", borderRadius: 12, fontSize: 14, outline: "none", fontFamily: "inherit", background: "white", resize: "vertical" as const }} />
                <button onClick={soruGonder} disabled={!yeniSoru.ad.trim() || !yeniSoru.soru.trim()}
                  style={{ background: !yeniSoru.ad.trim() || !yeniSoru.soru.trim() ? "#ccc" : "#E8845A", color: "white", border: "none", borderRadius: 50, padding: "14px 32px", fontSize: 15, fontWeight: 700, cursor: !yeniSoru.ad.trim() || !yeniSoru.soru.trim() ? "not-allowed" : "pointer", alignSelf: "flex-start", transition: "background .2s" }}>
                  Soruyu Gönder →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobil bottom nav */}
      <style>{`.blog-bottom-nav { display: none; } @media(max-width:768px){ .blog-bottom-nav { display: grid !important; grid-template-columns: repeat(4,1fr); position: fixed; bottom: 0; left: 0; right: 0; z-index: 300; background: rgba(253,246,238,0.97); backdrop-filter: blur(14px); border-top: 1px solid rgba(92,61,46,.08); padding: 8px 0 20px; } }`}</style>
      <nav className="blog-bottom-nav" style={{ display: "none" }}>
        <a href="/" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, textDecoration: "none", padding: 4 }}>
          <span style={{ fontSize: 22 }}>🏠</span><span style={{ fontSize: 10, fontWeight: 600, color: "#5C3D2E", opacity: 0.4 }}>Anasayfa</span>
        </a>
        <a href="/urunler" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, textDecoration: "none", padding: 4 }}>
          <span style={{ fontSize: 22 }}>🛍️</span><span style={{ fontSize: 10, fontWeight: 600, color: "#5C3D2E", opacity: 0.4 }}>Ürünler</span>
        </a>
        <a href="/blog" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, textDecoration: "none", padding: 4 }}>
          <span style={{ fontSize: 22 }}>📝</span><span style={{ fontSize: 10, fontWeight: 600, color: "#E8845A", opacity: 1 }}>Blog</span>
        </a>
        <a href="/sepet" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, textDecoration: "none", padding: 4 }}>
          <span style={{ fontSize: 22 }}>🛒</span><span style={{ fontSize: 10, fontWeight: 600, color: "#5C3D2E", opacity: 0.4 }}>Sepet</span>
        </a>
      </nav>

    </main>
  );
}