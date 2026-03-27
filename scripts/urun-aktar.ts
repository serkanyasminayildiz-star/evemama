import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = 'https://curbhyfhyanwqtduegng.supabase.co';
const supabaseKey = 'sb_publishable_ROoBDJwZlhUBdH-YVyP4Cg_WLTyAc3_';
const supabase = createClient(supabaseUrl, supabaseKey);

function slugify(text: string): string {
  const trMap: { [key: string]: string } = {
    'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
    'Ç': 'c', 'Ğ': 'g', 'İ': 'i', 'Ö': 'o', 'Ş': 's', 'Ü': 'u'
  };
  return text
    .split('').map(c => trMap[c] || c).join('')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 200);
}

function etiketOlustur(title: string, kategori: string, marka: string): string[] {
  const etiketler: string[] = [];
  if (marka) etiketler.push(marka.toLowerCase());
  
  const kelimeler = title.toLowerCase().split(' ');
  const onemliKelimeler = ['mama', 'kedi', 'köpek', 'tahılsız', 'organik', 'doğal', 
    'yavru', 'yetişkin', 'küçük', 'büyük', 'ırk', 'balık', 'tavuk', 'kuzu', 
    'dana', 'hindi', 'somon', 'konserve', 'kuru', 'yaş', 'ödül', 'atıştırmalık',
    'kg', 'gr', 'lt'];
  
  kelimeler.forEach(k => {
    if (onemliKelimeler.some(ok => k.includes(ok))) {
      etiketler.push(k.replace(/[^a-züçğışö]/g, ''));
    }
  });

  if (kategori) {
    kategori.split('>').forEach(k => {
      const temiz = k.trim().toLowerCase();
      if (temiz && !etiketler.includes(temiz)) etiketler.push(temiz);
    });
  }

  return [...new Set(etiketler)].filter(e => e.length > 2).slice(0, 10);
}

function seoAciklama(title: string, aciklama: string, marka: string, kategori: string): string {
  const temizAciklama = aciklama
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const kategoriAdi = kategori.split('>').pop()?.trim() || '';
  
  let seo = '';
  
  if (temizAciklama.length > 50) {
    seo = temizAciklama;
  } else {
    seo = `${title}, ${marka ? marka + ' markasının ' : ''}kaliteli ${kategoriAdi.toLowerCase()} ürünüdür. `;
    seo += `Evcil hayvanınızın sağlığı ve mutluluğu için özenle üretilmiştir. `;
    seo += `evemama.net güvencesiyle kapınıza teslim edilir.`;
  }

  // Başa ve sona SEO anahtar kelimeleri ekle
  const onEk = `${title} | ${marka} | evemama.net - `;
  const sonEk = ` Ücretsiz kargo fırsatı için 1000₺ ve üzeri alışveriş yapın. Aynı gün kargo ile hızlı teslimat.`;
  
  return onEk + seo + sonEk;
}

async function urunleriAktar() {
  console.log('📂 CSV okunuyor...');
  
  const csvContent = fs.readFileSync(
    path.join(process.cwd(), 'scripts', 'urunler.csv'), 
    'utf-8'
  );

  // CSV'yi parse et
  const satirlar = csvContent.split('\n');
  const basliklar = satirlar[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
  
  console.log(`📊 Toplam sütun: ${basliklar.length}`);

  // Önce kategorileri ve markaları çek
  const { data: kategoriler } = await supabase.from('kategoriler').select('*');
  const { data: markalar } = await supabase.from('markalar').select('*');

  console.log(`📁 Mevcut kategoriler: ${kategoriler?.length}`);
  console.log(`🏷️ Mevcut markalar: ${markalar?.length}`);

  // Markaları map'e çevir
  const markaMap: { [key: string]: number } = {};
  markalar?.forEach(m => { markaMap[m.ad.toLowerCase()] = m.id; });

  // Kategori map
  const kategoriMap: { [key: string]: number } = {};
  kategoriler?.forEach(k => { kategoriMap[k.slug] = k.id; });

  let basarili = 0;
  let hatali = 0;
  const slugSayaci: { [key: string]: number } = {};

  // Her satırı işle (başlık satırını atla)
  for (let i = 1; i < Math.min(satirlar.length, 1100); i++) {
    const satir = satirlar[i];
    if (!satir.trim()) continue;

    // Basit CSV parse (quoted fields için)
    const alanlar: string[] = [];
    let alan = '';
    let tirnakIcinde = false;
    
    for (let j = 0; j < satir.length; j++) {
      const c = satir[j];
      if (c === '"') {
        tirnakIcinde = !tirnakIcinde;
      } else if (c === ',' && !tirnakIcinde) {
        alanlar.push(alan.trim());
        alan = '';
      } else {
        alan += c;
      }
    }
    alanlar.push(alan.trim());

    const getAlan = (isim: string) => {
      const idx = basliklar.indexOf(isim);
      return idx >= 0 ? (alanlar[idx] || '').replace(/^"|"$/g, '').trim() : '';
    };

    const title = getAlan('Title');
    if (!title) continue;

    // Slug oluştur (unique)
    let slug = slugify(title);
    if (slugSayaci[slug]) {
      slugSayaci[slug]++;
      slug = `${slug}-${slugSayaci[slug]}`;
    } else {
      slugSayaci[slug] = 1;
    }

    const regularPrice = parseFloat(getAlan('Regular Price')) || 0;
    const salePrice = parseFloat(getAlan('Sale Price')) || 0;
    const stockStatus = getAlan('Stock Status');
    const imageUrls = getAlan('Image URL').split('|').map(u => u.trim()).filter(u => u);
    const markaAdi = getAlan('Markalar');
    const kategoriStr = getAlan('Ürün kategorileri');
    const aciklama = getAlan('Content');
    const kisaAciklama = getAlan('Short Description');

    // Fiyat hesapla
    let fiyat = regularPrice;
    let indirimli_fiyat = null;

    if (stockStatus === 'outofstock') {
      // Stok dışı: indirimi kaldır, %50 artır
      fiyat = Math.round(regularPrice * 1.5 * 100) / 100;
      indirimli_fiyat = null;
    } else {
      // Stokta: fiyat aynı, indirim de kaldır
      fiyat = regularPrice;
      indirimli_fiyat = null; // Tüm indirimleri kaldır
    }

    // Marka bul veya oluştur
    let markaId = null;
    if (markaAdi) {
      const markaKey = markaAdi.toLowerCase();
      if (markaMap[markaKey]) {
        markaId = markaMap[markaKey];
      } else {
        const { data: yeniMarka } = await supabase
          .from('markalar')
          .insert({ ad: markaAdi, slug: slugify(markaAdi) })
          .select()
          .single();
        if (yeniMarka) {
          markaMap[markaKey] = yeniMarka.id;
          markaId = yeniMarka.id;
        }
      }
    }

    // Kategori bul
    let kategoriId = null;
    if (kategoriStr) {
      const ilkKategori = kategoriStr.split('|')[0];
      const sonKategori = ilkKategori.split('>').pop()?.trim() || '';
      const sonKategoriSlug = slugify(sonKategori);
      kategoriId = kategoriMap[sonKategoriSlug] || null;
    }

    // Etiketler
    const etiketler = etiketOlustur(title, kategoriStr, markaAdi);

    // SEO açıklama
    const seoAciklamaMetni = seoAciklama(title, aciklama || kisaAciklama, markaAdi, kategoriStr);

    // Ürünü Supabase'e ekle
    const { error } = await supabase.from('urunler').upsert({
      ad: title,
      slug: slug,
      aciklama: seoAciklamaMetni,
      kisa_aciklama: kisaAciklama.replace(/<[^>]*>/g, '').trim().substring(0, 500),
      fiyat: fiyat,
      indirimli_fiyat: indirimli_fiyat,
      stok: stockStatus === 'instock' ? 100 : 0,
      kategori_id: kategoriId,
      marka_id: markaId,
      resim_url: imageUrls[0] || null,
      resimler: JSON.stringify(imageUrls),
      ozellikler: JSON.stringify({ etiketler }),
      aktif: true,
      one_cikan: false,
    }, { onConflict: 'slug' });

    if (error) {
      console.log(`❌ Hata (${title.substring(0, 30)}): ${error.message}`);
      hatali++;
    } else {
      basarili++;
      if (basarili % 50 === 0) console.log(`✅ ${basarili} ürün aktarıldı...`);
    }
  }

  console.log(`\n🎉 Tamamlandı!`);
  console.log(`✅ Başarılı: ${basarili}`);
  console.log(`❌ Hatalı: ${hatali}`);
}

urunleriAktar().catch(console.error);