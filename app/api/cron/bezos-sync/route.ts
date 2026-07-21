export const runtime = "nodejs";
export const maxDuration = 60;
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { bezosPetshopCek, bezosSatisFiyati } from "../../../../lib/bezos";

// BEZOS FİYAT/STOK SENKRONU — tedarikçi feed'i ile evemama kataloğunu eşitler.
//
// EŞLEŞTİRME ANAHTARI: barkod. evemama'nın KENDİ ürünlerinde barkod YOK
// (içe aktarımda doğrulandı) → yalnız bezos'tan gelen ürünlere dokunulur.
//
// YAPAR:  fiyat değiştiyse günceller (alış × 1,20 × 1,35), stok değiştiyse günceller,
//         feed'de artık olmayan bezos ürününün stoğunu 0'lar (SİLMEZ).
// YAPMAZ: feed'deki YENİ ürünleri eklemez (sadece sayar) — katalog kararı sende.
//
// AUTH: Bearer CRON_SECRET (Vercel cron) veya ?secret=... ya da admin Bearer.
// TEST: GET /api/cron/bezos-sync?secret=...&dry=1  → hiçbir şey yazmaz, raporlar.
const ADMIN_SIFRE = "evemama2025";
const noStore = { "Cache-Control": "no-store" };
const MAKUL_FIYAT_ORANI = 3; // fiyat 3 kattan fazla oynadıysa uygulama, raporla

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

function yetkili(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET || "";
  const auth = req.headers.get("authorization") || "";
  if (auth === `Bearer ${ADMIN_SIFRE}`) return true;
  if (!cronSecret) return false;
  return auth === `Bearer ${cronSecret}` || req.nextUrl.searchParams.get("secret") === cronSecret;
}

export async function GET(req: NextRequest) {
  if (!yetkili(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: noStore });
  const dry = req.nextUrl.searchParams.get("dry") === "1";
  const t0 = Date.now();

  try {
    // 1) Feed'i akışla oku (petshop bloğu bitince erken keser).
    const s1 = await bezosPetshopCek(0, 30_000);
    const s2 = await bezosPetshopCek(50_000, 12_000);
    const feed = new Map<string, { alis: number; stok: number; isim: string }>();
    for (const u of [...s1.urunler, ...s2.urunler]) feed.set(u.barkod, u);

    // 2) Bizdeki bezos ürünleri (barkod dolu olanlar).
    const sb = adminClient();
    const { data: mevcut, error } = await sb
      .from("urunler").select("id, ad, barkod, fiyat, stok, aktif").not("barkod", "is", null).limit(5000);
    if (error) throw error;

    const rapor = { fiyat: 0, stok: 0, stokSifirlandi: 0, atlanan: 0, yeniUrun: 0, hata: 0, fiyatsizPasif: 0, geriAcildi: 0 };
    const detay: string[] = [];
    const bizdeki = new Set<string>();

    // 🛡️ EMNİYET SUBABI: feed eksik okunduysa (süre doldu) ya da beklenenin çok
    // altında ürün geldiyse, "feed'de yok → stoğu sıfırla" mantığı TÜM KATALOĞU
    // sıfırlayabilir. Böyle durumda yalnız bulunan ürünler güncellenir.
    const bezosSayisi = (mevcut || []).filter(p => String(p.barkod || "").trim()).length;
    const feedSaglikli = !s1.sureDoldu && !s2.sureDoldu && feed.size >= bezosSayisi * 0.5;
    if (!feedSaglikli) detay.push(`⚠️ Feed şüpheli (okunan ${feed.size} / katalog ${bezosSayisi}) → stok sıfırlama ATLANDI`);

    for (const p of mevcut || []) {
      const barkod = String(p.barkod || "").trim();
      if (!barkod) continue;
      bizdeki.add(barkod);
      const f = feed.get(barkod);
      const guncelle: Record<string, number | boolean> = {};

      // 🚫 FİYATSIZ ÜRÜN KORUMASI: tedarikçi alış fiyatı vermemişse (alis=0)
      // satış fiyatı hesaplanamaz → ₺0 ürün vitrinde SATILABİLİR olurdu.
      // Pasife al; fiyat gelince aşağıdaki dalda otomatik geri açılır.
      if (f && f.alis <= 0) {
        if (p.aktif !== false) { guncelle.aktif = false; rapor.fiyatsizPasif++; }
        if (Object.keys(guncelle).length && !dry) {
          const { error: e } = await sb.from("urunler").update(guncelle).eq("id", p.id);
          if (e) { rapor.hata++; detay.push(`❌ ${p.ad?.slice(0, 40)}: ${e.message}`); }
        }
        continue;
      }

      if (!f) {
        // Feed'de yok → tedarikçide kalmamış. Silme, stoğu sıfırla.
        // (Feed sağlıksızsa dokunma — eksik okuma tüm kataloğu sıfırlayabilir.)
        if (feedSaglikli && Number(p.stok) !== 0) { guncelle.stok = 0; rapor.stokSifirlandi++; }
      } else {
        const yeniFiyat = bezosSatisFiyati(f.alis);
        const eskiFiyat = Number(p.fiyat) || 0;
        if (Math.abs(yeniFiyat - eskiFiyat) >= 0.01) {
          // Uç fiyat sıçraması = feed hatası olabilir → uygulama, raporla.
          const oran = eskiFiyat > 0 ? yeniFiyat / eskiFiyat : 1;
          if (eskiFiyat > 0 && (oran > MAKUL_FIYAT_ORANI || oran < 1 / MAKUL_FIYAT_ORANI)) {
            rapor.atlanan++;
            detay.push(`⚠️ ATLANDI (uç fiyat) ${p.ad?.slice(0, 40)}: ₺${eskiFiyat} → ₺${yeniFiyat}`);
          } else {
            guncelle.fiyat = yeniFiyat; rapor.fiyat++;
          }
        }
        if (Number(p.stok) !== f.stok) { guncelle.stok = f.stok; rapor.stok++; }
        // Fiyatsızlık nedeniyle pasife alınmıştı, artık fiyat var → geri aç.
        if (p.aktif === false && Number(p.fiyat) === 0) { guncelle.aktif = true; rapor.geriAcildi++; }
      }

      if (Object.keys(guncelle).length && !dry) {
        const { error: e } = await sb.from("urunler").update(guncelle).eq("id", p.id);
        if (e) { rapor.hata++; detay.push(`❌ ${p.ad?.slice(0, 40)}: ${e.message}`); }
      }
    }
    for (const barkod of feed.keys()) if (!bizdeki.has(barkod)) rapor.yeniUrun++;

    const sonuc = {
      ok: true, dry,
      feed: { urun: feed.size, taranan: s1.taranan + s2.taranan, okunanMb: s1.okunanMb + s2.okunanMb,
              erkenKesildi: s1.erkenKesildi, sureDoldu: s1.sureDoldu || s2.sureDoldu },
      katalog: { bezosUrun: bizdeki.size, feedSaglikli },
      guncelleme: rapor,
      detay: detay.slice(0, 40),
      saniye: Math.round((Date.now() - t0) / 100) / 10,
    };
    // sureDoldu=true ise feed EKSİK okunmuş olabilir → yanlış "stok 0"lama riski.
    if (sonuc.feed.sureDoldu) console.warn("[bezos-sync] SÜRE DOLDU — feed eksik okundu:", sonuc.feed);
    console.log("[bezos-sync]", JSON.stringify(sonuc.guncelleme), sonuc.saniye + "sn");
    return NextResponse.json(sonuc, { headers: noStore });
  } catch (e: unknown) {
    console.error("[bezos-sync]", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "senkron başarısız" }, { status: 500, headers: noStore });
  }
}
