const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  'https://curbhyfhyanwqtduegng.supabase.co',
  'sb_publishable_ROoBDJwZlhUBdH-YVyP4Cg_WLTyAc3_'
);

const kategoriEslestir = {
  'Kedi>Kedi Kuru Maması>Yetişkin Kedi Maması / 1-7 Yaş': 'kedi-kuru-yetiskin',
  'Kedi>Kedi Kuru Maması>Yavru Kedi Mamaları': 'kedi-kuru-yavru',
  'Kedi>Kedi Kuru Maması>Kısırlaştırılmış Kedi Maması': 'kedi-kuru-kisir',
  'Kedi>Kedi Kuru Maması>Tahılsız Kedi Maması': 'kedi-kuru-tahilsiz',
  'Kedi>Kedi Kuru Maması>Hipoalerjenik Kedi Maması': 'kedi-kuru-hipo',
  'Kedi>Kedi Kuru Maması>Light Kedi Maması': 'kedi-kuru-light',
  'Kedi>Kedi Kuru Maması>Yaşlı Kedi Maması / +7 Yaş': 'kedi-kuru-yasli',
  'Kedi>Kedi Kuru Maması>Özel Irk Kedi Maması': 'kedi-kuru-ozel-irk',
  'Kedi>Kedi Konserve Maması>Yetişkin Kedi Konservesi': 'kedi-konserve-yetiskin',
  'Kedi>Kedi Konserve Maması>Yavru Kedi Konservesi': 'kedi-konserve-yavru',
  'Kedi>Kedi Konserve Maması>Kısırlaştırılmış Kedi Konservesi': 'kedi-konserve-kisir',
  'Kedi>Kedi Konserve Maması>Light Kedi Konservesi': 'kedi-konserve-light',
  'Kedi>Kedi Konserve Maması>Yaşlı Kedi Konservesi': 'kedi-konserve-yasli',
  'Kedi>Kedi Ödül Maması>Kedi Ödül Mamaları': 'kedi-odul-genel',
  'Kedi>Kedi Ödül Maması>Özel Beslenme Ürünleri': 'kedi-ozel-beslenme',
  'Kedi>Kedi Kumu>Bentonit Kedi Kumu': 'kedi-kumu-bentonit',
  'Kedi>Kedi Kumu>Kristal Kedi Kumu': 'kedi-kumu-kristal',
  'Kedi>Kedi Kumu': 'kedi-kumu',
  'Kedi>kedi Oyuncakları': 'kedi-oyuncaklari',
  'Kedi>Diğer Ürünler': 'kedi-diger',
  'Köpek>Köpek Kuru Maması>Yetişkin Köpek Maması': 'kopek-kuru-yetiskin',
  'Köpek>Köpek Kuru Maması>Yavru Köpek Maması': 'kopek-kuru-yavru',
  'Köpek>Köpek Kuru Maması>Kısır Köpek Maması': 'kopek-kuru-kisir',
  'Köpek>Köpek Kuru Maması>Tahılsız Köpek Maması': 'kopek-kuru-tahilsiz',
  'Köpek>Köpek Kuru Maması>Hipoalerjenik Köpek Maması': 'kopek-kuru-hipo',
  'Köpek>Köpek Kuru Maması>Light Köpek Maması': 'kopek-kuru-light',
  'Köpek>Köpek Kuru Maması>Yaşlı Köpek Maması': 'kopek-kuru-yasli',
  'Köpek>Köpek Kuru Maması>Özel Irk Köpek Maması': 'kopek-kuru-ozel-irk',
  'Köpek>Köpek Kuru Maması': 'kopek-kuru-mamasi',
  'Köpek>Köpek Konserve Maması>Yetişkin Köpek Maması': 'kopek-konserve-yetiskin',
  'Köpek>Köpek Konserve Maması>Yavru Köpek Maması': 'kopek-konserve-yavru',
  'Köpek>Köpek Konserve Maması>Yaşlı Köpek Maması': 'kopek-konserve-yasli',
  'Köpek>Köpek Ödül ve Kemikleri>Köpek Ödülleri': 'kopek-odul',
  'Köpek>Köpek Ödül ve Kemikleri>Köpekler için Kemik Çeşitleri': 'kopek-kemik',
  'Köpek>Köpek Ödül ve Kemikleri>Ödül Bisküvileri': 'kopek-biskuvi',
  'Köpek>Köpek Ödül ve Kemikleri>Özel Beslenme Çeşitleri': 'kopek-ozel-beslenme',
  'Köpek>Köpek Ödül ve Kemikleri': 'kopek-odul-kemik',
  'Köpek>Köpek Oyuncakları>Top ve Diğer Oyuncaklar': 'kopek-oyuncaklari',
  'Köpek>Köpek Aksesuarları': 'kopek-aksesuarlari',
  'Köpek>Köpek Bakım ve Eğitim Ürünleri>Köpek Bakım Ve Temizlik Ürünleri': 'kopek-bakim-temizlik',
  'Kıyafet>Kedi Kıyafetleri>Kedi Kıyafetleri': 'kedi-kiyafet',
  'Kıyafet>Köpek Kıyafetleri': 'kopek-kiyafet',
  'Kıyafet>Köpek Kıyafetleri>Dönem Kilotları': 'kopek-donem-kilot',
  'Kampanyalar': 'kampanyalar',
  'En Çok Satanlar': 'en-cok-satanlar',
};

async function kategorileriAktar() {
  console.log('📂 CSV okunuyor...');

  const csvContent = fs.readFileSync(
    path.join(process.cwd(), 'scripts', 'urunler.csv'), 'utf-8'
  );

  const { data: tumKategoriler } = await supabase.from('kategoriler').select('*');
  const kategoriMap = {};
  tumKategoriler?.forEach(k => { kategoriMap[k.slug] = k.id; });

  console.log(`${Object.keys(kategoriMap).length} kategori yüklendi`);

  const satirlar = csvContent.split('\n');
  const basliklar = satirlar[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());

  let basarili = 0;
  let bulunamadi = 0;

  for (let i = 1; i < satirlar.length; i++) {
    const satir = satirlar[i];
    if (!satir.trim()) continue;

    const alanlar = [];
    let alan = '';
    let tirnakIcinde = false;

    for (let j = 0; j < satir.length; j++) {
      const c = satir[j];
      if (c === '"') { tirnakIcinde = !tirnakIcinde; }
      else if (c === ',' && !tirnakIcinde) { alanlar.push(alan.trim()); alan = ''; }
      else { alan += c; }
    }
    alanlar.push(alan.trim());

    const getAlan = (isim) => {
      const idx = basliklar.indexOf(isim);
      return idx >= 0 ? (alanlar[idx] || '').replace(/^"|"$/g, '').trim() : '';
    };

    const title = getAlan('Title');
    if (!title) continue;

    const kategoriStr = getAlan('Ürün kategorileri');
    if (!kategoriStr) continue;

    const kategoriListesi = kategoriStr.split('|').map(k => k.trim());

    let enUzunEslesen = '';
    for (const kat of kategoriListesi) {
      if (kategoriEslestir[kat] && kat.length > enUzunEslesen.length) {
        enUzunEslesen = kat;
      }
    }

    if (!enUzunEslesen) { bulunamadi++; continue; }

    const slug = kategoriEslestir[enUzunEslesen];
    const kategoriId = kategoriMap[slug];

    if (!kategoriId) { bulunamadi++; continue; }

    const { error } = await supabase
      .from('urunler')
      .update({ kategori_id: kategoriId })
      .eq('ad', title);

    if (!error) {
      basarili++;
      if (basarili % 50 === 0) console.log(`✅ ${basarili} ürün kategorilendi...`);
    }
  }

  console.log(`\n🎉 Tamamlandı!`);
  console.log(`✅ Başarılı: ${basarili}`);
  console.log(`❌ Bulunamadı: ${bulunamadi}`);
}

kategorileriAktar().catch(console.error);