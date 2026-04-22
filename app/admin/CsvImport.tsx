"use client";
import { useState, useRef } from "react";
import { supabase } from "../../lib/supabase";

type Satir = { [key: string]: string };

interface Props {
  acik: boolean;
  onKapat: () => void;
  onTamamlandi?: () => void;
}

export default function CsvImport({ acik, onKapat, onTamamlandi }: Props) {
  const [dosya, setDosya] = useState<File | null>(null);
  const [satirlar, setSatirlar] = useState<Satir[]>([]);
  const [onceSil, setOnceSil] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [ilerleme, setIlerleme] = useState({ mevcut: 0, toplam: 0, basarili: 0, hatali: 0, markalar: 0, kategoriler: 0 });
  const [log, setLog] = useState<string[]>([]);
  const [bitti, setBitti] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  const slugUret = (ad: string) => ad.toLowerCase()
    .replace(/ç/g,"c").replace(/ğ/g,"g").replace(/ı/g,"i")
    .replace(/ö/g,"o").replace(/ş/g,"s").replace(/ü/g,"u")
    .replace(/[^a-z0-9\s-]/g,"").trim().replace(/\s+/g,"-");

  const logEkle = (mesaj: string) => {
    setLog(prev => [...prev, mesaj].slice(-400));
    setTimeout(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, 20);
  };

  const parseCsv = (metin: string): Satir[] => {
    if (metin.charCodeAt(0) === 0xFEFF) metin = metin.slice(1);
    const rows: string[][] = [];
    let cur: string[] = [];
    let alan = "";
    let tIci = false;
    let i = 0;
    while (i < metin.length) {
      const c = metin[i];
      if (tIci) {
        if (c === '"' && metin[i+1] === '"') { alan += '"'; i += 2; }
        else if (c === '"') { tIci = false; i++; }
        else { alan += c; i++; }
      } else {
        if (c === '"') { tIci = true; i++; }
        else if (c === ',') { cur.push(alan); alan = ""; i++; }
        else if (c === '\r' && metin[i+1] === '\n') { cur.push(alan); rows.push(cur); cur = []; alan = ""; i += 2; }
        else if (c === '\n') { cur.push(alan); rows.push(cur); cur = []; alan = ""; i++; }
        else { alan += c; i++; }
      }
    }
    if (alan || cur.length > 0) { cur.push(alan); rows.push(cur); }
    if (rows.length < 2) return [];
    const basliklar = rows[0].map(b => b.trim());
    const out: Satir[] = [];
    for (let j = 1; j < rows.length; j++) {
      const r = rows[j];
      if (r.every(c => !c.trim())) continue;
      const o: Satir = {};
      basliklar.forEach((b, k) => { o[b] = (r[k] || "").trim(); });
      out.push(o);
    }
    return out;
  };

  const dosyaSecildi = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setDosya(f);
    const metin = await f.text();
    const parsed = parseCsv(metin);
    setSatirlar(parsed);
    setLog([]);
    logEkle(`📂 ${f.name} — ${parsed.length} satır okundu`);
    if (parsed.length > 0) logEkle(`   Sütunlar: ${Object.keys(parsed[0]).slice(0,8).join(", ")}...`);
  };

  const yuklemeBasla = async () => {
    if (satirlar.length === 0) return;
    const mesaj = `${satirlar.length} ürün içe aktarılacak.${onceSil ? "\n\n⚠️ ÖNCE TÜM MEVCUT ÜRÜNLER SİLİNECEK!" : ""}\n\nDevam?`;
    if (!confirm(mesaj)) return;

    setYukleniyor(true);
    setBitti(false);
    setLog([]);
    setIlerleme({ mevcut: 0, toplam: satirlar.length, basarili: 0, hatali: 0, markalar: 0, kategoriler: 0 });

    if (onceSil) {
      logEkle("🗑️  Mevcut ürünler siliniyor...");
      const { error } = await supabase.from("urunler").delete().neq("id", 0);
      if (error) { logEkle(`❌ Silme hatası: ${error.message}`); setYukleniyor(false); return; }
      logEkle("✅ Mevcut ürünler silindi\n");
    }

    logEkle("📋 Mevcut markalar yükleniyor...");
    const { data: mevM } = await supabase.from("markalar").select("id, ad");
    const markaMap = new Map<string, number>();
    mevM?.forEach((m: any) => markaMap.set(m.ad.toLowerCase().trim(), m.id));
    logEkle(`   ${markaMap.size} marka bulundu`);

    logEkle("📋 Mevcut kategoriler yükleniyor...");
    const { data: mevK } = await supabase.from("kategoriler").select("id, ad, ust_kategori_id");
    const kKey = (ad: string, pid: number | null) => `${pid || "root"}::${ad.toLowerCase().trim()}`;
    const katMap = new Map<string, number>();
    mevK?.forEach((k: any) => katMap.set(kKey(k.ad, k.ust_kategori_id), k.id));
    logEkle(`   ${katMap.size} kategori bulundu\n`);

    let basarili = 0, hatali = 0, yeniM = 0, yeniK = 0;

    for (let idx = 0; idx < satirlar.length; idx++) {
      const satir = satirlar[idx];
      const ad = (satir["Title"] || satir["Ad"] || "").trim();
      if (!ad) { hatali++; logEkle(`❌ Satır ${idx+1}: ad boş`); setIlerleme({ mevcut: idx+1, toplam: satirlar.length, basarili, hatali, markalar: yeniM, kategoriler: yeniK }); continue; }

      try {
        let markaId: number | null = null;
        const mAd = (satir["Markalar"] || satir["Marka"] || "").trim();
        if (mAd) {
          const mev = markaMap.get(mAd.toLowerCase());
          if (mev) markaId = mev;
          else {
            const { data, error }: any = await supabase.from("markalar").insert({ ad: mAd, slug: slugUret(mAd), aktif: true }).select("id").single();
            if (error) throw new Error(`Marka: ${error.message}`);
            markaId = data.id; markaMap.set(mAd.toLowerCase(), data.id); yeniM++;
            logEkle(`   ➕ Marka: ${mAd}`);
          }
        }

        let kategoriId: number | null = null;
        const kMetni = (satir["Ürün kategorileri"] || satir["Kategoriler"] || satir["Kategori"] || "").trim();
        if (kMetni) {
          const ilkYol = kMetni.split("|")[0].trim();
          const parts = ilkYol.split(">").map(p => p.trim()).filter(Boolean);
          let parentId: number | null = null;
          for (let p = 0; p < parts.length; p++) {
            const parca = parts[p];
            const key = kKey(parca, parentId);
            const mev = katMap.get(key);
            if (mev) parentId = mev;
            else {
              const kSlug: string = slugUret(parca) + (parentId ? `-${parentId}` : "");
              const { data, error }: any = await supabase.from("kategoriler").insert({ ad: parca, slug: kSlug, ust_kategori_id: parentId, aktif: true, sira: 0 }).select("id").single();
              if (error) throw new Error(`Kategori: ${error.message}`);
              parentId = data.id; katMap.set(key, data.id); yeniK++;
              logEkle(`   ➕ Kategori: ${parts.slice(0, p+1).join(" > ")}`);
            }
          }
          kategoriId = parentId;
        }

        const ss = (satir["Stock Status"] || "").toLowerCase().trim();
        const stok = ss === "instock" ? 10 : 0;
        const reg = parseFloat(satir["Regular Price"] || "0") || 0;
        const sal = satir["Sale Price"] ? parseFloat(satir["Sale Price"]) : null;
        const slug = slugUret(ad) + "-" + Date.now() + "-" + idx;

        const { error } = await supabase.from("urunler").insert({
          ad, slug, fiyat: reg,
          indirimli_fiyat: sal && sal !== reg ? sal : null,
          stok, resim_url: satir["Image URL"] || null,
          aciklama: satir["Content"] || null,
          kisa_aciklama: satir["Short Description"] || null,
          marka_id: markaId, kategori_id: kategoriId, aktif: true,
        });
        if (error) throw new Error(error.message);
        basarili++;
        if ((idx+1) % 20 === 0) logEkle(`✓ ${idx+1}/${satirlar.length} (başarılı:${basarili}, hata:${hatali})`);
      } catch (e: any) {
        hatali++;
        logEkle(`❌ "${ad.substring(0,45)}": ${e.message}`);
      }

      setIlerleme({ mevcut: idx+1, toplam: satirlar.length, basarili, hatali, markalar: yeniM, kategoriler: yeniK });
    }

    logEkle("");
    logEkle("🎉 TAMAMLANDI");
    logEkle(`   ✓ Başarılı: ${basarili}`);
    logEkle(`   ✗ Hatalı:   ${hatali}`);
    logEkle(`   + Yeni marka:    ${yeniM}`);
    logEkle(`   + Yeni kategori: ${yeniK}`);

    setYukleniyor(false);
    setBitti(true);
    if (onTamamlandi) onTamamlandi();
  };

  if (!acik) return null;

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget && !yukleniyor) onKapat(); }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "white", borderRadius: 20, padding: 28, width: "100%", maxWidth: 780, maxHeight: "92vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h2 style={{ fontFamily: "Georgia,serif", fontSize: 20, fontWeight: 700, color: "#5C3D2E", margin: 0 }}>📥 CSV ile Toplu Ürün Yükle</h2>
          <button onClick={() => !yukleniyor && onKapat()} style={{ background: "#F0EBE3", border: "none", fontSize: 20, cursor: yukleniyor ? "not-allowed" : "pointer", borderRadius: 8, width: 36, height: 36, color: "#5C3D2E", opacity: yukleniyor ? 0.3 : 1 }}>✕</button>
        </div>

        {!yukleniyor && !bitti && (
          <div style={{ overflowY: "auto", flex: 1 }}>
            <div style={{ background: "#FDF6EE", borderRadius: 14, padding: 18, marginBottom: 14, border: "2px dashed #E8D5B7" }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#5C3D2E", display: "block", marginBottom: 10 }}>1. CSV Dosyası Seç</label>
              <input type="file" accept=".csv" onChange={dosyaSecildi} style={{ display: "block", fontSize: 13, width: "100%" }} />
              {dosya && <div style={{ marginTop: 10, fontSize: 12, color: "#5C3D2E", opacity: 0.7 }}>📄 {dosya.name} — {(dosya.size / 1024).toFixed(0)} KB — {satirlar.length} satır</div>}
            </div>

            {satirlar.length > 0 && (
              <>
                <div style={{ background: "#F0EBE3", borderRadius: 14, padding: 18, marginBottom: 14 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#5C3D2E", display: "block", marginBottom: 10 }}>2. Seçenekler</label>
                  <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13, color: onceSil ? "#C62828" : "#5C3D2E", fontWeight: 600, padding: "8px 10px", background: onceSil ? "#FFEBEE" : "white", borderRadius: 8 }}>
                    <input type="checkbox" checked={onceSil} onChange={e => setOnceSil(e.target.checked)} style={{ width: 18, height: 18, cursor: "pointer" }} />
                    ⚠️ Önce tüm mevcut ürünleri sil (geri alınamaz!)
                  </label>
                  <div style={{ marginTop: 10, fontSize: 11, color: "#5C3D2E", opacity: 0.65, lineHeight: 1.6 }}>
                    • Markalar ve kategoriler otomatik oluşturulur<br/>
                    • Stock Status: instock → stok 10, outofstock → stok 0<br/>
                    • Her ürün aktif olarak eklenir<br/>
                    • Bir ürünün birden fazla kategorisi varsa sadece ilki atanır
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={yuklemeBasla} style={{ flex: 1, background: onceSil ? "#C62828" : "#E8845A", color: "white", border: "none", borderRadius: 10, padding: "14px", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
                    {onceSil ? "⚠️ SİL ve YÜKLE" : "🚀 Yüklemeyi Başlat"} ({satirlar.length} ürün)
                  </button>
                  <button onClick={onKapat} style={{ background: "#888", color: "white", border: "none", borderRadius: 10, padding: "14px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>İptal</button>
                </div>
              </>
            )}
          </div>
        )}

        {(yukleniyor || bitti) && (
          <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13, fontWeight: 700, color: "#5C3D2E" }}>
                <span>{bitti ? "✅ Tamamlandı" : "⏳ İşleniyor..."}</span>
                <span>{ilerleme.mevcut} / {ilerleme.toplam}</span>
              </div>
              <div style={{ background: "#F0EBE3", height: 16, borderRadius: 50, overflow: "hidden" }}>
                <div style={{ width: `${ilerleme.toplam > 0 ? (ilerleme.mevcut / ilerleme.toplam) * 100 : 0}%`, height: "100%", background: bitti ? "#8BAF8E" : "#E8845A", transition: "width 0.3s" }} />
              </div>
              <div style={{ display: "flex", gap: 14, marginTop: 10, fontSize: 12, color: "#5C3D2E", flexWrap: "wrap" }}>
                <span style={{ color: "#2E7D32" }}>✓ {ilerleme.basarili} başarılı</span>
                <span style={{ color: ilerleme.hatali > 0 ? "#C62828" : "#5C3D2E", opacity: ilerleme.hatali > 0 ? 1 : 0.5 }}>✗ {ilerleme.hatali} hatalı</span>
                <span style={{ opacity: 0.6 }}>+ {ilerleme.markalar} marka, + {ilerleme.kategoriler} kategori</span>
              </div>
            </div>
            <div ref={logRef} style={{ flex: 1, background: "#1C0F06", color: "#E8D5B7", borderRadius: 10, padding: 14, fontFamily: "monospace", fontSize: 11, overflowY: "auto", minHeight: 260, whiteSpace: "pre-wrap" as const, lineHeight: 1.5 }}>
              {log.join("\n")}
              {yukleniyor && <div style={{ opacity: 0.4 }}>_</div>}
            </div>
            {bitti && (
              <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                <button onClick={() => { onKapat(); setTimeout(() => window.location.reload(), 100); }} style={{ flex: 1, background: "#8BAF8E", color: "white", border: "none", borderRadius: 10, padding: "14px", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>✓ Tamam (sayfayı yenile)</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
