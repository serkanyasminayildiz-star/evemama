"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useCart } from "../context/CartContext";

export default function Home() {
  const [kullanici, setKullanici] = useState<any>(null);
  const [oneCikanlar, setOneCikanlar] = useState<any[]>([]);
  const [kategoriler, setKategoriler] = useState<any[]>([]);
  const [altKategoriler, setAltKategoriler] = useState<{ [key: string]: any[] }>({});
  const [acikMenu, setAcikMenu] = useState<string | null>(null);
  const [mobMenuAcik, setMobMenuAcik] = useState(false);
  const [aktifSlide, setAktifSlide] = useState(0);
  const [araInput, setAraInput] = useState("");
  const [newsletter, setNewsletter] = useState("");
  const [newsletterOk, setNewsletterOk] = useState(false);
  const { addItem, totalItems } = useCart();
  const [eklendi, setEklendi] = useState<number | null>(null);
  const slideInterval = useRef<any>(null);

  const slides = [
    { badge: "🔥 Haftanın Fırsatı", baslik: "Kedi mamaları", italik: "%30 indirimde", alt: "Royal Canin, Acana ve daha fazlası sizi bekliyor", kod: "🏷️ Kod: KEDI30", emoji: "🐱", bg: "linear-gradient(135deg,#F8E2C8,#F4C09A,#E8845A)", link: "/kategori/kedi" },
    { badge: "💥 Kaçmaz Fırsatlar", baslik: "Köpek mamaları", italik: "büyük kampanya!", alt: "Seçili ürünlerde %25'e varan indirim — sadece bu hafta", kod: "🏷️ Kod: KOPEK25", emoji: "🐶", bg: "linear-gradient(135deg,#C8DEC9,#8BAF8E,#5C9E6A)", link: "/kategori/kopek" },
    { badge: "🚀 Ücretsiz Kargo", baslik: "1000₺ üzeri", italik: "aynı gün kargo", alt: "Saat 14:00'a kadar verilen siparişlerde geçerli", kod: "📦 Hemen sipariş ver", emoji: "📦", bg: "linear-gradient(135deg,#DDD4F4,#A89AE0,#7B6EC8)", link: "/urunler" },
  ];

  const getKatGorsel = (slug: string): { bg: string; emoji: string } => {
    const s = slug.toLowerCase();
    if (s.includes("kampanya") || s.includes("firsat") || s.includes("indirim")) return { bg: "linear-gradient(135deg,#FFE8D0,#FF6B35)", emoji: "🏷️" };
    if (s.includes("en-cok") || s.includes("encok") || s.includes("populer") || s.includes("bestseller")) return { bg: "linear-gradient(135deg,#FFF0C0,#F4C04A)", emoji: "⭐" };
    if (s.includes("kiyafet") || s.includes("giysi") || s.includes("mont") || s.includes("kazak")) return { bg: "linear-gradient(135deg,#F0E0FF,#C088E8)", emoji: "👕" };
    if (s.includes("tasma") || s.includes("patrol")) return { bg: "linear-gradient(135deg,#E0F0FF,#6A9EE8)", emoji: "🦮" };
    if (s.includes("kedi") && s.includes("kum")) return { bg: "linear-gradient(135deg,#F5ECD7,#C8A86A)", emoji: "🪨" };
    if (s.includes("kedi") && (s.includes("mama") || s.includes("yem"))) return { bg: "linear-gradient(135deg,#FFE8D0,#E8845A)", emoji: "🥩" };
    if (s.includes("kedi")) return { bg: "linear-gradient(135deg,#FFF0E0,#F4C09A)", emoji: "🐱" };
    if (s.includes("kopek") && (s.includes("mama") || s.includes("yem"))) return { bg: "linear-gradient(135deg,#D8F0D8,#5C9E6A)", emoji: "🦴" };
    if (s.includes("kopek")) return { bg: "linear-gradient(135deg,#E0F0E8,#8BAF8E)", emoji: "🐶" };
    if (s.includes("odul") || s.includes("odül") || s.includes("treat")) return { bg: "linear-gradient(135deg,#FFF0D0,#F4C04A)", emoji: "🎁" };
    if (s.includes("oyun")) return { bg: "linear-gradient(135deg,#FFE0F0,#E88AAA)", emoji: "🎾" };
    if (s.includes("aksesuar")) return { bg: "linear-gradient(135deg,#E8E0FF,#9A88E8)", emoji: "🎀" };
    if (s.includes("saglik") || s.includes("sağlık") || s.includes("vitamin") || s.includes("ilac")) return { bg: "linear-gradient(135deg,#D8F8F0,#4AB8A0)", emoji: "💊" };
    if (s.includes("bakim") || s.includes("bakım") || s.includes("sham") || s.includes("tuy")) return { bg: "linear-gradient(135deg,#FFF0F8,#E88AB8)", emoji: "✨" };
    if (s.includes("kus") || s.includes("kuş")) return { bg: "linear-gradient(135deg,#E0F4FF,#7BC8E8)", emoji: "🦜" };
    if (s.includes("balik") || s.includes("balık") || s.includes("akvary")) return { bg: "linear-gradient(135deg,#D0EEFF,#4A9EC8)", emoji: "🐠" };
    if (s.includes("kemirgen") || s.includes("tavsan") || s.includes("tavşan")) return { bg: "linear-gradient(135deg,#FFF8D0,#D4A84A)", emoji: "🐹" };
    if (s.includes("surungen") || s.includes("sürüngen")) return { bg: "linear-gradient(135deg,#E0FFD8,#6AB84A)", emoji: "🦎" };
    if (s.includes("yatak") || s.includes("ev") || s.includes("kafes")) return { bg: "linear-gradient(135deg,#FFF8E0,#D4B84A)", emoji: "🏠" };
    if (s.includes("tasima") || s.includes("taşıma") || s.includes("çanta")) return { bg: "linear-gradient(135deg,#E8F0FF,#6A8AE8)", emoji: "👜" };
    return { bg: "linear-gradient(135deg,#F0E8E0,#E8D5B7)", emoji: "🐾" };
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setKullanici(data.user));
    supabase.from("urunler")
      .select("*, markalar(ad), kategoriler(id, ad, slug)")
      .neq("aktif", false).gt("stok", 0).limit(80)
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

  useEffect(() => {
    slideInterval.current = setInterval(() => setAktifSlide(s => (s + 1) % slides.length), 4500);
    return () => clearInterval(slideInterval.current);
  }, []);

  const urunGruplari = (() => {
    const gruplar: { [slug: string]: { ad: string; slug: string; urunler: any[] } } = {};
    oneCikanlar.forEach(u => {
      const kat = u.kategoriler;
      if (!kat) return;
      if (!gruplar[kat.slug]) gruplar[kat.slug] = { ad: kat.ad, slug: kat.slug, urunler: [] };
      if (gruplar[kat.slug].urunler.length < 4) gruplar[kat.slug].urunler.push(u);
    });
    return Object.values(gruplar)
      .filter(g => g.urunler.length >= 2)
      .sort((a, b) => {
        const oncelik = (slug: string) => {
          if (slug.includes("kedi") && slug.includes("mama")) return 0;
          if (slug.includes("kopek") && slug.includes("mama")) return 1;
          if (slug.includes("kedi")) return 2;
          if (slug.includes("kopek")) return 3;
          return 99;
        };
        const fark = oncelik(a.slug) - oncelik(b.slug);
        return fark !== 0 ? fark : b.urunler.length - a.urunler.length;
      })
      .slice(0, 6);
  })();

  const handleEkle = (urun: any) => {
    addItem({ id: urun.id, name: urun.ad, price: urun.indirimli_fiyat || urun.fiyat, emoji: "🐾", resim_url: urun.resim_url });
    setEklendi(urun.id);
    setTimeout(() => setEklendi(null), 1500);
  };

  const handleAra = () => {
    if (araInput.trim()) window.location.href = `/urunler?ara=${araInput.trim()}`;
  };

  const handleNewsletter = () => {
    if (newsletter.includes("@")) { setNewsletterOk(true); setNewsletter(""); }
  };

  const slide = slides[aktifSlide];

  const kaydiCubukMetinler = [
    "🚀 1000₺ üzeri ücretsiz kargo",
    "💳 Taksitli alışveriş imkânı",
    "🎁 5000₺ alışverişe 200₺ indirim — Kod: INDIRIM200",
    "🎉 10.000₺ üzeri alışverişe 500₺ indirim — Kod: INDIRIM500",
  ];

  return (
    <main style={{ fontFamily: "sans-serif", background: "#FDF6EE", color: "#2C1A0E", overflowX: "hidden" }}>

      <style>{`
        .hamburger-btn { display: none; background: none; border: none; font-size: 22px; cursor: pointer; color: #5C3D2E; padding: 4px 8px; }
        .header-grid { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; padding: 16px 48px; max-width: 1400px; margin: 0 auto; }
        .hdr-right { display: flex; justify-content: flex-end; gap: 8px; align-items: center; }
        .hdr-right-mob { display: none; justify-content: flex-end; align-items: center; gap: 6px; }
        .hero-grid { max-width: 1400px; margin: 0 auto; padding: 0 48px 48px; display: grid; grid-template-columns: 1fr 380px; gap: 24px; }
        .hero-banner { border-radius: 28px; height: 360px; display: flex; align-items: center; position: relative; overflow: hidden; box-shadow: 0 12px 40px rgba(232,132,90,.22); }
        .banner-title { font-family: Georgia,serif; font-size: 44px; font-weight: 700; color: #5C3D2E; line-height: 1.05; margin-bottom: 10px; }
        .banner-emoji-el { position: absolute; right: 40px; bottom: 0; font-size: 160px; line-height: 1; animation: floatAnim 3s ease-in-out infinite; }
        @keyframes floatAnim { 0%,100%{transform:translateY(0) rotate(-3deg)} 50%{transform:translateY(-16px) rotate(3deg)} }
        @keyframes slideIn { from{opacity:0;transform:translateX(24px)} to{opacity:1;transform:translateX(0)} }
        @keyframes kaydir { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        .banner-inner { animation: slideIn 0.45s ease; }
        .kayan-icerik { display: inline-flex; animation: kaydir 28s linear infinite; white-space: nowrap; }
        .kayan-icerik:hover { animation-play-state: paused; }
        .hero-right { display: flex; flex-direction: column; gap: 16px; }
        .kat-grid { display: grid; grid-template-columns: repeat(5,1fr); gap: 14px; }
        .kat-card { border-radius: 20px; overflow: hidden; text-decoration: none; transition: transform .2s, box-shadow .2s; display: block; }
        .kat-card:hover { transform: translateY(-6px); box-shadow: 0 16px 40px rgba(92,61,46,0.15); }
        .kat-card-img { height: 100px; display: flex; align-items: center; justify-content: center; }
        .kat-card-label { padding: 10px 8px 12px; text-align: center; background: white; }
        .urun-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; }
        .ara-btn-active { background: #E8845A; color: white; border: none; border-radius: 10px; padding: 8px 20px; font-size: 13px; font-weight: 700; cursor: pointer; transition: transform .1s, background .2s; }
        .ara-btn-active:hover { background: #5C3D2E; }
        .ara-btn-active:active { transform: scale(0.94); }
        .trust-grid { max-width: 1400px; margin: 0 auto; display: grid; grid-template-columns: repeat(4,1fr); }
        .trust-item { display: flex; align-items: center; gap: 16px; padding: 0 32px; border-right: 1px solid rgba(255,255,255,.1); }
        .trust-item:last-child { border-right: none; }
        .footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px; margin-bottom: 48px; }
        .footer-bot { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,.07); padding-top: 24px; }
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
          .ara-btn-active { display: none; }
          .hero-grid { grid-template-columns: 1fr !important; padding: 0 14px 24px !important; gap: 12px !important; }
          .hero-banner { height: 220px !important; border-radius: 20px !important; }
          .banner-pad { padding: 22px 20px !important; }
          .banner-title { font-size: 24px !important; }
          .banner-emoji-el { font-size: 90px !important; right: 0 !important; }
          .kat-section { padding: 0 14px 32px !important; }
          .kat-grid { grid-template-columns: repeat(3,1fr) !important; gap: 10px !important; }
          .kat-card-img { height: 72px !important; }
          .sec-title { font-size: 20px !important; }
          .urun-section { padding: 0 14px !important; }
          .urun-grid { grid-template-columns: repeat(2,1fr) !important; gap: 10px !important; }
          .urun-img { height: 130px !important; }
          .trust-section { padding: 26px 16px !important; }
          .trust-grid { grid-template-columns: repeat(2,1fr) !important; gap: 16px 12px !important; }
          .trust-item { padding: 0 !important; border-right: none !important; align-items: flex-start !important; gap: 10px !important; }
          .nl-section { padding: 24px 14px !important; }
          .nl-wrap { padding: 28px 20px !important; border-radius: 22px !important; flex-direction: column !important; gap: 18px !important; text-align: center; }
          .nl-form { flex-direction: column !important; }
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
          .banner-title { font-size: 20px !important; }
          .banner-emoji-el { font-size: 70px !important; }
        }
      `}</style>

      {/* KAYAN BİLGİLENDİRME ÇUBUĞU */}
      <div style={{ background: "#2C1A0E", overflow: "hidden", height: 36, display: "flex", alignItems: "center" }}>
        <div className="kayan-icerik">
          {[...Array(2)].map((_, ki) => (
            <div key={ki} style={{ display: "inline-flex", alignItems: "center" }}>
              {kaydiCubukMetinler.map((metin, i) => (
                <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 24, padding: "0 32px", fontSize: 12, fontWeight: 600, color: "#F4C09A", letterSpacing: "0.3px" }}>
                  {metin}
                  <span style={{ color: "#E8845A", opacity: 0.5 }}>✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

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
          { href: "/blog", label: "📝 Blog" },
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
          <a href="/" style={{ textAlign: "center", textDecoration: "none" }}>
            <div style={{ fontFamily: "Georgia,serif", fontSize: 26, fontWeight: 700, color: "#5C3D2E" }}>
              evemama<span style={{ color: "#E8845A", fontSize: 17, fontStyle: "italic" }}>.net</span>
            </div>
            <div style={{ fontSize: 10, color: "#5C3D2E", opacity: 0.4, letterSpacing: "0.8px", textTransform: "uppercase" }}>Dostunuzun Dükkânı</div>
          </a>
          <div className="hdr-right">
            {kullanici ? (
              <>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#5C3D2E" }}>👋 {kullanici.user_metadata?.full_name?.split(" ")[0] || "Üyemiz"}</span>
                <button onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }}
                  style={{ background: "none", border: "2px solid #E8D5B7", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#5C3D2E", padding: "8px 16px", borderRadius: 50 }}
                  onMouseEnter={e => e.currentTarget.style.background = "#E8D5B7"}
                  onMouseLeave={e => e.currentTarget.style.background = "none"}>Çıkış</button>
              </>
            ) : (
              <>
                <a href="/giris" style={{ fontSize: 13, fontWeight: 600, color: "#5C3D2E", opacity: 0.7, padding: "8px 12px", borderRadius: 10, textDecoration: "none" }}
                  onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                  onMouseLeave={e => e.currentTarget.style.opacity = "0.7"}>Giriş Yap</a>
                <a href="/uye-ol" style={{ border: "2px solid #E8845A", fontSize: 13, fontWeight: 700, color: "#E8845A", padding: "8px 16px", borderRadius: 50, textDecoration: "none" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#E8845A"; e.currentTarget.style.color = "white"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#E8845A"; }}>Üye Ol</a>
              </>
            )}
            <a href="/sepet" style={{ background: "#5C3D2E", color: "white", borderRadius: 50, padding: "10px 20px", fontSize: 13, fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}
              onMouseEnter={e => e.currentTarget.style.background = "#E8845A"}
              onMouseLeave={e => e.currentTarget.style.background = "#5C3D2E"}>
              🛒 Sepet {totalItems > 0 && <span style={{ background: "#E8845A", borderRadius: 50, padding: "1px 7px", fontSize: 12 }}>{totalItems}</span>}
            </a>
          </div>
          <div className="hdr-right-mob">
            <a href="/favoriler" style={{ fontSize: 13, fontWeight: 600, color: "#5C3D2E", opacity: 0.7, padding: "6px 10px", borderRadius: 10, textDecoration: "none" }}>❤️ Favoriler</a>
            <a href="/sepet" style={{ fontSize: 22, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
              🛒 {totalItems > 0 && <span style={{ background: "#E8845A", color: "white", borderRadius: 50, padding: "1px 6px", fontSize: 11, fontWeight: 700 }}>{totalItems}</span>}
            </a>
          </div>
        </div>

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
                    {getKatGorsel(slug).emoji} {kat.ad} {altKategoriler[slug]?.length > 0 ? "▾" : ""}
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
            <a href="/blog" className="cat-tab" style={{ flexShrink: 0, padding: "14px 18px", fontSize: 14, fontWeight: 600, color: "#5C3D2E", opacity: 0.6, textDecoration: "none", whiteSpace: "nowrap", borderBottom: "2px solid transparent" }}>📝 Blog</a>
          </div>
        </nav>
      </header>

      {/* ARAMA */}
      <div className="ara-section" style={{ padding: "20px 48px", maxWidth: 1400, margin: "0 auto" }}>
        <div className="ara-bar" style={{ background: "white", border: "2px solid #E8D5B7", borderRadius: 16, padding: "13px 20px", display: "flex", alignItems: "center", gap: 12, maxWidth: 680, margin: "0 auto" }}>
          <span style={{ fontSize: 18, opacity: 0.35 }}>🔍</span>
          <input type="text" placeholder="Mama, oyuncak, aksesuar veya marka ara..."
            value={araInput} onChange={e => setAraInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleAra(); }}
            style={{ flex: 1, border: "none", background: "none", outline: "none", fontSize: 15, fontFamily: "inherit" }} />
          <button className="ara-btn-active" onClick={handleAra}>Ara</button>
        </div>
      </div>

      {/* HERO SLIDER */}
      <div className="hero-grid">
        <div>
          <div className="hero-banner" style={{ background: slide.bg }}>
            <div className="banner-pad" style={{ padding: 48, flex: 1, zIndex: 2, position: "relative" }}>
              <div className="banner-inner" key={aktifSlide}>
                <div style={{ background: "rgba(255,255,255,.3)", color: "#5C3D2E", fontSize: 11, fontWeight: 700, textTransform: "uppercase", padding: "5px 14px", borderRadius: 50, display: "inline-block", marginBottom: 16 }}>{slide.badge}</div>
                <h1 className="banner-title">{slide.baslik}<br /><em style={{ color: "white" }}>{slide.italik}</em></h1>
                <p style={{ fontSize: 15, color: "#5C3D2E", opacity: 0.7, marginBottom: 24 }}>{slide.alt}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ background: "rgba(255,255,255,.3)", color: "#5C3D2E", fontSize: 12, fontWeight: 700, padding: "8px 16px", borderRadius: 50 }}>{slide.kod}</div>
                  <a href={slide.link} style={{ background: "#5C3D2E", color: "white", fontSize: 13, fontWeight: 700, padding: "10px 20px", borderRadius: 50, textDecoration: "none" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#2C1A0E"}
                    onMouseLeave={e => e.currentTarget.style.background = "#5C3D2E"}>Keşfet →</a>
                </div>
              </div>
            </div>
            <div className="banner-emoji-el" key={`e${aktifSlide}`}>{slide.emoji}</div>
          </div>
          <div style={{ display: "flex", gap: 6, justifyContent: "center", margin: "12px 0" }}>
            {slides.map((_, i) => (
              <div key={i} onClick={() => { setAktifSlide(i); clearInterval(slideInterval.current); }}
                style={{ width: i === aktifSlide ? 20 : 6, height: 6, borderRadius: 3, background: i === aktifSlide ? "#E8845A" : "#E8D5B7", cursor: "pointer", transition: "all .3s" }} />
            ))}
          </div>
        </div>
        <div className="hero-right">
          <a href="/urunler" style={{ background: "#E8845A", color: "white", borderRadius: 18, padding: "20px 28px", fontSize: 17, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 12, boxShadow: "0 10px 28px rgba(232,132,90,.32)", textDecoration: "none" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}>
            Alışverişe Başla
            <span style={{ background: "rgba(255,255,255,.22)", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>→</span>
          </a>
          <a href="/kategori/kopek" style={{ borderRadius: 20, padding: "24px 26px", background: "linear-gradient(135deg,#C8DEC9,rgba(139,175,142,.33))", display: "flex", alignItems: "center", justifyContent: "space-between", textDecoration: "none" }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#5C3D2E", opacity: 0.7, textTransform: "uppercase", marginBottom: 4 }}>🐶 Köpek Ürünleri</div>
              <div style={{ fontFamily: "Georgia,serif", fontSize: 19, fontWeight: 700, color: "#5C3D2E" }}>Yeni sezon<br />köpek mamaları</div>
            </div>
            <div style={{ fontSize: 52, animation: "floatAnim 4s ease-in-out infinite" }}>🦴</div>
          </a>
          <div style={{ borderRadius: 20, padding: "18px 20px", background: "#5C3D2E", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#F4C09A", textTransform: "uppercase", marginBottom: 3 }}>🚀 Ücretsiz Kargo</div>
              <div style={{ fontFamily: "Georgia,serif", fontSize: 17, fontWeight: 700, color: "white" }}>1000₺ üzeri<br /><em style={{ color: "#F4C09A" }}>aynı gün teslimat</em></div>
            </div>
            <div style={{ fontSize: 40, animation: "floatAnim 5s ease-in-out infinite" }}>📦</div>
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
          {kategoriler.map((kat, i) => {
            const g = getKatGorsel(kat.slug);
            return (
              <a key={i} href={`/kategori/${kat.slug}`} className="kat-card">
                <div className="kat-card-img" style={{ background: g.bg }}>
                  <span style={{ fontSize: 48, filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.12))" }}>{g.emoji}</span>
                </div>
                <div className="kat-card-label">
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#5C3D2E" }}>{kat.ad}</div>
                </div>
              </a>
            );
          })}
        </div>
      </div>

      {/* ÖNE ÇIKAN ÜRÜNLER */}
      <div style={{ background: "#FFFCF8", padding: "48px 0" }}>
        <div className="urun-section" style={{ maxWidth: 1400, margin: "0 auto", padding: "0 48px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 36 }}>
            <h2 className="sec-title" style={{ fontFamily: "Georgia,serif", fontSize: 28, fontWeight: 700, color: "#5C3D2E" }}>Öne Çıkan <span style={{ color: "#E8845A", fontStyle: "italic" }}>Ürünler</span></h2>
            <a href="/urunler" style={{ fontSize: 14, fontWeight: 600, color: "#E8845A", textDecoration: "none" }}>Tümü →</a>
          </div>

          {urunGruplari.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#5C3D2E", opacity: 0.4 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
              <div>Yükleniyor...</div>
            </div>
          ) : (
            urunGruplari.map((grup, ki) => {
              const g = getKatGorsel(grup.slug);
              return (
                <div key={ki} style={{ marginBottom: 52 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 16, background: g.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, boxShadow: "0 4px 12px rgba(92,61,46,0.1)", flexShrink: 0 }}>
                        {g.emoji}
                      </div>
                      <div>
                        <h3 style={{ fontFamily: "Georgia,serif", fontSize: 20, fontWeight: 700, color: "#5C3D2E", margin: 0 }}>{grup.ad}</h3>
                        <div style={{ fontSize: 12, color: "#5C3D2E", opacity: 0.4, marginTop: 2 }}>{grup.urunler.length} ürün gösteriliyor</div>
                      </div>
                    </div>
                    <a href={`/kategori/${grup.slug}`}
                      style={{ fontSize: 13, fontWeight: 600, color: "#E8845A", textDecoration: "none", border: "1.5px solid #E8845A", padding: "7px 16px", borderRadius: 50, whiteSpace: "nowrap" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "#E8845A"; e.currentTarget.style.color = "white"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#E8845A"; }}>
                      Tümünü Gör →
                    </a>
                  </div>

                  <div className="urun-grid">
                    {grup.urunler.map((urun, i) => (
                      <div key={i} style={{ background: "white", borderRadius: 20, overflow: "hidden", transition: "transform .2s, box-shadow .2s" }}
                        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 16px 40px rgba(92,61,46,0.1)"; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
                        <a href={`/urun/${urun.slug}`} style={{ textDecoration: "none", display: "block" }}>
                          <div className="urun-img" style={{ height: 160, background: "#f9f9f9", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                            {urun.resim_url
                              ? <img src={urun.resim_url} alt={urun.ad} style={{ width: "100%", height: "100%", objectFit: "contain", padding: 12, mixBlendMode: "multiply" }} />
                              : <div style={{ fontSize: 48, opacity: 0.15 }}>🐾</div>}
                            {urun.stok <= 5 && urun.stok > 0 && (
                              <span style={{ position: "absolute", top: 8, left: 8, background: "#E8845A", color: "white", fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 50 }}>Son {urun.stok}!</span>
                            )}
                          </div>
                          <div style={{ padding: "12px 14px 8px" }}>
                            {urun.markalar && <div style={{ fontSize: 10, fontWeight: 700, color: "#8BAF8E", textTransform: "uppercase", marginBottom: 3 }}>{urun.markalar.ad}</div>}
                            <div style={{ fontFamily: "Georgia,serif", fontSize: 13, fontWeight: 700, color: "#5C3D2E", lineHeight: 1.35 }}>{urun.ad.substring(0, 45)}{urun.ad.length > 45 ? "..." : ""}</div>
                          </div>
                        </a>
                        <div style={{ padding: "0 14px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontFamily: "Georgia,serif", fontSize: 16, fontWeight: 700, color: "#5C3D2E" }}>₺{(urun.indirimli_fiyat || urun.fiyat).toFixed(2)}</span>
                          <button onClick={() => handleEkle(urun)}
                            style={{ background: eklendi === urun.id ? "#8BAF8E" : "#E8845A", color: "white", border: "none", borderRadius: 50, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all .2s" }}>
                            {eklendi === urun.id ? "✅" : "+ Sepet"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {ki < urunGruplari.length - 1 && (
                    <div style={{ height: 1, background: "linear-gradient(to right, transparent, #E8D5B7, transparent)", marginTop: 48 }} />
                  )}
                </div>
              );
            })
          )}
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

      {/* NEWSLETTER */}
      <div className="nl-section" style={{ padding: "48px 48px", maxWidth: 1400, margin: "0 auto" }}>
        <div className="nl-wrap" style={{ background: "linear-gradient(135deg,#F4C09A,#E8D5B7)", borderRadius: 28, padding: "48px 56px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 40 }}>
          <div>
            <div style={{ fontFamily: "Georgia,serif", fontSize: 28, fontWeight: 700, color: "#5C3D2E", marginBottom: 8 }}>
              🎁 Kayıt ol, <em style={{ color: "#E8845A" }}>kampanyaları kaçırma!</em>
            </div>
            <div style={{ fontSize: 14, color: "#5C3D2E", opacity: 0.65, lineHeight: 1.6 }}>İlk siparişinde %10 indirim + özel fırsatlar sana özel gelsin.</div>
          </div>
          {newsletterOk ? (
            <div style={{ background: "#8BAF8E", color: "white", borderRadius: 50, padding: "16px 32px", fontWeight: 700, fontSize: 15, whiteSpace: "nowrap" }}>✅ Teşekkürler, kayıt oldunuz!</div>
          ) : (
            <div className="nl-form" style={{ display: "flex", gap: 10, flex: 1, maxWidth: 420 }}>
              <input type="email" placeholder="E-posta adresiniz"
                value={newsletter} onChange={e => setNewsletter(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleNewsletter(); }}
                style={{ flex: 1, border: "2px solid rgba(92,61,46,0.15)", borderRadius: 50, padding: "14px 22px", fontSize: 14, outline: "none", fontFamily: "inherit", background: "white" }} />
              <button onClick={handleNewsletter}
                style={{ background: "#E8845A", color: "white", border: "none", borderRadius: 50, padding: "14px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 8px 20px rgba(232,132,90,.3)" }}
                onMouseEnter={e => e.currentTarget.style.background = "#5C3D2E"}
                onMouseLeave={e => e.currentTarget.style.background = "#E8845A"}
                onMouseDown={e => e.currentTarget.style.transform = "scale(0.96)"}
                onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}>
                Abone Ol
              </button>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <footer className="footer-wrap" style={{ background: "#2C1A0E", padding: "56px 48px 32px" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <div className="footer-grid">
            <div>
              <div style={{ fontFamily: "Georgia,serif", fontSize: 22, fontWeight: 700, color: "#FDF6EE", marginBottom: 12 }}>evemama<span style={{ color: "#E8845A", fontStyle: "italic" }}>.net</span></div>
              <p style={{ fontSize: 12, color: "#FDF6EE", opacity: 0.4, lineHeight: 1.8, maxWidth: 260 }}>
                Evcil dostlarınız için en kaliteli ürünleri en uygun fiyatlarla sunuyoruz.<br /><br />
                <strong style={{ opacity: 0.7, fontSize: 11 }}>TNB Pet Mamaları ve Aksesuarları İthalat İhracat San. ve Tic. Ltd. Şti.</strong><br />
                Vergi No: 9381208717 — Kadifekale V.D.<br />
                Atilla Mah. 349 Sok. No:55/A Konak / İzmir<br />
                📞 0534 748 80 01<br />
                ✉️ info@evemama.net
              </p>
            </div>
            {[
              { title: "Hızlı Linkler", links: [{ ad: "Hakkımızda", href: "/hakkimizda" }, { ad: "Tüm Ürünler", href: "/urunler" }, { ad: "Kampanyalar", href: "/kampanyalar" }, { ad: "Blog", href: "/blog" }, { ad: "İletişim", href: "/iletisim" }] },
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
            <div>
              <div style={{ fontSize: 13, color: "#FDF6EE", opacity: 0.28 }}>© 2025 evemama.net — Tüm hakları saklıdır.</div>
              <div style={{ fontSize: 12, color: "#FDF6EE", opacity: 0.2, marginTop: 6 }}>⭐ Yıldız Yazılım tarafından hazırlanmıştır — Serkan Yıldız: 0534 748 80 01</div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {["📸", "🐦", "📘"].map((s, i) => (
                <button key={i} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,.07)", border: "none", cursor: "pointer", fontSize: 15, color: "white" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#E8845A"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.07)"}>{s}</button>
              ))}
            </div>
          </div>
        </div>
      </footer>

      <nav className="bottom-nav">
        <a href="/" className="bnav-item"><span className="bnav-icon">🏠</span><span className="bnav-label aktif">Anasayfa</span></a>
        <a href="/urunler" className="bnav-item"><span className="bnav-icon">🔍</span><span className="bnav-label">Ara</span></a>
        <a href="/blog" className="bnav-item"><span className="bnav-icon">📝</span><span className="bnav-label">Blog</span></a>
        <a href="/sepet" className="bnav-item"><span className="bnav-icon">🛒</span><span className="bnav-label">Sepet</span></a>
      </nav>

    </main>
  );
}