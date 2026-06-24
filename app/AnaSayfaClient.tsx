"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { supabase } from "../lib/supabase";
import { useCart } from "../context/CartContext";
import type { User } from "@supabase/supabase-js";

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
  // Tum kategoriler (root + alt seviyelerin hepsi) — urun gruplama icin
  // her urunun kategori_id'sini root kategoriye kadar takip etmek gerekiyor.
  const [tumKategoriler, setTumKategoriler] = useState<Kategori[]>([]);
  const [acikMenu, setAcikMenu] = useState<string | null>(null);
  const [mobMenuAcik, setMobMenuAcik] = useState(false);
  const [aktifSlide, setAktifSlide] = useState(0);
  const [araInput, setAraInput] = useState("");
  const [newsletter, setNewsletter] = useState("");
  const [newsletterOk, setNewsletterOk] = useState(false);
  const { addItem, totalItems } = useCart();
  const [eklendi, setEklendi] = useState<number | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const slideInterval = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

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
    supabase.auth.getUser()
      .then(({ data }) => setKullanici(data.user))
      .catch(err => console.error("[home] auth.getUser:", err));

    supabase.from("urunler")
      .select("*, markalar(ad), kategoriler(id, ad, slug)")
      // Limit yuksek tutulur ki TUM aktif+stoktaki urunler dataset'e gelsin;
      // grouplama (kategori basina max 6) memory'de yapilir. ~800 urun
      // toplam ~500 KB — modern cihazlarda sorun degil.
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

    // Tum kategoriler — parent lookup icin (urun gruplamada leaf -> root)
    supabase.from("kategoriler").select("id, ad, slug, ust_kategori_id")
      .then(({ data, error }) => {
        if (error) {
          console.error("[home] tumKategoriler fetch:", error);
          return;
        }
        setTumKategoriler(data || []);
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

  useEffect(() => {
    slideInterval.current = setInterval(() => setAktifSlide(s => (s + 1) % slides.length), 4500);
    return () => clearInterval(slideInterval.current);
    // slides sabit (3 eleman); slides.length stabil primitif → effect bir kez kurulur.
  }, [slides.length]);

  // Verilen filtre fonksiyonuna uyan ilk kategorinin slug'ini doner.
  // "Tümünü Gör" linkleri icin kullanilir; eslesme yoksa /urunler'e duser.
  const findKatSlug = (filterFn: (k: Kategori) => boolean): string => {
    const match = tumKategoriler.find(filterFn);
    return match ? match.slug : "";
  };

  const urunGruplari = (() => {
    if (!tumKategoriler.length || !oneCikanlar.length) return [];

    // 6 sabit grup: Kedi Mamasi + Yavru/Yasli; Kopek Mamasi + Yavru/Yasli.
    // Her urun slug ve isminde gecen kelimelere gore TAG'lenir, ilgili
    // gruplara eklenir. Bir urun birden fazla gruba girebilir (ornegin
    // "Yavru Kedi Mamasi" hem ana "Kedi Mamasi"nda hem ozel "Yavru Kedi
    // Mamalari" grubunda goruntulenir).
    type Grup = { ad: string; slug: string; urunler: Urun[]; sortKey: number };
    const gruplar: Record<string, Grup> = {
      "kedi-mama":     { ad: "Kedi Maması",         slug: findKatSlug(k => k.slug === "kedi") || "kedi",                            sortKey: 0, urunler: [] },
      "kedi-yavru":    { ad: "Yavru Kedi Mamaları", slug: findKatSlug(k => /yavru/.test(k.slug) && /kedi/.test(k.slug)) || "urunler", sortKey: 1, urunler: [] },
      "kedi-konserve": { ad: "Yaş Kedi Mamaları",   slug: findKatSlug(k => /konserve/.test(k.slug) && /kedi/.test(k.slug)) || "urunler", sortKey: 2, urunler: [] },
      "kopek-mama":    { ad: "Köpek Maması",        slug: findKatSlug(k => k.slug === "kopek") || "kopek",                          sortKey: 3, urunler: [] },
      "kopek-yavru":   { ad: "Yavru Köpek Mamaları",slug: findKatSlug(k => /yavru/.test(k.slug) && /kopek/.test(k.slug)) || "urunler", sortKey: 4, urunler: [] },
      "kopek-konserve":{ ad: "Yaş Köpek Mamaları",  slug: findKatSlug(k => /konserve/.test(k.slug) && /kopek/.test(k.slug)) || "urunler", sortKey: 5, urunler: [] },
    };

    oneCikanlar.forEach(u => {
      const slug = (u.kategoriler?.slug || "").toLowerCase();
      const ad = (u.ad || "").toLowerCase();
      const txt = slug + " " + ad;

      const isKedi = /\bkedi\b|kitten/.test(txt) && !/kopek|köpek/.test(txt);
      const isKopek = /\bkopek\b|köpek|puppy/.test(txt) && !/\bkedi\b/.test(txt);
      const isMama = /mama|food|biskuvi|odul|treat|konserve/.test(txt);
      const isYavru = /yavru|kitten|puppy/.test(txt);
      // "Yaş" = konserve / wet food. Slug'da "konserve" var veya ad'da "yaş mama"/"wet" geciyor.
      const isKonserve = /konserve|wet|pate|patê|sos|jelly|gravy|sıvı|pouch/.test(txt);

      if (!isMama) return; // Sadece mama urunleri (aksesuar, kum vb. degil)

      const ekle = (key: string) => {
        if (gruplar[key].urunler.length < 15) gruplar[key].urunler.push(u);
      };

      if (isKedi) {
        ekle("kedi-mama");
        if (isYavru) ekle("kedi-yavru");
        if (isKonserve) ekle("kedi-konserve");
      } else if (isKopek) {
        ekle("kopek-mama");
        if (isYavru) ekle("kopek-yavru");
        if (isKonserve) ekle("kopek-konserve");
      }
    });

    return Object.values(gruplar)
      .filter(g => g.urunler.length >= 2)
      .sort((a, b) => a.sortKey - b.sortKey);
  })();

  const handleEkle = (urun: Urun) => {
    addItem({ id: urun.id, name: urun.ad, price: parseFloat(urun.indirimli_fiyat || urun.fiyat) || 0, emoji: "🐾", resim_url: urun.resim_url || undefined });
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
            <Link href="/urunler" className="cat-tab" style={{ flexShrink: 0, padding: "14px 18px", fontSize: 14, fontWeight: 600, color: "#5C3D2E", opacity: 0.6, textDecoration: "none", whiteSpace: "nowrap", borderBottom: "2px solid transparent" }}>🛍️ Tüm Ürünler</Link>
            <Link href="/kampanyalar" className="cat-tab" style={{ flexShrink: 0, padding: "14px 18px", fontSize: 14, fontWeight: 600, color: "#5C3D2E", opacity: 0.6, textDecoration: "none", whiteSpace: "nowrap", borderBottom: "2px solid transparent" }}>🏷️ Kampanyalar</Link>
            <Link href="/blog" className="cat-tab" style={{ flexShrink: 0, padding: "14px 18px", fontSize: 14, fontWeight: 600, color: "#5C3D2E", opacity: 0.6, textDecoration: "none", whiteSpace: "nowrap", borderBottom: "2px solid transparent" }}>📝 Blog</Link>
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

      {/* SABİT BANNER — Royal Canin kampanya görseli (ana sayfa üstü). 1536×1024,
          tam-en responsive (mobilde otomatik küçülür), tıklanınca Royal Canin araması. */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "16px 16px 0" }}>
        <Link href="/urunler?q=Royal Canin" style={{ display: "block" }} aria-label="Royal Canin köpek mamaları — indirimli fırsatlar">
          <Image
            src="/royal-canin-banner.png"
            alt="Royal Canin köpek mamaları — evemama.net'te %100 orijinal, %25-27 indirim"
            width={1536}
            height={1024}
            priority
            sizes="(max-width: 1200px) 100vw, 1200px"
            style={{ width: "100%", height: "auto", display: "block", borderRadius: 20 }}
          />
        </Link>
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
                  <Link href={slide.link} style={{ background: "#5C3D2E", color: "white", fontSize: 13, fontWeight: 700, padding: "10px 20px", borderRadius: 50, textDecoration: "none" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#2C1A0E"}
                    onMouseLeave={e => e.currentTarget.style.background = "#5C3D2E"}>Keşfet →</Link>
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
          <Link href="/urunler" style={{ background: "#E8845A", color: "white", borderRadius: 18, padding: "20px 28px", fontSize: 17, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 12, boxShadow: "0 10px 28px rgba(232,132,90,.32)", textDecoration: "none" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}>
            Alışverişe Başla
            <span style={{ background: "rgba(255,255,255,.22)", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>→</span>
          </Link>
          <Link href="/kategori/kopek" style={{ borderRadius: 20, padding: "24px 26px", background: "linear-gradient(135deg,#C8DEC9,rgba(139,175,142,.33))", display: "flex", alignItems: "center", justifyContent: "space-between", textDecoration: "none" }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#5C3D2E", opacity: 0.7, textTransform: "uppercase", marginBottom: 4 }}>🐶 Köpek Ürünleri</div>
              <div style={{ fontFamily: "Georgia,serif", fontSize: 19, fontWeight: 700, color: "#5C3D2E" }}>Yeni sezon<br />köpek mamaları</div>
            </div>
            <div style={{ fontSize: 52, animation: "floatAnim 4s ease-in-out infinite" }}>🦴</div>
          </Link>
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
          <Link href="/urunler" style={{ fontSize: 14, fontWeight: 600, color: "#E8845A", textDecoration: "none" }}>Tümünü gör →</Link>
        </div>
        <div className="kat-grid">
          {kategoriler
            // "Kiyafet" kategorilerini ana sayfa carousel'inden gizle (kullanici talebi)
            .filter(kat => !/kiyafet|kıyafet|giysi/i.test(kat.slug + " " + kat.ad))
            .map((kat, i) => {
            const g = getKatGorsel(kat.slug);
            return (
              <Link key={i} href={`/kategori/${kat.slug}`} className="kat-card">
                <div className="kat-card-img" style={{ background: g.bg }}>
                  <span style={{ fontSize: 48, filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.12))" }}>{g.emoji}</span>
                </div>
                <div className="kat-card-label">
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#5C3D2E" }}>{kat.ad}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ÖNE ÇIKAN ÜRÜNLER */}
      <div style={{ background: "#FFFCF8", padding: "48px 0" }}>
        <div className="urun-section" style={{ maxWidth: 1400, margin: "0 auto", padding: "0 48px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 36 }}>
            <h2 className="sec-title" style={{ fontFamily: "Georgia,serif", fontSize: 28, fontWeight: 700, color: "#5C3D2E" }}>Öne Çıkan <span style={{ color: "#E8845A", fontStyle: "italic" }}>Ürünler</span></h2>
            <Link href="/urunler" style={{ fontSize: 14, fontWeight: 600, color: "#E8845A", textDecoration: "none" }}>Tümü →</Link>
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
                    <Link href={`/kategori/${grup.slug}`}
                      style={{ fontSize: 13, fontWeight: 600, color: "#E8845A", textDecoration: "none", border: "1.5px solid #E8845A", padding: "7px 16px", borderRadius: 50, whiteSpace: "nowrap" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "#E8845A"; e.currentTarget.style.color = "white"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#E8845A"; }}>
                      Tümünü Gör →
                    </Link>
                  </div>

                  <div className="urun-grid">
                    {grup.urunler.map((urun, i) => {
                      // Indirim hesaplama — indirimli_fiyat dolu ve normalden kucukse indirim var.
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
                            {/* Indirim rozeti — sag ust kose, kirmizi yuvarlak */}
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
                    })}
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
                <strong style={{ opacity: 0.7, fontSize: 11 }}>Verivo Teknoloji Yazılım ve Platform Hizmetleri Ticaret Limited Şirketi</strong><br />
                Vergi No: 9381208717 — Konak V.D.<br />
                Akın Simav Mah. Mithatpaşa Cad. No:446 Konak / İzmir<br />
                📞 0552 090 80 01<br />
                <span style={{ fontSize: 11, opacity: 0.7, display: "inline-block", margin: "2px 0" }}>Pazartesi–Cuma 09:00–17:00 arası arayabilirsiniz; harici saatlerde telefona cevap verilememektedir.</span><br />
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