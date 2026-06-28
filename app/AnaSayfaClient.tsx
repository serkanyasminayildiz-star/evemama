"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { supabase } from "../lib/supabase";
import { useCart } from "../context/CartContext";
import type { User } from "@supabase/supabase-js";
import KumbaraWidget from "./components/KumbaraWidget";

// Supabase satır tipleri (ana sayfa). numeric kolonlar (fiyat/indirimli_fiyat) string döner.
type Urun = {
  id: number;
  ad: string;
  slug: string;
  fiyat: string;
  indirimli_fiyat?: string | null;
  resim_url?: string | null;
  stok?: number | null;
  kategori_id?: number | null;
  markalar?: { ad: string } | null;
  kategoriler?: { id?: number; ad?: string; slug?: string } | null;
  oncelikli?: boolean | null;
};
type Kategori = {
  id: number;
  ad: string;
  slug: string;
  ust_kategori_id?: number | null;
  sira?: number | null;
  aktif?: boolean;
};

export default function AnaSayfaClient() {
  const [kullanici, setKullanici] = useState<User | null>(null);
  const [oneCikanlar, setOneCikanlar] = useState<Urun[]>([]);
  const [kategoriler, setKategoriler] = useState<Kategori[]>([]);
  const [altKategoriler, setAltKategoriler] = useState<{ [key: string]: Kategori[] }>({});
  const [acikMenu, setAcikMenu] = useState<string | null>(null);
  const [mobMenuAcik, setMobMenuAcik] = useState(false);
  const [araInput, setAraInput] = useState("");
  const [aramaOdak, setAramaOdak] = useState(false); // arama kutusu odakta mı (öneri dropdown'u için)
  const [newsletter, setNewsletter] = useState("");
  const [newsletterOk, setNewsletterOk] = useState(false);
  const { addItem, totalItems } = useCart();
  const [eklendi, setEklendi] = useState<number | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [aktifSlide, setAktifSlide] = useState(0);
  // Açık mama ürün slaytı görselleri (public/, dikey ~1054×1492).
  const acikSlaytlar = ["/acik-mama1.png", "/acik-mama2.png", "/acik-mama3.png", "/acik-mama4.png", "/acik-mama5.png", "/acik-mama6.png", "/acik-mama7.png", "/acik-mama8.png"];

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
    supabase.auth.getUser()
      .then(({ data }) => setKullanici(data.user))
      .catch(err => console.error("[home] auth.getUser:", err));

    supabase.from("urunler")
      .select("*, markalar(ad), kategoriler(id, ad, slug)")
      // Limit yuksek tutulur ki TUM aktif+stoktaki urunler dataset'e gelsin;
      // memory'de One Cikanlar (oncelikli) + Kedi + Kopek listelerine ayrilir.
      // ~700 urun toplam ~500 KB — modern cihazlarda sorun degil.
      .neq("aktif", false).gt("stok", 0).limit(1000)
      .then(({ data, error }) => {
        if (error) {
          console.error("[home] urunler fetch:", error);
          setHata("Ürünler yüklenemedi. Sayfayı yenileyin.");
          return;
        }
        setOneCikanlar(data || []);
      });

    supabase.from("kategoriler").select("id, ad, slug, ust_kategori_id, sira")
      .is("ust_kategori_id", null).eq("aktif", true).order("sira")
      .then(({ data, error }) => {
        if (error) {
          console.error("[home] kategoriler fetch:", error);
          setHata("Kategoriler yüklenemedi. Sayfayı yenileyin.");
          return;
        }
        setKategoriler(data || []);
      });
  }, []);

  useEffect(() => {
    if (kategoriler.length === 0) return;
    kategoriler.forEach(kat => {
      supabase.from("kategoriler").select("id, ad, slug, ust_kategori_id, sira")
        .eq("ust_kategori_id", kat.id).eq("aktif", true).order("sira")
        .then(({ data }) => {
          if (data && data.length > 0)
            setAltKategoriler(prev => ({ ...prev, [kat.slug]: data }));
        });
    });
  }, [kategoriler]);

  // Açık mama ürün slaytı — otomatik döner (4 sn).
  useEffect(() => {
    const id = setInterval(() => setAktifSlide(s => (s + 1) % acikSlaytlar.length), 4000);
    return () => clearInterval(id);
  }, [acikSlaytlar.length]);

  // Öne Çıkanlar slider'ı otomatik kayar (~3.5 sn'de bir bir sayfa ilerler);
  // fareyle üstüne gelince / dokununca durur, çekilince devam eder.
  const oneCikanRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = oneCikanRef.current;
    if (!el) return;
    let dur = false;
    const durdur = () => { dur = true; };
    const devam = () => { dur = false; };
    el.addEventListener("mouseenter", durdur);
    el.addEventListener("mouseleave", devam);
    el.addEventListener("touchstart", durdur, { passive: true });
    el.addEventListener("touchend", devam, { passive: true });
    const id = setInterval(() => {
      if (dur || el.scrollWidth <= el.clientWidth) return;
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 8) el.scrollTo({ left: 0, behavior: "smooth" });
      else el.scrollBy({ left: Math.round(el.clientWidth * 0.85), behavior: "smooth" });
    }, 3500);
    return () => {
      clearInterval(id);
      el.removeEventListener("mouseenter", durdur);
      el.removeEventListener("mouseleave", devam);
      el.removeEventListener("touchstart", durdur);
      el.removeEventListener("touchend", devam);
    };
  }, [oneCikanlar.length]);

  // Anasayfa ürün bölümleri — TEK fetch (oneCikanlar = tüm aktif+stoktaki ürünler);
  // memory'de 3 listeye ayrılır. Kedi/köpek ayrımı kategori-slug + ürün adındaki
  // "kedi/köpek" anahtarıyla yapılır (açık kedi/köpek mamaları da doğru bölüme düşsün).
  const urunMetni = (u: Urun) => `${u.kategoriler?.slug || ""} ${u.ad}`.toLowerCase();
  const isKedi = (u: Urun) => { const t = urunMetni(u); return /kedi|kitten/.test(t) && !/köpek|kopek/.test(t); };
  const isKopek = (u: Urun) => { const t = urunMetni(u); return /köpek|kopek|puppy/.test(t) && !/kedi|kitten/.test(t); };
  const oneCikanUrunler = oneCikanlar.filter(u => u.oncelikli).slice(0, 30);
  const kediUrunler = oneCikanlar.filter(isKedi).slice(0, 24);
  const kopekUrunler = oneCikanlar.filter(isKopek).slice(0, 24);

  // Anasayfa arama önerileri — yazılana göre (token-bazlı: tüm kelimeleri ad/marka/kategoride
  // içeren ilk 6 ürün). 2 harften kısa sorguda boş. oneCikanlar zaten tüm aktif+stok ürün.
  const aramaOnerileri = (() => {
    const q = araInput.trim().toLowerCase();
    if (q.length < 2) return [] as Urun[];
    const tokens = q.split(/\s+/).filter(Boolean);
    return oneCikanlar.filter(u => {
      const h = `${u.ad} ${u.markalar?.ad || ""} ${u.kategoriler?.ad || ""}`.toLowerCase();
      return tokens.every(t => h.includes(t));
    }).slice(0, 6);
  })();

  const handleEkle = (urun: Urun) => {
    addItem({ id: urun.id, name: urun.ad, price: parseFloat(urun.indirimli_fiyat || urun.fiyat) || 0, emoji: "🐾", resim_url: urun.resim_url || undefined, slug: urun.slug });
    setEklendi(urun.id);
    setTimeout(() => setEklendi(null), 1500);
  };

  // Ürün kartı — öne çıkanlar slider'ı + kedi/köpek grid'i ortak kullanır.
  const urunKart = (urun: Urun, i: number) => {
    const normalFiyat = parseFloat(urun.fiyat) || 0;
    const indirimliFiyat = parseFloat(urun.indirimli_fiyat ?? "") || 0;
    const indirimVar = indirimliFiyat > 0 && indirimliFiyat < normalFiyat;
    const indirimOrani = indirimVar ? Math.round((1 - indirimliFiyat / normalFiyat) * 100) : 0;
    const gosterFiyat = indirimVar ? indirimliFiyat : normalFiyat;
    return (
      <div key={i} style={{ background: "white", borderRadius: 20, overflow: "hidden", transition: "transform .2s, box-shadow .2s" }}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 16px 40px rgba(92,61,46,0.1)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
        <Link href={`/urun/${urun.slug}`} style={{ textDecoration: "none", display: "block" }}>
          <div className="urun-img" style={{ height: 160, background: "#f9f9f9", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            {urun.resim_url
              ? <Image src={urun.resim_url} alt={urun.ad} fill sizes="(max-width:768px) 50vw, (max-width:1200px) 25vw, 280px" style={{ objectFit: "contain", padding: 12, mixBlendMode: "multiply" }} />
              : <div style={{ fontSize: 48, opacity: 0.15 }}>🐾</div>}
            {indirimVar && (
              <span style={{ position: "absolute", top: 8, right: 8, background: "#C62828", color: "white", fontSize: 12, fontWeight: 800, padding: "5px 9px", borderRadius: 50, boxShadow: "0 2px 8px rgba(198,40,40,0.3)" }}>
                %{indirimOrani}
              </span>
            )}
            {urun.stok != null && urun.stok <= 5 && urun.stok > 0 && (
              <span style={{ position: "absolute", top: 8, left: 8, background: "#E8845A", color: "white", fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 50 }}>Son {urun.stok}!</span>
            )}
          </div>
          <div style={{ padding: "12px 14px 8px" }}>
            {urun.markalar && <div style={{ fontSize: 10, fontWeight: 700, color: "#8BAF8E", textTransform: "uppercase", marginBottom: 3 }}>{urun.markalar.ad}</div>}
            <div style={{ fontFamily: "Georgia,serif", fontSize: 13, fontWeight: 700, color: "#5C3D2E", lineHeight: 1.35 }}>{urun.ad.substring(0, 45)}{urun.ad.length > 45 ? "..." : ""}</div>
          </div>
        </Link>
        <div style={{ padding: "0 14px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
            {indirimVar && (
              <span style={{ fontSize: 11, color: "#999", textDecoration: "line-through", marginBottom: 2 }}>
                ₺{normalFiyat.toFixed(2)}
              </span>
            )}
            <span style={{ fontFamily: "Georgia,serif", fontSize: 16, fontWeight: 700, color: indirimVar ? "#C62828" : "#5C3D2E" }}>
              ₺{gosterFiyat.toFixed(2)}
            </span>
          </div>
          <button onClick={() => handleEkle(urun)}
            style={{ background: eklendi === urun.id ? "#8BAF8E" : "#E8845A", color: "white", border: "none", borderRadius: 50, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all .2s" }}>
            {eklendi === urun.id ? "✅" : "+ Sepet"}
          </button>
        </div>
      </div>
    );
  };

  const handleAra = () => {
    if (araInput.trim()) window.location.href = `/urunler?ara=${araInput.trim()}`;
  };

  const handleNewsletter = () => {
    if (newsletter.includes("@")) { setNewsletterOk(true); setNewsletter(""); }
  };

  const kaydiCubukMetinler = [
    "🚀 1000₺ üzeri ücretsiz kargo",
    "💳 Taksitli alışveriş imkânı",
    "🎁 5000₺ alışverişe 200₺ indirim — Kod: INDIRIM200",
    "🎉 10.000₺ üzeri alışverişe 500₺ indirim — Kod: INDIRIM500",
  ];

  return (
    <main style={{ fontFamily: "sans-serif", background: "#FDF6EE", color: "#2C1A0E", overflowX: "hidden" }}>

      {hata && (
        <div role="alert" style={{ background: "#FFEBEE", color: "#C62828", padding: "10px 16px", textAlign: "center", fontSize: 13, fontWeight: 600, borderBottom: "1px solid #FFCDD2" }}>
          ⚠️ {hata}
          <button onClick={() => setHata(null)} style={{ background: "none", border: "none", color: "#C62828", fontSize: 16, marginLeft: 10, cursor: "pointer", fontWeight: 700 }}>×</button>
        </div>
      )}

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
        /* Yatay kaydırılır urun carousel — desktop'ta 4 kart gorunur,
           mobilde 2 kart. Diger urunler kaydırma ile gorunur. */
        .urun-grid {
          display: flex; gap: 16px;
          overflow-x: auto; overflow-y: hidden;
          scroll-snap-type: x proximity; scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
          padding-bottom: 10px;
          scrollbar-width: thin; scrollbar-color: #E8D5B7 transparent;
        }
        .urun-grid::-webkit-scrollbar { height: 6px; }
        .urun-grid::-webkit-scrollbar-track { background: transparent; }
        .urun-grid::-webkit-scrollbar-thumb { background: #E8D5B7; border-radius: 50px; }
        .urun-grid > div {
          /* 6 kart gorunur: 6 kart + 5x16px gap = 100% - 80px / 6 */
          flex: 0 0 calc((100% - 80px) / 6);
          scroll-snap-align: start;
        }
        /* Kedi/Kopek sabit grid — desktop 6 sutun (6x4=24), tablet 3, telefon 2 */
        .urun-grid-sabit { display: grid; grid-template-columns: repeat(6, 1fr); gap: 16px; }
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
          .urun-grid { gap: 10px !important; }
          .urun-grid > div { flex: 0 0 calc((100% - 10px) / 2) !important; }
          .urun-grid-sabit { grid-template-columns: repeat(3,1fr) !important; gap: 10px !important; }
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
          .urun-grid-sabit { grid-template-columns: repeat(2,1fr) !important; }
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
            <div style={{ display: "flex", gap: 6 }}>
              <Link href="/siparislerim" style={{ background: "#E8845A", color: "white", textDecoration: "none", fontSize: 12, fontWeight: 700, padding: "6px 14px", borderRadius: 50 }}>📦 Siparişlerim</Link>
              <button onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }}
                style={{ background: "none", border: "1px solid #E8D5B7", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#5C3D2E", padding: "6px 14px", borderRadius: 50 }}>Çıkış Yap</button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <Link href="/giris" style={{ flex: 1, textAlign: "center", fontSize: 13, fontWeight: 600, color: "#5C3D2E", padding: 10, borderRadius: 10, textDecoration: "none", border: "1px solid #E8D5B7" }}>Giriş Yap</Link>
            <Link href="/uye-ol" style={{ flex: 1, textAlign: "center", border: "2px solid #E8845A", fontSize: 13, fontWeight: 700, color: "#E8845A", padding: 10, borderRadius: 50, textDecoration: "none" }}>Üye Ol</Link>
          </div>
        )}
        {[
          { href: "/", label: "🏠 Anasayfa" },
          { href: "/kategori/kedi", label: "🐱 Kedi" },
          { href: "/kategori/kopek", label: "🐶 Köpek" },
          { href: "/kategori/acik-mamalar", label: "🥣 Açık Mama" },
          { href: "/kategori/en-cok-satanlar", label: "⭐ Öne Çıkanlar" },
          { href: "/urunler", label: "🛍️ Tüm Ürünler" },
          { href: "/kampanyalar", label: "🏷️ Kampanyalar" },
          { href: "/blog", label: "📝 Blog" },
          { href: "/hakkimizda", label: "ℹ️ Hakkımızda" },
          { href: "/iletisim", label: "📞 İletişim" },
        ].map((item, i) => (
          <Link key={i} href={item.href}
            style={{ display: "block", padding: "13px 16px", fontSize: 15, fontWeight: 600, color: "#5C3D2E", textDecoration: "none", borderRadius: 12 }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(244,192,154,0.15)"}
            onMouseLeave={e => e.currentTarget.style.background = "none"}>
            {item.label}
          </Link>
        ))}
      </div>

      {/* HEADER */}
      <header style={{ position: "sticky", top: 0, zIndex: 200, background: "rgba(253,246,238,0.97)", backdropFilter: "blur(14px)", borderBottom: "1px solid rgba(92,61,46,0.08)" }}>
        <div className="header-grid">
          <div style={{ display: "flex", alignItems: "center" }}>
            <button className="hamburger-btn" onClick={() => setMobMenuAcik(true)}>☰</button>
          </div>
          <Link href="/" style={{ textAlign: "center", textDecoration: "none" }}>
            <div style={{ fontFamily: "Georgia,serif", fontSize: 26, fontWeight: 700, color: "#5C3D2E" }}>
              evemama<span style={{ color: "#E8845A", fontSize: 17, fontStyle: "italic" }}>.net</span>
            </div>
            <div style={{ fontSize: 10, color: "#5C3D2E", opacity: 0.4, letterSpacing: "0.8px", textTransform: "uppercase" }}>Dostunuzun Dükkânı</div>
          </Link>
          <div className="hdr-right">
            {kullanici ? (
              <>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#5C3D2E" }}>👋 {kullanici.user_metadata?.full_name?.split(" ")[0] || "Üyemiz"}</span>
                <Link href="/siparislerim" style={{ background: "#E8845A", color: "white", textDecoration: "none", fontSize: 13, fontWeight: 700, padding: "8px 16px", borderRadius: 50 }}
                  onMouseEnter={e => e.currentTarget.style.background = "#D67248"}
                  onMouseLeave={e => e.currentTarget.style.background = "#E8845A"}>📦 Siparişlerim</Link>
                <button onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }}
                  style={{ background: "none", border: "2px solid #E8D5B7", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#5C3D2E", padding: "8px 16px", borderRadius: 50 }}
                  onMouseEnter={e => e.currentTarget.style.background = "#E8D5B7"}
                  onMouseLeave={e => e.currentTarget.style.background = "none"}>Çıkış</button>
              </>
            ) : (
              <>
                <Link href="/giris" style={{ fontSize: 13, fontWeight: 600, color: "#5C3D2E", opacity: 0.7, padding: "8px 12px", borderRadius: 10, textDecoration: "none" }}
                  onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                  onMouseLeave={e => e.currentTarget.style.opacity = "0.7"}>Giriş Yap</Link>
                <Link href="/uye-ol" style={{ border: "2px solid #E8845A", fontSize: 13, fontWeight: 700, color: "#E8845A", padding: "8px 16px", borderRadius: 50, textDecoration: "none" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#E8845A"; e.currentTarget.style.color = "white"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#E8845A"; }}>Üye Ol</Link>
              </>
            )}
            <Link href="/sepet" style={{ background: "#5C3D2E", color: "white", borderRadius: 50, padding: "10px 20px", fontSize: 13, fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}
              onMouseEnter={e => e.currentTarget.style.background = "#E8845A"}
              onMouseLeave={e => e.currentTarget.style.background = "#5C3D2E"}>
              🛒 Sepet {totalItems > 0 && <span style={{ background: "#E8845A", borderRadius: 50, padding: "1px 7px", fontSize: 12 }}>{totalItems}</span>}
            </Link>
          </div>
          <div className="hdr-right-mob">
            <Link href="/favoriler" style={{ fontSize: 13, fontWeight: 600, color: "#5C3D2E", opacity: 0.7, padding: "6px 10px", borderRadius: 10, textDecoration: "none" }}>❤️ Favoriler</Link>
            <Link href="/sepet" style={{ fontSize: 22, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
              🛒 {totalItems > 0 && <span style={{ background: "#E8845A", color: "white", borderRadius: 50, padding: "1px 6px", fontSize: 11, fontWeight: 700 }}>{totalItems}</span>}
            </Link>
          </div>
        </div>

        <nav style={{ borderTop: "1px solid rgba(92,61,46,0.06)", background: "#FFFCF8" }}>
          <div className="nav-bar-inner" style={{ display: "flex", maxWidth: 1400, margin: "0 auto", padding: "0 48px", overflowX: "auto", scrollbarWidth: "none" }}>
            <Link href="/" className="cat-tab" style={{ flexShrink: 0, padding: "14px 18px", fontSize: 14, fontWeight: 600, color: "#E8845A", textDecoration: "none", whiteSpace: "nowrap", borderBottom: "2px solid #E8845A" }}>🏠 Anasayfa</Link>
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
                      <Link href={`/kategori/${slug}`} style={{ display: "block", padding: "10px 16px", fontSize: 13, fontWeight: 700, color: "#E8845A", textDecoration: "none", borderRadius: 10, marginBottom: 4 }}>Tüm {kat.ad} →</Link>
                      <div style={{ height: 1, background: "#F0E8E0", margin: "8px" }} />
                      {altKategoriler[slug].map((alt, j) => (
                        <Link key={j} href={`/kategori/${alt.slug}`}
                          style={{ display: "block", padding: "9px 16px", fontSize: 13, color: "#5C3D2E", textDecoration: "none", borderRadius: 10 }}
                          onMouseEnter={e => e.currentTarget.style.background = "#FDF6EE"}
                          onMouseLeave={e => e.currentTarget.style.background = "none"}>{alt.ad}</Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            <Link href="/kategori/acik-mamalar" className="cat-tab" style={{ flexShrink: 0, padding: "14px 18px", fontSize: 14, fontWeight: 600, color: "#5C3D2E", opacity: 0.6, textDecoration: "none", whiteSpace: "nowrap", borderBottom: "2px solid transparent" }}>🥣 Açık Mama</Link>
            <Link href="/kategori/en-cok-satanlar" className="cat-tab" style={{ flexShrink: 0, padding: "14px 18px", fontSize: 14, fontWeight: 600, color: "#5C3D2E", opacity: 0.6, textDecoration: "none", whiteSpace: "nowrap", borderBottom: "2px solid transparent" }}>⭐ Öne Çıkanlar</Link>
            <Link href="/urunler" className="cat-tab" style={{ flexShrink: 0, padding: "14px 18px", fontSize: 14, fontWeight: 600, color: "#5C3D2E", opacity: 0.6, textDecoration: "none", whiteSpace: "nowrap", borderBottom: "2px solid transparent" }}>🛍️ Tüm Ürünler</Link>
            <Link href="/kampanyalar" className="cat-tab" style={{ flexShrink: 0, padding: "14px 18px", fontSize: 14, fontWeight: 600, color: "#5C3D2E", opacity: 0.6, textDecoration: "none", whiteSpace: "nowrap", borderBottom: "2px solid transparent" }}>🏷️ Kampanyalar</Link>
            <Link href="/blog" className="cat-tab" style={{ flexShrink: 0, padding: "14px 18px", fontSize: 14, fontWeight: 600, color: "#5C3D2E", opacity: 0.6, textDecoration: "none", whiteSpace: "nowrap", borderBottom: "2px solid transparent" }}>📝 Blog</Link>
          </div>
        </nav>
      </header>

      {/* ARAMA */}
      <div className="ara-section" style={{ padding: "20px 48px", maxWidth: 1400, margin: "0 auto" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", position: "relative" }}>
          <div className="ara-bar" style={{ background: "white", border: "2px solid #E8D5B7", borderRadius: 16, padding: "13px 20px", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 18, opacity: 0.35 }}>🔍</span>
            <input type="text" placeholder="Mama, oyuncak, aksesuar veya marka ara..."
              value={araInput} onChange={e => setAraInput(e.target.value)}
              onFocus={() => setAramaOdak(true)}
              onBlur={() => setTimeout(() => setAramaOdak(false), 150)}
              onKeyDown={e => { if (e.key === "Enter") handleAra(); }}
              style={{ flex: 1, border: "none", background: "none", outline: "none", fontSize: 15, fontFamily: "inherit" }} />
            <button className="ara-btn-active" onClick={handleAra}>Ara</button>
          </div>

          {/* Otomatik tamamlama — yazarken eşleşen ürünler; tıkla → ürün sayfası */}
          {aramaOdak && aramaOnerileri.length > 0 && (
            <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: "white", border: "1px solid #E8D5B7", borderRadius: 14, boxShadow: "0 16px 40px rgba(92,61,46,0.14)", overflow: "hidden", zIndex: 60 }}>
              {aramaOnerileri.map(u => (
                <Link key={u.id} href={`/urun/${u.slug}`} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", textDecoration: "none", color: "#5C3D2E", borderBottom: "1px solid #F4EADF" }}>
                  <div style={{ width: 42, height: 42, borderRadius: 8, background: "#FAF6F0", flexShrink: 0, position: "relative", overflow: "hidden" }}>
                    {u.resim_url && <Image src={u.resim_url} alt={u.ad} fill sizes="42px" style={{ objectFit: "contain", padding: 3, mixBlendMode: "multiply" }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {u.markalar && <div style={{ fontSize: 10, fontWeight: 700, color: "#8BAF8E", textTransform: "uppercase" }}>{u.markalar.ad}</div>}
                    <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.ad}</div>
                  </div>
                  <div style={{ fontFamily: "Georgia,serif", fontSize: 14, fontWeight: 700, color: "#E8845A", flexShrink: 0 }}>₺{(parseFloat(u.indirimli_fiyat || u.fiyat) || 0).toFixed(2)}</div>
                </Link>
              ))}
              <button onClick={handleAra} style={{ width: "100%", textAlign: "center", padding: "11px", background: "#FFF7ED", border: "none", color: "#E8845A", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                {`"${araInput.trim()}" için tüm sonuçları gör →`}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* HERO — Açık Mamalar banner (sol) + hızlı erişim kartları (sağ, "şimdilik") */}
      <div className="hero-grid">
        {/* Eski gradient carousel kaldırıldı; yerine açık mama banner'ı. Tıklanınca açık mamalar kategorisi. */}
        <Link href="/kategori/acik-mamalar" aria-label="Açık Mamalar kategorisi — %100 orijinal, minimum 2027 SKT, 14 gün şartsız iade"
          style={{ display: "block", borderRadius: 28, overflow: "hidden", boxShadow: "0 12px 40px rgba(232,132,90,.22)" }}>
          <Image
            src="/acik-mama-banner.png"
            alt="Açık mama alırken en büyük korku son buluyor — evemama.net'te tüm açık mamalar %100 orijinal ve minimum 2027 SKT'li, 14 gün şartsız iade"
            width={1536}
            height={1024}
            priority
            sizes="(max-width: 768px) 100vw, 900px"
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </Link>
        {/* Açık mama ürün slaytı (8 dikey görsel, otomatik döner) — eski hızlı erişim kartlarının yerine */}
        <div className="hero-right">
          <div style={{ position: "relative", width: "100%", aspectRatio: "1054 / 1492", borderRadius: 20, overflow: "hidden", boxShadow: "0 10px 28px rgba(92,61,46,.18)", background: "#fff" }}>
            {acikSlaytlar.map((src, i) => (
              <Link key={src} href="/kategori/acik-mamalar" aria-label={`Açık mama ürünü ${i + 1} — açık mamalar kategorisine git`}
                style={{ position: "absolute", inset: 0, opacity: i === aktifSlide ? 1 : 0, transition: "opacity .6s ease", pointerEvents: i === aktifSlide ? "auto" : "none" }}>
                <Image src={src} alt={`Royal Canin açık mama ürün görseli ${i + 1}`} fill sizes="(max-width: 768px) 100vw, 380px" style={{ objectFit: "cover" }} priority={i === 0} />
              </Link>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 12, flexWrap: "wrap" }}>
            {acikSlaytlar.map((_, i) => (
              <button key={i} onClick={() => setAktifSlide(i)} aria-label={`${i + 1}. slayta git`}
                style={{ width: i === aktifSlide ? 22 : 7, height: 7, borderRadius: 4, border: "none", padding: 0, background: i === aktifSlide ? "#E8845A" : "#E8D5B7", cursor: "pointer", transition: "all .3s" }} />
            ))}
          </div>
        </div>
      </div>

      {/* GÜVEN ŞERİDİ — orijinallik anasayfada erken; fiyat-karşılaştıran kitleye ilk mesaj */}
      <Link href="/orijinallik-garantisi" style={{ display: "block", textDecoration: "none" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 14px 8px" }}>
          <div style={{ background: "linear-gradient(135deg,#F0FAF1,#E1F3E4)", border: "1.5px solid #8BAF8E", borderRadius: 18, padding: "15px 18px", display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "14px 26px" }}>
            {[
              ["🛡️", "%100 Orijinal & Bandrollü"],
              ["🔐", "Telefonunuzdan Doğrulayın"],
              ["💰", "Sahteyse 2 Katı İade"],
              ["🚚", "12:00'a kadar Aynı Gün Kargo"],
            ].map(([icon, t], i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, fontWeight: 700, color: "#2E7D32" }}>
                <span style={{ fontSize: 18 }}>{icon}</span><span>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </Link>

      {/* PATİ KUMBARASI — sosyal proje: her alışverişin %5'i barınak/sokak köpeklerine mama */}
      <KumbaraWidget />

      {/* ÖNE ÇIKAN ÜRÜNLER — kategori kartları kaldırıldı (kategoriler artık header'da);
          zaten yatay kaydırmalı olan featured slider bu konuma (kumbaranın altına) alındı */}
      <div style={{ background: "#FFFCF8", padding: "48px 0" }}>
        <div className="urun-section" style={{ maxWidth: 1400, margin: "0 auto", padding: "0 48px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 36 }}>
            <h2 className="sec-title" style={{ fontFamily: "Georgia,serif", fontSize: 28, fontWeight: 700, color: "#5C3D2E" }}>Öne Çıkan <span style={{ color: "#E8845A", fontStyle: "italic" }}>Ürünler</span></h2>
            <Link href="/urunler" style={{ fontSize: 14, fontWeight: 600, color: "#E8845A", textDecoration: "none" }}>Tümü →</Link>
          </div>

          {oneCikanUrunler.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#5C3D2E", opacity: 0.4 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
              <div>Yükleniyor...</div>
            </div>
          ) : (
            <div className="urun-grid" ref={oneCikanRef}>
              {oneCikanUrunler.map(urunKart)}
            </div>
          )}
        </div>
      </div>

      {/* KEDİ — sabit 6×4 grid (24 ürün); kategori-bazlı vitrin */}
      {kediUrunler.length > 0 && (
        <div style={{ background: "#FFFCF8", padding: "0 0 24px" }}>
          <div className="urun-section" style={{ maxWidth: 1400, margin: "0 auto", padding: "0 48px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
              <h2 className="sec-title" style={{ fontFamily: "Georgia,serif", fontSize: 28, fontWeight: 700, color: "#5C3D2E" }}>🐱 Kedi <span style={{ color: "#E8845A", fontStyle: "italic" }}>Mamaları</span></h2>
              <Link href="/kategori/kedi" style={{ fontSize: 14, fontWeight: 600, color: "#E8845A", textDecoration: "none" }}>Tümü →</Link>
            </div>
            <div className="urun-grid-sabit">{kediUrunler.map(urunKart)}</div>
          </div>
        </div>
      )}

      {/* KÖPEK — sabit 6×4 grid (24 ürün) */}
      {kopekUrunler.length > 0 && (
        <div style={{ background: "#FFFCF8", padding: "0 0 48px" }}>
          <div className="urun-section" style={{ maxWidth: 1400, margin: "0 auto", padding: "0 48px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
              <h2 className="sec-title" style={{ fontFamily: "Georgia,serif", fontSize: 28, fontWeight: 700, color: "#5C3D2E" }}>🐶 Köpek <span style={{ color: "#E8845A", fontStyle: "italic" }}>Mamaları</span></h2>
              <Link href="/kategori/kopek" style={{ fontSize: 14, fontWeight: 600, color: "#E8845A", textDecoration: "none" }}>Tümü →</Link>
            </div>
            <div className="urun-grid-sabit">{kopekUrunler.map(urunKart)}</div>
          </div>
        </div>
      )}

      {/* GÜVEN BARI */}
      <div className="trust-section" style={{ background: "#5C3D2E", padding: "36px 48px" }}>
        <div className="trust-grid">
          {[
            { icon: "🚀", title: "Aynı Gün Kargo", sub: "Saat 12:00'a kadar siparişlerde" },
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
                <strong style={{ opacity: 0.7, fontSize: 11 }}>Verivo Teknoloji Yazılım ve Platform Hizmetleri Ticaret Limited Şirketi</strong><br />
                Vergi No: 9381208717 — Konak V.D.<br />
                Akın Simav Mah. Mithatpaşa Cad. No:446 Konak / İzmir<br />
                📞 0552 090 80 01<br />
                <span style={{ fontSize: 11, opacity: 0.7, display: "inline-block", margin: "2px 0" }}>Pazartesi–Cuma 09:00–17:00 arası arayabilirsiniz; harici saatlerde telefona cevap verilememektedir.</span><br />
                ✉️ info@evemama.net
              </p>
            </div>
            {[
              { title: "Hızlı Linkler", links: [{ ad: "Hakkımızda", href: "/hakkimizda" }, { ad: "Tüm Ürünler", href: "/urunler" }, { ad: "Açık Mama", href: "/kategori/acik-mamalar" }, { ad: "Orijinallik Garantisi", href: "/orijinallik-garantisi" }, { ad: "Kampanyalar", href: "/kampanyalar" }, { ad: "Blog", href: "/blog" }, { ad: "İletişim", href: "/iletisim" }] },
              { title: "Kategoriler", links: kategoriler.slice(0, 4).map(k => ({ ad: k.ad, href: `/kategori/${k.slug}` })) },
              { title: "Yardım & Destek", links: [{ ad: "Sıkça Sorulan Sorular", href: "/sikca-sorulan-sorular" }, { ad: "İade & Değişim", href: "/iade" }, { ad: "Kargo & Teslimat", href: "/kargo" }, { ad: "İletişim", href: "/iletisim" }] },
              { title: "Yasal", links: [{ ad: "Kullanım Koşulları", href: "/kullanim-kosullari" }, { ad: "Gizlilik Politikası", href: "/gizlilik" }, { ad: "KVKK Aydınlatma", href: "/kvkk" }, { ad: "Çerez Politikası", href: "/cerez-politikasi" }, { ad: "Mesafeli Satış", href: "/mesafeli-satis" }] },
            ].map((col, i) => (
              <div key={i}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#FDF6EE", opacity: 0.35, textTransform: "uppercase", letterSpacing: 1, marginBottom: 18 }}>{col.title}</div>
                {col.links.map((link, j) => (
                  <Link key={j} href={link.href} style={{ display: "block", fontSize: 14, color: "#FDF6EE", opacity: 0.55, marginBottom: 10, textDecoration: "none" }}
                    onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                    onMouseLeave={e => e.currentTarget.style.opacity = "0.55"}>{link.ad}</Link>
                ))}
              </div>
            ))}
          </div>
          <div className="footer-bot">
            <div>
               <div style={{ fontSize: 13, color: "#FDF6EE", opacity: 0.28 }}>⭐ Yıldız Yazılım tarafından hazırlanmıştır — Tüm hakları saklıdır. | Serkan Yıldız: 0534 748 80 01</div>
               <Link 
               href="https://portal-etbis.ticaret.gov.tr/portal/business/certificate?businessSiteId=902a36a2-e806-43c6-89f6-a6f9be6687a9"
               target="_blank"
              rel="noopener noreferrer"
           style={{ color: "#FDF6EE", opacity: 0.6, fontSize: 12, textDecoration: "none" }}
             >
             🏛️ ETBİS Kayıt No: 5455865771
             </Link>
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
        <Link href="/" className="bnav-item"><span className="bnav-icon">🏠</span><span className="bnav-label aktif">Anasayfa</span></Link>
        <Link href="/urunler" className="bnav-item"><span className="bnav-icon">🔍</span><span className="bnav-label">Ara</span></Link>
        <Link href="/blog" className="bnav-item"><span className="bnav-icon">📝</span><span className="bnav-label">Blog</span></Link>
        <Link href="/sepet" className="bnav-item"><span className="bnav-icon">🛒</span><span className="bnav-label">Sepet</span></Link>
      </nav>

    </main>
  );
}