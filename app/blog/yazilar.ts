// Blog makaleleri — TEK KAYNAK. Hem /blog index (kartlar) hem /blog/[slug]
// (server-render makale sayfaları) hem sitemap buradan okur.
//
// NEDEN AYRI MODÜL: Eskiden makaleler app/blog/page.tsx içinde ("use client")
// statik array'di ve MODAL'da açılıyordu → her makalenin ayrı URL'i yoktu,
// tam metin başlangıç HTML'inde değildi → Google tek tek makaleleri indeksleyemiyordu.
// Veriyi server-importable modüle alınca gerçek /blog/[slug] sayfaları üretilebiliyor
// (metadata + JSON-LD + içerik server-render → organik trafik).
//
// urunLinkleri: her makaleden İLGİLİ kategoriye iç link (içerik → satış funnel'i).
// Slug'lar canlı sitemap'ten doğrulanmıştır.

export type IcerikBlok = { baslik: string; metin: string };
export type UrunLink = { etiket: string; href: string };
export type BlogYazi = {
  id: number;
  slug: string;
  kategori: string;
  emoji: string;
  renk: string;
  baslik: string;
  ozet: string;
  icerik: IcerikBlok[];
  urunLinkleri: UrunLink[];
};

export const blogYazilari: BlogYazi[] = [
  {
    id: 1,
    slug: "kedi-bakimi-10-altin-kural",
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
    ],
    urunLinkleri: [
      { etiket: "Kedi Kuru Maması", href: "/kategori/kedi-kuru-mamasi" },
      { etiket: "Kedi Kumu", href: "/kategori/kedi-kumu" },
      { etiket: "Kedi Oyuncakları", href: "/kategori/kedi-oyuncaklari" },
    ],
  },
  {
    id: 2,
    slug: "kopekle-guclu-bag-kurmanin-sirlari",
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
    ],
    urunLinkleri: [
      { etiket: "Köpek Kuru Maması", href: "/kategori/kopek-kuru-mamasi" },
      { etiket: "Köpek Oyuncakları", href: "/kategori/kopek-oyuncaklari" },
      { etiket: "Köpek Ödülleri", href: "/kategori/kopek-odul" },
    ],
  },
  {
    id: 3,
    slug: "kedi-kopek-kizginlik-donemi-rehberi",
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
    ],
    urunLinkleri: [
      { etiket: "Kısır Kedi Maması", href: "/kategori/kedi-kuru-kisir" },
      { etiket: "Kısır Köpek Maması", href: "/kategori/kopek-kuru-kisir" },
      { etiket: "Köpek Dönem Külodu", href: "/kategori/kopek-donem-kilot" },
    ],
  },
  {
    id: 4,
    slug: "evcil-hayvan-beslenme-plani",
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
    ],
    urunLinkleri: [
      { etiket: "Kedi Kuru Maması", href: "/kategori/kedi-kuru-mamasi" },
      { etiket: "Köpek Kuru Maması", href: "/kategori/kopek-kuru-mamasi" },
      { etiket: "Kedi Konserve Maması", href: "/kategori/kedi-konserve-mamasi" },
    ],
  },
  {
    id: 5,
    slug: "evcil-hayvan-saglik-ipuclari",
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
    ],
    urunLinkleri: [
      { etiket: "Kedi Özel Beslenme", href: "/kategori/kedi-ozel-beslenme" },
      { etiket: "Köpek Özel Beslenme", href: "/kategori/kopek-ozel-beslenme" },
      { etiket: "Hipoalerjenik Kedi Maması", href: "/kategori/kedi-kuru-hipo" },
    ],
  },
  {
    id: 6,
    slug: "kopek-egitimi-temel-prensipler",
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
    ],
    urunLinkleri: [
      { etiket: "Köpek Bakım & Eğitim", href: "/kategori/kopek-bakim-egitim" },
      { etiket: "Köpek Ödülleri", href: "/kategori/kopek-odul" },
      { etiket: "Kedi Ödül Maması", href: "/kategori/kedi-odul-mamasi" },
    ],
  },
];

export function yaziBul(slug: string): BlogYazi | undefined {
  return blogYazilari.find((y) => y.slug === slug);
}
