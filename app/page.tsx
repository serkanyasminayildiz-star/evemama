"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useCart } from "../context/CartContext";

export default function Home() {
  const [kullanici, setKullanici] = useState<any>(null);
  const [oneCikanlar, setOneCikanlar] = useState<any[]>([]);
  const [kategoriler, setKategoriler] = useState<any[]>([]);
  const [altKategoriler, setAltKategoriler] = useState<{ [key: string]: any[] }>({});
  const [acikMenu, setAcikMenu] = useState<string | null>(null);
  const [mobMenuAcik, setMobMenuAcik] = useState(false);
  const { addItem, totalItems } = useCart();
  const [eklendi, setEklendi] = useState<number | null>(null);

  const kategoriEmoji: { [key: string]: string } = {
    "kedi": "🐱", "kopek": "🐶", "kus": "🐦",
    "balik": "🐟", "kemirgenler": "🐹"
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setKullanici(data.user));
    supabase.from("urunler").select("*, markalar(ad)")
      .eq("aktif", true).gt("stok", 0).limit(32)
      .then(({ data }) => setOneCikanlar(data || []));
    supabase.from("kategoriler").select("*")
      .is("ust_kategori_id", null).eq("aktif", true).order("sira")
      .then(({ data }) => setKategoriler(data || []));
  }, []);

  useEffect(() => {
    if (kategoriler.length === 0) return;
    kategoriler.forEach(kat => {
      supabase.from("kategoriler").select("*")
        .eq("ust_kategori_id", kat.id).eq("aktif", true).order("sira")
        .then(({ data }) => {
          if (data && data.length > 0)
            setAltKategoriler(prev => ({ ...prev, [kat.slug]: data }));
        });
    });
  }, [kategoriler]);

  const handleEkle = (urun: any) => {
    addItem({ id: urun.id, name: urun.ad, price: urun.indirimli_fiyat || urun.fiyat, emoji: "🐾", resim_url: urun.resim_url });
    setEklendi(urun.id);
    setTimeout(() => setEklendi(null), 1500);
  };

  return (
    <main style={{ fontFamily: "sans-serif", background: "#FDF6EE", color: "#2C1A0E", overflowX: "hidden" }}>

      <style>{`
        .hamburger-btn { display: none; background: none; border: none; font-size: 22px; cursor: pointer; color: #5C3D2E; padding: 4px 8px; }
        .header-grid { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; padding: 16px 48px; max-width: 1400px; margin: 0 auto; }
        .hdr-right { display: flex; justify-content: flex-end; gap: 8px; align-items: center; }
        .hdr-right-mob { display: none; justify-content: flex-end; align-items: center; gap: 6px; }
        .hero-grid { max-width: 1400px; margin: 0 auto; padding: 0 48px 48px; display: grid; grid-template-columns: 1fr 380px; gap: 24px; }
        .hero-banner { border-radius: 28px; height: 360px; background: linear-gradient(135deg,#F8E2C8,#F4C09A,#E8845A); display: flex; align-items: center; position: relative; box-shadow: 0 12px 40px rgba(232,132,90,.22); overflow: hidden; }
        .banner-title { font-family: Georgia,serif; font-size: 48px; font-weight: 700; color: #5C3D2E; line-height: 1.05; margin-bottom: 10px; }
        .banner-emoji-el { position: absolute; right: 40px; bottom: 0; font-size: 160px; line-height: 1; }
        .hero-right { display: flex; flex-direction: column; gap: 16px; }
        .kat-grid { display: grid; grid-template-columns: repeat(5,1fr); gap: 14px; }
        .urun-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 20px; }
        .trust-grid { max-width: 1400px; margin: 0 auto; display: grid; grid-template-columns: repeat(4,1fr); }
        .trust-item { display: flex; align-items: center; gap: 16px; padding: 0 32px; border-right: 1px solid rgba(255,255,255,.1); }
        .trust-item:last-child { border-right: none; }
        .footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px; margin-bottom: 48px; }
        .footer-bot { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,.07); padding-top: 24px; }
        .ara-btn { display: inline-block; }
        .bottom-nav { display: none; }
        .mob-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 400; }
        .mob-panel { display: none; position: fixed; top: 0; left: 0; bottom: 0; width: 280px; background: #FDF6EE; z-index: 500; padding: 24px 20px; overflow-y: auto; box-shadow: 4px 0 24px rgba(0,0,0,0.15); flex-direction: column; gap: 4px; }
        .mob-overlay.acik { display: block; }
        .mob-panel.acik { display: flex; }

        @media (max-width: 768px) {
          .hamburger-btn { display: flex; align-items: center; }
          .header-grid { padding: 12px 16px; grid-template-columns: auto 1fr auto; gap: 8px; }
          .hdr-right { display: none; }
          .hdr-right-mob { display: flex; }
          .nav-bar-inner { padding: 0 12px !important; }
          .cat-tab { padding: 11px 12px !important; font-size: 13px !important; }
          .ara-section { padding: 10px 14px !important; }
          .ara-bar { border-radius: 12px !important; padding: 11px 16px !important; }
          .ara-btn { display: none; }
          .hero-grid { grid-template-columns: 1fr !important; padding: 0 14px 24px !important; gap: 12px !important; }
          .hero-banner { height: 220px !important; border-radius: 20px !important; }
          .banner-pad { padding: 22px 20px !important; }
          .banner-title { font-size: 26px !important; }
          .banner-emoji-el { font-size: 100px !important; right: 0 !important; }
          .kat-section { padding: 0 14px 32px !important; }
          .kat-grid { grid-template-columns: repeat(4,1fr) !important; gap: 10px !important; }
          .sec-title { font-size: 20px !important; }
          .urun-section { padding: 0 14px !important; }
          .urun-grid { grid-template-columns: repeat(2,1fr) !important; gap: 10px !important; }
          .urun-img { height: 130px !important; }
          .trust-section { padding: 26px 16px !important; }
          .trust-grid { grid-template-columns: repeat(2,1fr) !important; gap: 16px 12px !important; }
          .trust-item { padding: 0 !important; border-right: none !important; align-items: flex-start !important; gap: 10px !important; }
          .footer-wrap { padding: 36px 16px 96px !important; }
          .footer-grid { grid-template-columns: 1fr 1fr !important; gap: 28px !important; }
          .footer-bot { flex-direction: column !important; gap: 12px !important; text-align: center !important; }
          .bottom-nav {
            display: grid; grid-template-columns: repeat(4,1fr);
            position: fixed; bottom: 0; left: 0; right: 0; z-index: 300;
            background: rgba(253,246,238,0.97); backdrop-filter: blur(14px);
            border-top: 1px solid rgba(92,61,46,.08); padding: 8px 0 20px;
          }
          .bnav-item { display: flex; flex-direction: column; align-items: center; gap: 3px; background: none; border: none; cursor: pointer; padding: 4px; text-decoration: none; }
          .bnav-icon { font-size: 22px; }
          .bnav-label { font-size: 10px; font-weight: 600; color: #5C3D2E; opacity: .4; }
          .bnav-label.aktif { color: #E8845A; opacity: 1; }
        }
        @media (max-width: 480px) {
          .banner-title { font-size: 22px !important; }
          .banner-emoji-el { font-size: 80px !important; }
        }
      `}</style>

      {/* MOBİL MENÜ */}
      <div className={`mob-overlay${mobMenuAcik ? " acik" : ""}`} onClick={() => setMobMenuAcik(false)} />
      <div className={`mob-panel${mobMenuAcik ? " acik" : ""}`}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ fontFamily: "Georgia,serif", fontSize: 20, fontWeight: 700, color: "#5C3D2E" }}>evemama<span style={{ color: "#E8845A", fontStyle: "italic" }}>.net</span></div>
          <button onClick={() => setMobMenuAcik(false)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#5C3D2E" }}>✕</button>
        </div>
        {kullanici ? (
          <div style={{ background: "rgba(244,192,154,0.15)", borderRadius: 12, padding: "12px 16px", marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#5C3D2E", marginBottom: 8 }}>👋 {kullanici.user_metadata?.full_name?.split(" ")[0] || "Üyemiz"}</div>
            <button onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }}
              style={{ background: "none", border: "1px solid #E8D5B7", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#5C3D2E", padding: "6px 14px", borderRadius: 50 }}>Çıkış Yap</button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <a href="/giris" style={{ flex: 1, textAlign: "center", fontSize: 13, fontWeight: 600, color: "#5C3D2E", padding: 10, borderRadius: 10, textDecoration: "none", border: "1px solid #E8D5B7" }}>Giriş Yap</a>
            <a href="/uye-ol" style={{ flex: 1, textAlign: "center", border: "2px solid #E8845A", fontSize: 13, fontWeight: 700, color: "#E8845A", padding: 10, borderRadius: 50, textDecoration: "none" }}>Üye Ol</a>
          </div>
        )}
        {[
          { href: "/", label: "🏠 Anasayfa" },
          { href: "/kategori/kedi", label: "🐱 Kedi" },
          { href: "/kategori/kopek", label: "🐶 Köpek" },
          { href: "/urunler", label: "🛍️ Tüm Ürünler" },
          { href: "/kampanyalar", label: "🏷️ Kampanyalar" },
          { href: "/hakkimizda", label: "ℹ️ Hakkımızda" },
          { href: "/iletisim", label: "📞 İletişim" },
        ].map((item, i) => (
          <a key={i} href={item.href}
            style={{ display: "block", padding: "13px 16px", fontSize: 15, fontWeight: 600, color: "#5C3D2E", textDecoration: "none", borderRadius: 12 }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(244,192,154,0.15)"}
            onMouseLeave={e => e.currentTarget.style.background = "none"}>
            {item.label}
          </a>
        ))}
      </div>

      {/* HEADER */}
      <header style={{ position: "sticky", top: 0, zIndex: 200, background: "rgba(253,246,238,0.97)", backdropFilter: "blur(14px)", borderBottom: "1px solid rgba(92,61,46,0.08)" }}>
        <div className="header-grid">
          <div style={{ display: "flex", alignItems: "center" }}>
            <button className="hamburger-btn" onClick={() => setMobMenuAcik(true)}>☰</button>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "Georgia,serif", fontSize: 26, fontWeight: 700, color: "#5C3D2E" }}>
              evemama<span style={{ color: "#E8845A", fontSize: 17, fontStyle: "italic" }}>.net</span>
            </div>
            <div style={{ fontSize: 10, color: "#5C3D2E", opacity: 0.4, letterSpacing: "0.8px", textTransform: "uppercase" }}>Dostunuzun Dükkânı</div>
          </div>
          {/* Desktop sağ */}
          <div className="hdr-right">
            {kullanici ? (
              <>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#5C3D2E" }}>👋 {kullanici.user_metadata?.full_name?.split(" ")[0] || "Üyemiz"}</span>
                <button onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }}
                  style={{ background: "none", border: "2px solid #E8D5B7", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#5C3D2E", padding: "8px 16px", borderRadius: 50 }}>Çıkış</button>
              </>
            ) : (
              <>
                <a href="/giris" style={{ fontSize: 13, fontWeight: 600, color: "#5C3D2E", opacity: 0.7, padding: "8px 12px", borderRadius: 10, textDecoration: "none" }}>Giriş Yap</a>
                <a href="/uye-ol" style={{ border: "2px solid #E8845A", fontSize: 13, fontWeight: 700, color: "#E8845A", padding: "8px 16px", borderRadius: 50, textDecoration: "none" }}>Üye Ol</a>
              </>
            )}
            <a href="/sepet" style={{ background: "#5C3D2E", color: "white", borderRadius: 50, padding: "10px 20px", fontSize: 13, fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
              🛒 Sepet {totalItems > 0 && <span style={{ background: "#E8845A", borderRadius: 50, padding: "1px 7px", fontSize: 12 }}>{totalItems}</span>}
            </a>
          </div>
          {/* Mobil sağ */}
          <div className="hdr-right-mob">
            <a href="/favoriler" style={{ fontSize: 13, fontWeight: 600, color: "#5C3D2E", opacity: 0.7, padding: "6px 10px", borderRadius: 10, textDecoration: "none" }}>❤️ Favoriler</a>
            <a href="/sepet" style={{ fontSize: 22, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
              🛒 {totalItems > 0 && <span style={{ background: "#E8845A", color: "white", borderRadius: 50, padding: "1px 6px", fontSize: 11, fontWeight: 700 }}>{totalItems}</span>}
            </a>
          </div>
        </div>

        {/* KATEGORİ NAV */}
        <nav style={{ borderTop: "1px solid rgba(92,61,46,0.06)", background: "#FFFCF8" }}>
          <div className="nav-bar-inner" style={{ display: "flex", maxWidth: 1400, margin: "0 auto", padding: "0 48px", overflowX: "auto", scrollbarWidth: "none" as any }}>
            <a href="/" className="cat-tab" style={{ flexShrink: 0, padding: "14px 18px", fontSize: 14, fontWeight: 600, color: "#E8845A", textDecoration: "none", whiteSpace: "nowrap", borderBottom: "2px solid #E8845A" }}>🏠 Anasayfa</a>
            {["kedi", "kopek"].map((slug) => {
              const kat = kategoriler.find(k => k.slug === slug);
              if (!kat) return null;
              return (
                <div key={slug} style={{ position: "relative", flexShrink: 0 }}
                  onMouseEnter={() => setAcikMenu(slug)} onMouseLeave={() => setAcikMenu(null)}>
                  <div className="cat-tab" style={{ padding: "14px 18px", fontSize: 14, fontWeight: 600, color: "#5C3D2E", opacity: acikMenu === slug ? 1 : 0.6, whiteSpace: "nowrap", borderBottom: acikMenu === slug ? "2px solid #E8845A" : "2px solid transparent", cursor: "pointer" }}>
                    {kategoriEmoji[slug] || "🐾"} {kat.ad} {altKategoriler[slug]?.length > 0 ? "▾" : ""}
                  </div>
                  {acikMenu === slug && altKategoriler[slug]?.length > 0 && (
                    <div style={{ position: "absolute", top: "100%", left: 0, background: "white", borderRadius: 16, boxShadow: "0 12px 40px rgba(92,61,46,0.15)", padding: "12px 8px", minWidth: 240, zIndex: 300, border: "1px solid #E8D5B7" }}>
                      <a href={`/kategori/${slug}`} style={{ display: "block", padding: "10px 16px", fontSize: 13, fontWeight: 700, color: "#E8845A", textDecoration: "none", borderRadius: 10, marginBottom: 4 }}>Tüm {kat.ad} →</a>
                      <div style={{ height: 1, background: "#F0E8E0", margin: "8px" }} />
                      {altKategoriler[slug].map((alt, j) => (
                        <a key={j} href={`/kategori/${alt.slug}`}
                          style={{ display: "block", padding: "9px 16px", fontSize: 13, color: "#5C3D2E", textDecoration: "none", borderRadius: 10 }}
                          onMouseEnter={e => e.currentTarget.style.background = "#FDF6EE"}
                          onMouseLeave={e => e.currentTarget.style.background = "none"}>{alt.ad}</a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            <a href="/urunler" className="cat-tab" style={{ flexShrink: 0, padding: "14px 18px", fontSize: 14, fontWeight: 600, color: "#5C3D2E", opacity: 0.6, textDecoration: "none", whiteSpace: "nowrap", borderBottom: "2px solid transparent" }}>🛍️ Tüm Ürünler</a>
            <a href="/kampanyalar" className="cat-tab" style={{ flexShrink: 0, padding: "14px 18px", fontSize: 14, fontWeight: 600, color: "#5C3D2E", opacity: 0.6, textDecoration: "none", whiteSpace: "nowrap", borderBottom: "2px solid transparent" }}>🏷️ Kampanyalar</a>
          </div>
        </nav>
      </header>

      {/* ARAMA */}
      <div className="ara-section" style={{ padding: "20px 48px", maxWidth: 1400, margin: "0 auto" }}>
        <div className="ara-bar" style={{ background: "white", border: "2px solid #E8D5B7", borderRadius: 16, padding: "13px 20px", display: "flex", alignItems: "center", gap: 12, maxWidth: 680, margin: "0 auto" }}>
          <span style={{ fontSize: 18, opacity: 0.35 }}>🔍</span>
          <input type="text" placeholder="Mama, oyuncak, aksesuar veya marka ara..."
            style={{ flex: 1, border: "none", background: "none", outline: "none", fontSize: 15, fontFamily: "inherit" }}
            onKeyDown={e => { if (e.key === "Enter") window.location.href = `/urunler?ara=${(e.target as HTMLInputElement).value}`; }} />
          <button className="ara-btn" style={{ background: "#E8845A", color: "white", border: "none", borderRadius: 10, padding: "8px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Ara</button>
        </div>
      </div>

      {/* HERO */}
      <div className="hero-grid">
        <div>
          <div className="hero-banner">
            <div className="banner-pad" style={{ padding: 48, flex: 1, zIndex: 2, position: "relative" }}>
              <div style={{ background: "rgba(255,255,255,.3)", color: "#5C3D2E", fontSize: 11, fontWeight: 700, textTransform: "uppercase", padding: "5px 14px", borderRadius: 50, display: "inline-block", marginBottom: 16 }}>🔥 Haftanın Fırsatı</div>
              <h1 className="banner-title">Evcil dostunuz<br /><em style={{ color: "white" }}>en iyisini</em> hak ediyor</h1>
              <p style={{ fontSize: 15, color: "#5C3D2E", opacity: 0.65, marginBottom: 24 }}>1000₺ üzeri alışverişlerde ücretsiz kargo!</p>
              <a href="/urunler" style={{ background: "#5C3D2E", color: "white", fontSize: 14, fontWeight: 700, padding: "12px 24px", borderRadius: 50, display: "inline-block", textDecoration: "none" }}>Alışverişe Başla →</a>
            </div>
            <div className="banner-emoji-el">🐱</div>
          </div>
          <div style={{ display: "flex", gap: 6, justifyContent: "center", margin: "12px 0" }}>
            <div style={{ width: 20, height: 6, borderRadius: 3, background: "#E8845A" }} />
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#E8D5B7" }} />
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#E8D5B7" }} />
          </div>
        </div>
        <div className="hero-right">
          <a href="/urunler" style={{ background: "#E8845A", color: "white", border: "none", borderRadius: 18, padding: "20px 28px", fontSize: 17, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 12, boxShadow: "0 10px 28px rgba(232,132,90,.32)", textDecoration: "none" }}>
            Alışverişe Başla
            <span style={{ background: "rgba(255,255,255,.22)", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>→</span>
          </a>
          <a href="/kategori/kopek" style={{ borderRadius: 20, padding: "24px 26px", background: "linear-gradient(135deg,#C8DEC9,rgba(139,175,142,.33))", display: "flex", alignItems: "center", justifyContent: "space-between", textDecoration: "none" }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#5C3D2E", opacity: 0.7, textTransform: "uppercase", marginBottom: 4 }}>🐶 Köpek Ürünleri</div>
              <div style={{ fontFamily: "Georgia,serif", fontSize: 19, fontWeight: 700, color: "#5C3D2E" }}>Yeni sezon<br />köpek mamaları</div>
            </div>
            <div style={{ fontSize: 52 }}>🦴</div>
          </a>
          <div style={{ borderRadius: 20, padding: "18px 20px", background: "#5C3D2E", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#F4C09A", textTransform: "uppercase", marginBottom: 3 }}>🚀 Ücretsiz Kargo</div>
              <div style={{ fontFamily: "Georgia,serif", fontSize: 17, fontWeight: 700, color: "white" }}>1000₺ üzeri<br /><em style={{ color: "#F4C09A" }}>aynı gün teslimat</em></div>
            </div>
            <div style={{ fontSize: 40 }}>📦</div>
          </div>
        </div>
      </div>

      {/* KATEGORİLER */}
      <div className="kat-section" style={{ maxWidth: 1400, margin: "0 auto", padding: "0 48px 52px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 className="sec-title" style={{ fontFamily: "Georgia,serif", fontSize: 28, fontWeight: 700, color: "#5C3D2E" }}>Kategorilere <span style={{ color: "#E8845A", fontStyle: "italic" }}>Göz At</span></h2>
          <a href="/urunler" style={{ fontSize: 14, fontWeight: 600, color: "#E8845A", textDecoration: "none" }}>Tümünü gör →</a>
        </div>
        <div className="kat-grid">
          {kategoriler.map((kat, i) => (
            <a key={i} href={`/kategori/${kat.slug}`}
              style={{ background: "white", borderRadius: 20, padding: "20px 8px 14px", textAlign: "center", textDecoration: "none" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(92,61,46,0.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>{kategoriEmoji[kat.slug] || "🐾"}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#5C3D2E" }}>{kat.ad}</div>
            </a>
          ))}
        </div>
      </div>

      {/* ÜRÜNLER */}
      <div style={{ background: "#FFFCF8", padding: "48px 0" }}>
        <div className="urun-section" style={{ maxWidth: 1400, margin: "0 auto", padding: "0 48px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <h2 className="sec-title" style={{ fontFamily: "Georgia,serif", fontSize: 28, fontWeight: 700, color: "#5C3D2E" }}>Öne Çıkan <span style={{ color: "#E8845A", fontStyle: "italic" }}>Ürünler</span></h2>
            <a href="/urunler" style={{ fontSize: 14, fontWeight: 600, color: "#E8845A", textDecoration: "none" }}>Tümü →</a>
          </div>
          <div className="urun-grid">
            {oneCikanlar.map((urun, i) => (
              <div key={i} style={{ background: "white", borderRadius: 24, overflow: "hidden" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 16px 40px rgba(92,61,46,0.1)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
                <a href={`/urun/${urun.slug}`} style={{ textDecoration: "none", display: "block" }}>
                  <div className="urun-img" style={{ height: 180, background: "#f9f9f9", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                    {urun.resim_url
                      ? <img src={urun.resim_url} alt={urun.ad} style={{ width: "100%", height: "100%", objectFit: "contain", padding: 12, mixBlendMode: "multiply" }} />
                      : <div style={{ fontSize: 64, opacity: 0.2 }}>🐾</div>}
                    {urun.stok <= 5 && urun.stok > 0 && (
                      <span style={{ position: "absolute", top: 10, left: 10, background: "#E8845A", color: "white", fontSize: 10, fontWeight: 700, padding: "4px 9px", borderRadius: 50 }}>Son {urun.stok}!</span>
                    )}
                  </div>
                  <div style={{ padding: "12px 14px 8px" }}>
                    {urun.markalar && <div style={{ fontSize: 11, fontWeight: 600, color: "#8BAF8E", textTransform: "uppercase", marginBottom: 4 }}>{urun.markalar.ad}</div>}
                    <div style={{ fontFamily: "Georgia,serif", fontSize: 14, fontWeight: 700, color: "#5C3D2E", lineHeight: 1.3 }}>{urun.ad.substring(0, 45)}{urun.ad.length > 45 ? "..." : ""}</div>
                  </div>
                </a>
                <div style={{ padding: "0 14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: "Georgia,serif", fontSize: 17, fontWeight: 700, color: "#5C3D2E" }}>₺{(urun.indirimli_fiyat || urun.fiyat).toFixed(2)}</span>
                  <button onClick={() => handleEkle(urun)}
                    style={{ background: eklendi === urun.id ? "#8BAF8E" : "#E8845A", color: "white", border: "none", borderRadius: 50, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    {eklendi === urun.id ? "✅" : "+ Sepet"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* GÜVEN BARI */}
      <div className="trust-section" style={{ background: "#5C3D2E", padding: "36px 48px" }}>
        <div className="trust-grid">
          {[
            { icon: "🚀", title: "Aynı Gün Kargo", sub: "Saat 14:00'a kadar siparişlerde" },
            { icon: "✅", title: "%100 Orijinal Ürün", sub: "Yetkili distribütörden temin" },
            { icon: "🔒", title: "Güvenli Ödeme", sub: "SSL & 3D Secure korumalı" },
            { icon: "💬", title: "7/24 Destek", sub: "WhatsApp & e-posta" },
          ].map((t, i) => (
            <div key={i} className="trust-item">
              <span style={{ fontSize: 32 }}>{t.icon}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "white", marginBottom: 2 }}>{t.title}</div>
                <div style={{ fontSize: 12, color: "#F4C09A", opacity: 0.75 }}>{t.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <footer className="footer-wrap" style={{ background: "#2C1A0E", padding: "56px 48px 32px" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <div className="footer-grid">
            <div>
              <div style={{ fontFamily: "Georgia,serif", fontSize: 22, fontWeight: 700, color: "#FDF6EE", marginBottom: 12 }}>evemama<span style={{ color: "#E8845A", fontStyle: "italic" }}>.net</span></div>
              <p style={{ fontSize: 13, color: "#FDF6EE", opacity: 0.4, lineHeight: 1.7, maxWidth: 240 }}>Evcil dostlarınız için en kaliteli ürünleri en uygun fiyatlarla sunuyoruz.</p>
            </div>
            {[
              { title: "Hızlı Linkler", links: [{ ad: "Hakkımızda", href: "/hakkimizda" }, { ad: "Tüm Ürünler", href: "/urunler" }, { ad: "Kampanyalar", href: "/kampanyalar" }, { ad: "İletişim", href: "/iletisim" }] },
              { title: "Kategoriler", links: kategoriler.slice(0, 4).map(k => ({ ad: k.ad, href: `/kategori/${k.slug}` })) },
              { title: "Yardım & Destek", links: [{ ad: "Sıkça Sorulan Sorular", href: "/sikca-sorulan-sorular" }, { ad: "İade & Değişim", href: "/iade" }, { ad: "Kargo & Teslimat", href: "/kargo" }, { ad: "İletişim", href: "/iletisim" }] },
              { title: "Yasal", links: [{ ad: "Kullanım Koşulları", href: "/kullanim-kosullari" }, { ad: "Gizlilik Politikası", href: "/gizlilik" }, { ad: "KVKK Aydınlatma", href: "/kvkk" }, { ad: "Çerez Politikası", href: "/cerez-politikasi" }, { ad: "Mesafeli Satış", href: "/mesafeli-satis" }] },
            ].map((col, i) => (
              <div key={i}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#FDF6EE", opacity: 0.35, textTransform: "uppercase", letterSpacing: 1, marginBottom: 18 }}>{col.title}</div>
                {col.links.map((link, j) => (
                  <a key={j} href={link.href} style={{ display: "block", fontSize: 14, color: "#FDF6EE", opacity: 0.55, marginBottom: 10, textDecoration: "none" }}
                    onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                    onMouseLeave={e => e.currentTarget.style.opacity = "0.55"}>{link.ad}</a>
                ))}
              </div>
            ))}
          </div>
          <div className="footer-bot">
            <div style={{ fontSize: 13, color: "#FDF6EE", opacity: 0.28 }}>© 2025 evemama.net — Tüm hakları saklıdır.</div>
            <div style={{ display: "flex", gap: 10 }}>
              {["📸", "🐦", "📘"].map((s, i) => (
                <button key={i} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,.07)", border: "none", cursor: "pointer", fontSize: 15, color: "white" }}>{s}</button>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* MOBİL BOTTOM NAV */}
      <nav className="bottom-nav">
        <a href="/" className="bnav-item"><span className="bnav-icon">🏠</span><span className="bnav-label aktif">Anasayfa</span></a>
        <a href="/urunler" className="bnav-item"><span className="bnav-icon">🔍</span><span className="bnav-label">Ara</span></a>
        <a href="/favoriler" className="bnav-item"><span className="bnav-icon">❤️</span><span className="bnav-label">Favoriler</span></a>
        <a href="/sepet" className="bnav-item"><span className="bnav-icon">👤</span><span className="bnav-label">Hesabım</span></a>
      </nav>

    </main>
  );
}