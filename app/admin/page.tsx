"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";

const ADMIN_SIFRE = "evemama2025";
const SAYFA_BOYUTU = 50;

export default function Admin() {
  const [giris, setGiris] = useState(false);
  const [sifre, setSifre] = useState("");
  const [hataMesaji, setHataMesaji] = useState("");
  const [aktifSayfa, setAktifSayfa] = useState("dashboard");
  const [bildirim, setBildirim] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);

  // Ürünler
  const [urunler, setUrunler] = useState<any[]>([]);
  const [toplamUrun, setToplamUrun] = useState(0);
  const [sayfaNo, setSayfaNo] = useState(0);
  const [aramaMetni, setAramaMetni] = useState("");
  const [duzenleUrun, setDuzenleUrun] = useState<any>(null);
  const [yeniUrun, setYeniUrun] = useState({ ad: "", fiyat: "", indirimli_fiyat: "", stok: "", resim_url: "", kategori_id: "", marka_id: "", kisa_aciklama: "", aciklama: "", etiket: "", aktif: true });
  const [seciliUrunler, setSeciliUrunler] = useState<number[]>([]);
  const [topluIslem, setTopluIslem] = useState({ tip: "fiyat_yuzde", deger: "", etiket: "" });

  // Diğer veriler
  const [kategoriler, setKategoriler] = useState<any[]>([]);
  const [markalar, setMarkalar] = useState<any[]>([]);
  const [siparisler, setSiparisler] = useState<any[]>([]);
  const [kuponlar, setKuponlar] = useState<any[]>([]);
  const [kargoAyar, setKargoAyar] = useState<any>(null);
  const [siteAyarlari, setSiteAyarlari] = useState<any>({});
  const [blogSorular, setBlogSorular] = useState<any[]>([]);
  const [cevaplar, setCevaplar] = useState<{ [key: number]: string }>({});
  const [istatistikler, setIstatistikler] = useState({ urunler: 0, siparisler: 0, kategoriler: 0 });

  const [yeniKupon, setYeniKupon] = useState({ kod: "", indirim_tipi: "yuzde", indirim_degeri: "", min_sepet: "", kullanim_limiti: "100", bitis_tarihi: "" });

  const goster = (mesaj: string) => { setBildirim(mesaj); setTimeout(() => setBildirim(""), 3000); };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", border: "2px solid #E8D5B7",
    borderRadius: 10, fontSize: 14, outline: "none", fontFamily: "inherit",
    boxSizing: "border-box", background: "white", color: "#2C1A0E"
  };
  const btn = (bg = "#E8845A"): React.CSSProperties => ({
    background: bg, color: "white", border: "none", borderRadius: 10,
    padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit"
  });

  // --- VERİ YÜKLEME ---
  const urunleriYukle = useCallback(async (sayfa = 0, arama = "") => {
    setYukleniyor(true);
    const from = sayfa * SAYFA_BOYUTU;
    const to = from + SAYFA_BOYUTU - 1;
    let query = supabase.from("urunler").select("*, kategoriler(ad), markalar(ad)", { count: "exact" });
    if (arama) query = query.ilike("ad", `%${arama}%`);
    query = query.order("id", { ascending: false }).range(from, to);
    const { data, count } = await query;
    setUrunler(data || []);
    setToplamUrun(count || 0);
    setYukleniyor(false);
  }, []);

  const siparisleriYukle = async () => {
    const { data } = await supabase.from("siparisler").select("*").order("created_at", { ascending: false }).limit(100);
    setSiparisler(data || []);
  };

  const kategorileriYukle = async () => {
    const { data } = await supabase.from("kategoriler").select("*").order("sira");
    setKategoriler(data || []);
  };

  const markalariYukle = async () => {
    const { data } = await supabase.from("markalar").select("*").order("ad");
    setMarkalar(data || []);
  };

  const kuponlariYukle = async () => {
    const { data } = await supabase.from("kuponlar").select("*").order("created_at", { ascending: false });
    setKuponlar(data || []);
  };

  const kargoYukle = async () => {
    const { data } = await supabase.from("kargo_ayarlari").select("*").limit(1).single();
    setKargoAyar(data);
  };

  const siteAyarlariYukle = async () => {
    const { data } = await supabase.from("site_ayarlari").select("*");
    const obj: any = {};
    data?.forEach((row: any) => { obj[row.anahtar] = row.deger; });
    setSiteAyarlari(obj);
  };

  const blogSorulariYukle = async () => {
    const { data } = await supabase.from("blog_sorular").select("*").order("created_at", { ascending: false });
    setBlogSorular(data || []);
  };

  const istatistikleriYukle = async () => {
    const [{ count: uc }, { count: sc }, { count: kc }] = await Promise.all([
      supabase.from("urunler").select("*", { count: "exact", head: true }),
      supabase.from("siparisler").select("*", { count: "exact", head: true }),
      supabase.from("kategoriler").select("*", { count: "exact", head: true }),
    ]);
    setIstatistikler({ urunler: uc || 0, siparisler: sc || 0, kategoriler: kc || 0 });
  };

  const handleGiris = () => {
    if (sifre === ADMIN_SIFRE) {
      setGiris(true);
      kategorileriYukle(); markalariYukle(); kargoYukle(); siteAyarlariYukle(); istatistikleriYukle();
    } else setHataMesaji("Hatalı şifre!");
  };

  useEffect(() => {
    if (aktifSayfa === "urunler") { setSayfaNo(0); urunleriYukle(0, aramaMetni); }
    if (aktifSayfa === "siparisler") siparisleriYukle();
    if (aktifSayfa === "kuponlar") kuponlariYukle();
    if (aktifSayfa === "blog") blogSorulariYukle();
  }, [aktifSayfa]);

  useEffect(() => {
    const timer = setTimeout(() => { urunleriYukle(0, aramaMetni); setSayfaNo(0); }, 400);
    return () => clearTimeout(timer);
  }, [aramaMetni]);

  // --- ÜRÜN İŞLEMLERİ ---
  const urunEkle = async () => {
    if (!yeniUrun.ad || !yeniUrun.fiyat) { goster("⚠️ Ürün adı ve fiyat zorunludur!"); return; }
    const slug = yeniUrun.ad.toLowerCase()
      .replace(/ç/g,"c").replace(/ğ/g,"g").replace(/ı/g,"i").replace(/ö/g,"o").replace(/ş/g,"s").replace(/ü/g,"u")
      .replace(/[^a-z0-9\s-]/g,"").trim().replace(/\s+/g,"-") + "-" + Date.now();
    const { error } = await supabase.from("urunler").insert({
      ad: yeniUrun.ad, slug,
      fiyat: parseFloat(yeniUrun.fiyat),
      indirimli_fiyat: yeniUrun.indirimli_fiyat ? parseFloat(yeniUrun.indirimli_fiyat) : null,
      stok: parseInt(yeniUrun.stok) || 0,
      resim_url: yeniUrun.resim_url || null,
      kisa_aciklama: yeniUrun.kisa_aciklama || null,
      aciklama: yeniUrun.aciklama || null,
      etiket: yeniUrun.etiket || null,
      kategori_id: yeniUrun.kategori_id || null,
      marka_id: yeniUrun.marka_id || null,
      aktif: true,
    });
    if (error) { goster("❌ Hata: " + error.message); return; }
    setYeniUrun({ ad: "", fiyat: "", indirimli_fiyat: "", stok: "", resim_url: "", kategori_id: "", marka_id: "", kisa_aciklama: "", aciklama: "", etiket: "", aktif: true });
    urunleriYukle(sayfaNo, aramaMetni);
    istatistikleriYukle();
    goster("✅ Ürün eklendi");
  };

  const urunGuncelle = async () => {
    if (!duzenleUrun) return;
    const { error } = await supabase.from("urunler").update({
      ad: duzenleUrun.ad,
      fiyat: parseFloat(duzenleUrun.fiyat),
      indirimli_fiyat: duzenleUrun.indirimli_fiyat ? parseFloat(duzenleUrun.indirimli_fiyat) : null,
      stok: parseInt(duzenleUrun.stok),
      resim_url: duzenleUrun.resim_url || null,
      kisa_aciklama: duzenleUrun.kisa_aciklama || null,
      aciklama: duzenleUrun.aciklama || null,
      etiket: duzenleUrun.etiket || null,
      kategori_id: duzenleUrun.kategori_id || null,
      marka_id: duzenleUrun.marka_id || null,
      aktif: duzenleUrun.aktif,
    }).eq("id", duzenleUrun.id);
    if (error) { goster("❌ Hata: " + error.message); return; }
    setDuzenleUrun(null);
    urunleriYukle(sayfaNo, aramaMetni);
    goster("✅ Ürün güncellendi");
  };

  const urunSil = async (id: number) => {
    if (!confirm("Bu ürünü silmek istediğinizden emin misiniz?")) return;
    await supabase.from("urunler").delete().eq("id", id);
    urunleriYukle(sayfaNo, aramaMetni);
    istatistikleriYukle();
    goster("✅ Ürün silindi");
  };

  const topluIslemUygula = async () => {
    if (seciliUrunler.length === 0) { goster("⚠️ Önce ürün seçin!"); return; }
    setYukleniyor(true);
    if (topluIslem.tip === "fiyat_yuzde" && topluIslem.deger) {
      const yuzde = parseFloat(topluIslem.deger) / 100;
      for (const id of seciliUrunler) {
        const urun = urunler.find(u => u.id === id);
        if (urun) await supabase.from("urunler").update({ fiyat: Math.round(urun.fiyat * (1 + yuzde) * 100) / 100 }).eq("id", id);
      }
    } else if (topluIslem.tip === "indirim_yuzde" && topluIslem.deger) {
      const yuzde = parseFloat(topluIslem.deger) / 100;
      for (const id of seciliUrunler) {
        const urun = urunler.find(u => u.id === id);
        if (urun) await supabase.from("urunler").update({ indirimli_fiyat: Math.round(urun.fiyat * (1 - yuzde) * 100) / 100 }).eq("id", id);
      }
    } else if (topluIslem.tip === "stok_ac") {
      for (const id of seciliUrunler) await supabase.from("urunler").update({ aktif: true }).eq("id", id);
    } else if (topluIslem.tip === "stok_kapat") {
      for (const id of seciliUrunler) await supabase.from("urunler").update({ aktif: false }).eq("id", id);
    } else if (topluIslem.tip === "etiket" && topluIslem.etiket) {
      for (const id of seciliUrunler) await supabase.from("urunler").update({ etiket: topluIslem.etiket }).eq("id", id);
    } else if (topluIslem.tip === "indirim_kaldir") {
      for (const id of seciliUrunler) await supabase.from("urunler").update({ indirimli_fiyat: null }).eq("id", id);
    } else if (topluIslem.tip === "sil") {
      if (!confirm(`${seciliUrunler.length} ürünü silmek istediğinizden emin misiniz?`)) { setYukleniyor(false); return; }
      for (const id of seciliUrunler) await supabase.from("urunler").delete().eq("id", id);
    }
    setSeciliUrunler([]);
    urunleriYukle(sayfaNo, aramaMetni);
    setYukleniyor(false);
    goster(`✅ ${seciliUrunler.length} ürüne işlem uygulandı`);
  };

  // --- KARGO ---
  const kargoGuncelle = async () => {
    if (!kargoAyar) return;
    // Önce tablo kolonlarını kontrol et
    const guncellemeler: any = {};
    if (kargoAyar.ucretsiz_limit !== undefined) guncellemeler.ucretsiz_limit = parseFloat(kargoAyar.ucretsiz_limit);
    if (kargoAyar["ucretsiz limit"] !== undefined) guncellemeler["ucretsiz limit"] = parseFloat(kargoAyar["ucretsiz limit"]);
    guncellemeler.sabit_ucret = parseFloat(kargoAyar.sabit_ucret);
    const { error } = await supabase.from("kargo_ayarlari").update(guncellemeler).eq("id", kargoAyar.id);
    if (error) { goster("❌ Hata: " + error.message); return; }
    goster("✅ Kargo ayarları güncellendi");
  };

  // --- KUPON ---
  const kuponEkle = async () => {
    if (!yeniKupon.kod || !yeniKupon.indirim_degeri) return;
    await supabase.from("kuponlar").insert({
      kod: yeniKupon.kod.toUpperCase(),
      indirim_tipi: yeniKupon.indirim_tipi,
      indirim_degeri: parseFloat(yeniKupon.indirim_degeri),
      min_sepet: parseFloat(yeniKupon.min_sepet) || 0,
      kullanim_limiti: parseInt(yeniKupon.kullanim_limiti) || 100,
      bitis_tarihi: yeniKupon.bitis_tarihi || null,
      aktif: true,
    });
    setYeniKupon({ kod: "", indirim_tipi: "yuzde", indirim_degeri: "", min_sepet: "", kullanim_limiti: "100", bitis_tarihi: "" });
    kuponlariYukle();
    goster("✅ Kupon eklendi");
  };

  const siteAyarKaydet = async (anahtar: string, deger: string) => {
    const { error } = await supabase.from("site_ayarlari")
      .upsert({ anahtar, deger }, { onConflict: "anahtar" });
    if (error) { goster("❌ Hata: " + error.message); return; }
    goster("✅ Kaydedildi");
  };

  const bekleyenSorular = blogSorular.filter(s => !s.onaylandi);
  const toplamSayfa = Math.ceil(toplamUrun / SAYFA_BOYUTU);

  // --- GİRİŞ EKRANI ---
  if (!giris) return (
    <main style={{ minHeight: "100vh", background: "#FDF6EE", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
      <div style={{ background: "white", borderRadius: 24, padding: "48px 40px", maxWidth: 400, width: "100%", boxShadow: "0 20px 60px rgba(92,61,46,0.1)", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 24, fontWeight: 700, color: "#5C3D2E", marginBottom: 28 }}>Admin Paneli</div>
        <input type="password" value={sifre} onChange={e => setSifre(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleGiris()} placeholder="Şifre"
          style={{ ...inputStyle, marginBottom: 10, textAlign: "center", fontSize: 16 }} />
        {hataMesaji && <div style={{ color: "#E57373", fontSize: 13, marginBottom: 10 }}>{hataMesaji}</div>}
        <button onClick={handleGiris} style={{ ...btn(), width: "100%", padding: "14px", fontSize: 15 }}>Giriş Yap →</button>
      </div>
    </main>
  );

  const menuler = [
    { id: "dashboard", icon: "📊", ad: "Dashboard" },
    { id: "urunler", icon: "📦", ad: "Ürünler" },
    { id: "siparisler", icon: "🛒", ad: "Siparişler" },
    { id: "kategoriler", icon: "📁", ad: "Kategoriler" },
    { id: "markalar", icon: "🏷️", ad: "Markalar" },
    { id: "kuponlar", icon: "🎟️", ad: "Kuponlar" },
    { id: "blog", icon: "📝", ad: "Blog Soruları", badge: bekleyenSorular.length },
    { id: "kargo", icon: "🚀", ad: "Kargo Ayarları" },
    { id: "ayarlar", icon: "⚙️", ad: "Site Ayarları" },
  ];

  return (
    <main style={{ minHeight: "100vh", background: "#F5F0EB", fontFamily: "sans-serif", display: "flex" }}>

      {bildirim && (
        <div style={{ position: "fixed", top: 20, right: 20, background: "#2C1A0E", color: "white", padding: "14px 22px", borderRadius: 14, fontSize: 14, fontWeight: 600, zIndex: 9999, boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}>
          {bildirim}
        </div>
      )}

      {/* DÜZENLEME MODALI */}
      {duzenleUrun && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "white", borderRadius: 20, padding: 28, width: "100%", maxWidth: 700, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: "#5C3D2E" }}>✏️ Ürün Düzenle</h2>
              <button onClick={() => setDuzenleUrun(null)} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#5C3D2E" }}>✕</button>
            </div>

            {duzenleUrun.resim_url && (
              <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
                <img src={duzenleUrun.resim_url} alt="" style={{ width: 80, height: 80, objectFit: "contain", borderRadius: 12, background: "#FDF6EE", padding: 8 }} />
                <span style={{ fontSize: 12, color: "#5C3D2E", opacity: 0.6 }}>Mevcut resim</span>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#5C3D2E", opacity: 0.7, display: "block", marginBottom: 5 }}>Ürün Adı *</label>
                <input value={duzenleUrun.ad} onChange={e => setDuzenleUrun({ ...duzenleUrun, ad: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#5C3D2E", opacity: 0.7, display: "block", marginBottom: 5 }}>Fiyat (₺) *</label>
                <input type="number" step="0.01" value={duzenleUrun.fiyat} onChange={e => setDuzenleUrun({ ...duzenleUrun, fiyat: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#5C3D2E", opacity: 0.7, display: "block", marginBottom: 5 }}>İndirimli Fiyat (₺)</label>
                <input type="number" step="0.01" value={duzenleUrun.indirimli_fiyat || ""} onChange={e => setDuzenleUrun({ ...duzenleUrun, indirimli_fiyat: e.target.value })} style={inputStyle} placeholder="Boş bırakın = indirim yok" />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#5C3D2E", opacity: 0.7, display: "block", marginBottom: 5 }}>Stok</label>
                <input type="number" value={duzenleUrun.stok} onChange={e => setDuzenleUrun({ ...duzenleUrun, stok: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#5C3D2E", opacity: 0.7, display: "block", marginBottom: 5 }}>Durum</label>
                <select value={duzenleUrun.aktif ? "1" : "0"} onChange={e => setDuzenleUrun({ ...duzenleUrun, aktif: e.target.value === "1" })} style={inputStyle}>
                  <option value="1">✅ Aktif</option>
                  <option value="0">❌ Pasif</option>
                </select>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#5C3D2E", opacity: 0.7, display: "block", marginBottom: 5 }}>Resim URL</label>
                <input value={duzenleUrun.resim_url || ""} onChange={e => setDuzenleUrun({ ...duzenleUrun, resim_url: e.target.value })} style={inputStyle} placeholder="https://..." />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#5C3D2E", opacity: 0.7, display: "block", marginBottom: 5 }}>Kategori</label>
                <select value={duzenleUrun.kategori_id || ""} onChange={e => setDuzenleUrun({ ...duzenleUrun, kategori_id: e.target.value })} style={inputStyle}>
                  <option value="">Seçin</option>
                  {kategoriler.map(k => <option key={k.id} value={k.id}>{k.ad}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#5C3D2E", opacity: 0.7, display: "block", marginBottom: 5 }}>Marka</label>
                <select value={duzenleUrun.marka_id || ""} onChange={e => setDuzenleUrun({ ...duzenleUrun, marka_id: e.target.value })} style={inputStyle}>
                  <option value="">Seçin</option>
                  {markalar.map(m => <option key={m.id} value={m.id}>{m.ad}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#5C3D2E", opacity: 0.7, display: "block", marginBottom: 5 }}>Etiket</label>
                <select value={duzenleUrun.etiket || ""} onChange={e => setDuzenleUrun({ ...duzenleUrun, etiket: e.target.value })} style={inputStyle}>
                  <option value="">Etiket Yok</option>
                  <option value="yeni">🆕 Yeni</option>
                  <option value="indirim">💥 İndirim</option>
                  <option value="cok-satan">⭐ Çok Satan</option>
                  <option value="kampanya">🏷️ Kampanya</option>
                  <option value="onerilir">👍 Önerilir</option>
                  <option value="son-stok">⚠️ Son Stok</option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#5C3D2E", opacity: 0.7, display: "block", marginBottom: 5 }}>Kısa Açıklama</label>
              <input value={duzenleUrun.kisa_aciklama || ""} onChange={e => setDuzenleUrun({ ...duzenleUrun, kisa_aciklama: e.target.value })} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#5C3D2E", opacity: 0.7, display: "block", marginBottom: 5 }}>Uzun Açıklama</label>
              <textarea value={duzenleUrun.aciklama || ""} onChange={e => setDuzenleUrun({ ...duzenleUrun, aciklama: e.target.value })}
                rows={4} style={{ ...inputStyle, resize: "vertical" as const }} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={urunGuncelle} style={{ ...btn(), flex: 1, padding: "14px" }}>💾 Kaydet</button>
              <button onClick={() => setDuzenleUrun(null)} style={{ ...btn("#999"), padding: "14px 20px" }}>İptal</button>
            </div>
          </div>
        </div>
      )}

      {/* SOL MENÜ */}
      <div style={{ width: 220, background: "#2C1A0E", minHeight: "100vh", position: "fixed", left: 0, top: 0, bottom: 0, overflowY: "auto" }}>
        <div style={{ padding: "20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 17, fontWeight: 700, color: "#FDF6EE" }}>evemama<span style={{ color: "#E8845A" }}>.net</span></div>
          <div style={{ fontSize: 11, color: "#F4C09A", opacity: 0.6, marginTop: 2 }}>Admin Paneli</div>
        </div>
        <nav style={{ padding: "12px 10px" }}>
          {menuler.map(m => (
            <button key={m.id} onClick={() => setAktifSayfa(m.id)}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", background: aktifSayfa === m.id ? "rgba(232,132,90,0.15)" : "none", border: "none", borderLeft: aktifSayfa === m.id ? "3px solid #E8845A" : "3px solid transparent", cursor: "pointer", color: aktifSayfa === m.id ? "#E8845A" : "#FDF6EE", fontSize: 13, fontWeight: aktifSayfa === m.id ? 700 : 400, marginBottom: 2, fontFamily: "inherit", textAlign: "left", opacity: aktifSayfa === m.id ? 1 : 0.65 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}><span>{m.icon}</span>{m.ad}</span>
              {m.badge && m.badge > 0 ? <span style={{ background: "#E8845A", color: "white", borderRadius: 50, fontSize: 10, padding: "1px 6px" }}>{m.badge}</span> : null}
            </button>
          ))}
        </nav>
        <div style={{ padding: "10px" }}>
          <a href="/" target="_blank" style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", background: "rgba(255,255,255,0.05)", borderRadius: 10, color: "#FDF6EE", textDecoration: "none", fontSize: 13, opacity: 0.6 }}>
            🏠 Siteye Git
          </a>
        </div>
      </div>

      {/* SAYFA İÇERİĞİ */}
      <div style={{ marginLeft: 220, flex: 1, padding: "28px 32px" }}>

        {/* DASHBOARD */}
        {aktifSayfa === "dashboard" && (
          <div>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700, color: "#2C1A0E", marginBottom: 24 }}>Dashboard</h1>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
              {[
                { icon: "📦", ad: "Toplam Ürün", deger: istatistikler.urunler, renk: "#E8845A" },
                { icon: "🛒", ad: "Sipariş", deger: istatistikler.siparisler, renk: "#8BAF8E" },
                { icon: "📁", ad: "Kategori", deger: istatistikler.kategoriler, renk: "#5C3D2E" },
                { icon: "📝", ad: "Bekleyen Soru", deger: bekleyenSorular.length, renk: "#9C27B0" },
              ].map((k, i) => (
                <div key={i} style={{ background: "white", borderRadius: 18, padding: 20, boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>{k.icon}</div>
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 30, fontWeight: 700, color: k.renk }}>{k.deger}</div>
                  <div style={{ fontSize: 12, color: "#5C3D2E", opacity: 0.5, marginTop: 2 }}>{k.ad}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ÜRÜNLER */}
        {aktifSayfa === "urunler" && (
          <div>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700, color: "#2C1A0E", marginBottom: 20 }}>
              Ürün Yönetimi <span style={{ fontSize: 16, opacity: 0.5, fontStyle: "normal" }}>({toplamUrun} ürün)</span>
            </h1>

            {/* YENİ ÜRÜN */}
            <div style={{ background: "white", borderRadius: 18, padding: 22, marginBottom: 16, boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 700, color: "#2C1A0E", marginBottom: 14 }}>➕ Yeni Ürün Ekle</h2>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
                <input placeholder="Ürün Adı *" value={yeniUrun.ad} onChange={e => setYeniUrun({ ...yeniUrun, ad: e.target.value })} style={inputStyle} />
                <input placeholder="Fiyat ₺ *" type="number" step="0.01" value={yeniUrun.fiyat} onChange={e => setYeniUrun({ ...yeniUrun, fiyat: e.target.value })} style={inputStyle} />
                <input placeholder="İndirimli ₺" type="number" step="0.01" value={yeniUrun.indirimli_fiyat} onChange={e => setYeniUrun({ ...yeniUrun, indirimli_fiyat: e.target.value })} style={inputStyle} />
                <input placeholder="Stok" type="number" value={yeniUrun.stok} onChange={e => setYeniUrun({ ...yeniUrun, stok: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
                <input placeholder="Resim URL" value={yeniUrun.resim_url} onChange={e => setYeniUrun({ ...yeniUrun, resim_url: e.target.value })} style={inputStyle} />
                <select value={yeniUrun.kategori_id} onChange={e => setYeniUrun({ ...yeniUrun, kategori_id: e.target.value })} style={inputStyle}>
                  <option value="">Kategori</option>
                  {kategoriler.map(k => <option key={k.id} value={k.id}>{k.ad}</option>)}
                </select>
                <select value={yeniUrun.marka_id} onChange={e => setYeniUrun({ ...yeniUrun, marka_id: e.target.value })} style={inputStyle}>
                  <option value="">Marka</option>
                  {markalar.map(m => <option key={m.id} value={m.id}>{m.ad}</option>)}
                </select>
                <select value={yeniUrun.etiket} onChange={e => setYeniUrun({ ...yeniUrun, etiket: e.target.value })} style={inputStyle}>
                  <option value="">Etiket</option>
                  <option value="yeni">🆕 Yeni</option>
                  <option value="indirim">💥 İndirim</option>
                  <option value="cok-satan">⭐ Çok Satan</option>
                  <option value="kampanya">🏷️ Kampanya</option>
                  <option value="son-stok">⚠️ Son Stok</option>
                </select>
              </div>
              <input placeholder="Kısa Açıklama" value={yeniUrun.kisa_aciklama} onChange={e => setYeniUrun({ ...yeniUrun, kisa_aciklama: e.target.value })} style={{ ...inputStyle, marginBottom: 10 }} />
              <button onClick={urunEkle} style={btn()}>+ Ürün Ekle</button>
            </div>

            {/* TOPLU İŞLEM */}
            <div style={{ background: "white", borderRadius: 18, padding: 18, marginBottom: 16, boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <strong style={{ fontSize: 13, color: "#5C3D2E" }}>⚡ Toplu İşlem</strong>
                {seciliUrunler.length > 0 && <span style={{ background: "#E8845A", color: "white", borderRadius: 50, fontSize: 12, padding: "2px 10px" }}>{seciliUrunler.length} seçili</span>}
                <select value={topluIslem.tip} onChange={e => setTopluIslem({ ...topluIslem, tip: e.target.value })}
                  style={{ padding: "9px 12px", border: "2px solid #E8D5B7", borderRadius: 10, fontSize: 13, outline: "none" }}>
                  <option value="fiyat_yuzde">Fiyat % Değiştir</option>
                  <option value="indirim_yuzde">İndirim % Uygula</option>
                  <option value="indirim_kaldir">İndirim Kaldır</option>
                  <option value="stok_ac">Aktif Et</option>
                  <option value="stok_kapat">Pasif Et</option>
                  <option value="etiket">Etiket Ekle</option>
                  <option value="sil">🗑️ Sil</option>
                </select>
                {(topluIslem.tip === "fiyat_yuzde" || topluIslem.tip === "indirim_yuzde") && (
                  <input type="number" placeholder="% değer (örn: 10)" value={topluIslem.deger} onChange={e => setTopluIslem({ ...topluIslem, deger: e.target.value })}
                    style={{ padding: "9px 12px", border: "2px solid #E8D5B7", borderRadius: 10, fontSize: 13, outline: "none", width: 180 }} />
                )}
                {topluIslem.tip === "etiket" && (
                  <select value={topluIslem.etiket} onChange={e => setTopluIslem({ ...topluIslem, etiket: e.target.value })}
                    style={{ padding: "9px 12px", border: "2px solid #E8D5B7", borderRadius: 10, fontSize: 13, outline: "none" }}>
                    <option value="">Etiket Seçin</option>
                    <option value="yeni">🆕 Yeni</option>
                    <option value="indirim">💥 İndirim</option>
                    <option value="cok-satan">⭐ Çok Satan</option>
                    <option value="son-stok">⚠️ Son Stok</option>
                  </select>
                )}
                <button onClick={topluIslemUygula} style={btn()}>Uygula</button>
                {seciliUrunler.length > 0 && <button onClick={() => setSeciliUrunler([])} style={btn("#999")}>Seçimi Temizle</button>}
              </div>
            </div>

            {/* ÜRÜN LİSTESİ */}
            <div style={{ background: "white", borderRadius: 18, padding: 22, boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 10 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input placeholder="🔍 Ürün ara..." value={aramaMetni} onChange={e => setAramaMetni(e.target.value)}
                    style={{ padding: "9px 14px", border: "2px solid #E8D5B7", borderRadius: 10, fontSize: 13, outline: "none", width: 250 }} />
                  {yukleniyor && <span style={{ fontSize: 12, opacity: 0.5 }}>Yükleniyor...</span>}
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button onClick={() => setSeciliUrunler(urunler.map(u => u.id))} style={{ ...btn("#5C3D2E"), padding: "8px 14px", fontSize: 12 }}>Sayfadakileri Seç</button>
                  <span style={{ fontSize: 13, color: "#5C3D2E", opacity: 0.6 }}>Sayfa {sayfaNo + 1}/{Math.max(1, toplamSayfa)}</span>
                  <button onClick={() => { const p = Math.max(0, sayfaNo - 1); setSayfaNo(p); urunleriYukle(p, aramaMetni); }} disabled={sayfaNo === 0}
                    style={{ ...btn("#5C3D2E"), padding: "8px 14px", opacity: sayfaNo === 0 ? 0.4 : 1 }}>← Önceki</button>
                  <button onClick={() => { const p = sayfaNo + 1; setSayfaNo(p); urunleriYukle(p, aramaMetni); }} disabled={sayfaNo >= toplamSayfa - 1}
                    style={{ ...btn("#5C3D2E"), padding: "8px 14px", opacity: sayfaNo >= toplamSayfa - 1 ? 0.4 : 1 }}>Sonraki →</button>
                </div>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#FDF6EE" }}>
                      <th style={{ padding: "10px 8px", width: 36 }}>
                        <input type="checkbox"
                          onChange={e => setSeciliUrunler(e.target.checked ? urunler.map(u => u.id) : [])}
                          checked={seciliUrunler.length === urunler.length && urunler.length > 0} />
                      </th>
                      {["Resim", "Ürün Adı", "Fiyat", "İndirimli", "Stok", "Kategori", "Etiket", "Durum", "İşlem"].map(h => (
                        <th key={h} style={{ padding: "10px 8px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#5C3D2E", opacity: 0.6, textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {urunler.map(urun => (
                      <tr key={urun.id} style={{ borderBottom: "1px solid #F0E8E0", background: seciliUrunler.includes(urun.id) ? "#FFF5F0" : "white" }}>
                        <td style={{ padding: "8px" }}>
                          <input type="checkbox" checked={seciliUrunler.includes(urun.id)}
                            onChange={e => setSeciliUrunler(e.target.checked ? [...seciliUrunler, urun.id] : seciliUrunler.filter(id => id !== urun.id))} />
                        </td>
                        <td style={{ padding: "8px" }}>
                          {urun.resim_url
                            ? <img src={urun.resim_url} alt="" style={{ width: 44, height: 44, objectFit: "contain", borderRadius: 8, background: "#FDF6EE" }} />
                            : <div style={{ width: 44, height: 44, background: "#FDF6EE", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>🐾</div>}
                        </td>
                        <td style={{ padding: "8px", fontSize: 13, color: "#2C1A0E", maxWidth: 220 }}>
                          <div style={{ fontWeight: 600 }}>{urun.ad?.substring(0, 50)}{urun.ad?.length > 50 ? "..." : ""}</div>
                          <div style={{ fontSize: 11, opacity: 0.4, marginTop: 2 }}>ID: {urun.id}</div>
                        </td>
                        <td style={{ padding: "8px", fontSize: 13, fontWeight: 700, color: "#5C3D2E", whiteSpace: "nowrap" }}>₺{parseFloat(urun.fiyat).toFixed(2)}</td>
                        <td style={{ padding: "8px", fontSize: 13, fontWeight: 700, color: "#E8845A", whiteSpace: "nowrap" }}>
                          {urun.indirimli_fiyat ? `₺${parseFloat(urun.indirimli_fiyat).toFixed(2)}` : <span style={{ opacity: 0.3 }}>-</span>}
                        </td>
                        <td style={{ padding: "8px" }}>
                          <span style={{ background: urun.stok > 10 ? "#E8F5E9" : urun.stok > 0 ? "#FFF8E1" : "#FFEBEE", color: urun.stok > 10 ? "#2E7D32" : urun.stok > 0 ? "#F57F17" : "#C62828", padding: "3px 9px", borderRadius: 50, fontSize: 12, fontWeight: 700 }}>{urun.stok}</span>
                        </td>
                        <td style={{ padding: "8px", fontSize: 12, opacity: 0.6 }}>{urun.kategoriler?.ad || "-"}</td>
                        <td style={{ padding: "8px" }}>
                          {urun.etiket && <span style={{ background: "#E8845A", color: "white", padding: "2px 8px", borderRadius: 50, fontSize: 11, fontWeight: 700 }}>{urun.etiket}</span>}
                        </td>
                        <td style={{ padding: "8px" }}>
                          <span style={{ background: urun.aktif ? "#E8F5E9" : "#FFEBEE", color: urun.aktif ? "#2E7D32" : "#C62828", padding: "3px 9px", borderRadius: 50, fontSize: 11, fontWeight: 700 }}>
                            {urun.aktif ? "Aktif" : "Pasif"}
                          </span>
                        </td>
                        <td style={{ padding: "8px" }}>
                          <div style={{ display: "flex", gap: 5 }}>
                            <button onClick={() => setDuzenleUrun({ ...urun })}
                              style={{ background: "#FDF6EE", border: "2px solid #E8D5B7", borderRadius: 8, padding: "5px 10px", fontSize: 12, cursor: "pointer", fontWeight: 600, color: "#5C3D2E" }}>✏️ Düzenle</button>
                            <button onClick={() => urunSil(urun.id)}
                              style={{ background: "#FFEBEE", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 12, cursor: "pointer", color: "#C62828" }}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* SAYFALAMA */}
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
                <button onClick={() => { setSayfaNo(0); urunleriYukle(0, aramaMetni); }} disabled={sayfaNo === 0}
                  style={{ ...btn("#5C3D2E"), padding: "8px 14px", opacity: sayfaNo === 0 ? 0.4 : 1 }}>« İlk</button>
                <button onClick={() => { const p = Math.max(0, sayfaNo - 1); setSayfaNo(p); urunleriYukle(p, aramaMetni); }} disabled={sayfaNo === 0}
                  style={{ ...btn("#5C3D2E"), padding: "8px 14px", opacity: sayfaNo === 0 ? 0.4 : 1 }}>← Önceki</button>
                <span style={{ padding: "8px 16px", background: "white", border: "2px solid #E8D5B7", borderRadius: 10, fontSize: 13, fontWeight: 700 }}>
                  {sayfaNo + 1} / {Math.max(1, toplamSayfa)} ({toplamUrun} ürün)
                </span>
                <button onClick={() => { const p = sayfaNo + 1; setSayfaNo(p); urunleriYukle(p, aramaMetni); }} disabled={sayfaNo >= toplamSayfa - 1}
                  style={{ ...btn("#5C3D2E"), padding: "8px 14px", opacity: sayfaNo >= toplamSayfa - 1 ? 0.4 : 1 }}>Sonraki →</button>
                <button onClick={() => { const p = toplamSayfa - 1; setSayfaNo(p); urunleriYukle(p, aramaMetni); }} disabled={sayfaNo >= toplamSayfa - 1}
                  style={{ ...btn("#5C3D2E"), padding: "8px 14px", opacity: sayfaNo >= toplamSayfa - 1 ? 0.4 : 1 }}>Son »</button>
              </div>
            </div>
          </div>
        )}

        {/* SİPARİŞLER */}
        {aktifSayfa === "siparisler" && (
          <div>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700, color: "#2C1A0E", marginBottom: 24 }}>Sipariş Yönetimi</h1>
            <div style={{ background: "white", borderRadius: 18, padding: 22, boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
              {siparisler.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", opacity: 0.4 }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
                  <div>Henüz sipariş yok</div>
                </div>
              ) : siparisler.map(s => (
                <div key={s.id} style={{ background: "#FDF6EE", borderRadius: 16, padding: 18, marginBottom: 14, border: "1px solid #E8D5B7" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                    <div>
                      <span style={{ fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 700, color: "#5C3D2E" }}>#{s.siparis_no}</span>
                      <span style={{ fontSize: 12, opacity: 0.5, marginLeft: 10 }}>{new Date(s.created_at).toLocaleDateString("tr-TR")}</span>
                    </div>
                    <div style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: "#E8845A" }}>₺{parseFloat(s.toplam || 0).toFixed(2)}</div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                    <div style={{ background: "white", borderRadius: 10, padding: "10px 14px" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.5, marginBottom: 3 }}>MÜŞTERİ</div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{s.ad} {s.soyad}</div>
                      <div style={{ fontSize: 12, opacity: 0.6 }}>{s.email}</div>
                    </div>
                    <div style={{ background: "white", borderRadius: 10, padding: "10px 14px" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.5, marginBottom: 3 }}>ADRES</div>
                      <div style={{ fontSize: 12 }}>{s.adres}, {s.sehir}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <select value={s.durum} onChange={async e => { await supabase.from("siparisler").update({ durum: e.target.value }).eq("id", s.id); siparisleriYukle(); goster("✅ Güncellendi"); }}
                      style={{ padding: "9px 12px", border: "2px solid #E8D5B7", borderRadius: 10, fontSize: 13, outline: "none", fontFamily: "inherit", background: "white" }}>
                      <option value="beklemede">⏳ Beklemede</option>
                      <option value="hazirlaniyor">🔧 Hazırlanıyor</option>
                      <option value="kargoda">🚚 Kargoda</option>
                      <option value="tamamlandi">✅ Tamamlandı</option>
                      <option value="iptal">❌ İptal</option>
                    </select>
                    <select value={s.odeme_durumu || "beklemede"} onChange={async e => { await supabase.from("siparisler").update({ odeme_durumu: e.target.value }).eq("id", s.id); siparisleriYukle(); goster("✅ Ödeme durumu güncellendi"); }}
                      style={{ padding: "9px 12px", border: "2px solid #E8D5B7", borderRadius: 10, fontSize: 13, outline: "none", fontFamily: "inherit", background: "white" }}>
                      <option value="beklemede">⏳ Ödeme Bekliyor</option>
                      <option value="odendi">💳 Ödendi</option>
                      <option value="iptal">❌ İptal</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* KATEGORİLER */}
        {aktifSayfa === "kategoriler" && (
          <div>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700, color: "#2C1A0E", marginBottom: 24 }}>Kategoriler ({kategoriler.length})</h1>
            <div style={{ background: "white", borderRadius: 18, padding: 22, boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#FDF6EE" }}>
                    {["ID", "Kategori Adı", "Slug", "Üst Kategori", "Durum"].map(h => (
                      <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#5C3D2E", opacity: 0.6, textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {kategoriler.map(k => (
                    <tr key={k.id} style={{ borderBottom: "1px solid #F0E8E0" }}>
                      <td style={{ padding: "10px 12px", fontSize: 12, opacity: 0.4 }}>{k.id}</td>
                      <td style={{ padding: "10px 12px", fontSize: 14, fontWeight: 600, paddingLeft: k.ust_kategori_id ? 28 : 12 }}>{k.ust_kategori_id ? "└ " : ""}{k.ad}</td>
                      <td style={{ padding: "10px 12px", fontSize: 12, opacity: 0.6, fontFamily: "monospace" }}>{k.slug}</td>
                      <td style={{ padding: "10px 12px", fontSize: 12, opacity: 0.6 }}>{kategoriler.find(u => u.id === k.ust_kategori_id)?.ad || "-"}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ background: k.aktif ? "#E8F5E9" : "#FFEBEE", color: k.aktif ? "#2E7D32" : "#C62828", padding: "3px 9px", borderRadius: 50, fontSize: 11, fontWeight: 700 }}>
                          {k.aktif ? "Aktif" : "Pasif"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MARKALAR */}
        {aktifSayfa === "markalar" && (
          <div>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700, color: "#2C1A0E", marginBottom: 24 }}>Markalar ({markalar.length})</h1>
            <div style={{ background: "white", borderRadius: 18, padding: 22, boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#FDF6EE" }}>
                    {["ID", "Marka Adı", "Slug", "Durum"].map(h => (
                      <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#5C3D2E", opacity: 0.6, textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {markalar.map(m => (
                    <tr key={m.id} style={{ borderBottom: "1px solid #F0E8E0" }}>
                      <td style={{ padding: "10px 12px", fontSize: 12, opacity: 0.4 }}>{m.id}</td>
                      <td style={{ padding: "10px 12px", fontSize: 14, fontWeight: 600 }}>{m.ad}</td>
                      <td style={{ padding: "10px 12px", fontSize: 12, opacity: 0.6, fontFamily: "monospace" }}>{m.slug}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ background: m.aktif ? "#E8F5E9" : "#FFEBEE", color: m.aktif ? "#2E7D32" : "#C62828", padding: "3px 9px", borderRadius: 50, fontSize: 11, fontWeight: 700 }}>
                          {m.aktif ? "Aktif" : "Pasif"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* KUPONLAR */}
        {aktifSayfa === "kuponlar" && (
          <div>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700, color: "#2C1A0E", marginBottom: 24 }}>Kupon Yönetimi</h1>
            <div style={{ background: "white", borderRadius: 18, padding: 22, marginBottom: 16, boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 700, color: "#2C1A0E", marginBottom: 14 }}>➕ Yeni Kupon</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <input placeholder="Kupon Kodu *" value={yeniKupon.kod} onChange={e => setYeniKupon({ ...yeniKupon, kod: e.target.value.toUpperCase() })} style={inputStyle} />
                <select value={yeniKupon.indirim_tipi} onChange={e => setYeniKupon({ ...yeniKupon, indirim_tipi: e.target.value })} style={inputStyle}>
                  <option value="yuzde">Yüzde (%)</option>
                  <option value="tl">TL İndirim</option>
                </select>
                <input placeholder="İndirim Değeri *" type="number" value={yeniKupon.indirim_degeri} onChange={e => setYeniKupon({ ...yeniKupon, indirim_degeri: e.target.value })} style={inputStyle} />
                <input placeholder="Min. Sepet ₺" type="number" value={yeniKupon.min_sepet} onChange={e => setYeniKupon({ ...yeniKupon, min_sepet: e.target.value })} style={inputStyle} />
                <input placeholder="Kullanım Limiti" type="number" value={yeniKupon.kullanim_limiti} onChange={e => setYeniKupon({ ...yeniKupon, kullanim_limiti: e.target.value })} style={inputStyle} />
                <input placeholder="Bitiş Tarihi" type="date" value={yeniKupon.bitis_tarihi} onChange={e => setYeniKupon({ ...yeniKupon, bitis_tarihi: e.target.value })} style={inputStyle} />
              </div>
              <button onClick={kuponEkle} style={btn()}>Kupon Oluştur →</button>
            </div>
            <div style={{ background: "white", borderRadius: 18, padding: 22, boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#FDF6EE" }}>
                    {["Kod", "İndirim", "Min Sepet", "Kullanım", "Bitiş", "Durum", ""].map(h => (
                      <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#5C3D2E", opacity: 0.6, textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {kuponlar.map(k => (
                    <tr key={k.id} style={{ borderBottom: "1px solid #F0E8E0" }}>
                      <td style={{ padding: "12px", fontWeight: 700, color: "#E8845A", fontFamily: "monospace", fontSize: 15 }}>{k.kod}</td>
                      <td style={{ padding: "12px", fontSize: 14, fontWeight: 700 }}>{k.indirim_degeri}{k.indirim_tipi === "yuzde" ? "%" : "₺"}</td>
                      <td style={{ padding: "12px", fontSize: 13 }}>₺{k.min_sepet || 0}</td>
                      <td style={{ padding: "12px", fontSize: 13 }}>{k.kullanim_sayisi || 0}/{k.kullanim_limiti}</td>
                      <td style={{ padding: "12px", fontSize: 12, opacity: 0.6 }}>{k.bitis_tarihi ? new Date(k.bitis_tarihi).toLocaleDateString("tr-TR") : "Süresiz"}</td>
                      <td style={{ padding: "12px" }}>
                        <span style={{ background: k.aktif ? "#E8F5E9" : "#FFEBEE", color: k.aktif ? "#2E7D32" : "#C62828", padding: "3px 9px", borderRadius: 50, fontSize: 11, fontWeight: 700 }}>
                          {k.aktif ? "Aktif" : "Pasif"}
                        </span>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <button onClick={async () => { await supabase.from("kuponlar").delete().eq("id", k.id); kuponlariYukle(); goster("✅ Silindi"); }}
                          style={{ background: "#FFEBEE", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 12, cursor: "pointer", color: "#C62828" }}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* BLOG SORULARI */}
        {aktifSayfa === "blog" && (
          <div>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700, color: "#2C1A0E", marginBottom: 24 }}>
              Blog Soruları {bekleyenSorular.length > 0 && <span style={{ background: "#E8845A", color: "white", borderRadius: 50, fontSize: 14, padding: "3px 12px", marginLeft: 10 }}>{bekleyenSorular.length} bekliyor</span>}
            </h1>
            {bekleyenSorular.length > 0 && (
              <div style={{ background: "white", borderRadius: 18, padding: 22, marginBottom: 20, boxShadow: "0 4px 16px rgba(92,61,46,0.06)", border: "2px solid #F4C09A" }}>
                <h2 style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 700, color: "#2C1A0E", marginBottom: 16 }}>⏳ Bekleyen Sorular</h2>
                {bekleyenSorular.map(s => (
                  <div key={s.id} style={{ background: "#FFF8E8", borderRadius: 14, padding: 18, marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: 14, color: "#5C3D2E" }}>{s.ad}</span>
                        <span style={{ fontSize: 11, opacity: 0.5, marginLeft: 8 }}>{new Date(s.created_at).toLocaleDateString("tr-TR")}</span>
                      </div>
                      <button onClick={async () => { await supabase.from("blog_sorular").delete().eq("id", s.id); blogSorulariYukle(); goster("✅ Silindi"); }}
                        style={{ background: "#FFEBEE", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 12, cursor: "pointer", color: "#C62828" }}>🗑️</button>
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#5C3D2E", marginBottom: 12 }}>❓ {s.soru}</p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <textarea placeholder="Cevap yazın..." value={cevaplar[s.id] || ""} onChange={e => setCevaplar(prev => ({ ...prev, [s.id]: e.target.value }))}
                        rows={3} style={{ flex: 1, padding: "10px 14px", border: "2px solid #E8D5B7", borderRadius: 10, fontSize: 13, outline: "none", fontFamily: "inherit", resize: "vertical" as const }} />
                      <button onClick={async () => { const cevap = cevaplar[s.id]; if (!cevap?.trim()) return; await supabase.from("blog_sorular").update({ cevap, onaylandi: true }).eq("id", s.id); setCevaplar(prev => { const y = { ...prev }; delete y[s.id]; return y; }); blogSorulariYukle(); goster("✅ Cevap kaydedildi"); }}
                        disabled={!cevaplar[s.id]?.trim()} style={{ ...btn(!cevaplar[s.id]?.trim() ? "#ccc" : "#E8845A"), alignSelf: "flex-start", whiteSpace: "nowrap" }}>
                        💾 Cevapla & Yayınla
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ background: "white", borderRadius: 18, padding: 22, boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 700, color: "#2C1A0E", marginBottom: 16 }}>✅ Yayındaki Sorular ({blogSorular.filter(s => s.onaylandi).length})</h2>
              {blogSorular.filter(s => s.onaylandi).map(s => (
                <div key={s.id} style={{ background: "#F9FBF9", borderRadius: 14, padding: 16, marginBottom: 12, border: "1px solid #E8D5B7" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{s.ad}</span>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={async () => { await supabase.from("blog_sorular").update({ onaylandi: false }).eq("id", s.id); blogSorulariYukle(); goster("✅ Gizlendi"); }}
                        style={{ background: "#FFF5F0", color: "#E8845A", border: "none", borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Gizle</button>
                      <button onClick={async () => { await supabase.from("blog_sorular").delete().eq("id", s.id); blogSorulariYukle(); goster("✅ Silindi"); }}
                        style={{ background: "#FFEBEE", border: "none", borderRadius: 8, padding: "4px 10px", fontSize: 11, cursor: "pointer", color: "#C62828" }}>🗑️</button>
                    </div>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#5C3D2E", marginBottom: s.cevap ? 8 : 0 }}>❓ {s.soru}</p>
                  {s.cevap && <div style={{ background: "#FFF5F0", borderRadius: 10, padding: "10px 12px", borderLeft: "3px solid #E8845A", fontSize: 12, color: "#5C3D2E" }}>{s.cevap}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* KARGO */}
        {aktifSayfa === "kargo" && (
          <div>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700, color: "#2C1A0E", marginBottom: 24 }}>Kargo Ayarları</h1>
            <div style={{ background: "white", borderRadius: 18, padding: 28, boxShadow: "0 4px 16px rgba(92,61,46,0.06)", maxWidth: 500 }}>
              {kargoAyar ? (
                <>
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ fontSize: 13, fontWeight: 700, color: "#5C3D2E", display: "block", marginBottom: 8 }}>🎁 Ücretsiz Kargo Limiti (₺)</label>
                    <input type="number" step="0.01"
                      value={kargoAyar.ucretsiz_limit ?? kargoAyar["ucretsiz limit"] ?? ""}
                      onChange={e => setKargoAyar({ ...kargoAyar, ucretsiz_limit: e.target.value, "ucretsiz limit": e.target.value })}
                      style={inputStyle} />
                    <div style={{ fontSize: 12, color: "#5C3D2E", opacity: 0.5, marginTop: 4 }}>Bu tutarın üzeri ücretsiz kargo</div>
                  </div>
                  <div style={{ marginBottom: 24 }}>
                    <label style={{ fontSize: 13, fontWeight: 700, color: "#5C3D2E", display: "block", marginBottom: 8 }}>🚚 Sabit Kargo Ücreti (₺)</label>
                    <input type="number" step="0.01"
                      value={kargoAyar.sabit_ucret || ""}
                      onChange={e => setKargoAyar({ ...kargoAyar, sabit_ucret: e.target.value })}
                      style={inputStyle} />
                  </div>
                  <button onClick={kargoGuncelle} style={{ ...btn(), padding: "14px 28px", fontSize: 15 }}>💾 Kaydet</button>
                  <div style={{ marginTop: 16, padding: 14, background: "#FDF6EE", borderRadius: 12, fontSize: 13, color: "#5C3D2E", opacity: 0.7 }}>
                    Mevcut: Ücretsiz limit = ₺{kargoAyar.ucretsiz_limit ?? kargoAyar["ucretsiz limit"] ?? "?"} | Sabit ücret = ₺{kargoAyar.sabit_ucret ?? "?"}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: "center", padding: "40px 0", opacity: 0.5 }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🚀</div>
                  <div>Kargo ayarı bulunamadı</div>
                  <div style={{ fontSize: 12, marginTop: 8 }}>Supabase'de kargo_ayarlari tablosunu kontrol edin</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SİTE AYARLARI */}
        {aktifSayfa === "ayarlar" && (
          <div>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700, color: "#2C1A0E", marginBottom: 24 }}>Site Ayarları</h1>
            {[
              { baslik: "💳 İyzico Ödeme Ayarları", alanlar: [{ key: "iyzico_api_key", label: "API Key" }, { key: "iyzico_secret_key", label: "Secret Key" }, { key: "iyzico_base_url", label: "Base URL" }] },
              { baslik: "🏦 Havale / EFT Bilgileri", alanlar: [{ key: "havale_banka1", label: "Banka Adı" }, { key: "havale_iban1", label: "IBAN" }, { key: "havale_ad1", label: "Hesap Sahibi" }] },
              { baslik: "📞 İletişim", alanlar: [{ key: "whatsapp_no", label: "WhatsApp Numarası" }, { key: "site_email", label: "E-posta" }] },
            ].map((bolum, bi) => (
              <div key={bi} style={{ background: "white", borderRadius: 18, padding: 24, marginBottom: 16, boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
                <h2 style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 700, color: "#2C1A0E", marginBottom: 16 }}>{bolum.baslik}</h2>
                {bolum.alanlar.map(({ key, label }) => (
                  <div key={key} style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#5C3D2E", opacity: 0.7, display: "block", marginBottom: 6 }}>{label}</label>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input value={siteAyarlari[key] || ""} onChange={e => setSiteAyarlari({ ...siteAyarlari, [key]: e.target.value })} style={{ ...inputStyle, marginBottom: 0, flex: 1 }} />
                      <button onClick={() => siteAyarKaydet(key, siteAyarlari[key] || "")} style={{ ...btn(), padding: "10px 16px", whiteSpace: "nowrap" }}>Kaydet</button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}