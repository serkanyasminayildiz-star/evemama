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
  {
    id: 7,
    slug: "yavru-kedi-mamasi-nasil-secilir",
    kategori: "Besleme Önerileri",
    emoji: "🐱",
    renk: "linear-gradient(135deg,#FFF0E0,#F4C09A)",
    baslik: "Yavru Kedi Maması Nasıl Seçilir? (Kapsamlı Rehber)",
    ozet: "Yavru kedinizin sağlıklı büyümesi doğru mamayla başlar. Protein, DHA, porsiyon ve yetişkin mamaya geçiş hakkında bilmeniz gereken her şey.",
    icerik: [
      { baslik: "Neden Yavruya Özel Mama?", metin: "Yavru kediler yetişkinlere göre kilogram başına çok daha fazla enerji ve protein harcar. Yavru (kitten) mamaları bu hızlı büyümeyi desteklemek için daha yüksek protein, kalori ve kalsiyum içerir. Yetişkin maması yavrunun gelişim ihtiyacını karşılayamaz." },
      { baslik: "Protein ve DHA Bileşenine Bakın", metin: "İçerik listesinde ilk sırada gerçek bir et kaynağı (tavuk, somon) bulunmalı. DHA (bir omega-3 türü) beyin ve görme gelişimini destekler; kaliteli yavru mamalarında aranan bir bileşendir. Tahıl ya da et yan ürünlerinin başta geldiği mamalardan kaçının." },
      { baslik: "Kuru ve Yaş Mama Dengesi", metin: "Kuru mama pratiktir ve diş sağlığına katkı sağlar; yaş mama ise su alımını artırır ve iştahsız yavrular için daha caziptir. İkisini birlikte sunmak hem beslenme hem hidrasyon açısından idealdir." },
      { baslik: "Porsiyon ve Öğün Sayısı", metin: "Yavrular küçük mideleri nedeniyle günde 3-4 öğün yemelidir. Paket üzerindeki yaşa ve kiloya göre tabloyu izleyin, taze suyu her zaman hazır bulundurun. Sınırsız serbest besleme yerine ölçülü öğünleri tercih edin." },
      { baslik: "Ne Zaman Yetişkin Mamasına Geçilir?", metin: "Çoğu kedi 12 aylıkken yetişkin mamasına geçebilir. Geçişi 7-10 güne yayın: eski mamaya yenisini kademeli olarak karıştırın. Ani değişiklik sindirim sorunlarına yol açabilir." },
    ],
    urunLinkleri: [
      { etiket: "Yavru Kedi Kuru Maması", href: "/kategori/kedi-kuru-yavru" },
      { etiket: "Yavru Kedi Konservesi", href: "/kategori/kedi-konserve-yavru" },
      { etiket: "Tüm Yavru Kedi Mamaları", href: "/kategori/yavru-kedi-mamalari-32" },
    ],
  },
  {
    id: 8,
    slug: "kisirlastirilmis-kedi-mama-secimi",
    kategori: "Besleme Önerileri",
    emoji: "⚖️",
    renk: "linear-gradient(135deg,#E0F0E8,#8BAF8E)",
    baslik: "Kısırlaştırılmış Kedi Neden Kilo Alır? Doğru Mama Seçimi",
    ozet: "Kısırlaştırma sonrası kediler kolayca kilo alır. Bunun nedeni ve doğru kısır kedi maması ile ideal kiloyu korumanın pratik yolları.",
    icerik: [
      { baslik: "Kısırlaştırma Metabolizmayı Değiştirir", metin: "Kısırlaştırma sonrası kedinin enerji ihtiyacı belirgin biçimde düşerken iştahı artar. Önlem alınmazsa bu kombinasyon hızlı kilo alımına ve obeziteye yol açar." },
      { baslik: "Kısır Mamasının Farkı Nedir?", metin: "Sterilised (kısır) mamalar daha düşük yağ ve kalori ama yüksek protein içerir; böylece kas kütlesi korunurken kilo kontrol altında tutulur. Bazıları yağ yakımını destekleyen L-karnitin gibi bileşenler içerir." },
      { baslik: "Porsiyonu Azaltın ama Aç Bırakmayın", metin: "Lif oranı yüksek kısır mamaları tokluk hissi vererek kedinin daha az kaloriyle doymasını sağlar. Paketin kısır kedilere özel porsiyon önerisini izleyin; eski porsiyonu sürdürmek kilo aldırır." },
      { baslik: "İdrar Yolu Sağlığına Dikkat", metin: "Kısırlaştırılmış kediler idrar yolu ve taş sorunlarına daha yatkındır. Dengeli mineral içerikli mamalar ve bol su alımı (yaş mama ve su kaynağı) bu riski azaltmaya yardımcı olur." },
      { baslik: "Kiloyu Düzenli Takip Edin", metin: "Ayda bir tartın ve kaburgaları kalın yağ tabakası olmadan hissedip hissetmediğinizi kontrol edin. Küçük porsiyon ayarları büyük fark yaratır; kararsız kaldığınızda veterinerinize danışın." },
    ],
    urunLinkleri: [
      { etiket: "Kısır Kedi Kuru Maması", href: "/kategori/kedi-kuru-kisir" },
      { etiket: "Kısır Kedi Konservesi", href: "/kategori/kedi-konserve-kisir" },
      { etiket: "Light Kedi Konservesi", href: "/kategori/kedi-konserve-light" },
    ],
  },
  {
    id: 9,
    slug: "tahilsiz-mama-fayda-zarar",
    kategori: "Besleme Önerileri",
    emoji: "🌾",
    renk: "linear-gradient(135deg,#FFF0C0,#F4C04A)",
    baslik: "Tahılsız Mama Gerçekten Daha mı İyi? Dengeli Bir Bakış",
    ozet: "Tahılsız mama herkes için daha mı sağlıklı? Faydaları, yaygın mitler ve köpeklerde tartışılan kalp sağlığı konusu hakkında doğru bilgi.",
    icerik: [
      { baslik: "Tahılsız (Grain-Free) Ne Demek?", metin: "Tahılsız mamalar buğday, mısır ve pirinç gibi tahılları içermez; karbonhidrat kaynağı olarak genellikle patates, bezelye veya baklagiller kullanılır. Tahılsız olması mamanın otomatik olarak düşük karbonhidratlı olduğu anlamına gelmez." },
      { baslik: "Kimler İçin Uygun?", metin: "Tahıl hassasiyeti olan ve kaşıntı ya da kronik sindirim sorunu yaşayan hayvanlar tahılsız mamadan fayda görebilir. Ancak gerçek tahıl alerjisi sanılandan nadirdir; besin alerjilerinin çoğu protein kaynaklıdır." },
      { baslik: "Tahıl Sadece Dolgu Madde mi?", metin: "Yaygın inanışın aksine, kaliteli tahıllar sindirilebilir enerji, lif ve besin sağlar; değersiz bir dolgu değildir. Sağlıklı bir hayvan için kaliteli ve tahıl içeren bir mama da mükemmel bir seçimdir." },
      { baslik: "Köpeklerde Kalp Sağlığı Tartışması", metin: "ABD Gıda ve İlaç Dairesi (FDA), bazı tahılsız ve baklagil ağırlıklı köpek mamaları ile bir kalp hastalığı (DCM) arasında olası bir bağ üzerine inceleme yürüttü; sonuç kesinleşmedi. Köpeğinizi tahılsıza geçirmeden önce veterinerinize danışmanız önerilir." },
      { baslik: "Nasıl Doğru Seçilir?", metin: "Etiketi okuyun: ilk sırada isimlendirilmiş bir et kaynağı bulunsun ve tam ve dengeli ibaresi yer alsın. Tahılsız tercih edecekseniz protein çeşitliliği yüksek, baklagil ağırlığı dengeli ürünleri seçin." },
    ],
    urunLinkleri: [
      { etiket: "Tahılsız Kedi Maması", href: "/kategori/kedi-kuru-tahilsiz" },
      { etiket: "Tahılsız Köpek Maması", href: "/kategori/kopek-kuru-tahilsiz" },
    ],
  },
  {
    id: 10,
    slug: "kopek-mama-miktari-porsiyon",
    kategori: "Besleme Önerileri",
    emoji: "🍖",
    renk: "linear-gradient(135deg,#FFE0D0,#E8845A)",
    baslik: "Köpeğinize Günde Ne Kadar Mama Vermelisiniz?",
    ozet: "Köpek mama miktarı kilo, yaş ve aktiviteye göre değişir. Porsiyon mantığını, öğün sayısını ve aşırı kilonun işaretlerini öğrenin.",
    icerik: [
      { baslik: "Porsiyonu Ne Belirler?", metin: "Günlük mama miktarı köpeğin kilosuna, yaşına, aktivite düzeyine ve mamanın kalori yoğunluğuna göre değişir. Aynı kiloda iki köpekten hareketli olanın ihtiyacı, sakin olandan daha fazladır." },
      { baslik: "Paket Tablosunu Doğru Okuyun", metin: "Her kaliteli mamanın arkasında kiloya göre günlük gram tablosu vardır ve başlangıç noktanız burasıdır. Bu değer günlük toplamı verir; öğün sayısına bölerek dağıtın." },
      { baslik: "Yaşa Göre İhtiyaç", metin: "Yavrular büyüme için kiloya oranla daha fazla, yaşlı ve sakin köpekler ise daha az kalori ister. Yaşam evresine uygun mama (yavru, yetişkin, yaşlı) seçmek porsiyon ayarını kolaylaştırır." },
      { baslik: "Günde Kaç Öğün?", metin: "Yetişkin köpekler genellikle günde 2 öğün, yavrular 3-4 öğün yer. Düzenli saatlerde besleme sindirimi ve tuvalet düzenini kolaylaştırır. Bazı büyük ırklarda tek seferde çok fazla mama mide riski yaratabilir." },
      { baslik: "Aşırı Kiloyu Erken Fark Edin", metin: "Köpeğin belini üstten görebilmeli, kaburgalarını kalın yağ tabakası olmadan hissedebilmelisiniz. Bel hattı kaybolduysa porsiyonu bir miktar azaltıp ödülleri kısın; kararsız kaldığınızda veterinerinize danışın." },
    ],
    urunLinkleri: [
      { etiket: "Köpek Kuru Maması", href: "/kategori/kopek-kuru-mamasi" },
      { etiket: "Yavru Köpek Maması", href: "/kategori/kopek-kuru-yavru" },
      { etiket: "Yaşlı Köpek Maması", href: "/kategori/kopek-kuru-yasli" },
    ],
  },
  {
    id: 11,
    slug: "hipoalerjenik-kedi-mamasi-rehberi",
    kategori: "Sağlık İpuçları",
    emoji: "🐾",
    renk: "linear-gradient(135deg,#D8F8F0,#4AB8A0)",
    baslik: "Alerjili Kediler İçin Hipoalerjenik Mama Rehberi",
    ozet: "Sürekli kaşınan, kusan veya ishal olan kedinizde besin alerjisi olabilir. Hipoalerjenik mama nedir, nasıl seçilir ve eliminasyon diyeti nasıl yapılır?",
    icerik: [
      { baslik: "Besin Alerjisinin Belirtileri", metin: "Kaşıntı (özellikle yüz ve boyun bölgesinde), tüy dökülmesi, kronik kusma veya ishal besin alerjisine işaret edebilir. Belirtiler mevsimden bağımsız ve süreklilik gösteriyorsa gıda kaynaklı olma olasılığı artar." },
      { baslik: "En Yaygın Alerjenler", metin: "Kedilerde besin alerjileri çoğunlukla belirli protein kaynaklarına (tavuk, sığır, balık, süt ürünleri) karşı gelişir; tahıla karşı değil. Bu yüzden etiketteki protein kaynağı kritik öneme sahiptir." },
      { baslik: "Hipoalerjenik ve Hidrolize Mama Nedir?", metin: "Hipoalerjenik mamalar ya yeni ve tekli bir protein (ördek, geyik gibi) ya da hidrolize protein (alerji tetiklemeyecek kadar küçük parçalara ayrılmış) kullanır. Amaç, bağışıklık sisteminin tepki vermesini engellemektir." },
      { baslik: "Eliminasyon Diyeti (Veteriner Eşliğinde)", metin: "Alerjeni tespit etmek için 8-12 hafta boyunca tek protein kaynaklı mama verilir ve belirtilerin geçip geçmediği izlenir. Bu süreç veteriner gözetiminde yapılmalı, arada başka yiyecek veya ödül verilmemelidir." },
      { baslik: "Mama Geçişini Yavaş Yapın", metin: "Yeni mamaya 7-10 günde kademeli geçin; hassas sindirimli kedilerde ani değişim sorunu artırır. Geçiş sonrası belirtiler düzelmezse veterinerinizle ileri tetkikleri konuşun." },
    ],
    urunLinkleri: [
      { etiket: "Hipoalerjenik Kedi Maması", href: "/kategori/kedi-kuru-hipo" },
      { etiket: "Kedi Özel Beslenme", href: "/kategori/kedi-ozel-beslenme" },
    ],
  },
  {
    id: 12,
    slug: "acik-mama-guvenli-mi-rehberi",
    kategori: "Beslenme",
    emoji: "🥩",
    renk: "linear-gradient(135deg,#FFE8D0,#E8845A)",
    baslik: "Açık Mama Güvenli mi? Açık Mama Alırken Dikkat Edilmesi Gerekenler",
    ozet: "Açık mama alırken 'sahte mi, bayat mı, SKT'si geçmiş mi?' diye tereddüt mü ediyorsunuz? Açık mama nedir, güvenli mi, orijinal nasıl anlaşılır ve alırken nelere dikkat etmeli — hepsi bu rehberde.",
    icerik: [
      { baslik: "Açık Mama Nedir?", metin: "Açık mama, büyük orijinal çuvallardan tartılarak istediğiniz kiloda (örneğin 1 kg) satın alabileceğiniz mamadır. Hazır poşet paketler yerine mamayı ihtiyacınız kadar almanızı sağlar. Özellikle Royal Canin gibi premium markaları küçük miktarda denemek ya da bütçeyi yormadan düzenli almak isteyenler için idealdir." },
      { baslik: "Açık Mama Güvenli mi?", metin: "Açık mamanın kendisi güvensiz değildir; güvenliği tamamen satıcıya bağlıdır. Orijinal ürünün bölünmesiyle, hijyenik koşullarda ve taze şekilde hazırlanan açık mama tamamen güvenlidir. Risk; mamanın nereden geldiğinin ve ne zaman paketlendiğinin bilinmemesinden doğar. Bu yüzden açık mamayı orijinallik ve SKT garantisi veren, iade hakkı sunan satıcılardan almak şarttır." },
      { baslik: "Orijinal Açık Mama Nasıl Anlaşılır?", metin: "Orijinal açık mamada tanenin rengi, kokusu ve boyutu markanın standardına uyar. Küflü, yağlanmış, tozlu veya kötü kokulu görünüm taklit ya da bayat ürüne işarettir. Satıcının hangi orijinal üründen böldüğünü açıkça belirtmesi, fatura kesmesi ve garanti/iade sunması en önemli güven işaretleridir." },
      { baslik: "Son Kullanma Tarihi (SKT) Neden Önemli?", metin: "Mama zamanla yağlarını okside eder; SKT'si yakın veya geçmiş mama hem besin değerini kaybeder hem de sindirim sorunlarına yol açabilir. Açık mama alırken mutlaka son kullanma tarihini sorun. evemama.net'te gönderdiğimiz tüm açık mamalar minimum 2027 SKT'lidir; bayat ürün göndermeyiz." },
      { baslik: "Açık Mama Alırken Dikkat Edilmesi Gerekenler", metin: "1) Satıcının orijinallik ve SKT garantisi verip vermediğini sorun. 2) Mamanın hangi markanın hangi ürünü olduğunu öğrenin (örn. Royal Canin Maxi Adult). 3) Taze ve hijyenik paketlendiğinden emin olun. 4) İade hakkı olup olmadığını kontrol edin. 5) Gerçekçi olmayan ucuz fiyatlara şüpheyle yaklaşın — orijinal ürünün belli bir maliyeti vardır." },
      { baslik: "Açık Mama Kimler İçin Mantıklı?", metin: "Yeni bir markayı küçük miktarla denemek isteyenler, tek kedisi veya köpeği olup büyük çuvalı bitiremeyenler ve premium mamayı bütçe dostu şekilde almak isteyenler için açık mama idealdir. evemama.net'te Royal Canin açık kedi maması ve açık köpek maması çeşitlerini istediğiniz kiloda, %100 orijinal ve 14 gün şartsız iade güvencesiyle bulabilirsiniz." },
    ],
    urunLinkleri: [
      { etiket: "Açık Mamalar", href: "/kategori/acik-mamalar" },
      { etiket: "Açık Kedi Mamaları", href: "/kategori/acik-kedi-mamalari" },
      { etiket: "Açık Köpek Mamaları", href: "/kategori/acik-kopek-mamalari" },
    ],
  },
  {
    id: 13,
    slug: "sahte-royal-canin-nasil-anlasilir",
    kategori: "Güvenli Alışveriş",
    emoji: "🛡️",
    renk: "linear-gradient(135deg,#E1F3E4,#8BAF8E)",
    baslik: "Sahte Royal Canin Nasıl Anlaşılır? Orijinal Mamayı Ayırt Etmenin 6 Yolu",
    ozet: "Piyasada orijinalin biraz altına satılan sahte/taklit mamalar dostunuzun sağlığını riske atar. Sahte Royal Canin nasıl anlaşılır, orijinal mamayı nasıl ayırt edersiniz ve neden 'en ucuz' her zaman en iyi değildir — bu rehberde.",
    icerik: [
      { baslik: "Neden Sahte Mama Tehlikeli?", metin: "Sahte ya da taklit mamalar ucuz görünür ama içeriği denetimsizdir: yanlış besin değerleri, bozuk veya son kullanma tarihi geçmiş hammadde, hatalı saklama. Bu da dostunuzda kusma, ishal, kilo kaybı, tüy dökülmesi, hatta uzun vadede böbrek ve karaciğer sorunlarına yol açabilir. Birkaç yüz lira 'tasarruf', veteriner faturası ve en kötüsü dostunuzun sağlığı olarak geri döner. İşte sahteyi orijinalden ayırmanın 6 somut yolu." },
      { baslik: "1) Resmi İthalatçı Bandrolü Var mı?", metin: "Orijinal ürünlerde, resmi ithalatçının/distribütörün işletme kayıt numarasını içeren bandrol/etiket bulunur. Bu, ürünün yasal yollarla ithal edildiğini gösterir — kaçak ya da merdiven altı değil. Bandrolü olmayan, kaynağı belirsiz ürünlerden uzak durun." },
      { baslik: "2) Hologram ve QR Doğrulaması (En Güçlü Kanıt)", metin: "Royal Canin ürünlerinde üreticinin kendi hologram + QR doğrulama etiketi vardır. Royal Canin Up uygulamasını indirip hologramı kaldırır ve QR kodu okutursanız, ürünün orijinal olup olmadığını saniyeler içinde üreticinin kendi sisteminden teyit edebilirsiniz. Bu, satıcının sözüne değil doğrudan markanın kendisine dayanan en güçlü kanıttır." },
      { baslik: "3) Ambalaj ve Baskı Kalitesi", metin: "Orijinal ambalajda baskı nettir, renkler canlıdır, yazılar düzgündür. Silik, bulanık veya yamuk yazılar; yazım hataları; farklı yazı tipleri ve özensiz dikiş/yapıştırma taklit ürüne işarettir. Ambalajın sağlamlığına ve baskı kalitesine dikkat edin." },
      { baslik: "4) Fiyat Çok mu Düşük?", metin: "Orijinal ürünün belli bir maliyeti vardır. Bir ürün piyasanın çok altındaysa bu bir 'fırsat' değil, uyarı işareti olabilir. Sahteciler tam da bu yüzden fiyatı düşük tutar. 'Neden bu kadar ucuz?' sorusunu mutlaka sorun — birkaç yüz liralık fark, dostunuzun sağlığına mal olmasın." },
      { baslik: "5) Satıcı Fatura Veriyor mu?", metin: "Faturalı satış; ürünün kaynağının belli, izlenebilir ve garantili olduğunu gösterir. Fatura vermeyen satıcı, bir sorun çıktığında muhatap bulamayacağınız anlamına gelir. Her zaman faturalı satış yapan satıcıları tercih edin." },
      { baslik: "6) Orijinallik Garantisi Var mı?", metin: "Güvenilir satıcı, orijinallik konusunda yazılı garanti verir. evemama.net'te tüm ürünler %100 orijinal, bandrollü ve faturalıdır; ürünü teslim alırken hologram + QR ile orijinalliğini kendiniz doğrulayabilirsiniz. Bizim sözümüze güvenmek zorunda değilsiniz — markanın kendi uygulamasıyla teyit edersiniz; orijinal değilse ürün bedelini tam iade ediyoruz." },
    ],
    urunLinkleri: [
      { etiket: "Orijinallik Garantisi", href: "/orijinallik-garantisi" },
      { etiket: "Tüm Ürünler", href: "/urunler" },
      { etiket: "Royal Canin Açık Mama", href: "/kategori/acik-mamalar" },
    ],
  },
];

export function yaziBul(slug: string): BlogYazi | undefined {
  return blogYazilari.find((y) => y.slug === slug);
}
