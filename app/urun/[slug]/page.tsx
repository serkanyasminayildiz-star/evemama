"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { useCart } from "../../../context/CartContext";

export default function UrunDetay() {
  const { slug } = useParams();
  const { addItem, totalPrice } = useCart();
  const [urun, setUrun] = useState<any>(null);
  const [benzerUrunler, setBenzerUrunler] = useState<any[]>([]);
  const [yorumlar, setYorumlar] = useState<any[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [eklendi, setEklendi] = useState(false);
  const [adet, setAdet] = useState(1);
  const [aktifSekme, setAktifSekme] = useState<"aciklama" | "yorumlar">("aciklama");
  const [yeniYorum, setYeniYorum] = useState({ ad: "", puan: 5, yorum: "" });
  const [yorumGonderildi, setYorumGonderildi] = useState(false);

  useEffect(() => {
    if (!slug) return;
    supabase
      .from("urunler")
      .select("*, kategoriler(ad, slug), markalar(ad)")
      .eq("slug", slug)
      .single()
      .then(({ data }) => {
        setUrun(data);
        setYukleniyor(false);
        if (data?.kategori_id) {
          supabase
            .from("urunler")
            .select("*")
            .eq("kategori_id", data.kategori_id)
            .neq("slug", slug)
            .limit(4)
            .then(({ data: benzer }) => setBenzerUrunler(benzer || []));
        }
      });
  }, [slug]);

  const handleSepet = () => {
    if (!urun) return;
    for (let i = 0; i < adet; i++) {
      addItem({
        id: urun.id,
        name: urun.ad,
        price: urun.indirimli_fiyat || urun.fiyat,
        emoji: "🐾",
      });
    }
    setEklendi(true);
    setTimeout(() => setEklendi(false), 2500);
  };

  const handleYorumGonder = () => {
    if (!yeniYorum.ad || !yeniYorum.yorum) return;
    setYorumlar(prev => [...prev, {
      id: Date.now(),
      ad: yeniYorum.ad,
      puan: yeniYorum.puan,
      yorum: yeniYorum.yorum,
      tarih: new Date().toLocaleDateString("tr-TR")
    }]);
    setYeniYorum({ ad: "", puan: 5, yorum: "" });
    setYorumGonderildi(true);
    setTimeout(() => setYorumGonderildi(false), 3000);
  };

  if (yukleniyor) return (
    <main style={{ minHeight: "100vh", background: "#FDF6EE", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: "#5C3D2E" }}>Yükleniyor...</div>
      </div>
    </main>
  );

  if (!urun) return (
    <main style={{ minHeight: "100vh", background: "#FDF6EE", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>😢</div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: "#5C3D2E", marginBottom: 20 }}>Ürün bulunamadı</div>
        <a href="/" style={{ color: "#E8845A", textDecoration: "none", fontWeight: 700 }}>← Ana Sayfaya Dön</a>
      </div>
    </main>
  );

  const indirimOrani = urun.indirimli_fiyat
    ? Math.round(((urun.fiyat - urun.indirimli_fiyat) / urun.fiyat) * 100)
    : 0;

  const kargoUcreti = (totalPrice + (urun.indirimli_fiyat || urun.fiyat) * adet) >= 1000 ? 0 : 29.90;
  const kargoyaKalan = 1000 - totalPrice;

  return (
    <main style={{ minHeight: "100vh", background: "#FDF6EE", fontFamily: "sans-serif" }}>

      {/* Header */}
      <header style={{ background: "white", padding: "16px 48px", borderBottom: "1px solid #E8D5B7", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100 }}>
        <a href="/" style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: "#5C3D2E", textDecoration: "none" }}>
          evemama<span style={{ color: "#E8845A", fontStyle: "italic" }}>.net</span>
        </a>
        <a href="/sepet" style={{ background: "#5C3D2E", color: "white", padding: "10px 20px", borderRadius: 50, textDecoration: "none", fontSize: 13, fontWeight: 700 }}>🛒 Sepete Git</a>
      </header>

      {/* 1000₺ Kargo Bildirimi */}
      {kargoyaKalan > 0 ? (
        <div style={{ background: "linear-gradient(135deg, #5C3D2E, #8B5E42)", padding: "10px 24px", textAlign: "center" }}>
          <div style={{ color: "white", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
            🚀 Ücretsiz kargo için <strong style={{ color: "#F4C09A" }}>₺{kargoyaKalan.toFixed(2)}</strong> daha alışveriş yap!
          </div>
          <div style={{ maxWidth: 400, margin: "0 auto", background: "rgba(255,255,255,0.2)", borderRadius: 50, height: 6 }}>
            <div style={{ width: `${Math.min((totalPrice / 1000) * 100, 100)}%`, height: "100%", background: "#E8845A", borderRadius: 50, transition: "width .4s" }} />
          </div>
        </div>
      ) : (
        <div style={{ background: "linear-gradient(135deg, #8BAF8E, #5C8C60)", padding: "10px 24px", textAlign: "center", color: "white", fontSize: 13, fontWeight: 600 }}>
          🎉 Sepetinizde ücretsiz kargo var!
        </div>
      )}

      {/* Breadcrumb */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "16px 24px", fontSize: 13, color: "#5C3D2E", opacity: 0.6 }}>
        <a href="/" style={{ color: "#E8845A", textDecoration: "none" }}>Ana Sayfa</a>
        {urun.kategoriler && <> / <a href={`/kategori/${urun.kategoriler.slug}`} style={{ color: "#E8845A", textDecoration: "none" }}>{urun.kategoriler.ad}</a></>}
        / {urun.ad}
      </div>

      {/* Ana İçerik */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 48px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }}>

        {/* Sol: Görsel */}
        <div>
          <div style={{ background: "white", borderRadius: 24, overflow: "hidden", aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 32px rgba(92,61,46,0.08)", marginBottom: 16 }}>
            {urun.resim_url ? (
              <img src={urun.resim_url} alt={urun.ad} style={{ width: "100%", height: "100%", objectFit: "contain", padding: 24 }} />
            ) : (
              <div style={{ fontSize: 120, opacity: 0.2 }}>🐾</div>
            )}
          </div>
        </div>

        {/* Sağ: Bilgiler */}
        <div>
          {urun.markalar && (
            <div style={{ fontSize: 12, fontWeight: 700, color: "#8BAF8E", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8 }}>
              {urun.markalar.ad}
            </div>
          )}

          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700, color: "#5C3D2E", marginBottom: 12, lineHeight: 1.3 }}>
            {urun.ad}
          </h1>

          {/* Puan Özeti */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 2 }}>
              {[1,2,3,4,5].map(s => (
                <span key={s} style={{ fontSize: 16, color: s <= 4 ? "#E8845A" : "#E8D5B7" }}>★</span>
              ))}
            </div>
            <span style={{ fontSize: 13, color: "#5C3D2E", opacity: 0.6 }}>({yorumlar.length} yorum)</span>
          </div>

          {urun.kisa_aciklama && (
            <p style={{ fontSize: 14, color: "#5C3D2E", opacity: 0.65, lineHeight: 1.7, marginBottom: 20 }}>
              {urun.kisa_aciklama}
            </p>
          )}

          {/* Fiyat */}
          <div style={{ marginBottom: 20 }}>
            {urun.indirimli_fiyat ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <span style={{ fontFamily: "Georgia, serif", fontSize: 36, fontWeight: 700, color: "#E8845A" }}>₺{urun.indirimli_fiyat.toFixed(2)}</span>
                <span style={{ fontFamily: "Georgia, serif", fontSize: 20, color: "#5C3D2E", opacity: 0.4, textDecoration: "line-through" }}>₺{urun.fiyat.toFixed(2)}</span>
                <span style={{ background: "#E8845A", color: "white", fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 50 }}>%{indirimOrani} İndirim</span>
              </div>
            ) : (
              <span style={{ fontFamily: "Georgia, serif", fontSize: 36, fontWeight: 700, color: "#5C3D2E" }}>₺{urun.fiyat.toFixed(2)}</span>
            )}
            <div style={{ fontSize: 11, color: "#5C3D2E", opacity: 0.45, marginTop: 4 }}>KDV Dahil (%{urun.kdv_orani})</div>
          </div>

          {/* Stok */}
          <div style={{ marginBottom: 20 }}>
            {urun.stok > 0 ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#8BAF8E", fontWeight: 600 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#8BAF8E" }} />
                Stokta var {urun.stok <= 5 && <span style={{ color: "#E8845A" }}>— Son {urun.stok} adet!</span>}
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#E57373", fontWeight: 600 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#E57373" }} />
                Stokta yok
              </div>
            )}
          </div>

          {/* Adet Seçici */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#5C3D2E" }}>Adet:</span>
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#FDF6EE", borderRadius: 50, padding: "4px 8px" }}>
              <button onClick={() => setAdet(a => Math.max(1, a - 1))}
                style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: "white", cursor: "pointer", fontSize: 18, fontWeight: 700, color: "#5C3D2E", boxShadow: "0 2px 6px rgba(92,61,46,0.1)" }}>−</button>
              <span style={{ fontSize: 16, fontWeight: 700, color: "#5C3D2E", minWidth: 28, textAlign: "center" }}>{adet}</span>
              <button onClick={() => setAdet(a => Math.min(urun.stok, a + 1))}
                style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: "#E8845A", cursor: "pointer", fontSize: 18, fontWeight: 700, color: "white", boxShadow: "0 2px 6px rgba(232,132,90,0.3)" }}>+</button>
            </div>
          </div>

          {/* Sepete Ekle */}
          <button onClick={handleSepet} disabled={urun.stok === 0}
            style={{ width: "100%", background: eklendi ? "#8BAF8E" : urun.stok === 0 ? "#ccc" : "#E8845A", color: "white", border: "none", borderRadius: 16, padding: "18px", fontSize: 16, fontWeight: 700, cursor: urun.stok === 0 ? "not-allowed" : "pointer", fontFamily: "inherit", marginBottom: 12, boxShadow: "0 8px 20px rgba(232,132,90,0.3)", transition: "all .3s" }}
            onMouseDown={e => { if (urun.stok > 0) e.currentTarget.style.transform = "scale(0.98)"; }}
            onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}>
            {eklendi ? "✅ Sepete Eklendi!" : urun.stok === 0 ? "Stokta Yok" : `🛒 Sepete Ekle (${adet} adet)`}
          </button>

          <a href="/sepet"
            style={{ display: "block", width: "100%", background: "white", color: "#5C3D2E", border: "2px solid #E8D5B7", borderRadius: 16, padding: "15px", fontSize: 15, fontWeight: 700, textAlign: "center", textDecoration: "none", boxSizing: "border-box" as const, transition: "all .2s" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "#E8845A"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "#E8D5B7"}>
            Sepete Git →
          </a>

          {/* Kargo & Teslimat Bilgisi */}
          <div style={{ marginTop: 20, background: "white", borderRadius: 16, padding: "18px 20px" }}>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 14, fontWeight: 700, color: "#5C3D2E", marginBottom: 12 }}>🚚 Kargo & Teslimat</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#5C3D2E" }}>
                <span style={{ fontSize: 18 }}>⚡</span>
                <span><strong>Aynı Gün Kargo</strong> — Saat 14:00'a kadar verilen siparişler bugün kargoya verilir</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#5C3D2E" }}>
                <span style={{ fontSize: 18 }}>🎁</span>
                <span><strong>1000₺ Üzeri Ücretsiz Kargo</strong> — {kargoUcreti === 0 ? "Siparişiniz ücretsiz kargo kapsamında!" : `₺${kargoyaKalan.toFixed(2)} daha ekleyin`}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#5C3D2E" }}>
                <span style={{ fontSize: 18 }}>↩️</span>
                <span><strong>14 Gün İade Garantisi</strong> — Koşulsuz iade hakkı</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sekmeler: Açıklama & Yorumlar */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 48px" }}>
        <div style={{ display: "flex", gap: 0, borderBottom: "2px solid #E8D5B7", marginBottom: 28 }}>
          {[
            { id: "aciklama", label: "📋 Ürün Açıklaması" },
            { id: "yorumlar", label: `⭐ Yorumlar (${yorumlar.length})` }
          ].map(sekme => (
            <button key={sekme.id} onClick={() => setAktifSekme(sekme.id as any)}
              style={{ padding: "14px 28px", fontSize: 14, fontWeight: 700, border: "none", background: "none", cursor: "pointer", color: aktifSekme === sekme.id ? "#E8845A" : "#5C3D2E", opacity: aktifSekme === sekme.id ? 1 : 0.5, borderBottom: aktifSekme === sekme.id ? "2px solid #E8845A" : "2px solid transparent", marginBottom: -2, transition: "all .2s" }}>
              {sekme.label}
            </button>
          ))}
        </div>

        {aktifSekme === "aciklama" && (
          <div style={{ background: "white", borderRadius: 24, padding: "32px" }}>
            {urun.aciklama ? (
              <div style={{ fontSize: 15, color: "#5C3D2E", opacity: 0.75, lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: urun.aciklama }} />
            ) : (
              <div style={{ fontSize: 15, color: "#5C3D2E", opacity: 0.5, textAlign: "center", padding: "40px 0" }}>Bu ürün için henüz açıklama eklenmemiş.</div>
            )}
          </div>
        )}

        {aktifSekme === "yorumlar" && (
          <div>
            {/* Mevcut Yorumlar */}
            {yorumlar.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 32 }}>
                {yorumlar.map(y => (
                  <div key={y.id} style={{ background: "white", borderRadius: 20, padding: "20px 24px", boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <div style={{ fontWeight: 700, color: "#5C3D2E" }}>{y.ad}</div>
                      <div style={{ fontSize: 12, color: "#5C3D2E", opacity: 0.5 }}>{y.tarih}</div>
                    </div>
                    <div style={{ display: "flex", gap: 2, marginBottom: 8 }}>
                      {[1,2,3,4,5].map(s => (
                        <span key={s} style={{ color: s <= y.puan ? "#E8845A" : "#E8D5B7" }}>★</span>
                      ))}
                    </div>
                    <p style={{ fontSize: 14, color: "#5C3D2E", opacity: 0.75, lineHeight: 1.6, margin: 0 }}>{y.yorum}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ background: "white", borderRadius: 20, padding: "40px", textAlign: "center", marginBottom: 32 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: "#5C3D2E", marginBottom: 8 }}>Henüz yorum yok</div>
                <div style={{ fontSize: 14, color: "#5C3D2E", opacity: 0.5 }}>Bu ürünü ilk yorumlayan siz olun!</div>
              </div>
            )}

            {/* Yorum Formu */}
            <div style={{ background: "white", borderRadius: 24, padding: "28px" }}>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: "#5C3D2E", marginBottom: 20 }}>✍️ Yorum Yaz</div>

              {yorumGonderildi && (
                <div style={{ background: "#E8F5E9", color: "#2E7D32", padding: "12px 16px", borderRadius: 12, marginBottom: 16, fontSize: 14 }}>
                  ✅ Yorumunuz için teşekkürler!
                </div>
              )}

              <input value={yeniYorum.ad} onChange={e => setYeniYorum({ ...yeniYorum, ad: e.target.value })}
                placeholder="Adınız *" style={{ width: "100%", padding: "12px 16px", border: "2px solid #E8D5B7", borderRadius: 12, fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box" as const, marginBottom: 12 }} />

              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#5C3D2E", marginBottom: 8 }}>Puanınız:</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {[1,2,3,4,5].map(s => (
                    <button key={s} onClick={() => setYeniYorum({ ...yeniYorum, puan: s })}
                      style={{ fontSize: 28, background: "none", border: "none", cursor: "pointer", color: s <= yeniYorum.puan ? "#E8845A" : "#E8D5B7", transition: "transform .15s" }}
                      onMouseEnter={e => e.currentTarget.style.transform = "scale(1.2)"}
                      onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>★</button>
                  ))}
                </div>
              </div>

              <textarea value={yeniYorum.yorum} onChange={e => setYeniYorum({ ...yeniYorum, yorum: e.target.value })}
                placeholder="Yorumunuz *" rows={4}
                style={{ width: "100%", padding: "12px 16px", border: "2px solid #E8D5B7", borderRadius: 12, fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box" as const, marginBottom: 16, resize: "vertical" }} />

              <button onClick={handleYorumGonder}
                style={{ background: "#E8845A", color: "white", border: "none", borderRadius: 12, padding: "14px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 6px 16px rgba(232,132,90,0.3)", transition: "all .2s" }}
                onMouseDown={e => e.currentTarget.style.transform = "scale(0.97)"}
                onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}>
                Yorum Gönder ✨
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Benzer Ürünler */}
      {benzerUrunler.length > 0 && (
        <div style={{ background: "white", padding: "48px 0" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
            <h2 style={{ fontFamily: "Georgia, serif", fontSize: 24, fontWeight: 700, color: "#5C3D2E", marginBottom: 24 }}>
              Benzer <span style={{ color: "#E8845A", fontStyle: "italic" }}>Ürünler</span>
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
              {benzerUrunler.map(u => (
                <a key={u.id} href={`/urun/${u.slug}`}
                  style={{ background: "#FDF6EE", borderRadius: 20, overflow: "hidden", textDecoration: "none", display: "block", transition: "transform .2s, box-shadow .2s" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(92,61,46,0.1)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
                  <div style={{ height: 140, background: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {u.resim_url ? (
                      <img src={urun.resim_url} alt={urun.ad} style={{ width: "100%", height: "100%", objectFit: "contain", padding: 16, mixBlendMode: "multiply" }} />
                    ) : (
                      <div style={{ fontSize: 48, opacity: 0.2 }}>🐾</div>
                    )}
                  </div>
                  <div style={{ padding: "12px 14px 16px" }}>
                    <div style={{ fontFamily: "Georgia, serif", fontSize: 14, fontWeight: 700, color: "#5C3D2E", marginBottom: 6, lineHeight: 1.3 }}>{u.ad}</div>
                    <div style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 700, color: "#E8845A" }}>
                      ₺{(u.indirimli_fiyat || u.fiyat).toFixed(2)}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

    </main>
  );
}