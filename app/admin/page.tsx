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
  const [yukleniyor, setYukleniyor] = useState(false);
  const [aramaMetni, setAramaMetni] = useState("");
  const [duzenleUrun, setDuzenleUrun] = useState<any>(null);
  const [yeniUrun, setYeniUrun] = useState({ ad: "", fiyat: "", stok: "", resim_url: "", kategori_id: "", marka_id: "", kisa_aciklama: "" });
  const [bildirim, setBildirim] = useState("");

  const goster = (mesaj: string) => {
    setBildirim(mesaj);
    setTimeout(() => setBildirim(""), 3000);
  };

  const handleGiris = () => {
    if (sifre === ADMIN_SIFRE) {
      setGiris(true);
      veriYukle();
    } else {
      setHataMesaji("Hatalı şifre!");
    }
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
    const { data } = await supabase.from("urunler").select("*, kategoriler(ad), markalar(ad)").order("created_at", { ascending: false }).limit(100);
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

  useEffect(() => {
    if (giris) {
      kategorileriYukle();
      markalariYukle();
    }
  }, [giris]);

  useEffect(() => {
    if (aktifSayfa === "urunler") urunleriYukle();
    if (aktifSayfa === "siparisler") siparisleriYukle();
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
      stok: parseInt(duzenleUrun.stok),
      resim_url: duzenleUrun.resim_url,
      kisa_aciklama: duzenleUrun.kisa_aciklama,
      kategori_id: duzenleUrun.kategori_id || null,
      marka_id: duzenleUrun.marka_id || null,
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
      ad: yeniUrun.ad,
      slug,
      fiyat: parseFloat(yeniUrun.fiyat),
      stok: parseInt(yeniUrun.stok) || 0,
      resim_url: yeniUrun.resim_url || null,
      kisa_aciklama: yeniUrun.kisa_aciklama || null,
      kategori_id: yeniUrun.kategori_id || null,
      marka_id: yeniUrun.marka_id || null,
      aktif: true,
    });
    setYeniUrun({ ad: "", fiyat: "", stok: "", resim_url: "", kategori_id: "", marka_id: "", kisa_aciklama: "" });
    urunleriYukle();
    goster("✅ Ürün eklendi");
  };

  const siparisGuncelle = async (id: number, durum: string) => {
    await supabase.from("siparisler").update({ durum }).eq("id", id);
    siparisleriYukle();
    goster("✅ Sipariş durumu güncellendi");
  };

  const filtrelenmisUrunler = urunler.filter(u => u.ad?.toLowerCase().includes(aramaMetni.toLowerCase()));

  const inputStyle = { width: "100%", padding: "10px 14px", border: "2px solid #E8D5B7", borderRadius: 10, fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box" as const, marginBottom: 10 };
  const btnStyle = (renk = "#E8845A") => ({ background: renk, color: "white", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" });

  if (!giris) return (
    <main style={{ minHeight: "100vh", background: "#FDF6EE", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
      <div style={{ background: "white", borderRadius: 24, padding: "48px 40px", maxWidth: 400, width: "100%", boxShadow: "0 20px 60px rgba(92,61,46,0.1)", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 24, fontWeight: 700, color: "#5C3D2E", marginBottom: 8 }}>Admin Paneli</div>
        <div style={{ fontSize: 13, color: "#5C3D2E", opacity: 0.5, marginBottom: 28 }}>evemama.net yönetim paneli</div>
        <input type="password" value={sifre} onChange={e => setSifre(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleGiris()}
          placeholder="Şifrenizi girin" style={{ ...inputStyle, textAlign: "center", fontSize: 16 }} />
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
  ];

  return (
    <main style={{ minHeight: "100vh", background: "#F5F0EB", fontFamily: "sans-serif", display: "flex" }}>

      {/* Bildirim */}
      {bildirim && (
        <div style={{ position: "fixed", top: 20, right: 20, background: "#5C3D2E", color: "white", padding: "12px 20px", borderRadius: 12, fontSize: 14, fontWeight: 600, zIndex: 999, boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}>
          {bildirim}
        </div>
      )}

      {/* Sol Menü */}
      <div style={{ width: 240, background: "#2C1A0E", minHeight: "100vh", padding: "24px 0", position: "fixed", left: 0, top: 0, bottom: 0 }}>
        <div style={{ padding: "0 20px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: "#FDF6EE" }}>evemama<span style={{ color: "#E8845A" }}>.net</span></div>
          <div style={{ fontSize: 11, color: "#F4C09A", opacity: 0.6, marginTop: 2 }}>Admin Paneli</div>
        </div>
        <nav style={{ padding: "16px 12px" }}>
          {menuler.map(m => (
            <button key={m.id} onClick={() => setAktifSayfa(m.id)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: aktifSayfa === m.id ? "rgba(232,132,90,0.15)" : "none", border: "none", borderRadius: 12, cursor: "pointer", color: aktifSayfa === m.id ? "#E8845A" : "#FDF6EE", fontSize: 14, fontWeight: aktifSayfa === m.id ? 700 : 400, marginBottom: 4, fontFamily: "inherit", textAlign: "left", opacity: aktifSayfa === m.id ? 1 : 0.6 }}>
              <span style={{ fontSize: 18 }}>{m.icon}</span> {m.ad}
            </button>
          ))}
        </nav>
        <div style={{ position: "absolute", bottom: 20, left: 12, right: 12 }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "rgba(255,255,255,0.05)", borderRadius: 12, color: "#FDF6EE", textDecoration: "none", fontSize: 13, opacity: 0.6 }}>
            🏠 Siteye Git
          </a>
        </div>
      </div>

      {/* İçerik */}
      <div style={{ marginLeft: 240, flex: 1, padding: "32px" }}>

        {/* DASHBOARD */}
        {aktifSayfa === "dashboard" && (
          <div>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: 28, fontWeight: 700, color: "#2C1A0E", marginBottom: 8 }}>Dashboard</h1>
            <p style={{ fontSize: 14, color: "#5C3D2E", opacity: 0.6, marginBottom: 32 }}>Genel bakış ve istatistikler</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20, marginBottom: 32 }}>
              {[
                { icon: "📦", ad: "Toplam Ürün", deger: istatistikler.urunler, renk: "#E8845A" },
                { icon: "🛒", ad: "Toplam Sipariş", deger: istatistikler.siparisler, renk: "#8BAF8E" },
                { icon: "📁", ad: "Kategori", deger: istatistikler.kategoriler, renk: "#5C3D2E" },
                { icon: "🏷️", ad: "Marka", deger: istatistikler.markalar, renk: "#F4C09A" },
              ].map((kart, i) => (
                <div key={i} style={{ background: "white", borderRadius: 20, padding: "24px", boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>{kart.icon}</div>
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 32, fontWeight: 700, color: kart.renk, marginBottom: 4 }}>{kart.deger}</div>
                  <div style={{ fontSize: 13, color: "#5C3D2E", opacity: 0.6 }}>{kart.ad}</div>
                </div>
              ))}
            </div>
            <div style={{ background: "white", borderRadius: 20, padding: "28px", boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, color: "#2C1A0E", marginBottom: 16 }}>Hızlı İşlemler</h2>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {[
                  { ad: "Ürün Ekle", icon: "➕", sayfa: "urunler" },
                  { ad: "Siparişler", icon: "📋", sayfa: "siparisler" },
                  { ad: "Kategoriler", icon: "📁", sayfa: "kategoriler" },
                  { ad: "Markalar", icon: "🏷️", sayfa: "markalar" },
                ].map((item, i) => (
                  <button key={i} onClick={() => setAktifSayfa(item.sayfa)}
                    style={{ background: "#FDF6EE", border: "2px solid #E8D5B7", borderRadius: 14, padding: "14px 20px", fontSize: 14, fontWeight: 600, color: "#5C3D2E", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8 }}>
                    {item.icon} {item.ad}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ÜRÜNLER */}
        {aktifSayfa === "urunler" && (
          <div>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: 28, fontWeight: 700, color: "#2C1A0E", marginBottom: 24 }}>Ürün Yönetimi</h1>

            {/* Yeni Ürün Ekle */}
            <div style={{ background: "white", borderRadius: 20, padding: "24px", marginBottom: 24, boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: "#2C1A0E", marginBottom: 16 }}>➕ Yeni Ürün Ekle</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <input placeholder="Ürün Adı *" value={yeniUrun.ad} onChange={e => setYeniUrun({ ...yeniUrun, ad: e.target.value })} style={inputStyle} />
                <input placeholder="Fiyat (₺) *" type="number" value={yeniUrun.fiyat} onChange={e => setYeniUrun({ ...yeniUrun, fiyat: e.target.value })} style={inputStyle} />
                <input placeholder="Stok Adedi" type="number" value={yeniUrun.stok} onChange={e => setYeniUrun({ ...yeniUrun, stok: e.target.value })} style={inputStyle} />
                <input placeholder="Resim URL" value={yeniUrun.resim_url} onChange={e => setYeniUrun({ ...yeniUrun, resim_url: e.target.value })} style={inputStyle} />
                <select value={yeniUrun.kategori_id} onChange={e => setYeniUrun({ ...yeniUrun, kategori_id: e.target.value })} style={inputStyle}>
                  <option value="">Kategori Seçin</option>
                  {kategoriler.map(k => <option key={k.id} value={k.id}>{k.ad}</option>)}
                </select>
                <select value={yeniUrun.marka_id} onChange={e => setYeniUrun({ ...yeniUrun, marka_id: e.target.value })} style={inputStyle}>
                  <option value="">Marka Seçin</option>
                  {markalar.map(m => <option key={m.id} value={m.id}>{m.ad}</option>)}
                </select>
              </div>
              <input placeholder="Kısa Açıklama" value={yeniUrun.kisa_aciklama} onChange={e => setYeniUrun({ ...yeniUrun, kisa_aciklama: e.target.value })} style={inputStyle} />
              <button onClick={urunEkle} style={btnStyle()}>Ürün Ekle →</button>
            </div>

            {/* Ürün Listesi */}
            <div style={{ background: "white", borderRadius: 20, padding: "24px", boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h2 style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: "#2C1A0E" }}>Ürünler ({filtrelenmisUrunler.length})</h2>
                <input placeholder="🔍 Ürün ara..." value={aramaMetni} onChange={e => setAramaMetni(e.target.value)}
                  style={{ padding: "8px 14px", border: "2px solid #E8D5B7", borderRadius: 10, fontSize: 14, outline: "none", width: 240 }} />
              </div>

              {duzenleUrun && (
                <div style={{ background: "#FDF6EE", borderRadius: 16, padding: "20px", marginBottom: 20, border: "2px solid #E8845A" }}>
                  <h3 style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 700, color: "#5C3D2E", marginBottom: 14 }}>✏️ Ürün Düzenle</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <input placeholder="Ürün Adı" value={duzenleUrun.ad} onChange={e => setDuzenleUrun({ ...duzenleUrun, ad: e.target.value })} style={inputStyle} />
                    <input placeholder="Fiyat" type="number" value={duzenleUrun.fiyat} onChange={e => setDuzenleUrun({ ...duzenleUrun, fiyat: e.target.value })} style={inputStyle} />
                    <input placeholder="Stok" type="number" value={duzenleUrun.stok} onChange={e => setDuzenleUrun({ ...duzenleUrun, stok: e.target.value })} style={inputStyle} />
                    <input placeholder="Resim URL" value={duzenleUrun.resim_url || ""} onChange={e => setDuzenleUrun({ ...duzenleUrun, resim_url: e.target.value })} style={inputStyle} />
                    <select value={duzenleUrun.kategori_id || ""} onChange={e => setDuzenleUrun({ ...duzenleUrun, kategori_id: e.target.value })} style={inputStyle}>
                      <option value="">Kategori Seçin</option>
                      {kategoriler.map(k => <option key={k.id} value={k.id}>{k.ad}</option>)}
                    </select>
                    <select value={duzenleUrun.marka_id || ""} onChange={e => setDuzenleUrun({ ...duzenleUrun, marka_id: e.target.value })} style={inputStyle}>
                      <option value="">Marka Seçin</option>
                      {markalar.map(m => <option key={m.id} value={m.id}>{m.ad}</option>)}
                    </select>
                  </div>
                  <input placeholder="Kısa Açıklama" value={duzenleUrun.kisa_aciklama || ""} onChange={e => setDuzenleUrun({ ...duzenleUrun, kisa_aciklama: e.target.value })} style={inputStyle} />
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
                      {["Resim", "Ürün Adı", "Fiyat", "Stok", "Kategori", "Marka", "İşlem"].map(h => (
                        <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#5C3D2E", opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtrelenmisUrunler.slice(0, 50).map((urun) => (
                      <tr key={urun.id} style={{ borderBottom: "1px solid #F0E8E0" }}>
                        <td style={{ padding: "10px 12px" }}>
                          {urun.resim_url ? (
                            <img src={urun.resim_url} alt={urun.ad} style={{ width: 48, height: 48, objectFit: "contain", borderRadius: 8, background: "#FDF6EE" }} />
                          ) : (
                            <div style={{ width: 48, height: 48, background: "#FDF6EE", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🐾</div>
                          )}
                        </td>
                        <td style={{ padding: "10px 12px", fontSize: 13, color: "#2C1A0E", maxWidth: 200 }}>{urun.ad?.substring(0, 50)}{urun.ad?.length > 50 ? "..." : ""}</td>
                        <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 700, color: "#E8845A" }}>₺{parseFloat(urun.fiyat).toFixed(2)}</td>
                        <td style={{ padding: "10px 12px" }}>
                          <span style={{ background: urun.stok > 0 ? "#E8F5E9" : "#FFEBEE", color: urun.stok > 0 ? "#2E7D32" : "#C62828", padding: "4px 10px", borderRadius: 50, fontSize: 12, fontWeight: 700 }}>
                            {urun.stok}
                          </span>
                        </td>
                        <td style={{ padding: "10px 12px", fontSize: 12, color: "#5C3D2E", opacity: 0.6 }}>{urun.kategoriler?.ad || "-"}</td>
                        <td style={{ padding: "10px 12px", fontSize: 12, color: "#5C3D2E", opacity: 0.6 }}>{urun.markalar?.ad || "-"}</td>
                        <td style={{ padding: "10px 12px" }}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={() => setDuzenleUrun({ ...urun })} style={{ background: "#FDF6EE", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer", fontWeight: 600, color: "#5C3D2E" }}>✏️ Düzenle</button>
                            <button onClick={() => urunSil(urun.id)} style={{ background: "#FFEBEE", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer", fontWeight: 600, color: "#C62828" }}>🗑️ Sil</button>
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
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: 28, fontWeight: 700, color: "#2C1A0E", marginBottom: 24 }}>Sipariş Yönetimi</h1>
            <div style={{ background: "white", borderRadius: 20, padding: "24px", boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
              {siparisler.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0" }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: "#5C3D2E" }}>Henüz sipariş yok</div>
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#FDF6EE" }}>
                      {["Sipariş No", "Müşteri", "Tutar", "Durum", "Tarih", "İşlem"].map(h => (
                        <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#5C3D2E", opacity: 0.6, textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {siparisler.map((siparis) => (
                      <tr key={siparis.id} style={{ borderBottom: "1px solid #F0E8E0" }}>
                        <td style={{ padding: "12px", fontSize: 13, fontWeight: 700, color: "#5C3D2E" }}>#{siparis.siparis_no}</td>
                        <td style={{ padding: "12px", fontSize: 13, color: "#2C1A0E" }}>{siparis.ad} {siparis.soyad}<br /><span style={{ fontSize: 11, opacity: 0.5 }}>{siparis.email}</span></td>
                        <td style={{ padding: "12px", fontSize: 14, fontWeight: 700, color: "#E8845A" }}>₺{parseFloat(siparis.toplam || 0).toFixed(2)}</td>
                        <td style={{ padding: "12px" }}>
                          <span style={{ background: siparis.durum === "tamamlandi" ? "#E8F5E9" : siparis.durum === "iptal" ? "#FFEBEE" : "#FFF5F0", color: siparis.durum === "tamamlandi" ? "#2E7D32" : siparis.durum === "iptal" ? "#C62828" : "#E8845A", padding: "4px 10px", borderRadius: 50, fontSize: 12, fontWeight: 700 }}>
                            {siparis.durum}
                          </span>
                        </td>
                        <td style={{ padding: "12px", fontSize: 12, color: "#5C3D2E", opacity: 0.6 }}>{new Date(siparis.created_at).toLocaleDateString("tr-TR")}</td>
                        <td style={{ padding: "12px" }}>
                          <select onChange={e => siparisGuncelle(siparis.id, e.target.value)} value={siparis.durum}
                            style={{ padding: "6px 10px", border: "2px solid #E8D5B7", borderRadius: 8, fontSize: 12, outline: "none", cursor: "pointer" }}>
                            <option value="beklemede">Beklemede</option>
                            <option value="hazirlaniyor">Hazırlanıyor</option>
                            <option value="kargoda">Kargoda</option>
                            <option value="tamamlandi">Tamamlandı</option>
                            <option value="iptal">İptal</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* KATEGORİLER */}
        {aktifSayfa === "kategoriler" && (
          <div>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: 28, fontWeight: 700, color: "#2C1A0E", marginBottom: 24 }}>Kategori Yönetimi</h1>
            <div style={{ background: "white", borderRadius: 20, padding: "24px", boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#FDF6EE" }}>
                    {["ID", "Kategori Adı", "Slug", "Üst Kategori", "Sıra", "Durum"].map(h => (
                      <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#5C3D2E", opacity: 0.6, textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {kategoriler.map((kat) => (
                    <tr key={kat.id} style={{ borderBottom: "1px solid #F0E8E0" }}>
                      <td style={{ padding: "10px 12px", fontSize: 13, color: "#5C3D2E", opacity: 0.5 }}>{kat.id}</td>
                      <td style={{ padding: "10px 12px", fontSize: 14, fontWeight: 600, color: "#2C1A0E", paddingLeft: kat.ust_kategori_id ? 32 : 12 }}>{kat.ust_kategori_id ? "└ " : ""}{kat.ad}</td>
                      <td style={{ padding: "10px 12px", fontSize: 12, color: "#5C3D2E", opacity: 0.6, fontFamily: "monospace" }}>{kat.slug}</td>
                      <td style={{ padding: "10px 12px", fontSize: 12, color: "#5C3D2E", opacity: 0.6 }}>{kategoriler.find(k => k.id === kat.ust_kategori_id)?.ad || "-"}</td>
                      <td style={{ padding: "10px 12px", fontSize: 13, color: "#5C3D2E" }}>{kat.sira}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ background: kat.aktif ? "#E8F5E9" : "#FFEBEE", color: kat.aktif ? "#2E7D32" : "#C62828", padding: "4px 10px", borderRadius: 50, fontSize: 12, fontWeight: 700 }}>
                          {kat.aktif ? "Aktif" : "Pasif"}
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
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: 28, fontWeight: 700, color: "#2C1A0E", marginBottom: 24 }}>Marka Yönetimi</h1>
            <div style={{ background: "white", borderRadius: 20, padding: "24px", boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#FDF6EE" }}>
                    {["ID", "Marka Adı", "Slug", "Durum"].map(h => (
                      <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#5C3D2E", opacity: 0.6, textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {markalar.map((marka) => (
                    <tr key={marka.id} style={{ borderBottom: "1px solid #F0E8E0" }}>
                      <td style={{ padding: "10px 12px", fontSize: 13, color: "#5C3D2E", opacity: 0.5 }}>{marka.id}</td>
                      <td style={{ padding: "10px 12px", fontSize: 14, fontWeight: 600, color: "#2C1A0E" }}>{marka.ad}</td>
                      <td style={{ padding: "10px 12px", fontSize: 12, color: "#5C3D2E", opacity: 0.6, fontFamily: "monospace" }}>{marka.slug}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ background: marka.aktif ? "#E8F5E9" : "#FFEBEE", color: marka.aktif ? "#2E7D32" : "#C62828", padding: "4px 10px", borderRadius: 50, fontSize: 12, fontWeight: 700 }}>
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

      </div>
    </main>
  );
}