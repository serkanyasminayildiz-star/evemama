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
          if (data && data.length > 0) {
            setAltKategoriler(prev => ({ ...prev, [kat.slug]: data }));
          }
        });
    });
  }, [kategoriler]);

  const handleEkle = (urun: any) => {
  addItem({ 
    id: urun.id, 
    name: urun.ad, 
    price: urun.indirimli_fiyat || urun.fiyat, 
    emoji: "🐾",
    resim_url: urun.resim_url 
  });
  setEklendi(urun.id);
  setTimeout(() => setEklendi(null), 1500);
};
    
    return (
    <main style={{ fontFamily: "sans-serif", background: "#FDF6EE", color: "#2C1A0E", overflowX: "hidden" }}>

      {/* HEADER */}
      <header style={{ position: "sticky", top: 0, zIndex: 200, background: "rgba(253,246,238,0.97)", borderBottom: "1px solid rgba(92,61,46,0.08)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", padding: "16px 48px", maxWidth: 1400, margin: "0 auto" }}>
          <div />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700, color: "#5C3D2E" }}>
              evemama<span style={{ color: "#E8845A", fontSize: 17, fontStyle: "italic" }}>.net</span>
            </div>
            <div style={{ fontSize: 10, color: "#5C3D2E", opacity: 0.4, letterSpacing: "0.8px", textTransform: "uppercase" }}>Dostunuzun Dükkânı</div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, alignItems: "center" }}>
            {kullanici ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#5C3D2E" }}>
                  👋 {kullanici.user_metadata?.full_name?.split(" ")[0] || "Üyemiz"}
                </span>
                <button onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }}
                  style={{ background: "none", border: "2px solid #E8D5B7", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#5C3D2E", padding: "8px 16px", borderRadius: 50 }}>
                  Çıkış
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <a href="/giris" style={{ fontSize: 13, fontWeight: 600, color: "#5C3D2E", opacity: 0.7, padding: "8px 12px", borderRadius: 10, textDecoration: "none" }}>Giriş Yap</a>
                <a href="/uye-ol" style={{ border: "2px solid #E8845A", fontSize: 13, fontWeight: 700, color: "#E8845A", padding: "8px 16px", borderRadius: 50, textDecoration: "none" }}>Üye Ol</a>
              </div>
            )}
            <a href="/sepet" style={{ background: "#5C3D2E", color: "white", borderRadius: 50, padding: "10px 20px", fontSize: 13, fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
              🛒 Sepet {totalItems > 0 && <span style={{ background: "#E8845A", borderRadius: 50, padding: "1px 7px", fontSize: 12 }}>{totalItems}</span>}
            </a>
          </div>
        </div>

        {/* KATEGORİ MENÜSÜ */}
        <nav style={{ borderTop: "1px solid rgba(92,61,46,0.06)", background: "#FFFCF8" }}>
          <div style={{ display: "flex", maxWidth: 1400, margin: "0 auto", padding: "0 48px", overflowX: "auto", scrollbarWidth: "none" as any }}>
            <a href="/" style={{ flexShrink: 0, padding: "14px 18px", fontSize: 14, fontWeight: 600, color: "#E8845A", textDecoration: "none", whiteSpace: "nowrap", borderBottom: "2px solid #E8845A" }}>
              🏠 Anasayfa
            </a>
            {["kedi", "kopek"].map((slug) => {
  const kat = kategoriler.find(k => k.slug === slug);
  if (!kat) return null;
  return (
    <div key={slug} style={{ position: "relative", flexShrink: 0 }}
      onMouseEnter={() => setAcikMenu(slug)}
      onMouseLeave={() => setAcikMenu(null)}>
      <div
        style={{ display: "block", padding: "14px 18px", fontSize: 14, fontWeight: 600, color: "#5C3D2E", opacity: acikMenu === slug ? 1 : 0.6, whiteSpace: "nowrap", borderBottom: acikMenu === slug ? "2px solid #E8845A" : "2px solid transparent", transition: "all .2s", cursor: "pointer" }}>
        {kategoriEmoji[slug] || "🐾"} {kat.ad} {altKategoriler[slug]?.length > 0 ? "▾" : ""}
      </div>
      {acikMenu === slug && altKategoriler[slug]?.length > 0 && (
        <div style={{ position: "absolute", top: "100%", left: 0, background: "white", borderRadius: 16, boxShadow: "0 12px 40px rgba(92,61,46,0.15)", padding: "12px 8px", minWidth: 240, zIndex: 300, border: "1px solid #E8D5B7" }}>
          <a href={`/kategori/${slug}`}
            style={{ display: "block", padding: "10px 16px", fontSize: 13, fontWeight: 700, color: "#E8845A", textDecoration: "none", borderRadius: 10, marginBottom: 4 }}>
            Tüm {kat.ad} →
          </a>
          <div style={{ height: 1, background: "#F0E8E0", margin: "8px 8px" }} />
          {altKategoriler[slug].map((alt, j) => (
            <a key={j} href={`/kategori/${alt.slug}`}
              style={{ display: "block", padding: "9px 16px", fontSize: 13, color: "#5C3D2E", textDecoration: "none", borderRadius: 10, transition: "background .15s" }}
              onMouseEnter={e => e.currentTarget.style.background = "#FDF6EE"}
              onMouseLeave={e => e.currentTarget.style.background = "none"}>
              {alt.ad}
            </a>
          ))}
        </div>
      )}
    </div>
  );
})}
            <a href="/urunler" style={{ flexShrink: 0, padding: "14px 18px", fontSize: 14, fontWeight: 600, color: "#5C3D2E", opacity: 0.6, textDecoration: "none", whiteSpace: "nowrap", borderBottom: "2px solid transparent" }}>
              🛍️ Tüm Ürünler
            </a>
            <a href="/kampanyalar" style={{ flexShrink: 0, padding: "14px 18px", fontSize: 14, fontWeight: 600, color: "#5C3D2E", opacity: 0.6, textDecoration: "none", whiteSpace: "nowrap", borderBottom: "2px solid transparent" }}>
              🏷️ Kampanyalar
            </a>
          </div>
        </nav>
      </header>

      {/* ARAMA */}
      <div style={{ padding: "20px 48px", maxWidth: 1400, margin: "0 auto" }}>
        <div style={{ background: "white", border: "2px solid #E8D5B7", borderRadius: 16, padding: "13px 20px", display: "flex", alignItems: "center", gap: 12, maxWidth: 680, margin: "0 auto" }}>
          <span style={{ fontSize: 18, opacity: 0.35 }}>🔍</span>
          <input type="text" placeholder="Mama, oyuncak, aksesuar veya marka ara..."
            style={{ flex: 1, border: "none", background: "none", outline: "none", fontSize: 15, fontFamily: "inherit" }}
            onKeyDown={e => { if (e.key === "Enter") window.location.href = `/urunler?ara=${(e.target as HTMLInputElement).value}`; }} />
          <button style={{ background: "#E8845A", color: "white", border: "none", borderRadius: 10, padding: "8px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Ara</button>
        </div>
      </div>

      {/* HERO */}
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 48px 48px", display: "grid", gridTemplateColumns: "1fr 380px", gap: 24 }}>
        <div>
          <div style={{ borderRadius: 28, height: 360, background: "linear-gradient(135deg,#F8E2C8,#F4C09A,#E8845A)", display: "flex", alignItems: "center", position: "relative", boxShadow: "0 12px 40px rgba(232,132,90,.22)", overflow: "hidden" }}>
            <div style={{ padding: 48, flex: 1, zIndex: 2, position: "relative" }}>
              <div style={{ background: "rgba(255,255,255,.3)", color: "#5C3D2E", fontSize: 11, fontWeight: 700, textTransform: "uppercase", padding: "5px 14px", borderRadius: 50, display: "inline-block", marginBottom: 16 }}>🔥 Haftanın Fırsatı</div>
              <h1 style={{ fontFamily: "Georgia, serif", fontSize: 48, fontWeight: 700, color: "#5C3D2E", lineHeight: 1.05, marginBottom: 10 }}>
                Evcil dostunuz<br /><em style={{ color: "white" }}>en iyisini</em> hak ediyor
              </h1>
              <p style={{ fontSize: 15, color: "#5C3D2E", opacity: 0.65, marginBottom: 24 }}>1000₺ üzeri alışverişlerde ücretsiz kargo!</p>
              <a href="/urunler" style={{ background: "#5C3D2E", color: "white", fontSize: 14, fontWeight: 700, padding: "12px 24px", borderRadius: 50, display: "inline-block", textDecoration: "none" }}>Alışverişe Başla →</a>
            </div>
            <div style={{ position: "absolute", right: 40, bottom: 0, fontSize: 160, lineHeight: 1 }}>🐱</div>
          </div>
          <div style={{ display: "flex", gap: 6, justifyContent: "center", margin: "12px 0" }}>
            <div style={{ width: 20, height: 6, borderRadius: 3, background: "#E8845A" }} />
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#E8D5B7" }} />
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#E8D5B7" }} />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <a href="/urunler" style={{ width: "100%", background: "#E8845A", color: "white", border: "none", borderRadius: 18, padding: "20px 28px", fontSize: 17, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, boxShadow: "0 10px 28px rgba(232,132,90,.32)", textDecoration: "none" }}>
            Alışverişe Başla
            <span style={{ background: "rgba(255,255,255,.22)", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>→</span>
          </a>
          <a href="/kategori/kopek" style={{ borderRadius: 20, padding: "24px 26px", background: "linear-gradient(135deg,#C8DEC9,rgba(139,175,142,.33))", display: "flex", alignItems: "center", justifyContent: "space-between", textDecoration: "none" }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#5C3D2E", opacity: 0.7, textTransform: "uppercase", marginBottom: 4 }}>🐶 Köpek Ürünleri</div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 19, fontWeight: 700, color: "#5C3D2E" }}>Yeni sezon<br />köpek mamaları</div>
            </div>
            <div style={{ fontSize: 52 }}>🦴</div>
          </a>
          <div style={{ borderRadius: 20, padding: "18px 20px", background: "#5C3D2E", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#F4C09A", textTransform: "uppercase", marginBottom: 3 }}>🚀 Ücretsiz Kargo</div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 17, fontWeight: 700, color: "white" }}>1000₺ üzeri<br /><em style={{ color: "#F4C09A" }}>aynı gün teslimat</em></div>
            </div>
            <div style={{ fontSize: 40 }}>📦</div>
          </div>
        </div>
      </div>

      {/* KATEGORİLER */}
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 48px 52px" }}>
        <h2 style={{ fontFamily: "Georgia, serif", fontSize: 28, fontWeight: 700, color: "#5C3D2E", marginBottom: 24 }}>
          Kategorilere <span style={{ color: "#E8845A", fontStyle: "italic" }}>Göz At</span>
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 14 }}>
          {kategoriler.map((kat, i) => (
            <a key={i} href={`/kategori/${kat.slug}`}
              style={{ background: "white", borderRadius: 20, padding: "20px 8px 14px", textAlign: "center", textDecoration: "none", transition: "transform .2s, box-shadow .2s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(92,61,46,0.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>{kategoriEmoji[kat.slug] || "🐾"}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#5C3D2E" }}>{kat.ad}</div>
            </a>
          ))}
        </div>
      </div>

      {/* ÜRÜNLER */}
      <div style={{ background: "#FFFCF8", padding: "48px 0" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 48px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <h2 style={{ fontFamily: "Georgia, serif", fontSize: 28, fontWeight: 700, color: "#5C3D2E" }}>
              Öne Çıkan <span style={{ color: "#E8845A", fontStyle: "italic" }}>Ürünler</span>
            </h2>
            <a href="/urunler" style={{ fontSize: 14, fontWeight: 600, color: "#E8845A", textDecoration: "none" }}>Tümü →</a>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 }}>
            {oneCikanlar.map((urun, i) => (
              <div key={i} style={{ background: "white", borderRadius: 24, overflow: "hidden", transition: "transform .2s, box-shadow .2s" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 16px 40px rgba(92,61,46,0.1)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
                <a href={`/urun/${urun.slug}`} style={{ textDecoration: "none", display: "block" }}>
                  <div style={{ height: 180, background: "#f9f9f9", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                    {urun.resim_url ? (
                      <img src={urun.resim_url} alt={urun.ad} style={{ width: "100%", height: "100%", objectFit: "contain", padding: 16, mixBlendMode: "multiply" }} />
                    ) : (
                      <div style={{ fontSize: 64, opacity: 0.2 }}>🐾</div>
                    )}
                    {urun.stok <= 5 && urun.stok > 0 && (
                      <span style={{ position: "absolute", top: 10, left: 10, background: "#E8845A", color: "white", fontSize: 10, fontWeight: 700, padding: "4px 9px", borderRadius: 50 }}>Son {urun.stok}!</span>
                    )}
                  </div>
                  <div style={{ padding: "16px 18px 8px" }}>
                    {urun.markalar && <div style={{ fontSize: 11, fontWeight: 600, color: "#8BAF8E", textTransform: "uppercase", marginBottom: 4 }}>{urun.markalar.ad}</div>}
                    <div style={{ fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 700, color: "#5C3D2E", marginBottom: 4, lineHeight: 1.3 }}>{urun.ad.substring(0, 50)}{urun.ad.length > 50 ? "..." : ""}</div>
                  </div>
                </a>
                <div style={{ padding: "0 18px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: "#5C3D2E" }}>₺{(urun.indirimli_fiyat || urun.fiyat).toFixed(2)}</span>
                  <button onClick={() => handleEkle(urun)}
                    style={{ background: eklendi === urun.id ? "#8BAF8E" : "#E8845A", color: "white", border: "none", borderRadius: 50, padding: "9px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all .2s" }}
                    onMouseDown={e => e.currentTarget.style.transform = "scale(0.95)"}
                    onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}>
                    {eklendi === urun.id ? "✅" : "+ Sepet"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* GÜVEN BARI */}
      <div style={{ background: "#5C3D2E", padding: "36px 48px" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)" }}>
          {[
            { icon: "🚀", title: "Aynı Gün Kargo", sub: "Saat 14:00'a kadar siparişlerde" },
            { icon: "✅", title: "%100 Orijinal Ürün", sub: "Yetkili distribütörden temin" },
            { icon: "🔒", title: "Güvenli Ödeme", sub: "SSL & 3D Secure korumalı" },
            { icon: "💬", title: "7/24 Destek", sub: "WhatsApp & e-posta" },
          ].map((t, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, padding: "0 32px", borderRight: i < 3 ? "1px solid rgba(255,255,255,.1)" : "none" }}>
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
      <footer style={{ background: "#2C1A0E", padding: "56px 48px 32px" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48, marginBottom: 48 }}>
            <div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: "#FDF6EE", marginBottom: 12 }}>
                evemama<span style={{ color: "#E8845A", fontStyle: "italic" }}>.net</span>
              </div>
              <p style={{ fontSize: 13, color: "#FDF6EE", opacity: 0.4, lineHeight: 1.7, maxWidth: 240 }}>Evcil dostlarınız için en kaliteli ürünleri en uygun fiyatlarla sunuyoruz.</p>
            </div>
            {[
              { title: "Hızlı Linkler", links: [{ ad: "Hakkımızda", href: "/hakkimizda" }, { ad: "Tüm Ürünler", href: "/urunler" }, { ad: "Kampanyalar", href: "/kampanyalar" }, { ad: "İletişim", href: "/iletisim" }] },
              { title: "Kategoriler", links: kategoriler.slice(0, 4).map(k => ({ ad: k.ad, href: `/kategori/${k.slug}` })) },
              { title: "Yardım & Destek", links: [
  { ad: "Sıkça Sorulan Sorular", href: "/sikca-sorulan-sorular" },
  { ad: "İade & Değişim", href: "/iade" },
  { ad: "Kargo & Teslimat", href: "/kargo" },
  { ad: "İletişim", href: "/iletisim" },
]},
               { title: "Yasal", links: [
  { ad: "Kullanım Koşulları", href: "/kullanim-kosullari" },
  { ad: "Gizlilik Politikası", href: "/gizlilik" },
  { ad: "KVKK Aydınlatma", href: "/kvkk" },
  { ad: "Çerez Politikası", href: "/cerez-politikasi" },
  { ad: "Mesafeli Satış Sözleşmesi", href: "/mesafeli-satis" },
]},
            ].map((col, i) => (
              <div key={i}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#FDF6EE", opacity: 0.35, textTransform: "uppercase", letterSpacing: 1, marginBottom: 18 }}>{col.title}</div>
                {col.links.map((link, j) => (
                  <a key={j} href={link.href} style={{ display: "block", fontSize: 14, color: "#FDF6EE", opacity: 0.55, marginBottom: 10, textDecoration: "none" }}
                    onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                    onMouseLeave={e => e.currentTarget.style.opacity = "0.55"}>
                    {link.ad}
                  </a>
                ))}
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,.07)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 13, color: "#FDF6EE", opacity: 0.28 }}>© 2025 evemama.net — Tüm hakları saklıdır.</div>
            <div style={{ display: "flex", gap: 10 }}>
              {["📸", "🐦", "📘"].map((s, i) => (
                <button key={i} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,.07)", border: "none", cursor: "pointer", fontSize: 15, color: "white" }}>{s}</button>
              ))}
            </div>
          </div>
        </div>
      </footer>

    </main>
  );
}