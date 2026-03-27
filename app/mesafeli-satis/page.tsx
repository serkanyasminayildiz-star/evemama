export default function MesafeliSatis() {
  return (
    <main style={{ minHeight: "100vh", background: "#FDF6EE", fontFamily: "sans-serif" }}>
      <header style={{ background: "white", padding: "16px 48px", borderBottom: "1px solid #E8D5B7", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <a href="/" style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: "#5C3D2E", textDecoration: "none" }}>evemama<span style={{ color: "#E8845A", fontStyle: "italic" }}>.net</span></a>
      </header>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: 36, fontWeight: 700, color: "#5C3D2E", marginBottom: 8 }}>Mesafeli Satış Sözleşmesi</h1>
        <div style={{ width: 60, height: 4, background: "#E8845A", borderRadius: 2, marginBottom: 8 }} />
        <p style={{ fontSize: 13, color: "#5C3D2E", opacity: 0.5, marginBottom: 40 }}>Son güncelleme tarihi: 01/02/2026</p>
        <div style={{ background: "white", borderRadius: 24, padding: "40px 48px", boxShadow: "0 4px 24px rgba(92,61,46,0.07)" }}>
          {[
            { no: "1", baslik: "TARAFLAR", icerik: "İşbu Sözleşme aşağıdaki taraflar arasında aşağıda belirtilen hüküm ve şartlar çerçevesinde imzalanmıştır.\n\nALICI: Sözleşmede bundan sonra 'ALICI' olarak anılacaktır.\n\nSATICI: TNB PET MAMALARI VE AKSESUARLARI İTHALAT İHRACAT SANAYİ TİCARET LİMİTED ŞİRKETİ" },
            { no: "2", baslik: "TANIMLAR", icerik: "KANUN: 6502 sayılı Tüketicinin Korunması Hakkında Kanun'u,\nYÖNETMELİK: Mesafeli Sözleşmeler Yönetmeliği'ni (RG:27.11.2014/29188)\nSATICI: Ticari veya mesleki faaliyetleri kapsamında tüketiciye mal sunan şirketi,\nALICI: Bir mal veya hizmeti ticari veya mesleki olmayan amaçlarla edinen gerçek ya da tüzel kişiyi ifade eder." },
            { no: "3", baslik: "KONU", icerik: "İşbu Sözleşme, ALICI'nın, SATICI'ya ait internet sitesi üzerinden elektronik ortamda siparişini verdiği ürünün satışı ve teslimi ile ilgili olarak 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmelere Dair Yönetmelik hükümleri gereğince tarafların hak ve yükümlülüklerini düzenler." },
            { no: "4", baslik: "SATICI BİLGİLERİ", icerik: "Ünvanı: TNB PET MAMALARI VE AKSESUARLARI İTHALAT İHRACAT SANAYİ TİCARET LİMİTED ŞİRKETİ\nAdres: ATİLLA MAH 349. SOK NO: 55 İÇ KAPI NO: A KONAK/İZMİR\nVergi No: 9381208717\nTelefon: +90 552 090 80 01\nE-posta: info@evemama.net" },
            { no: "9", baslik: "GENEL HÜKÜMLER", icerik: "9.1. ALICI, SATICI'ya ait internet sitesinde sözleşme konusu ürünün temel nitelikleri, satış fiyatı ve ödeme şekli ile teslimata ilişkin ön bilgileri okuyup, bilgi sahibi olduğunu kabul eder.\n\n9.2. Sözleşme konusu her bir ürün, 30 günlük yasal süreyi aşmamak kaydı ile ALICI'nın yerleşim yeri uzaklığına bağlı olarak belirtilen süre zarfında teslim edilir.\n\n9.5. SATICI, sipariş konusu ürün veya hizmetin yerine getirilmesinin imkânsızlaşması halinde, bu durumu 3 gün içinde yazılı olarak tüketiciye bildirecek ve 14 günlük süre içinde toplam bedeli iade edecektir." },
            { no: "10", baslik: "CAYMA HAKKI", icerik: "ALICI; mesafeli sözleşmenin mal satışına ilişkin olması durumunda, ürünün teslim tarihinden itibaren 14 (on dört) gün içerisinde, SATICI'ya bildirmek şartıyla hiçbir hukuki ve cezai sorumluluk üstlenmeksizin sözleşmeden cayma hakkını kullanabilir.\n\nCayma hakkının kullanılması için 14 günlük süre içinde SATICI'ya iadeli taahhütlü posta, faks veya e-posta ile yazılı bildirimde bulunulması şarttır." },
            { no: "11", baslik: "CAYMA HAKKI KULLANILAMAYACAK ÜRÜNLER", icerik: "Tüketicinin isteği veya kişisel ihtiyaçları doğrultusunda hazırlanan ürünler, çabuk bozulma tehlikesi olan veya son kullanma tarihi geçme ihtimali olan mallar, teslim edilmesinin ardından ambalajı açıldığı takdirde iade edilmesi sağlık ve hijyen açısından uygun olmayan ürünler için cayma hakkı kullanılamaz." },
            { no: "13", baslik: "YETKİLİ MAHKEME", icerik: "İşbu sözleşmeden doğan uyuşmazlıklarda şikayet ve itirazlar, tüketicinin yerleşim yerinin bulunduğu veya tüketici işleminin yapıldığı yerdeki tüketici sorunları hakem heyetine veya tüketici mahkemesine yapılacaktır." },
            { no: "14", baslik: "YÜRÜRLÜK", icerik: "ALICI, Site üzerinden verdiği siparişe ait ödemeyi gerçekleştirdiğinde işbu sözleşmenin tüm şartlarını kabul etmiş sayılır." },
          ].map((item) => (
            <div key={item.no} style={{ marginBottom: 28 }}>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: "#5C3D2E", marginBottom: 10 }}>{item.no}. {item.baslik}</h2>
              <p style={{ fontSize: 15, color: "#5C3D2E", opacity: 0.75, lineHeight: 1.8, whiteSpace: "pre-line" }}>{item.icerik}</p>
            </div>
          ))}
        </div>
      </div>
      <footer style={{ background: "#2C1A0E", padding: "32px 48px", textAlign: "center" }}>
        <div style={{ fontSize: 13, color: "#FDF6EE", opacity: 0.3 }}>© 2025 evemama.net — Tüm hakları saklıdır.</div>
      </footer>
    </main>
  );
}