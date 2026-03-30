"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

const ADMIN_SIFRE = "evemama2025";

export default function Admin() {
  const [giris, setGiris] = useState(false);
  const [sifre, setSifre] = useState("");
  const [hataMesaji, setHataMesaji] = useState("");
  const [aktifSayfa, setAktifSayfa] = useState("dashboard");
  const [istatistikler, setIstatistikler] = useState({ urunler: 0, siparisler: 0, kategoriler: 0, markalar: 0 });
  const [urunler, setUrunler] = useState<any[]>([]);
  const [siparisler, setSiparisler] = useState<any[]>([]);
  const [kategoriler, setKategoriler] = useState<any[]>([]);
  const [markalar, setMarkalar] = useState<any[]>([]);
  const [bannerlar, setBannerlar] = useState<any[]>([]);
  const [kuponlar, setKuponlar] = useState<any[]>([]);
  const [kargoAyar, setKargoAyar] = useState<any>(null);
  const [siteAyarlari, setSiteAyarlari] = useState<any>({});
  const [blogSorular, setBlogSorular] = useState<any[]>([]);
  const [cevaplar, setCevaplar] = useState<{ [key: number]: string }>({});
  const [yukleniyor, setYukleniyor] = useState(false);
  const [aramaMetni, setAramaMetni] = useState("");
  const [duzenleUrun, setDuzenleUrun] = useState<any>(null);
  const [yeniUrun, setYeniUrun] = useState({ ad: "", fiyat: "", indirimli_fiyat: "", stok: "", resim_url: "", kategori_id: "", marka_id: "", kisa_aciklama: "", uzun_aciklama: "", etiket: "" });
  const [bildirim, setBildirim] = useState("");
  const [seciliUrunler, setSeciliUrunler] = useState<number[]>([]);
  const [topluIslem, setTopluIslem] = useState({ tip: "fiyat_yuzde", deger: "", etiket: "" });
  const [yeniBanner, setYeniBanner] = useState({ baslik: "", alt_baslik: "", renk: "linear-gradient(135deg,#F8E2C8,#F4C09A,#E8845A)", emoji: "🐱", link: "/urunler", kod: "" });
  const [yeniKupon, setYeniKupon] = useState({ kod: "", indirim_tipi: "yuzde", indirim_degeri: "", min_sepet: "", kullanim_limiti: "100", bitis_tarihi: "" });

  const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 14px", border: "2px solid #E8D5B7", borderRadius: 10, fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box", marginBottom: 10, background: "white", color: "#2C1A0E" };
  const btnStyle = (renk = "#E8845A"): React.CSSProperties => ({ background: renk, color: "white", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" });

  const goster = (mesaj: string) => { setBildirim(mesaj); setTimeout(() => setBildirim(""), 3000); };

  const handleGiris = () => {
    if (sifre === ADMIN_SIFRE) { setGiris(true); veriYukle(); }
    else setHataMesaji("Hatalı şifre!");
  };

  const veriYukle = async () => {
    setYukleniyor(true);
    const [{ count: uc }, { count: sc }, { count: kc }, { count: mc }] = await Promise.all([
      supabase.from("urunler").select("*", { count: "exact", head: true }),
      supabase.from("siparisler").select("*", { count: "exact", head: true }),
      supabase.from("kategoriler").select("*", { count: "exact", head: true }),
      supabase.from("markalar").select("*", { count: "exact", head: true }),
    ]);
    setIstatistikler({ urunler: uc || 0, siparisler: sc || 0, kategoriler: kc || 0, markalar: mc || 0 });
    setYukleniyor(false);
  };

  const urunleriYukle = async () => {
    setYukleniyor(true);
    const { data } = await supabase.from("urunler").select("*, kategoriler(ad), markalar(ad)").order("created_at", { ascending: false }).limit(200);
    setUrunler(data || []);
    setYukleniyor(false);
  };

  const siparisleriYukle = async () => {
    setYukleniyor(true);
    const { data } = await supabase.from("siparisler").select("*").order("created_at", { ascending: false }).limit(50);
    setSiparisler(data || []);
    setYukleniyor(false);
  };

  const kategorileriYukle = async () => {
    const { data } = await supabase.from("kategoriler").select("*").order("sira");
    setKategoriler(data || []);
  };

  const markalariYukle = async () => {
    const { data } = await supabase.from("markalar").select("*").order("ad");
    setMarkalar(data || []);
  };

  const bannerlariYukle = async () => {
    const { data } = await supabase.from("bannerlar").select("*").order("sira");
    setBannerlar(data || []);
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

  useEffect(() => {
    if (giris) { kategorileriYukle(); markalariYukle(); bannerlariYukle(); kuponlariYukle(); kargoYukle(); siteAyarlariYukle(); blogSorulariYukle(); }
  }, [giris]);

  useEffect(() => {
    if (aktifSayfa === "urunler") urunleriYukle();
    if (aktifSayfa === "siparisler") siparisleriYukle();
    if (aktifSayfa === "blog") blogSorulariYukle();
  }, [aktifSayfa]);

  const urunSil = async (id: number) => {
    if (!confirm("Bu ürünü silmek istediğinizden emin misiniz?")) return;
    await supabase.from("urunler").delete().eq("id", id);
    urunleriYukle();
    goster("✅ Ürün silindi");
  };

  const urunGuncelle = async () => {
    if (!duzenleUrun) return;
    await supabase.from("urunler").update({
      ad: duzenleUrun.ad,
      fiyat: parseFloat(duzenleUrun.fiyat),
      indirimli_fiyat: duzenleUrun.indirimli_fiyat ? parseFloat(duzenleUrun.indirimli_fiyat) : null,
      stok: parseInt(duzenleUrun.stok),
      resim_url: duzenleUrun.resim_url,
      kisa_aciklama: duzenleUrun.kisa_aciklama,
      uzun_aciklama: duzenleUrun.uzun_aciklama,
      etiket: duzenleUrun.etiket || null,
      kategori_id: duzenleUrun.kategori_id || null,
      marka_id: duzenleUrun.marka_id || null,
      aktif: duzenleUrun.aktif,
    }).eq("id", duzenleUrun.id);
    setDuzenleUrun(null);
    urunleriYukle();
    goster("✅ Ürün güncellendi");
  };

  const urunEkle = async () => {
    if (!yeniUrun.ad || !yeniUrun.fiyat) return;
    const slug = yeniUrun.ad.toLowerCase()
      .replace(/ç/g,"c").replace(/ğ/g,"g").replace(/ı/g,"i").replace(/ö/g,"o").replace(/ş/g,"s").replace(/ü/g,"u")
      .replace(/[^a-z0-9\s-]/g,"").trim().replace(/\s+/g,"-") + "-" + Date.now();
    await supabase.from("urunler").insert({
      ad: yeniUrun.ad, slug,
      fiyat: parseFloat(yeniUrun.fiyat),
      indirimli_fiyat: yeniUrun.indirimli_fiyat ? parseFloat(yeniUrun.indirimli_fiyat) : null,
      stok: parseInt(yeniUrun.stok) || 0,
      resim_url: yeniUrun.resim_url || null,
      kisa_aciklama: yeniUrun.kisa_aciklama || null,
      uzun_aciklama: yeniUrun.uzun_aciklama || null,
      etiket: yeniUrun.etiket || null,
      kategori_id: yeniUrun.kategori_id || null,
      marka_id: yeniUrun.marka_id || null,
      aktif: true,
    });
    setYeniUrun({ ad: "", fiyat: "", indirimli_fiyat: "", stok: "", resim_url: "", kategori_id: "", marka_id: "", kisa_aciklama: "", uzun_aciklama: "", etiket: "" });
    urunleriYukle();
    goster("✅ Ürün eklendi");
  };

  const topluIslemUygula = async () => {
    if (seciliUrunler.length === 0) { goster("⚠️ Önce ürün seçin!"); return; }
    if (topluIslem.tip === "fiyat_yuzde" && topluIslem.deger) {
      const yuzde = parseFloat(topluIslem.deger) / 100;
      for (const id of seciliUrunler) {
        const urun = urunler.find(u => u.id === id);
        if (urun) await supabase.from("urunler").update({ fiyat: Math.round(urun.fiyat * (1 + yuzde) * 100) / 100 }).eq("id", id);
      }
      goster(`✅ ${seciliUrunler.length} ürün fiyatı güncellendi`);
    } else if (topluIslem.tip === "fiyat_tl" && topluIslem.deger) {
      const miktar = parseFloat(topluIslem.deger);
      for (const id of seciliUrunler) {
        const urun = urunler.find(u => u.id === id);
        if (urun) await supabase.from("urunler").update({ fiyat: Math.max(0, urun.fiyat + miktar) }).eq("id", id);
      }
      goster(`✅ ${seciliUrunler.length} ürün fiyatı güncellendi`);
    } else if (topluIslem.tip === "stok_ac") {
      for (const id of seciliUrunler) await supabase.from("urunler").update({ aktif: true }).eq("id", id);
      goster(`✅ ${seciliUrunler.length} ürün aktif edildi`);
    } else if (topluIslem.tip === "stok_kapat") {
      for (const id of seciliUrunler) await supabase.from("urunler").update({ aktif: false }).eq("id", id);
      goster(`✅ ${seciliUrunler.length} ürün pasif edildi`);
    } else if (topluIslem.tip === "etiket" && topluIslem.etiket) {
      for (const id of seciliUrunler) await supabase.from("urunler").update({ etiket: topluIslem.etiket }).eq("id", id);
      goster(`✅ ${seciliUrunler.length} ürüne etiket eklendi`);
    } else if (topluIslem.tip === "indirim_kaldir") {
      for (const id of seciliUrunler) await supabase.from("urunler").update({ indirimli_fiyat: null, etiket: null }).eq("id", id);
      goster(`✅ ${seciliUrunler.length} üründen indirim kaldırıldı`);
    }
    setSeciliUrunler([]);
    urunleriYukle();
  };

  const siparisGuncelle = async (id: number, durum: string) => {
    await supabase.from("siparisler").update({ durum }).eq("id", id);
    siparisleriYukle();
    goster("✅ Sipariş güncellendi");
  };

  const bannerEkle = async () => {
    if (!yeniBanner.baslik) return;
    await supabase.from("bannerlar").insert({ ...yeniBanner, aktif: true, sira: bannerlar.length });
    setYeniBanner({ baslik: "", alt_baslik: "", renk: "linear-gradient(135deg,#F8E2C8,#F4C09A,#E8845A)", emoji: "🐱", link: "/urunler", kod: "" });
    bannerlariYukle();
    goster("✅ Banner eklendi");
  };

  const bannerSil = async (id: number) => {
    await supabase.from("bannerlar").delete().eq("id", id);
    bannerlariYukle();
    goster("✅ Banner silindi");
  };

  const bannerToggle = async (id: number, aktif: boolean) => {
    await supabase.from("bannerlar").update({ aktif: !aktif }).eq("id", id);
    bannerlariYukle();
  };

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

  const kuponSil = async (id: number) => {
    await supabase.from("kuponlar").delete().eq("id", id);
    kuponlariYukle();
    goster("✅ Kupon silindi");
  };

  const kargoGuncelle = async () => {
    if (!kargoAyar) return;
    await supabase.from("kargo_ayarlari").update({
      "ucretsiz limit": kargoAyar.ucretsiz_limit,
      sabit_ucret: kargoAyar.sabit_ucret,
    }).eq("id", kargoAyar.id);
    goster("✅ Kargo ayarları güncellendi");
  };

  const siteAyarKaydet = async (anahtar: string, deger: string) => {
    await supabase.from("site_ayarlari").upsert({ anahtar, deger, updated_at: new Date().toISOString() }, { onConflict: "anahtar" });
    goster("✅ Ayar kaydedildi");
  };

  const soruOnayla = async (id: number, onaylandi: boolean) => {
    await supabase.from("blog_sorular").update({ onaylandi }).eq("id", id);
    blogSorulariYukle();
    goster(onaylandi ? "✅ Soru onaylandı" : "✅ Soru gizlendi");
  };

  const soruCevapla = async (id: number) => {
    const cevap = cevaplar[id];
    if (!cevap?.trim()) return;
    await supabase.from("blog_sorular").update({ cevap, onaylandi: true }).eq("id", id);
    setCevaplar(prev => { const y = { ...prev }; delete y[id]; return y; });
    blogSorulariYukle();
    goster("✅ Cevap kaydedildi ve soru yayınlandı");
  };

  const soruSil = async (id: number) => {
    if (!confirm("Bu soruyu silmek istediğinizden emin misiniz?")) return;
    await supabase.from("blog_sorular").delete().eq("id", id);
    blogSorulariYukle();
    goster("✅ Soru silindi");
  };

  const filtrelenmisUrunler = urunler.filter(u => u.ad?.toLowerCase().includes(aramaMetni.toLowerCase()));
  const bekleyenSorular = blogSorular.filter(s => !s.onaylandi);
  const onaylananSorular = blogSorular.filter(s => s.onaylandi);

  const etiketRenk: any = {
    "yeni": "#4CAF50", "indirim": "#E8845A", "cok-satan": "#9C27B0",
    "kampanya": "#F44336", "onerilir": "#2196F3", "son-stok": "#FF9800"
  };

  if (!giris) return (
    <main style={{ minHeight: "100vh", background: "#FDF6EE", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
      <div style={{ background: "white", borderRadius: 24, padding: "48px 40px", maxWidth: 400, width: "100%", boxShadow: "0 20px 60px rgba(92,61,46,0.1)", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 24, fontWeight: 700, color: "#5C3D2E", marginBottom: 8 }}>Admin Paneli</div>
        <div style={{ fontSize: 13, color: "#5C3D2E", opacity: 0.5, marginBottom: 28 }}>evemama.net yönetim paneli</div>
        <input type="password" value={sifre} onChange={e => setSifre(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleGiris()} placeholder="Şifrenizi girin"
          style={{ width: "100%", padding: "14px 18px", border: "2px solid #E8D5B7", borderRadius: 10, fontSize: 16, outline: "none", fontFamily: "inherit", boxSizing: "border-box", marginBottom: 10, textAlign: "center", background: "white", color: "#2C1A0E" }} />
        {hataMesaji && <div style={{ color: "#E57373", fontSize: 13, marginBottom: 12 }}>{hataMesaji}</div>}
        <button onClick={handleGiris} style={{ ...btnStyle(), width: "100%", padding: "14px", fontSize: 15 }}>Giriş Yap →</button>
      </div>
    </main>
  );

  const menuler = [
    { id: "dashboard", icon: "📊", ad: "Dashboard" },
    { id: "urunler", icon: "📦", ad: "Ürünler" },
    { id: "siparisler", icon: "🛒", ad: "Siparişler" },
    { id: "kategoriler", icon: "📁", ad: "Kategoriler" },
    { id: "markalar", icon: "🏷️", ad: "Markalar" },
    { id: "bannerlar", icon: "🖼️", ad: "Bannerlar" },
    { id: "kuponlar", icon: "🎟️", ad: "Kuponlar" },
    { id: "blog", icon: "📝", ad: "Blog Soruları", badge: bekleyenSorular.length },
    { id: "kargo", icon: "🚀", ad: "Kargo Ayarları" },
    { id: "ayarlar", icon: "⚙️", ad: "Site Ayarları" },
  ];

  return (
    <main style={{ minHeight: "100vh", background: "#F5F0EB", fontFamily: "sans-serif", display: "flex" }}>
      {bildirim && (
        <div style={{ position: "fixed", top: 20, right: 20, background: "#5C3D2E", color: "white", padding: "12px 20px", borderRadius: 12, fontSize: 14, fontWeight: 600, zIndex: 999, boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}>
          {bildirim}
        </div>
      )}

      {/* Sol Menü */}
      <div style={{ width: 220, background: "#2C1A0E", minHeight: "100vh", padding: "24px 0", position: "fixed", left: 0, top: 0, bottom: 0, overflowY: "auto" }}>
        <div style={{ padding: "0 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 17, fontWeight: 700, color: "#FDF6EE" }}>evemama<span style={{ color: "#E8845A" }}>.net</span></div>
          <div style={{ fontSize: 11, color: "#F4C09A", opacity: 0.6, marginTop: 2 }}>Admin Paneli</div>
        </div>
        <nav style={{ padding: "12px 10px" }}>
          {menuler.map(m => (
            <button key={m.id} onClick={() => setAktifSayfa(m.id)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", background: aktifSayfa === m.id ? "rgba(232,132,90,0.15)" : "none", border: "none", borderLeft: aktifSayfa === m.id ? "3px solid #E8845A" : "3px solid transparent", borderRadius: 0, cursor: "pointer", color: aktifSayfa === m.id ? "#E8845A" : "#FDF6EE", fontSize: 13, fontWeight: aktifSayfa === m.id ? 700 : 400, marginBottom: 2, fontFamily: "inherit", textAlign: "left", opacity: aktifSayfa === m.id ? 1 : 0.65, justifyContent: "space-between" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 16 }}>{m.icon}</span> {m.ad}
              </span>
              {m.badge && m.badge > 0 && (
                <span style={{ background: "#E8845A", color: "white", borderRadius: 50, fontSize: 10, padding: "1px 6px", fontWeight: 700 }}>{m.badge}</span>
              )}
            </button>
          ))}
        </nav>
        <div style={{ position: "fixed", bottom: 20, left: 0, width: 220, padding: "0 10px" }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", background: "rgba(255,255,255,0.05)", borderRadius: 10, color: "#FDF6EE", textDecoration: "none", fontSize: 13, opacity: 0.6 }}>
            🏠 Siteye Git
          </a>
        </div>
      </div>

      {/* İçerik */}
      <div style={{ marginLeft: 220, flex: 1, padding: "28px 32px", minHeight: "100vh" }}>

        {/* DASHBOARD */}
        {aktifSayfa === "dashboard" && (
          <div>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700, color: "#2C1A0E", marginBottom: 6 }}>Dashboard</h1>
            <p style={{ fontSize: 14, color: "#5C3D2E", opacity: 0.5, marginBottom: 28 }}>Genel bakış</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
              {[
                { icon: "📦", ad: "Toplam Ürün", deger: istatistikler.urunler, renk: "#E8845A" },
                { icon: "🛒", ad: "Sipariş", deger: istatistikler.siparisler, renk: "#8BAF8E" },
                { icon: "📁", ad: "Kategori", deger: istatistikler.kategoriler, renk: "#5C3D2E" },
                { icon: "📝", ad: "Bekleyen Soru", deger: bekleyenSorular.length, renk: "#9C27B0" },
              ].map((kart, i) => (
                <div key={i} style={{ background: "white", borderRadius: 18, padding: "20px", boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>{kart.icon}</div>
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 30, fontWeight: 700, color: kart.renk, marginBottom: 2 }}>{kart.deger}</div>
                  <div style={{ fontSize: 12, color: "#5C3D2E", opacity: 0.5 }}>{kart.ad}</div>
                </div>
              ))}
            </div>
            <div style={{ background: "white", borderRadius: 18, padding: "24px", boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: "#2C1A0E", marginBottom: 16 }}>Hızlı Erişim</h2>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {menuler.filter(m => m.id !== "dashboard").map((item, i) => (
                  <button key={i} onClick={() => setAktifSayfa(item.id)}
                    style={{ background: "#FDF6EE", border: "2px solid #E8D5B7", borderRadius: 12, padding: "12px 18px", fontSize: 13, fontWeight: 600, color: "#5C3D2E", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 7 }}>
                    {item.icon} {item.ad} {item.badge && item.badge > 0 ? <span style={{ background: "#E8845A", color: "white", borderRadius: 50, fontSize: 11, padding: "1px 6px" }}>{item.badge}</span> : null}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ÜRÜNLER */}
        {aktifSayfa === "urunler" && (
          <div>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700, color: "#2C1A0E", marginBottom: 24 }}>Ürün Yönetimi</h1>
            <div style={{ background: "white", borderRadius: 18, padding: "22px", marginBottom: 20, boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 700, color: "#2C1A0E", marginBottom: 14 }}>➕ Yeni Ürün Ekle</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <input placeholder="Ürün Adı *" value={yeniUrun.ad} onChange={e => setYeniUrun({ ...yeniUrun, ad: e.target.value })} style={inputStyle} />
                <input placeholder="Fiyat (₺) *" type="number" value={yeniUrun.fiyat} onChange={e => setYeniUrun({ ...yeniUrun, fiyat: e.target.value })} style={inputStyle} />
                <input placeholder="İndirimli Fiyat (₺)" type="number" value={yeniUrun.indirimli_fiyat} onChange={e => setYeniUrun({ ...yeniUrun, indirimli_fiyat: e.target.value })} style={inputStyle} />
                <input placeholder="Stok" type="number" value={yeniUrun.stok} onChange={e => setYeniUrun({ ...yeniUrun, stok: e.target.value })} style={inputStyle} />
                <input placeholder="Resim URL" value={yeniUrun.resim_url} onChange={e => setYeniUrun({ ...yeniUrun, resim_url: e.target.value })} style={inputStyle} />
                <select value={yeniUrun.etiket} onChange={e => setYeniUrun({ ...yeniUrun, etiket: e.target.value })} style={inputStyle}>
                  <option value="">Etiket Seçin</option>
                  <option value="yeni">🆕 Yeni</option>
                  <option value="indirim">💥 İndirim</option>
                  <option value="cok-satan">⭐ Çok Satan</option>
                  <option value="kampanya">🏷️ Kampanya</option>
                  <option value="onerilir">👍 Önerilir</option>
                  <option value="son-stok">⚠️ Son Stok</option>
                </select>
                <select value={yeniUrun.kategori_id} onChange={e => setYeniUrun({ ...yeniUrun, kategori_id: e.target.value })} style={inputStyle}>
                  <option value="">Kategori Seçin</option>
                  {kategoriler.map(k => <option key={k.id} value={k.id}>{k.ad}</option>)}
                </select>
                <select value={yeniUrun.marka_id} onChange={e => setYeniUrun({ ...yeniUrun, marka_id: e.target.value })} style={inputStyle}>
                  <option value="">Marka Seçin</option>
                  {markalar.map(m => <option key={m.id} value={m.id}>{m.ad}</option>)}
                </select>
                <input placeholder="Kısa Açıklama" value={yeniUrun.kisa_aciklama} onChange={e => setYeniUrun({ ...yeniUrun, kisa_aciklama: e.target.value })} style={inputStyle} />
              </div>
              <textarea placeholder="Uzun Açıklama (opsiyonel)" value={yeniUrun.uzun_aciklama} onChange={e => setYeniUrun({ ...yeniUrun, uzun_aciklama: e.target.value })}
                style={{ ...inputStyle, height: 80, resize: "vertical" as const }} />
              <button onClick={urunEkle} style={btnStyle()}>Ürün Ekle →</button>
            </div>

            <div style={{ background: "white", borderRadius: 18, padding: "22px", marginBottom: 20, boxShadow: "0 4px 16px rgba(92,61,46,0.06)", border: "2px solid #E8D5B7" }}>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 700, color: "#2C1A0E", marginBottom: 14 }}>
                ⚡ Toplu İşlem {seciliUrunler.length > 0 && <span style={{ background: "#E8845A", color: "white", borderRadius: 50, fontSize: 12, padding: "2px 10px", marginLeft: 8 }}>{seciliUrunler.length} seçili</span>}
              </h2>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                <select value={topluIslem.tip} onChange={e => setTopluIslem({ ...topluIslem, tip: e.target.value })}
                  style={{ padding: "10px 14px", border: "2px solid #E8D5B7", borderRadius: 10, fontSize: 13, outline: "none", cursor: "pointer" }}>
                  <option value="fiyat_yuzde">Fiyat % Değiştir</option>
                  <option value="fiyat_tl">Fiyat TL Değiştir</option>
                  <option value="stok_ac">Stok Aç (Aktif Et)</option>
                  <option value="stok_kapat">Stok Kapat (Pasif Et)</option>
                  <option value="etiket">Etiket Ekle</option>
                  <option value="indirim_kaldir">İndirim Kaldır</option>
                </select>
                {(topluIslem.tip === "fiyat_yuzde" || topluIslem.tip === "fiyat_tl") && (
                  <input type="number" placeholder={topluIslem.tip === "fiyat_yuzde" ? "% (örn: 10 veya -10)" : "₺ (örn: 50 veya -50)"}
                    value={topluIslem.deger} onChange={e => setTopluIslem({ ...topluIslem, deger: e.target.value })}
                    style={{ padding: "10px 14px", border: "2px solid #E8D5B7", borderRadius: 10, fontSize: 13, outline: "none", width: 200 }} />
                )}
                {topluIslem.tip === "etiket" && (
                  <select value={topluIslem.etiket} onChange={e => setTopluIslem({ ...topluIslem, etiket: e.target.value })}
                    style={{ padding: "10px 14px", border: "2px solid #E8D5B7", borderRadius: 10, fontSize: 13, outline: "none" }}>
                    <option value="">Etiket Seçin</option>
                    <option value="yeni">🆕 Yeni</option>
                    <option value="indirim">💥 İndirim</option>
                    <option value="cok-satan">⭐ Çok Satan</option>
                    <option value="kampanya">🏷️ Kampanya</option>
                    <option value="son-stok">⚠️ Son Stok</option>
                  </select>
                )}
                <button onClick={topluIslemUygula} style={btnStyle()}>Uygula</button>
                {seciliUrunler.length > 0 && <button onClick={() => setSeciliUrunler([])} style={btnStyle("#999")}>Seçimi Temizle</button>}
              </div>
            </div>

            <div style={{ background: "white", borderRadius: 18, padding: "22px", boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                <h2 style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 700, color: "#2C1A0E" }}>Ürünler ({filtrelenmisUrunler.length})</h2>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setSeciliUrunler(filtrelenmisUrunler.map(u => u.id))} style={{ ...btnStyle("#5C3D2E"), padding: "8px 14px", fontSize: 12 }}>Tümünü Seç</button>
                  <input placeholder="🔍 Ürün ara..." value={aramaMetni} onChange={e => setAramaMetni(e.target.value)}
                    style={{ padding: "8px 14px", border: "2px solid #E8D5B7", borderRadius: 10, fontSize: 13, outline: "none", width: 200 }} />
                </div>
              </div>

              {duzenleUrun && (
                <div style={{ background: "#FDF6EE", borderRadius: 16, padding: "20px", marginBottom: 20, border: "2px solid #E8845A" }}>
                  <h3 style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 700, color: "#5C3D2E", marginBottom: 14 }}>✏️ Ürün Düzenle: {duzenleUrun.ad?.substring(0, 40)}</h3>
                  {duzenleUrun.resim_url && (
                    <div style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 12 }}>
                      <img src={duzenleUrun.resim_url} alt="" style={{ width: 80, height: 80, objectFit: "contain", borderRadius: 10, background: "white", padding: 6 }} />
                      <span style={{ fontSize: 12, color: "#5C3D2E", opacity: 0.6 }}>Mevcut resim</span>
                    </div>
                  )}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    <input placeholder="Ürün Adı" value={duzenleUrun.ad} onChange={e => setDuzenleUrun({ ...duzenleUrun, ad: e.target.value })} style={inputStyle} />
                    <input placeholder="Fiyat (₺)" type="number" value={duzenleUrun.fiyat} onChange={e => setDuzenleUrun({ ...duzenleUrun, fiyat: e.target.value })} style={inputStyle} />
                    <input placeholder="İndirimli Fiyat (₺)" type="number" value={duzenleUrun.indirimli_fiyat || ""} onChange={e => setDuzenleUrun({ ...duzenleUrun, indirimli_fiyat: e.target.value })} style={inputStyle} />
                    <input placeholder="Stok" type="number" value={duzenleUrun.stok} onChange={e => setDuzenleUrun({ ...duzenleUrun, stok: e.target.value })} style={inputStyle} />
                    <input placeholder="Yeni Resim URL" value={duzenleUrun.resim_url || ""} onChange={e => setDuzenleUrun({ ...duzenleUrun, resim_url: e.target.value })} style={inputStyle} />
                    <select value={duzenleUrun.etiket || ""} onChange={e => setDuzenleUrun({ ...duzenleUrun, etiket: e.target.value })} style={inputStyle}>
                      <option value="">Etiket Yok</option>
                      <option value="yeni">🆕 Yeni</option>
                      <option value="indirim">💥 İndirim</option>
                      <option value="cok-satan">⭐ Çok Satan</option>
                      <option value="kampanya">🏷️ Kampanya</option>
                      <option value="onerilir">👍 Önerilir</option>
                      <option value="son-stok">⚠️ Son Stok</option>
                    </select>
                    <select value={duzenleUrun.kategori_id || ""} onChange={e => setDuzenleUrun({ ...duzenleUrun, kategori_id: e.target.value })} style={inputStyle}>
                      <option value="">Kategori Seçin</option>
                      {kategoriler.map(k => <option key={k.id} value={k.id}>{k.ad}</option>)}
                    </select>
                    <select value={duzenleUrun.marka_id || ""} onChange={e => setDuzenleUrun({ ...duzenleUrun, marka_id: e.target.value })} style={inputStyle}>
                      <option value="">Marka Seçin</option>
                      {markalar.map(m => <option key={m.id} value={m.id}>{m.ad}</option>)}
                    </select>
                    <select value={duzenleUrun.aktif ? "1" : "0"} onChange={e => setDuzenleUrun({ ...duzenleUrun, aktif: e.target.value === "1" })} style={inputStyle}>
                      <option value="1">✅ Aktif</option>
                      <option value="0">❌ Pasif</option>
                    </select>
                  </div>
                  <input placeholder="Kısa Açıklama" value={duzenleUrun.kisa_aciklama || ""} onChange={e => setDuzenleUrun({ ...duzenleUrun, kisa_aciklama: e.target.value })} style={inputStyle} />
                  <textarea placeholder="Uzun Açıklama" value={duzenleUrun.uzun_aciklama || ""} onChange={e => setDuzenleUrun({ ...duzenleUrun, uzun_aciklama: e.target.value })}
                    style={{ ...inputStyle, height: 80, resize: "vertical" as const }} />
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={urunGuncelle} style={btnStyle()}>💾 Kaydet</button>
                    <button onClick={() => setDuzenleUrun(null)} style={btnStyle("#999")}>İptal</button>
                  </div>
                </div>
              )}

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#FDF6EE" }}>
                      <th style={{ padding: "10px 8px", textAlign: "left", width: 36 }}>
                        <input type="checkbox" onChange={e => setSeciliUrunler(e.target.checked ? filtrelenmisUrunler.map(u => u.id) : [])}
                          checked={seciliUrunler.length === filtrelenmisUrunler.length && filtrelenmisUrunler.length > 0} />
                      </th>
                      {["Resim", "Ürün Adı", "Fiyat", "İndirimli", "Stok", "Etiket", "Durum", "İşlem"].map(h => (
                        <th key={h} style={{ padding: "10px 10px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#5C3D2E", opacity: 0.6, textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtrelenmisUrunler.slice(0, 100).map((urun) => (
                      <tr key={urun.id} style={{ borderBottom: "1px solid #F0E8E0", background: seciliUrunler.includes(urun.id) ? "#FFF5F0" : "white" }}>
                        <td style={{ padding: "8px" }}>
                          <input type="checkbox" checked={seciliUrunler.includes(urun.id)}
                            onChange={e => setSeciliUrunler(e.target.checked ? [...seciliUrunler, urun.id] : seciliUrunler.filter(id => id !== urun.id))} />
                        </td>
                        <td style={{ padding: "8px 10px" }}>
                          {urun.resim_url
                            ? <img src={urun.resim_url} alt={urun.ad} style={{ width: 44, height: 44, objectFit: "contain", borderRadius: 8, background: "#FDF6EE" }} />
                            : <div style={{ width: 44, height: 44, background: "#FDF6EE", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🐾</div>}
                        </td>
                        <td style={{ padding: "8px 10px", fontSize: 13, color: "#2C1A0E", maxWidth: 180 }}>{urun.ad?.substring(0, 45)}{urun.ad?.length > 45 ? "..." : ""}</td>
                        <td style={{ padding: "8px 10px", fontSize: 13, fontWeight: 700, color: "#5C3D2E" }}>₺{parseFloat(urun.fiyat).toFixed(2)}</td>
                        <td style={{ padding: "8px 10px", fontSize: 13, fontWeight: 700, color: "#E8845A" }}>{urun.indirimli_fiyat ? `₺${parseFloat(urun.indirimli_fiyat).toFixed(2)}` : "-"}</td>
                        <td style={{ padding: "8px 10px" }}>
                          <span style={{ background: urun.stok > 0 ? "#E8F5E9" : "#FFEBEE", color: urun.stok > 0 ? "#2E7D32" : "#C62828", padding: "3px 8px", borderRadius: 50, fontSize: 12, fontWeight: 700 }}>{urun.stok}</span>
                        </td>
                        <td style={{ padding: "8px 10px" }}>
                          {urun.etiket && <span style={{ background: etiketRenk[urun.etiket] || "#999", color: "white", padding: "3px 8px", borderRadius: 50, fontSize: 11, fontWeight: 700 }}>{urun.etiket}</span>}
                        </td>
                        <td style={{ padding: "8px 10px" }}>
                          <span style={{ background: urun.aktif ? "#E8F5E9" : "#FFEBEE", color: urun.aktif ? "#2E7D32" : "#C62828", padding: "3px 8px", borderRadius: 50, fontSize: 11, fontWeight: 700 }}>
                            {urun.aktif ? "Aktif" : "Pasif"}
                          </span>
                        </td>
                        <td style={{ padding: "8px 10px" }}>
                          <div style={{ display: "flex", gap: 5 }}>
                            <button onClick={() => setDuzenleUrun({ ...urun })} style={{ background: "#FDF6EE", border: "none", borderRadius: 7, padding: "5px 10px", fontSize: 12, cursor: "pointer", fontWeight: 600, color: "#5C3D2E" }}>✏️</button>
                            <button onClick={() => urunSil(urun.id)} style={{ background: "#FFEBEE", border: "none", borderRadius: 7, padding: "5px 10px", fontSize: 12, cursor: "pointer", fontWeight: 600, color: "#C62828" }}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SİPARİŞLER */}
        {aktifSayfa === "siparisler" && (
          <div>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700, color: "#2C1A0E", marginBottom: 24 }}>Sipariş Yönetimi</h1>
            <div style={{ background: "white", borderRadius: 18, padding: "22px", boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
              {siparisler.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0" }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: "#5C3D2E" }}>Henüz sipariş yok</div>
                </div>
              ) : siparisler.map((siparis) => (
                <div key={siparis.id} style={{ background: "#FDF6EE", borderRadius: 16, padding: "18px", marginBottom: 14, border: "1px solid #E8D5B7" }}>
                  {/* Üst satır */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                    <div>
                      <span style={{ fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 700, color: "#5C3D2E" }}>#{siparis.siparis_no}</span>
                      <span style={{ fontSize: 12, color: "#5C3D2E", opacity: 0.5, marginLeft: 10 }}>{new Date(siparis.created_at).toLocaleDateString("tr-TR")} {new Date(siparis.created_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {/* Ödeme durumu */}
                      <span style={{
                        background: siparis.odeme_durumu === "odendi" ? "#E8F5E9" : siparis.odeme_durumu === "iptal" ? "#FFEBEE" : "#FFF8E1",
                        color: siparis.odeme_durumu === "odendi" ? "#2E7D32" : siparis.odeme_durumu === "iptal" ? "#C62828" : "#F57F17",
                        padding: "4px 12px", borderRadius: 50, fontSize: 12, fontWeight: 700
                      }}>
                        {siparis.odeme_durumu === "odendi" ? "💳 Ödendi" : siparis.odeme_durumu === "iptal" ? "❌ İptal" : "⏳ Beklemede"}
                      </span>
                      {/* Sipariş durumu */}
                      <span style={{
                        background: siparis.durum === "tamamlandi" ? "#E8F5E9" : siparis.durum === "iptal" ? "#FFEBEE" : siparis.durum === "kargoda" ? "#E3F2FD" : "#FFF5F0",
                        color: siparis.durum === "tamamlandi" ? "#2E7D32" : siparis.durum === "iptal" ? "#C62828" : siparis.durum === "kargoda" ? "#1565C0" : "#E8845A",
                        padding: "4px 12px", borderRadius: 50, fontSize: 12, fontWeight: 700
                      }}>
                        {siparis.durum === "hazirlaniyor" ? "🔧 Hazırlanıyor" : siparis.durum === "kargoda" ? "🚚 Kargoda" : siparis.durum === "tamamlandi" ? "✅ Tamamlandı" : siparis.durum === "iptal" ? "❌ İptal" : "⏳ Beklemede"}
                      </span>
                    </div>
                  </div>

                  {/* Müşteri ve tutar bilgisi */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
                    <div style={{ background: "white", borderRadius: 10, padding: "10px 14px" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#5C3D2E", opacity: 0.5, marginBottom: 3, textTransform: "uppercase" }}>Müşteri</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#2C1A0E" }}>{siparis.ad} {siparis.soyad}</div>
                      <div style={{ fontSize: 11, color: "#5C3D2E", opacity: 0.6 }}>{siparis.email}</div>
                    </div>
                    <div style={{ background: "white", borderRadius: 10, padding: "10px 14px" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#5C3D2E", opacity: 0.5, marginBottom: 3, textTransform: "uppercase" }}>Tutar</div>
                      <div style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: "#E8845A" }}>₺{parseFloat(siparis.toplam || 0).toFixed(2)}</div>
                      <div style={{ fontSize: 11, color: "#5C3D2E", opacity: 0.6 }}>{siparis.odeme_yontemi === "kredi_karti" ? "💳 Kredi Kartı" : "🏦 Havale/EFT"}</div>
                    </div>
                    <div style={{ background: "white", borderRadius: 10, padding: "10px 14px" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#5C3D2E", opacity: 0.5, marginBottom: 3, textTransform: "uppercase" }}>Adres</div>
                      <div style={{ fontSize: 11, color: "#2C1A0E" }}>{siparis.adres || "-"}</div>
                      <div style={{ fontSize: 11, color: "#5C3D2E", opacity: 0.6 }}>{siparis.sehir}</div>
                    </div>
                  </div>

                  {/* Durum değiştirme ve paketleme fişi */}
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <select
                      value={siparis.durum}
                      onChange={e => siparisGuncelle(siparis.id, e.target.value)}
                      style={{ padding: "8px 12px", border: "2px solid #E8D5B7", borderRadius: 10, fontSize: 13, outline: "none", fontFamily: "inherit", cursor: "pointer", background: "white" }}>
                      <option value="beklemede">⏳ Beklemede</option>
                      <option value="hazirlaniyor">🔧 Hazırlanıyor</option>
                      <option value="kargoda">🚚 Kargoda</option>
                      <option value="tamamlandi">✅ Tamamlandı</option>
                      <option value="iptal">❌ İptal</option>
                      <option value="iade">↩️ İade Edildi</option>
                    </select>

                    <select
                      value={siparis.odeme_durumu || "beklemede"}
                      onChange={async (e) => {
                        await supabase.from("siparisler").update({ odeme_durumu: e.target.value }).eq("id", siparis.id);
                        siparisleriYukle();
                        goster("✅ Ödeme durumu güncellendi");
                      }}
                      style={{ padding: "8px 12px", border: "2px solid #E8D5B7", borderRadius: 10, fontSize: 13, outline: "none", fontFamily: "inherit", cursor: "pointer", background: "white" }}>
                      <option value="beklemede">⏳ Ödeme Bekliyor</option>
                      <option value="odendi">💳 Ödendi</option>
                      <option value="iptal">❌ İptal</option>
                      <option value="iade">↩️ İade</option>
                    </select>

                    <button
                      onClick={() => {
                        const w = window.open("", "_blank");
                        if (!w) return;
                        w.document.write(`
                          <html><head><title>Paketleme Fişi - #${siparis.siparis_no}</title>
                          <style>
                            body { font-family: Arial, sans-serif; padding: 20px; max-width: 400px; margin: 0 auto; }
                            h2 { border-bottom: 2px solid #333; padding-bottom: 8px; }
                            .row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dashed #eee; }
                            .label { font-weight: bold; color: #555; font-size: 12px; }
                            .value { font-size: 12px; }
                            .total { font-size: 16px; font-weight: bold; color: #E8845A; margin-top: 10px; }
                            @media print { button { display: none; } }
                          </style></head>
                          <body>
                            <h2>🐾 evemama.net</h2>
                            <h3>Paketleme Fişi</h3>
                            <div class="row"><span class="label">Sipariş No</span><span class="value">#${siparis.siparis_no}</span></div>
                            <div class="row"><span class="label">Tarih</span><span class="value">${new Date(siparis.created_at).toLocaleDateString("tr-TR")}</span></div>
                            <div class="row"><span class="label">Müşteri</span><span class="value">${siparis.ad || ""} ${siparis.soyad || ""}</span></div>
                            <div class="row"><span class="label">E-posta</span><span class="value">${siparis.email || ""}</span></div>
                            <div class="row"><span class="label">Adres</span><span class="value">${siparis.adres || ""} ${siparis.sehir || ""}</span></div>
                            <div class="row"><span class="label">Ödeme</span><span class="value">${siparis.odeme_yontemi === "kredi_karti" ? "Kredi Kartı" : "Havale/EFT"}</span></div>
                            <br/>
                            <div class="total">Toplam: ₺${parseFloat(siparis.toplam || 0).toFixed(2)}</div>
                            <br/>
                            <button onclick="window.print()">🖨️ Yazdır</button>
                          </body></html>
                        `);
                        w.document.close();
                      }}
                      style={{ background: "#5C3D2E", color: "white", border: "none", borderRadius: 10, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                      🖨️ Paketleme Fişi
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
```

**Command+S** bas, push yap!
```
git commit -m "siparis yonetimi guncellendi"

        {/* KATEGORİLER */}
        {aktifSayfa === "kategoriler" && (
          <div>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700, color: "#2C1A0E", marginBottom: 24 }}>Kategori Yönetimi</h1>
            <div style={{ background: "white", borderRadius: 18, padding: "22px", boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#FDF6EE" }}>
                      {["ID", "Kategori Adı", "Slug", "Üst Kategori", "Sıra", "Durum"].map(h => (
                        <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#5C3D2E", opacity: 0.6, textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {kategoriler.map((kat) => (
                      <tr key={kat.id} style={{ borderBottom: "1px solid #F0E8E0" }}>
                        <td style={{ padding: "10px 12px", fontSize: 12, opacity: 0.5 }}>{kat.id}</td>
                        <td style={{ padding: "10px 12px", fontSize: 14, fontWeight: 600, paddingLeft: kat.ust_kategori_id ? 28 : 12 }}>{kat.ust_kategori_id ? "└ " : ""}{kat.ad}</td>
                        <td style={{ padding: "10px 12px", fontSize: 12, opacity: 0.6, fontFamily: "monospace" }}>{kat.slug}</td>
                        <td style={{ padding: "10px 12px", fontSize: 12, opacity: 0.6 }}>{kategoriler.find(k => k.id === kat.ust_kategori_id)?.ad || "-"}</td>
                        <td style={{ padding: "10px 12px", fontSize: 13 }}>{kat.sira}</td>
                        <td style={{ padding: "10px 12px" }}>
                          <span style={{ background: kat.aktif ? "#E8F5E9" : "#FFEBEE", color: kat.aktif ? "#2E7D32" : "#C62828", padding: "3px 9px", borderRadius: 50, fontSize: 11, fontWeight: 700 }}>
                            {kat.aktif ? "Aktif" : "Pasif"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MARKALAR */}
        {aktifSayfa === "markalar" && (
          <div>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700, color: "#2C1A0E", marginBottom: 24 }}>Marka Yönetimi</h1>
            <div style={{ background: "white", borderRadius: 18, padding: "22px", boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#FDF6EE" }}>
                    {["ID", "Marka Adı", "Slug", "Durum"].map(h => (
                      <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#5C3D2E", opacity: 0.6, textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {markalar.map((marka) => (
                    <tr key={marka.id} style={{ borderBottom: "1px solid #F0E8E0" }}>
                      <td style={{ padding: "10px 12px", fontSize: 12, opacity: 0.5 }}>{marka.id}</td>
                      <td style={{ padding: "10px 12px", fontSize: 14, fontWeight: 600 }}>{marka.ad}</td>
                      <td style={{ padding: "10px 12px", fontSize: 12, opacity: 0.6, fontFamily: "monospace" }}>{marka.slug}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ background: marka.aktif ? "#E8F5E9" : "#FFEBEE", color: marka.aktif ? "#2E7D32" : "#C62828", padding: "3px 9px", borderRadius: 50, fontSize: 11, fontWeight: 700 }}>
                          {marka.aktif ? "Aktif" : "Pasif"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* BANNERLAR */}
        {aktifSayfa === "bannerlar" && (
          <div>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700, color: "#2C1A0E", marginBottom: 24 }}>Banner Yönetimi</h1>
            <div style={{ background: "white", borderRadius: 18, padding: "22px", marginBottom: 20, boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 700, color: "#2C1A0E", marginBottom: 14 }}>➕ Yeni Banner Ekle</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <input placeholder="Başlık *" value={yeniBanner.baslik} onChange={e => setYeniBanner({ ...yeniBanner, baslik: e.target.value })} style={inputStyle} />
                <input placeholder="Alt Başlık" value={yeniBanner.alt_baslik} onChange={e => setYeniBanner({ ...yeniBanner, alt_baslik: e.target.value })} style={inputStyle} />
                <input placeholder="Emoji (örn: 🐱)" value={yeniBanner.emoji} onChange={e => setYeniBanner({ ...yeniBanner, emoji: e.target.value })} style={inputStyle} />
                <input placeholder="Link (örn: /kategori/kedi)" value={yeniBanner.link} onChange={e => setYeniBanner({ ...yeniBanner, link: e.target.value })} style={inputStyle} />
                <input placeholder="Kupon Kodu (opsiyonel)" value={yeniBanner.kod} onChange={e => setYeniBanner({ ...yeniBanner, kod: e.target.value })} style={inputStyle} />
                <select value={yeniBanner.renk} onChange={e => setYeniBanner({ ...yeniBanner, renk: e.target.value })} style={inputStyle}>
                  <option value="linear-gradient(135deg,#F8E2C8,#F4C09A,#E8845A)">🟠 Turuncu</option>
                  <option value="linear-gradient(135deg,#C8DEC9,#8BAF8E,#5C9E6A)">🟢 Yeşil</option>
                  <option value="linear-gradient(135deg,#DDD4F4,#A89AE0,#7B6EC8)">🟣 Mor</option>
                  <option value="linear-gradient(135deg,#D4E8F8,#7BAED4,#4A7AA8)">🔵 Mavi</option>
                  <option value="linear-gradient(135deg,#2C1A0E,#5C3D2E,#8B5E42)">🟤 Kahve</option>
                </select>
              </div>
              <button onClick={bannerEkle} style={btnStyle()}>Banner Ekle →</button>
            </div>
            <div style={{ background: "white", borderRadius: 18, padding: "22px", boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 700, color: "#2C1A0E", marginBottom: 16 }}>Mevcut Bannerlar ({bannerlar.length})</h2>
              {bannerlar.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", opacity: 0.4 }}><div style={{ fontSize: 40, marginBottom: 12 }}>🖼️</div><div>Henüz banner eklenmedi</div></div>
              ) : bannerlar.map((banner, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px", background: "#FDF6EE", borderRadius: 14, marginBottom: 10 }}>
                  <div style={{ width: 60, height: 40, borderRadius: 10, background: banner.renk, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{banner.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#2C1A0E" }}>{banner.baslik}</div>
                    <div style={{ fontSize: 12, opacity: 0.5 }}>{banner.alt_baslik} • {banner.link} {banner.kod && `• Kod: ${banner.kod}`}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => bannerToggle(banner.id, banner.aktif)}
                      style={{ background: banner.aktif ? "#E8F5E9" : "#FFEBEE", color: banner.aktif ? "#2E7D32" : "#C62828", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      {banner.aktif ? "✅ Aktif" : "❌ Pasif"}
                    </button>
                    <button onClick={() => bannerSil(banner.id)} style={{ background: "#FFEBEE", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer", color: "#C62828", fontWeight: 700 }}>🗑️ Sil</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* KUPONLAR */}
        {aktifSayfa === "kuponlar" && (
          <div>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700, color: "#2C1A0E", marginBottom: 24 }}>Kupon Yönetimi</h1>
            <div style={{ background: "white", borderRadius: 18, padding: "22px", marginBottom: 20, boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 700, color: "#2C1A0E", marginBottom: 14 }}>➕ Yeni Kupon Oluştur</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <input placeholder="Kupon Kodu *" value={yeniKupon.kod} onChange={e => setYeniKupon({ ...yeniKupon, kod: e.target.value.toUpperCase() })} style={inputStyle} />
                <select value={yeniKupon.indirim_tipi} onChange={e => setYeniKupon({ ...yeniKupon, indirim_tipi: e.target.value })} style={inputStyle}>
                  <option value="yuzde">Yüzde İndirim (%)</option>
                  <option value="tl">TL İndirim</option>
                </select>
                <input placeholder={yeniKupon.indirim_tipi === "yuzde" ? "İndirim % *" : "İndirim TL *"} type="number" value={yeniKupon.indirim_degeri} onChange={e => setYeniKupon({ ...yeniKupon, indirim_degeri: e.target.value })} style={inputStyle} />
                <input placeholder="Min. Sepet Tutarı (₺)" type="number" value={yeniKupon.min_sepet} onChange={e => setYeniKupon({ ...yeniKupon, min_sepet: e.target.value })} style={inputStyle} />
                <input placeholder="Kullanım Limiti" type="number" value={yeniKupon.kullanim_limiti} onChange={e => setYeniKupon({ ...yeniKupon, kullanim_limiti: e.target.value })} style={inputStyle} />
                <input placeholder="Bitiş Tarihi" type="date" value={yeniKupon.bitis_tarihi} onChange={e => setYeniKupon({ ...yeniKupon, bitis_tarihi: e.target.value })} style={inputStyle} />
              </div>
              <button onClick={kuponEkle} style={btnStyle()}>Kupon Oluştur →</button>
            </div>
            <div style={{ background: "white", borderRadius: 18, padding: "22px", boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 700, color: "#2C1A0E", marginBottom: 16 }}>Mevcut Kuponlar</h2>
              {kuponlar.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", opacity: 0.4 }}><div style={{ fontSize: 40, marginBottom: 12 }}>🎟️</div><div>Henüz kupon yok</div></div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#FDF6EE" }}>
                      {["Kod", "İndirim", "Min. Sepet", "Kullanım", "Bitiş", "Durum", "Sil"].map(h => (
                        <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#5C3D2E", opacity: 0.6, textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {kuponlar.map((kupon) => (
                      <tr key={kupon.id} style={{ borderBottom: "1px solid #F0E8E0" }}>
                        <td style={{ padding: "12px", fontWeight: 700, fontSize: 14, color: "#E8845A", fontFamily: "monospace" }}>{kupon.kod}</td>
                        <td style={{ padding: "12px", fontSize: 13 }}>{kupon.indirim_degeri}{kupon.indirim_tipi === "yuzde" ? "%" : "₺"}</td>
                        <td style={{ padding: "12px", fontSize: 13 }}>₺{kupon.min_sepet}</td>
                        <td style={{ padding: "12px", fontSize: 13 }}>{kupon.kullanim_sayisi}/{kupon.kullanim_limiti}</td>
                        <td style={{ padding: "12px", fontSize: 12, opacity: 0.6 }}>{kupon.bitis_tarihi ? new Date(kupon.bitis_tarihi).toLocaleDateString("tr-TR") : "Süresiz"}</td>
                        <td style={{ padding: "12px" }}>
                          <span style={{ background: kupon.aktif ? "#E8F5E9" : "#FFEBEE", color: kupon.aktif ? "#2E7D32" : "#C62828", padding: "3px 9px", borderRadius: 50, fontSize: 11, fontWeight: 700 }}>
                            {kupon.aktif ? "Aktif" : "Pasif"}
                          </span>
                        </td>
                        <td style={{ padding: "12px" }}>
                          <button onClick={() => kuponSil(kupon.id)} style={{ background: "#FFEBEE", border: "none", borderRadius: 7, padding: "5px 10px", fontSize: 12, cursor: "pointer", color: "#C62828", fontWeight: 700 }}>🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* BLOG SORULARI */}
        {aktifSayfa === "blog" && (
          <div>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700, color: "#2C1A0E", marginBottom: 24 }}>
              Blog Soru Yönetimi
              {bekleyenSorular.length > 0 && <span style={{ background: "#E8845A", color: "white", borderRadius: 50, fontSize: 14, padding: "3px 12px", marginLeft: 12 }}>{bekleyenSorular.length} bekliyor</span>}
            </h1>

            {/* Bekleyen Sorular */}
            {bekleyenSorular.length > 0 && (
              <div style={{ background: "white", borderRadius: 18, padding: "22px", marginBottom: 24, boxShadow: "0 4px 16px rgba(92,61,46,0.06)", border: "2px solid #F4C09A" }}>
                <h2 style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 700, color: "#2C1A0E", marginBottom: 16 }}>⏳ Onay Bekleyen Sorular ({bekleyenSorular.length})</h2>
                {bekleyenSorular.map((s) => (
                  <div key={s.id} style={{ background: "#FFF8E8", borderRadius: 14, padding: "18px", marginBottom: 14, border: "1px solid #F4C09A" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: 14, color: "#5C3D2E" }}>{s.ad}</span>
                        <span style={{ background: "#FFF5F0", color: "#E8845A", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 50, marginLeft: 8 }}>{s.kategori}</span>
                        <div style={{ fontSize: 11, color: "#5C3D2E", opacity: 0.5, marginTop: 2 }}>{new Date(s.created_at).toLocaleDateString("tr-TR")}</div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => soruOnayla(s.id, true)} style={{ background: "#E8F5E9", color: "#2E7D32", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>✅ Onayla</button>
                        <button onClick={() => soruSil(s.id)} style={{ background: "#FFEBEE", color: "#C62828", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>🗑️ Sil</button>
                      </div>
                    </div>
                    <p style={{ fontSize: 14, color: "#5C3D2E", fontWeight: 600, marginBottom: 12 }}>❓ {s.soru}</p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <textarea
                        placeholder="Cevabınızı yazın... (kaydet aynı zamanda onaylar)"
                        value={cevaplar[s.id] || ""}
                        onChange={e => setCevaplar(prev => ({ ...prev, [s.id]: e.target.value }))}
                        rows={3}
                        style={{ flex: 1, padding: "10px 14px", border: "2px solid #E8D5B7", borderRadius: 10, fontSize: 13, outline: "none", fontFamily: "inherit", resize: "vertical" as const }}
                      />
                      <button onClick={() => soruCevapla(s.id)} disabled={!cevaplar[s.id]?.trim()}
                        style={{ background: !cevaplar[s.id]?.trim() ? "#ccc" : "#E8845A", color: "white", border: "none", borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 700, cursor: !cevaplar[s.id]?.trim() ? "not-allowed" : "pointer", whiteSpace: "nowrap", alignSelf: "flex-start" }}>
                        💾 Cevapla & Yayınla
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Yayındaki Sorular */}
            <div style={{ background: "white", borderRadius: 18, padding: "22px", boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 700, color: "#2C1A0E", marginBottom: 16 }}>✅ Yayındaki Sorular ({onaylananSorular.length})</h2>
              {onaylananSorular.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", opacity: 0.4 }}><div style={{ fontSize: 40, marginBottom: 12 }}>💬</div><div>Henüz yayınlanan soru yok</div></div>
              ) : onaylananSorular.map((s) => (
                <div key={s.id} style={{ background: "#F9FBF9", borderRadius: 14, padding: "16px", marginBottom: 12, border: "1px solid #E8D5B7" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: 13, color: "#5C3D2E" }}>{s.ad}</span>
                      <span style={{ background: "#E8F5E9", color: "#2E7D32", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 50, marginLeft: 8 }}>{s.kategori}</span>
                      <div style={{ fontSize: 11, color: "#5C3D2E", opacity: 0.4, marginTop: 2 }}>{new Date(s.created_at).toLocaleDateString("tr-TR")}</div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => soruOnayla(s.id, false)} style={{ background: "#FFF5F0", color: "#E8845A", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Gizle</button>
                      <button onClick={() => soruSil(s.id)} style={{ background: "#FFEBEE", color: "#C62828", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>🗑️</button>
                    </div>
                  </div>
                  <p style={{ fontSize: 13, color: "#5C3D2E", fontWeight: 600, marginBottom: s.cevap ? 8 : 0 }}>❓ {s.soru}</p>
                  {s.cevap && (
                    <div style={{ background: "#FFF5F0", borderRadius: 10, padding: "10px 12px", borderLeft: "3px solid #E8845A" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#E8845A", marginBottom: 3 }}>💬 Cevap</div>
                      <p style={{ fontSize: 12, color: "#5C3D2E", lineHeight: 1.6, margin: 0 }}>{s.cevap}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* KARGO AYARLARI */}
        {aktifSayfa === "kargo" && (
          <div>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700, color: "#2C1A0E", marginBottom: 24 }}>Kargo Ayarları</h1>
            <div style={{ background: "white", borderRadius: 18, padding: "28px", boxShadow: "0 4px 16px rgba(92,61,46,0.06)", maxWidth: 560 }}>
              {kargoAyar && (
                <>
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ fontSize: 13, fontWeight: 700, color: "#5C3D2E", display: "block", marginBottom: 8 }}>Ücretsiz Kargo Limiti (₺)</label>
                    <input type="number" value={kargoAyar["ucretsiz limit"] || ""} onChange={e => setKargoAyar({ ...kargoAyar, "ucretsiz limit": e.target.value })} style={inputStyle} />
                    <div style={{ fontSize: 12, color: "#5C3D2E", opacity: 0.5 }}>Bu tutarın üzerindeki siparişlerde kargo ücretsiz olur</div>
                  </div>
                  <div style={{ marginBottom: 24 }}>
                    <label style={{ fontSize: 13, fontWeight: 700, color: "#5C3D2E", display: "block", marginBottom: 8 }}>Sabit Kargo Ücreti (₺)</label>
                    <input type="number" value={kargoAyar.sabit_ucret || ""} onChange={e => setKargoAyar({ ...kargoAyar, sabit_ucret: e.target.value })} style={inputStyle} />
                  </div>
                  <button onClick={kargoGuncelle} style={btnStyle()}>💾 Kaydet</button>
                </>
              )}
            </div>
          </div>
        )}

        {/* SİTE AYARLARI */}
        {aktifSayfa === "ayarlar" && (
          <div>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700, color: "#2C1A0E", marginBottom: 24 }}>Site Ayarları</h1>
            <div style={{ background: "white", borderRadius: 18, padding: "24px", marginBottom: 20, boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 700, color: "#2C1A0E", marginBottom: 16 }}>💳 İyzico Ödeme Ayarları</h2>
              {[
                { key: "iyzico_api_key", label: "API Key" },
                { key: "iyzico_secret_key", label: "Secret Key" },
                { key: "iyzico_base_url", label: "Base URL" },
              ].map(({ key, label }) => (
                <div key={key} style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#5C3D2E", display: "block", marginBottom: 6, opacity: 0.7 }}>{label}</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input value={siteAyarlari[key] || ""} onChange={e => setSiteAyarlari({ ...siteAyarlari, [key]: e.target.value })} style={{ ...inputStyle, marginBottom: 0, flex: 1 }} />
                    <button onClick={() => siteAyarKaydet(key, siteAyarlari[key] || "")} style={{ ...btnStyle(), padding: "10px 16px", whiteSpace: "nowrap" }}>Kaydet</button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: "white", borderRadius: 18, padding: "24px", marginBottom: 20, boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 700, color: "#2C1A0E", marginBottom: 16 }}>🏦 Havale / EFT Bilgileri</h2>
              {[
                { key: "havale_banka1", label: "Banka Adı" },
                { key: "havale_iban1", label: "IBAN" },
                { key: "havale_ad1", label: "Hesap Sahibi Adı" },
              ].map(({ key, label }) => (
                <div key={key} style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#5C3D2E", display: "block", marginBottom: 6, opacity: 0.7 }}>{label}</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input value={siteAyarlari[key] || ""} onChange={e => setSiteAyarlari({ ...siteAyarlari, [key]: e.target.value })} style={{ ...inputStyle, marginBottom: 0, flex: 1 }} />
                    <button onClick={() => siteAyarKaydet(key, siteAyarlari[key] || "")} style={{ ...btnStyle(), padding: "10px 16px", whiteSpace: "nowrap" }}>Kaydet</button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: "white", borderRadius: 18, padding: "24px", boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 700, color: "#2C1A0E", marginBottom: 16 }}>📞 İletişim Bilgileri</h2>
              {[
                { key: "whatsapp_no", label: "WhatsApp Numarası" },
                { key: "site_email", label: "Site E-posta" },
              ].map(({ key, label }) => (
                <div key={key} style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#5C3D2E", display: "block", marginBottom: 6, opacity: 0.7 }}>{label}</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input value={siteAyarlari[key] || ""} onChange={e => setSiteAyarlari({ ...siteAyarlari, [key]: e.target.value })} style={{ ...inputStyle, marginBottom: 0, flex: 1 }} />
                    <button onClick={() => siteAyarKaydet(key, siteAyarlari[key] || "")} style={{ ...btnStyle(), padding: "10px 16px", whiteSpace: "nowrap" }}>Kaydet</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}