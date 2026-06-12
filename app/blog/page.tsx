"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { blogYazilari } from "./yazilar";

const kategoriler = ["Tümü", "Kedi Bakımı", "Köpek Bakımı", "Kızgınlık Dönemleri", "Besleme Önerileri", "Sağlık İpuçları", "Eğitim"];

const soruKategorileri = ["Kedi Bakımı", "Köpek Bakımı", "Besleme", "Sağlık", "Eğitim", "Diğer"];

type Soru = {
  id: number | string;
  ad: string;
  soru: string;
  cevap?: string | null;
  kategori: string;
  onaylandi: boolean;
  created_at: string;
};

export default function Blog() {
  const [aktifKat, setAktifKat] = useState("Tümü");
  const [sorular, setSorular] = useState<Soru[]>([]);
  const [yeniSoru, setYeniSoru] = useState({ ad: "", soru: "", kategori: "Kedi Bakımı" });
  const [soruGonderildi, setSoruGonderildi] = useState(false);
  const [soruYukleniyor, setSoruYukleniyor] = useState(true);
  const [soruHata, setSoruHata] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("blog_sorular")
      .select("id, ad, soru, cevap, kategori, onaylandi, created_at")
      .eq("onaylandi", true)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error("[blog] sorular fetch:", error);
          // Sorular zorunlu degil — sayfa blogYazilari (statik) ile calismaya devam eder.
        }
        setSorular((data as Soru[]) || []);
        setSoruYukleniyor(false);
      });
  }, []);

  const soruGonder = async () => {
    if (!yeniSoru.ad.trim() || !yeniSoru.soru.trim()) return;
    try {
      const { error } = await supabase.from("blog_sorular").insert({
        ad: yeniSoru.ad,
        soru: yeniSoru.soru,
        kategori: yeniSoru.kategori,
        onaylandi: false,
      });
      if (error) throw error;
      setSoruGonderildi(true);
      setYeniSoru({ ad: "", soru: "", kategori: "Kedi Bakımı" });
    } catch (err) {
      console.error("[blog] soru gonderme hatasi:", err);
      setSoruHata("Soru gönderilemedi. Lütfen tekrar deneyin.");
      setTimeout(() => setSoruHata(null), 4000);
    }
  };

  const filtrelenmis = aktifKat === "Tümü" ? blogYazilari : blogYazilari.filter(y => y.kategori === aktifKat);

  return (
    <main style={{ minHeight: "100vh", background: "#FDF6EE", fontFamily: "sans-serif", color: "#2C1A0E" }}>

      <style>{`
        .blog-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 24px; }
        .soru-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .blog-header-pad { padding: 16px 48px; }
        .blog-hero-pad { padding: 60px 48px 40px; }
        .blog-content-pad { padding: 0 48px 60px; }
        @media (max-width: 768px) {
          .blog-grid { grid-template-columns: 1fr !important; gap: 16px; }
          .soru-grid { grid-template-columns: 1fr !important; }
          .blog-header-pad { padding: 13px 16px !important; }
          .blog-hero-pad { padding: 32px 16px 24px !important; }
          .blog-content-pad { padding: 0 16px 80px !important; }
        }
      `}</style>

      {/* Header */}
      <header className="blog-header-pad" style={{ background: "white", borderBottom: "1px solid #E8D5B7", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100 }}>
        <Link href="/" style={{ fontFamily: "Georgia,serif", fontSize: 20, fontWeight: 700, color: "#5C3D2E", textDecoration: "none" }}>
          evemama<span style={{ color: "#E8845A", fontStyle: "italic" }}>.net</span>
        </Link>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link href="/urunler" style={{ fontSize: 13, fontWeight: 600, color: "#5C3D2E", opacity: 0.6, textDecoration: "none" }}>Ürünler</Link>
          <Link href="/sepet" style={{ background: "#5C3D2E", color: "white", padding: "9px 18px", borderRadius: 50, textDecoration: "none", fontSize: 13, fontWeight: 700 }}>🛒 Sepet</Link>
        </div>
      </header>

      {/* Hero */}
      <div className="blog-hero-pad" style={{ background: "linear-gradient(135deg,#5C3D2E,#8B5E42)", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🐾</div>
        <h1 style={{ fontFamily: "Georgia,serif", fontSize: 36, fontWeight: 700, color: "white", marginBottom: 12 }}>
          Evcil Dostlar <em style={{ color: "#F4C09A" }}>Rehberi</em>
        </h1>
        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.7)", maxWidth: 560, margin: "0 auto" }}>
          Kedi ve köpeklerinizin bakımı, sağlığı ve mutluluğu için uzman bilgileri ve topluluk deneyimleri
        </p>
      </div>

      {/* Kategori Filtreleri */}
      <div className="blog-content-pad" style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: "28px 0 24px", overflowX: "auto" }}>
          {kategoriler.map((kat, i) => (
            <button key={i} onClick={() => setAktifKat(kat)}
              style={{ padding: "9px 18px", borderRadius: 50, border: `2px solid ${aktifKat === kat ? "#E8845A" : "#E8D5B7"}`, background: aktifKat === kat ? "#E8845A" : "white", color: aktifKat === kat ? "white" : "#5C3D2E", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
              {kat}
            </button>
          ))}
        </div>

        {/* Blog Kartları → gerçek makale sayfalarına link */}
        <div className="blog-grid">
          {filtrelenmis.map((yazi) => (
            <Link key={yazi.slug} href={`/blog/${yazi.slug}`}
              style={{ background: "white", borderRadius: 24, overflow: "hidden", boxShadow: "0 4px 20px rgba(92,61,46,0.08)", cursor: "pointer", transition: "transform .2s, box-shadow .2s", textDecoration: "none", display: "block" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 16px 40px rgba(92,61,46,0.15)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(92,61,46,0.08)"; }}>
              <div style={{ height: 120, background: yazi.renk, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 56 }}>
                {yazi.emoji}
              </div>
              <div style={{ padding: "20px 22px 24px" }}>
                <div style={{ display: "inline-block", background: "#FFF5F0", color: "#E8845A", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 50, marginBottom: 10 }}>{yazi.kategori}</div>
                <h3 style={{ fontFamily: "Georgia,serif", fontSize: 17, fontWeight: 700, color: "#5C3D2E", marginBottom: 10, lineHeight: 1.35 }}>{yazi.baslik}</h3>
                <p style={{ fontSize: 13, color: "#5C3D2E", opacity: 0.6, lineHeight: 1.6, marginBottom: 16 }}>{yazi.ozet}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#E8845A", fontSize: 13, fontWeight: 700 }}>
                  Devamını Oku <span>→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Soru-Cevap Bölümü */}
        <div style={{ marginTop: 64 }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <h2 style={{ fontFamily: "Georgia,serif", fontSize: 30, fontWeight: 700, color: "#5C3D2E", marginBottom: 10 }}>
              Topluluk <span style={{ color: "#E8845A", fontStyle: "italic" }}>Soru & Cevap</span>
            </h2>
            <p style={{ fontSize: 15, color: "#5C3D2E", opacity: 0.6 }}>Merak ettiklerinizi sorun, deneyimlerinizi paylaşın</p>
          </div>

          {/* Sorular */}
          {soruYukleniyor ? (
            <div style={{ textAlign: "center", padding: "40px 0", opacity: 0.4 }}>⏳ Yükleniyor...</div>
          ) : sorular.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", background: "white", borderRadius: 20, marginBottom: 32 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
              <div style={{ fontFamily: "Georgia,serif", fontSize: 16, color: "#5C3D2E" }}>Henüz soru yok. İlk soruyu sen sor!</div>
            </div>
          ) : (
            <div className="soru-grid" style={{ marginBottom: 40 }}>
              {sorular.map((s, i) => (
                <div key={i} style={{ background: "white", borderRadius: 20, padding: "22px", boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#F4C09A,#E8845A)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "white", flexShrink: 0 }}>
                        {s.ad[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#5C3D2E" }}>{s.ad}</div>
                        <div style={{ fontSize: 11, color: "#E8845A", fontWeight: 600 }}>{s.kategori}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: "#5C3D2E", opacity: 0.4 }}>
                      {new Date(s.created_at).toLocaleDateString("tr-TR")}
                    </div>
                  </div>
                  <p style={{ fontSize: 14, color: "#5C3D2E", lineHeight: 1.6, marginBottom: s.cevap ? 14 : 0, fontWeight: 600 }}>❓ {s.soru}</p>
                  {s.cevap && (
                    <div style={{ background: "#FFF5F0", borderRadius: 12, padding: "12px 14px", borderLeft: "3px solid #E8845A" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#E8845A", marginBottom: 4 }}>💬 evemama.net Yanıtı</div>
                      <p style={{ fontSize: 13, color: "#5C3D2E", lineHeight: 1.6, margin: 0 }}>{s.cevap}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Soru Formu */}
          <div style={{ background: "linear-gradient(135deg,#F4C09A,#E8D5B7)", borderRadius: 24, padding: "36px 40px" }}>
            <h3 style={{ fontFamily: "Georgia,serif", fontSize: 22, fontWeight: 700, color: "#5C3D2E", marginBottom: 6 }}>
              🐾 Siz de Sorun!
            </h3>
            <p style={{ fontSize: 14, color: "#5C3D2E", opacity: 0.7, marginBottom: 24 }}>
              Evcil dostunuz hakkında merak ettiğiniz her şeyi sorabilirsiniz. Uzman ekibimiz ve topluluk yardımcı olacak!
            </p>
            {soruHata && (
              <div role="alert" style={{ background: "#FFEBEE", color: "#C62828", padding: "10px 14px", borderRadius: 10, marginBottom: 14, fontSize: 13, fontWeight: 600 }}>
                ⚠️ {soruHata}
              </div>
            )}
            {soruGonderildi ? (
              <div style={{ background: "#8BAF8E", borderRadius: 16, padding: "20px", textAlign: "center", color: "white" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                <div style={{ fontFamily: "Georgia,serif", fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Sorunuz alındı!</div>
                <div style={{ fontSize: 14, opacity: 0.85 }}>İncelendikten sonra yayınlanacak ve yanıtlanacak.</div>
                <button onClick={() => setSoruGonderildi(false)}
                  style={{ marginTop: 16, background: "white", color: "#5C3D2E", border: "none", borderRadius: 50, padding: "10px 24px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  Başka Soru Sor
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <input placeholder="Adınız *" value={yeniSoru.ad} onChange={e => setYeniSoru({ ...yeniSoru, ad: e.target.value })}
                    style={{ padding: "12px 16px", border: "2px solid rgba(92,61,46,0.15)", borderRadius: 12, fontSize: 14, outline: "none", fontFamily: "inherit", background: "white" }} />
                  <select value={yeniSoru.kategori} onChange={e => setYeniSoru({ ...yeniSoru, kategori: e.target.value })}
                    style={{ padding: "12px 16px", border: "2px solid rgba(92,61,46,0.15)", borderRadius: 12, fontSize: 14, outline: "none", fontFamily: "inherit", background: "white", color: "#5C3D2E", cursor: "pointer" }}>
                    {soruKategorileri.map((k, i) => <option key={i} value={k}>{k}</option>)}
                  </select>
                </div>
                <textarea placeholder="Sorunuzu yazın... *" value={yeniSoru.soru} onChange={e => setYeniSoru({ ...yeniSoru, soru: e.target.value })}
                  rows={4} style={{ padding: "12px 16px", border: "2px solid rgba(92,61,46,0.15)", borderRadius: 12, fontSize: 14, outline: "none", fontFamily: "inherit", background: "white", resize: "vertical" as const }} />
                <button onClick={soruGonder} disabled={!yeniSoru.ad.trim() || !yeniSoru.soru.trim()}
                  style={{ background: !yeniSoru.ad.trim() || !yeniSoru.soru.trim() ? "#ccc" : "#E8845A", color: "white", border: "none", borderRadius: 50, padding: "14px 32px", fontSize: 15, fontWeight: 700, cursor: !yeniSoru.ad.trim() || !yeniSoru.soru.trim() ? "not-allowed" : "pointer", alignSelf: "flex-start", transition: "background .2s" }}>
                  Soruyu Gönder →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobil bottom nav */}
      <style>{`.blog-bottom-nav { display: none; } @media(max-width:768px){ .blog-bottom-nav { display: grid !important; grid-template-columns: repeat(4,1fr); position: fixed; bottom: 0; left: 0; right: 0; z-index: 300; background: rgba(253,246,238,0.97); backdrop-filter: blur(14px); border-top: 1px solid rgba(92,61,46,.08); padding: 8px 0 20px; } }`}</style>
      <nav className="blog-bottom-nav" style={{ display: "none" }}>
        <Link href="/" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, textDecoration: "none", padding: 4 }}>
          <span style={{ fontSize: 22 }}>🏠</span><span style={{ fontSize: 10, fontWeight: 600, color: "#5C3D2E", opacity: 0.4 }}>Anasayfa</span>
        </Link>
        <Link href="/urunler" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, textDecoration: "none", padding: 4 }}>
          <span style={{ fontSize: 22 }}>🛍️</span><span style={{ fontSize: 10, fontWeight: 600, color: "#5C3D2E", opacity: 0.4 }}>Ürünler</span>
        </Link>
        <Link href="/blog" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, textDecoration: "none", padding: 4 }}>
          <span style={{ fontSize: 22 }}>📝</span><span style={{ fontSize: 10, fontWeight: 600, color: "#E8845A", opacity: 1 }}>Blog</span>
        </Link>
        <Link href="/sepet" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, textDecoration: "none", padding: 4 }}>
          <span style={{ fontSize: 22 }}>🛒</span><span style={{ fontSize: 10, fontWeight: 600, color: "#5C3D2E", opacity: 0.4 }}>Sepet</span>
        </Link>
      </nav>

    </main>
  );
}
