"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useCart } from "../../context/CartContext";

export default function Urunler() {
  const [urunler, setUrunler] = useState<any[]>([]);
  const [filtrelenmis, setFiltrelenmis] = useState<any[]>([]);
  const [kategoriler, setKategoriler] = useState<any[]>([]);
  const [markalar, setMarkalar] = useState<any[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [seciliKategori, setSeciliKategori] = useState("");
  const [seciliMarka, setSeciliMarka] = useState("");
  const [seciliYas, setSeciliYas] = useState("");
  const [seciliOzellik, setSeciliOzellik] = useState("");
  const [seciliKilo, setSeciliKilo] = useState("");
  const [minFiyat, setMinFiyat] = useState("");
  const [maxFiyat, setMaxFiyat] = useState("");
  const [sadeceStoktaki, setSadeceStoktaki] = useState(false);
  const [siralama, setSiralama] = useState("varsayilan");
  const [sayfa, setSayfa] = useState(1);
  const [aramaMetni, setAramaMetni] = useState("");
  const [eklendi, setEklendi] = useState<number | null>(null);
  const [filtrePanelAcik, setFiltrePanelAcik] = useState(false);
  const { addItem, totalItems } = useCart();
  const sayfaBasina = 24;

  const yasGruplari = ["Yavru", "Yetişkin", "Yaşlı"];
  const ozellikler = ["Tahılsız", "Hipoalerjenik", "Kısır", "Light", "Özel Irk"];
  const kilolar = ["500g altı", "500g-1kg", "1kg-3kg", "3kg-7kg", "7kg-15kg", "15kg üzeri"];

  useEffect(() => {
    Promise.all([
      supabase.from("urunler").select("*, markalar(ad), kategoriler(ad, slug)").eq("aktif", true),
      supabase.from("kategoriler").select("*").eq("aktif", true).order("sira"),
      supabase.from("markalar").select("*").eq("aktif", true).order("ad"),
    ]).then(([{ data: u }, { data: k }, { data: m }]) => {
      setUrunler(u || []);
      setFiltrelenmis(u || []);
      setKategoriler(k || []);
      setMarkalar(m || []);
      setYukleniyor(false);
    });
  }, []);

  const kiloAralik = (urunAd: string, secili: string) => {
    const kgMatch = urunAd.match(/(\d+[.,]?\d*)\s*[Kk][Gg]/);
    const grMatch = urunAd.match(/(\d+[.,]?\d*)\s*[Gg][Rr]/);
    let gram = 0;
    if (kgMatch) gram = parseFloat(kgMatch[1].replace(',', '.')) * 1000;
    else if (grMatch) gram = parseFloat(grMatch[1].replace(',', '.'));
    if (gram === 0) return true;
    if (secili === "500g altı") return gram < 500;
    if (secili === "500g-1kg") return gram >= 500 && gram < 1000;
    if (secili === "1kg-3kg") return gram >= 1000 && gram < 3000;
    if (secili === "3kg-7kg") return gram >= 3000 && gram < 7000;
    if (secili === "7kg-15kg") return gram >= 7000 && gram < 15000;
    if (secili === "15kg üzeri") return gram >= 15000;
    return true;
  };

  useEffect(() => {
    let sonuc = [...urunler];
    if (aramaMetni) sonuc = sonuc.filter(u => u.ad.toLowerCase().includes(aramaMetni.toLowerCase()));
    if (seciliKategori) sonuc = sonuc.filter(u => u.kategoriler?.slug === seciliKategori);
    if (seciliMarka) sonuc = sonuc.filter(u => u.markalar?.ad === seciliMarka);
    if (seciliYas) sonuc = sonuc.filter(u => u.ad.toLowerCase().includes(seciliYas.toLowerCase()) || u.kategoriler?.ad?.toLowerCase().includes(seciliYas.toLowerCase()));
    if (seciliOzellik) sonuc = sonuc.filter(u => u.ad.toLowerCase().includes(seciliOzellik.toLowerCase()) || u.kategoriler?.ad?.toLowerCase().includes(seciliOzellik.toLowerCase()));
    if (seciliKilo) sonuc = sonuc.filter(u => kiloAralik(u.ad, seciliKilo));
    if (minFiyat) sonuc = sonuc.filter(u => (u.indirimli_fiyat || u.fiyat) >= parseFloat(minFiyat));
    if (maxFiyat) sonuc = sonuc.filter(u => (u.indirimli_fiyat || u.fiyat) <= parseFloat(maxFiyat));
    if (sadeceStoktaki) sonuc = sonuc.filter(u => u.stok > 0);
    if (siralama === "ucuz") sonuc.sort((a, b) => (a.indirimli_fiyat || a.fiyat) - (b.indirimli_fiyat || b.fiyat));
    if (siralama === "pahali") sonuc.sort((a, b) => (b.indirimli_fiyat || b.fiyat) - (a.indirimli_fiyat || a.fiyat));
    if (siralama === "az") sonuc.sort((a, b) => a.ad.localeCompare(b.ad));
    if (siralama === "stok") sonuc.sort((a, b) => b.stok - a.stok);
    setFiltrelenmis(sonuc);
    setSayfa(1);
  }, [aramaMetni, seciliKategori, seciliMarka, seciliYas, seciliOzellik, seciliKilo, minFiyat, maxFiyat, sadeceStoktaki, siralama, urunler]);

  const handleEkle = (urun: any) => {
    addItem({ id: urun.id, name: urun.ad, price: urun.indirimli_fiyat || urun.fiyat, emoji: "🐾", resim_url: urun.resim_url });
    setEklendi(urun.id);
    setTimeout(() => setEklendi(null), 1500);
  };

  const filtreTemizle = () => {
    setSeciliKategori(""); setSeciliMarka(""); setSeciliYas("");
    setSeciliOzellik(""); setSeciliKilo(""); setMinFiyat("");
    setMaxFiyat(""); setSadeceStoktaki(false); setAramaMetni("");
    setSiralama("varsayilan");
  };

  const aktifFiltreSayisi = [seciliKategori, seciliMarka, seciliYas, seciliOzellik, seciliKilo, minFiyat, maxFiyat].filter(Boolean).length + (sadeceStoktaki ? 1 : 0);
  const sayfadakiUrunler = filtrelenmis.slice((sayfa - 1) * sayfaBasina, sayfa * sayfaBasina);
  const toplamSayfa = Math.ceil(filtrelenmis.length / sayfaBasina);
  const anaKategoriler = kategoriler.filter(k => !k.ust_kategori_id);
  const altKategoriMap: { [key: number]: any[] } = {};
  kategoriler.filter(k => k.ust_kategori_id).forEach(k => {
    if (!altKategoriMap[k.ust_kategori_id]) altKategoriMap[k.ust_kategori_id] = [];
    altKategoriMap[k.ust_kategori_id].push(k);
  });

  const FilterSelect = ({ label, value, onChange, options }: any) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#5C3D2E", opacity: 0.5, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 }}>{label}</div>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width: "100%", padding: "9px 12px", border: `2px solid ${value ? "#E8845A" : "#E8D5B7"}`, borderRadius: 10, fontSize: 13, outline: "none", fontFamily: "inherit", background: "white", color: "#5C3D2E", cursor: "pointer" }}>
        <option value="">Tümü</option>
        {options.map((o: any, i: number) => (
          <option key={i} value={typeof o === "string" ? o : o.value}>{typeof o === "string" ? o : o.label}</option>
        ))}
      </select>
    </div>
  );

  const FiltrePaneli = () => (
    <div style={{ background: "white", borderRadius: 20, padding: "20px", boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 700, color: "#5C3D2E" }}>
          🔧 Filtreler {aktifFiltreSayisi > 0 && <span style={{ background: "#E8845A", color: "white", borderRadius: 50, fontSize: 11, padding: "2px 7px", marginLeft: 6 }}>{aktifFiltreSayisi}</span>}
        </div>
        {aktifFiltreSayisi > 0 && (
          <button onClick={filtreTemizle} style={{ background: "none", border: "none", color: "#E8845A", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Temizle</button>
        )}
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#5C3D2E", opacity: 0.5, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 }}>🔍 Ara</div>
        <input value={aramaMetni} onChange={e => setAramaMetni(e.target.value)}
          placeholder="Ürün ara..." style={{ width: "100%", padding: "9px 12px", border: "2px solid #E8D5B7", borderRadius: 10, fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box" as const }} />
      </div>

      <div style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => setSadeceStoktaki(!sadeceStoktaki)}>
        <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${sadeceStoktaki ? "#E8845A" : "#E8D5B7"}`, background: sadeceStoktaki ? "#E8845A" : "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {sadeceStoktaki && <span style={{ color: "white", fontSize: 12 }}>✓</span>}
        </div>
        <span style={{ fontSize: 13, color: "#5C3D2E", fontWeight: sadeceStoktaki ? 700 : 400 }}>Sadece Stoktakiler</span>
      </div>

      <FilterSelect label="📁 Kategori" value={seciliKategori} onChange={setSeciliKategori}
        options={anaKategoriler.map(k => ({ value: k.slug, label: k.ad }))} />

      <FilterSelect label="🏷️ Marka" value={seciliMarka} onChange={setSeciliMarka}
        options={markalar.map(m => m.ad)} />

      <FilterSelect label="🐾 Yaş Grubu" value={seciliYas} onChange={setSeciliYas}
        options={yasGruplari} />

      <FilterSelect label="⭐ Özellik" value={seciliOzellik} onChange={setSeciliOzellik}
        options={ozellikler} />

      <FilterSelect label="⚖️ Paket Boyutu" value={seciliKilo} onChange={setSeciliKilo}
        options={kilolar} />

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#5C3D2E", opacity: 0.5, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 }}>💰 Fiyat Aralığı (₺)</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <input type="number" value={minFiyat} onChange={e => setMinFiyat(e.target.value)}
            placeholder="Min" style={{ padding: "9px 10px", border: "2px solid #E8D5B7", borderRadius: 10, fontSize: 13, outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" as const }} />
          <input type="number" value={maxFiyat} onChange={e => setMaxFiyat(e.target.value)}
            placeholder="Max" style={{ padding: "9px 10px", border: "2px solid #E8D5B7", borderRadius: 10, fontSize: 13, outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" as const }} />
        </div>
      </div>
    </div>
  );

  return (
    <main style={{ minHeight: "100vh", background: "#FDF6EE", fontFamily: "sans-serif" }}>

      <style>{`
        .urunler-layout { max-width: 1400px; margin: 0 auto; padding: 0 24px 48px; display: grid; grid-template-columns: 280px 1fr; gap: 24px; }
        .urun-grid-all { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
        .filtre-desktop { display: block; }
        .filtre-mob-btn { display: none !important; }
        .filtre-overlay-mob { display: none; }
        .header-urunler { padding: 16px 48px; }
        .urun-topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }

        @media (max-width: 768px) {
          .urunler-layout { grid-template-columns: 1fr !important; padding: 0 14px 96px; gap: 0; }
          .urun-grid-all { grid-template-columns: repeat(2,1fr) !important; gap: 10px; }
          .filtre-desktop { display: none !important; }
          .filtre-mob-btn { display: flex !important; }
          .header-urunler { padding: 13px 16px !important; }
          .filtre-overlay-mob { display: block; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 400; }
          .filtre-drawer-mob { position: fixed; bottom: 0; left: 0; right: 0; z-index: 500; background: #FDF6EE; border-radius: 24px 24px 0 0; padding: 20px 16px 40px; max-height: 85vh; overflow-y: auto; }
          .urun-topbar { gap: 8px; }
        }
        @media (max-width: 480px) {
          .urun-grid-all { grid-template-columns: repeat(2,1fr) !important; gap: 8px; }
        }
      `}</style>

      {/* Mobil filtre drawer */}
      {filtrePanelAcik && (
        <>
          <div className="filtre-overlay-mob" onClick={() => setFiltrePanelAcik(false)} />
          <div className="filtre-drawer-mob">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontFamily: "Georgia,serif", fontSize: 18, fontWeight: 700, color: "#5C3D2E" }}>Filtrele & Sırala</div>
              <button onClick={() => setFiltrePanelAcik(false)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#5C3D2E" }}>✕</button>
            </div>
            <FiltrePaneli />
            <button onClick={() => setFiltrePanelAcik(false)}
              style={{ width: "100%", marginTop: 16, background: "#E8845A", color: "white", border: "none", borderRadius: 50, padding: "14px", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
              Filtreleri Uygula ({filtrelenmis.length} ürün)
            </button>
          </div>
        </>
      )}

      {/* Header */}
      <header className="header-urunler" style={{ background: "white", borderBottom: "1px solid #E8D5B7", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100 }}>
        <a href="/" style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, color: "#5C3D2E", textDecoration: "none" }}>
          evemama<span style={{ color: "#E8845A", fontStyle: "italic" }}>.net</span>
        </a>
        <a href="/sepet" style={{ background: "#5C3D2E", color: "white", padding: "9px 18px", borderRadius: 50, textDecoration: "none", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
          🛒 {totalItems > 0 && <span style={{ background: "#E8845A", borderRadius: 50, padding: "1px 7px", fontSize: 11 }}>{totalItems}</span>}
        </a>
      </header>

      {/* Breadcrumb */}
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "12px 16px", fontSize: 13, color: "#5C3D2E", opacity: 0.6 }}>
        <a href="/" style={{ color: "#E8845A", textDecoration: "none" }}>Ana Sayfa</a> / Tüm Ürünler
      </div>

      <div className="urunler-layout">

        {/* Sol: Filtreler — sadece desktop */}
        <div className="filtre-desktop">
          <FiltrePaneli />
        </div>

        {/* Sağ: Ürünler */}
        <div>
          <div className="urun-topbar">
            <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
              {/* Mobil filtre butonu */}
              <button className="filtre-mob-btn" onClick={() => setFiltrePanelAcik(true)}
                style={{ alignItems: "center", gap: 6, background: "white", border: "2px solid #E8D5B7", borderRadius: 50, padding: "9px 16px", fontSize: 13, fontWeight: 600, color: "#5C3D2E", cursor: "pointer", flexShrink: 0 }}>
                🔧 Filtre {aktifFiltreSayisi > 0 && <span style={{ background: "#E8845A", color: "white", borderRadius: 50, fontSize: 11, padding: "1px 6px", marginLeft: 4 }}>{aktifFiltreSayisi}</span>}
              </button>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: "#5C3D2E" }}>
                Tüm Ürünler
                <span style={{ fontSize: 12, fontWeight: 400, opacity: 0.5, marginLeft: 6 }}>({filtrelenmis.length})</span>
              </div>
            </div>
            <select value={siralama} onChange={e => setSiralama(e.target.value)}
              style={{ padding: "9px 14px", border: "2px solid #E8D5B7", borderRadius: 12, fontSize: 13, outline: "none", fontFamily: "inherit", background: "white", color: "#5C3D2E", cursor: "pointer", flexShrink: 0 }}>
              <option value="varsayilan">Varsayılan</option>
              <option value="ucuz">Önce Ucuz</option>
              <option value="pahali">Önce Pahalı</option>
              <option value="az">A'dan Z'ye</option>
              <option value="stok">Stok Durumu</option>
            </select>
          </div>

          {/* Aktif filtreler */}
          {aktifFiltreSayisi > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
              {seciliKategori && <span style={{ background: "#FFF5F0", color: "#E8845A", border: "1px solid #E8845A", borderRadius: 50, padding: "4px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }} onClick={() => setSeciliKategori("")}>✕ {kategoriler.find(k => k.slug === seciliKategori)?.ad}</span>}
              {seciliMarka && <span style={{ background: "#FFF5F0", color: "#E8845A", border: "1px solid #E8845A", borderRadius: 50, padding: "4px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }} onClick={() => setSeciliMarka("")}>✕ {seciliMarka}</span>}
              {seciliYas && <span style={{ background: "#FFF5F0", color: "#E8845A", border: "1px solid #E8845A", borderRadius: 50, padding: "4px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }} onClick={() => setSeciliYas("")}>✕ {seciliYas}</span>}
              {seciliOzellik && <span style={{ background: "#FFF5F0", color: "#E8845A", border: "1px solid #E8845A", borderRadius: 50, padding: "4px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }} onClick={() => setSeciliOzellik("")}>✕ {seciliOzellik}</span>}
              {seciliKilo && <span style={{ background: "#FFF5F0", color: "#E8845A", border: "1px solid #E8845A", borderRadius: 50, padding: "4px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }} onClick={() => setSeciliKilo("")}>✕ {seciliKilo}</span>}
              {(minFiyat || maxFiyat) && <span style={{ background: "#FFF5F0", color: "#E8845A", border: "1px solid #E8845A", borderRadius: 50, padding: "4px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }} onClick={() => { setMinFiyat(""); setMaxFiyat(""); }}>✕ ₺{minFiyat}-₺{maxFiyat}</span>}
              {sadeceStoktaki && <span style={{ background: "#FFF5F0", color: "#E8845A", border: "1px solid #E8845A", borderRadius: 50, padding: "4px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }} onClick={() => setSadeceStoktaki(false)}>✕ Stokta</span>}
            </div>
          )}

          {yukleniyor ? (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: "#5C3D2E" }}>Yükleniyor...</div>
            </div>
          ) : sayfadakiUrunler.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", background: "white", borderRadius: 24 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>😢</div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: "#5C3D2E", marginBottom: 12 }}>Ürün bulunamadı</div>
              <button onClick={filtreTemizle} style={{ background: "#E8845A", color: "white", border: "none", borderRadius: 50, padding: "12px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Filtreleri Temizle</button>
            </div>
          ) : (
            <div className="urun-grid-all">
              {sayfadakiUrunler.map((urun, i) => (
                <div key={i} style={{ background: "white", borderRadius: 18, overflow: "hidden", transition: "transform .2s, box-shadow .2s" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(92,61,46,0.1)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
                  <a href={`/urun/${urun.slug}`} style={{ textDecoration: "none", display: "block" }}>
                    <div style={{ height: 140, background: "#FDF6EE", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                      {urun.resim_url ? (
                        <img src={urun.resim_url} alt={urun.ad} style={{ width: "100%", height: "100%", objectFit: "contain", padding: 10, mixBlendMode: "multiply" }} />
                      ) : (
                        <div style={{ fontSize: 48, opacity: 0.2 }}>🐾</div>
                      )}
                      {urun.stok === 0 && (
                        <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.75)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ background: "#5C3D2E", color: "white", fontSize: 10, fontWeight: 700, padding: "5px 10px", borderRadius: 50 }}>Stokta Yok</span>
                        </div>
                      )}
                      {urun.stok > 0 && urun.stok <= 5 && (
                        <span style={{ position: "absolute", top: 8, left: 8, background: "#E8845A", color: "white", fontSize: 9, fontWeight: 700, padding: "3px 7px", borderRadius: 50 }}>Son {urun.stok}!</span>
                      )}
                    </div>
                    <div style={{ padding: "10px 12px 6px" }}>
                      {urun.markalar && <div style={{ fontSize: 9, fontWeight: 700, color: "#8BAF8E", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 3 }}>{urun.markalar.ad}</div>}
                      <div style={{ fontFamily: "Georgia, serif", fontSize: 13, fontWeight: 700, color: "#5C3D2E", lineHeight: 1.3 }}>{urun.ad.substring(0, 50)}{urun.ad.length > 50 ? "..." : ""}</div>
                    </div>
                  </a>
                  <div style={{ padding: "0 12px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 700, color: "#5C3D2E" }}>₺{(urun.indirimli_fiyat || urun.fiyat).toFixed(2)}</span>
                      {urun.indirimli_fiyat && <span style={{ fontSize: 10, color: "#5C3D2E", opacity: 0.4, textDecoration: "line-through", marginLeft: 4 }}>₺{urun.fiyat.toFixed(2)}</span>}
                    </div>
                    <button onClick={() => handleEkle(urun)} disabled={urun.stok === 0}
                      style={{ background: eklendi === urun.id ? "#8BAF8E" : urun.stok === 0 ? "#ccc" : "#E8845A", color: "white", border: "none", borderRadius: 50, padding: "7px 12px", fontSize: 11, fontWeight: 700, cursor: urun.stok === 0 ? "not-allowed" : "pointer" }}>
                      {eklendi === urun.id ? "✅" : "+ Sepet"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sayfalama */}
          {toplamSayfa > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 28, flexWrap: "wrap" }}>
              <button onClick={() => setSayfa(1)} disabled={sayfa === 1}
                style={{ padding: "9px 14px", border: "2px solid #E8D5B7", borderRadius: 12, background: "white", cursor: sayfa === 1 ? "not-allowed" : "pointer", color: "#5C3D2E", fontWeight: 600, opacity: sayfa === 1 ? 0.4 : 1, fontSize: 13 }}>«</button>
              <button onClick={() => setSayfa(s => Math.max(1, s - 1))} disabled={sayfa === 1}
                style={{ padding: "9px 14px", border: "2px solid #E8D5B7", borderRadius: 12, background: "white", cursor: sayfa === 1 ? "not-allowed" : "pointer", color: "#5C3D2E", fontWeight: 600, opacity: sayfa === 1 ? 0.4 : 1, fontSize: 13 }}>←</button>
              {Array.from({ length: Math.min(5, toplamSayfa) }, (_, i) => {
                const p = sayfa <= 3 ? i + 1 : sayfa - 2 + i;
                if (p > toplamSayfa) return null;
                return (
                  <button key={p} onClick={() => setSayfa(p)}
                    style={{ padding: "9px 13px", border: `2px solid ${sayfa === p ? "#E8845A" : "#E8D5B7"}`, borderRadius: 12, background: sayfa === p ? "#E8845A" : "white", cursor: "pointer", color: sayfa === p ? "white" : "#5C3D2E", fontWeight: 700, fontSize: 13 }}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => setSayfa(s => Math.min(toplamSayfa, s + 1))} disabled={sayfa === toplamSayfa}
                style={{ padding: "9px 14px", border: "2px solid #E8D5B7", borderRadius: 12, background: "white", cursor: sayfa === toplamSayfa ? "not-allowed" : "pointer", color: "#5C3D2E", fontWeight: 600, opacity: sayfa === toplamSayfa ? 0.4 : 1, fontSize: 13 }}>→</button>
              <button onClick={() => setSayfa(toplamSayfa)} disabled={sayfa === toplamSayfa}
                style={{ padding: "9px 14px", border: "2px solid #E8D5B7", borderRadius: 12, background: "white", cursor: sayfa === toplamSayfa ? "not-allowed" : "pointer", color: "#5C3D2E", fontWeight: 600, opacity: sayfa === toplamSayfa ? 0.4 : 1, fontSize: 13 }}>»</button>
            </div>
          )}
        </div>
      </div>

      {/* Mobil bottom nav */}
      <style>{`.mob-nav-urunler { display: none; } @media(max-width:768px){ .mob-nav-urunler { display: grid !important; grid-template-columns: repeat(4,1fr); position: fixed; bottom: 0; left: 0; right: 0; z-index: 300; background: rgba(253,246,238,0.97); backdrop-filter: blur(14px); border-top: 1px solid rgba(92,61,46,.08); padding: 8px 0 20px; } }`}</style>
      <nav className="mob-nav-urunler" style={{ display: "none" }}>
        <a href="/" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, textDecoration: "none", padding: 4 }}>
          <span style={{ fontSize: 22 }}>🏠</span><span style={{ fontSize: 10, fontWeight: 600, color: "#5C3D2E", opacity: 0.4 }}>Anasayfa</span>
        </a>
        <a href="/urunler" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, textDecoration: "none", padding: 4 }}>
          <span style={{ fontSize: 22 }}>🔍</span><span style={{ fontSize: 10, fontWeight: 600, color: "#E8845A" }}>Ara</span>
        </a>
        <a href="/favoriler" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, textDecoration: "none", padding: 4 }}>
          <span style={{ fontSize: 22 }}>❤️</span><span style={{ fontSize: 10, fontWeight: 600, color: "#5C3D2E", opacity: 0.4 }}>Favoriler</span>
        </a>
        <a href="/sepet" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, textDecoration: "none", padding: 4 }}>
          <span style={{ fontSize: 22 }}>🛒</span><span style={{ fontSize: 10, fontWeight: 600, color: "#5C3D2E", opacity: 0.4 }}>Sepet</span>
        </a>
      </nav>

    </main>
  );
}