import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabase = createClient(
  'https://curbhyfhyanwqtduegng.supabase.co',
  'sb_publishable_ROoBDJwZlhUBdH-YVyP4Cg_WLTyAc3_'
);

async function resimleriDuzelt() {
  console.log('📂 CSV okunuyor...');
  
  const csvContent = fs.readFileSync(
    path.join(process.cwd(), 'scripts', 'urunler.csv'), 'utf-8'
  );

  const satirlar = csvContent.split('\n');
  const basliklar = satirlar[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());

  // Tüm ürünleri Supabase'den çek
  const { data: tumUrunler } = await supabase
    .from('urunler')
    .select('id, ad, resim_url')
    .is('resim_url', null);

  console.log(`${tumUrunler?.length} resimsiz ürün bulundu`);

  let basarili = 0;

  for (let i = 1; i < satirlar.length; i++) {
    const satir = satirlar[i];
    if (!satir.trim()) continue;

    const alanlar: string[] = [];
    let alan = '';
    let tirnakIcinde = false;
    
    for (let j = 0; j < satir.length; j++) {
      const c = satir[j];
      if (c === '"') { tirnakIcinde = !tirnakIcinde; }
      else if (c === ',' && !tirnakIcinde) { alanlar.push(alan.trim()); alan = ''; }
      else { alan += c; }
    }
    alanlar.push(alan.trim());

    const getAlan = (isim: string) => {
      const idx = basliklar.indexOf(isim);
      return idx >= 0 ? (alanlar[idx] || '').replace(/^"|"$/g, '').trim() : '';
    };

    const title = getAlan('Title');
    if (!title) continue;

    const imageUrls = getAlan('Image URL').split('|')
      .map(u => u.trim()).filter(u => u && u.startsWith('http'));
    
    if (imageUrls.length === 0) continue;

    // Ürünü ada göre bul
    const eslesen = tumUrunler?.find(u => 
      u.ad.trim().toLowerCase() === title.trim().toLowerCase()
    );

    if (!eslesen) continue;

    const { error } = await supabase
      .from('urunler')
      .update({ 
        resim_url: imageUrls[0],
        resimler: JSON.stringify(imageUrls)
      })
      .eq('id', eslesen.id);

    if (!error) {
      basarili++;
      if (basarili % 20 === 0) console.log(`✅ ${basarili} resim güncellendi...`);
    }
  }

  console.log(`\n🎉 Tamamlandı! ✅ ${basarili} resim güncellendi`);
}

resimleriDuzelt().catch(console.error);