"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import Image from "next/image";
import { supabase } from "../../lib/supabase";
import { useCart } from "../../context/CartContext";

// Kampanyalar: indirimli_fiyat'ı dolu ve gerçekten indirimli (ind < fiyat) TÜM
// aktif ürünler. Sıralama: önce stoktakiler, sonra indirim yüzdesi (büyük → küçük).
// Kart görünümü /urunler ile birebir + indirim yüzdesi rozeti.
type Urun = {
  id: number;
  ad: string;
  slug: string;
  fiyat: number;
  indirimli_fiyat: number | null;
  stok: number;
  resim_url: string | null;
  markalar: { ad: string } | null;
};

function indirimYuzde(u: Urun): number {
  if (!u.indirimli_fiyat || u.fiyat <= 0) return 0;
  return Math.round((1 - u.indirimli_fiyat / u.fiyat) * 100);
}

export default function Kampanyalar() {
  const { addItem, totalItems } = useCart();
  const [urunler, setUrunler] = useState<Urun[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [eklendi, setEklendi] = useState<number | null>(null);

  useEffect(() => {
    supabase
      .from("urunler")
      .select("id, ad, slug, fiyat, indirimli_fiyat, stok, resim_url, markalar(ad)")
      .eq("aktif", true)
      .not("indirimli_fiyat", "is", null)
      .then(({ data, error }) => {
        if (error) console.error("[kampanyalar] urunler:", error);
        const liste = ((data || []) as unknown as Urun[])
          .filter(u => u.indirimli_fiyat !== null && u.indirimli_fiyat < u.fiyat)
          .sort((a, b) => {
            const stokFark = (b.stok > 0 ? 1 : 0) - (a.stok > 0 ? 1 : 0); // stoktakiler öne
            if (stokFark !== 0) return stokFark;
            return indirimYuzde(b) - indirimYuzde(a); // sonra büyük indirim öne
          });
        setUrunler(liste);
        setYukleniyor(false);
      });
  }, []);

  const handleEkle = (urun: Urun) => {
    if (urun.stok === 0) return;
    addItem({ id: urun.id, name: urun.ad, price: urun.indirimli_fiyat || urun.fiyat, emoji: "🐾", resim_url: urun.resim_url || undefined, slug: urun.slug });
    setEklendi(urun.id);
    setTimeout(() => setEklendi(null), 1200);
  };

  return (
    <main style={{ minHeight: "100vh", background: "#FDF6EE", fontFamily: "sans-serif" }}>

      <style>{`
        .kampanya-wrap { max-width: 1200px; margin: 0 auto; padding: 0 24px 64px; }
        .kampanya-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; }
        .header-kampanya { padding: 16px 48px; }
        @media (max-width: 1024px) {
          .kampanya-grid { grid-template-columns: repeat(3,1fr); }
        }
        @media (max-width: 768px) {
          .kampanya-wrap { padding: 0 14px 64px; }
          .kampanya-grid { grid-template-columns: repeat(2,1fr) !important; gap: 10px; }
          .header-kampanya { padding: 13px 16px !important; }
        }
      `}</style>

      {/* Header */}
      <header className="header-kampanya" style={{ background: "white", borderBottom: "1px solid #E8D5B7", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100 }}>
        <Link href="/" style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, color: "#5C3D2E", textDecoration: "none" }}>
          evemama<span style={{ color: "#E8845A", fontStyle: "italic" }}>.net</span>
        </Link>
        <Link href="/sepet" style={{ background: "#5C3D2E", color: "white", padding: "9px 18px", borderRadius: 50, textDecoration: "none", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
          🛒 {totalItems > 0 && <span style={{ background: "#E8845A", borderRadius: 50, padding: "1px 7px", fontSize: 11 }}>{totalItems}</span>}
        </Link>
      </header>

      {/* Breadcrumb */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "12px 16px", fontSize: 13, color: "#5C3D2E", opacity: 0.6 }}>
        <Link href="/" style={{ color: "#E8845A", textDecoration: "none" }}>Ana Sayfa</Link> / Kampanyalar
      </div>

      <div className="kampanya-wrap">

        {/* Başlık şeridi */}
        <div style={{ background: "linear-gradient(135deg,#FFE8D0,#FFD4B8)", borderRadius: 20, padding: "26px 24px", marginBottom: 24, textAlign: "center" }}>
          <div style={{ fontSize: 34, marginBottom: 6 }}>🏷️</div>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700, color: "#5C3D2E", margin: 0 }}>Kampanyalar</h1>
          <p style={{ fontSize: 14, color: "#5C3D2E", opacity: 0.7, margin: "8px 0 0" }}>
            Tüm indirimli ürünler bir arada{!yukleniyor && urunler.length > 0 ? ` — ${urunler.length} ürün` : ""}
          </p>
        </div>

        {yukleniyor ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: "#5C3D2E" }}>Yükleniyor...</div>
          </div>
        ) : urunler.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 24px", background: "white", borderRadius: 24 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🐾</div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: "#5C3D2E", marginBottom: 8 }}>Şu anda aktif kampanya yok</div>
            <div style={{ fontSize: 14, color: "#5C3D2E", opacity: 0.6, marginBottom: 20 }}>Yeni indirimler için bizi takipte kal!</div>
            <Link href="/urunler" style={{ background: "#E8845A", color: "white", padding: "12px 28px", borderRadius: 50, textDecoration: "none", fontWeight: 700, fontSize: 14, display: "inline-block" }}>Tüm Ürünlere Göz At →</Link>
          </div>
        ) : (
          <div className="kampanya-grid">
            {urunler.map(urun => (
              <div key={urun.id} style={{ background: "white", borderRadius: 18, overflow: "hidden", transition: "transform .2s, box-shadow .2s" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(92,61,46,0.1)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
                <Link href={`/urun/${urun.slug}`} style={{ textDecoration: "none", display: "block" }}>
                  <div style={{ height: 140, background: "#FDF6EE", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                    {urun.resim_url ? (
                      <Image src={urun.resim_url} alt={urun.ad} fill sizes="(max-width:768px) 50vw, (max-width:1200px) 33vw, 300px" style={{ objectFit: "contain", padding: 10, mixBlendMode: "multiply" }} />
                    ) : (
                      <div style={{ fontSize: 48, opacity: 0.2 }}>🐾</div>
                    )}
                    {/* İndirim rozeti */}
                    <span style={{ position: "absolute", top: 8, right: 8, background: "#E53935", color: "white", fontSize: 11, fontWeight: 700, padding: "4px 8px", borderRadius: 50 }}>
                      -%{indirimYuzde(urun)}
                    </span>
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
                </Link>
                <div style={{ padding: "0 12px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 700, color: "#E53935" }}>₺{(urun.indirimli_fiyat || urun.fiyat).toFixed(2)}</span>
                    <span style={{ fontSize: 10, color: "#5C3D2E", opacity: 0.4, textDecoration: "line-through", marginLeft: 4 }}>₺{urun.fiyat.toFixed(2)}</span>
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

      </div>
    </main>
  );
}
