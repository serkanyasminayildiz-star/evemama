"use client";
import { useCart } from "../../context/CartContext";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function Sepet() {
  const { items, removeItem, updateQuantity, totalItems, totalPrice, clearCart } = useCart();
  const [silindi, setSilindi] = useState<number | null>(null);
  const [eklendi, setEklendi] = useState<number | null>(null);
  const [ilkSiparisIndirimi, setIlkSiparisIndirimi] = useState(false);
  const [kullanici, setKullanici] = useState<any>(null);

  useEffect(() => {
    const kontrol = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setKullanici(user);
      if (user && totalPrice >= 1000) {
        const { count } = await supabase
          .from("siparisler")
          .select("*", { count: "exact", head: true })
          .eq("email", user.email);
        if (count === 0) setIlkSiparisIndirimi(true);
      }
    };
    kontrol();
  }, [totalPrice]);

  const kargoUcreti = totalPrice >= 1000 ? 0 : 29.90;
  const kargoyaKalan = 1000 - totalPrice;

  const indirimMiktari = (totalPrice >= 10000 ? 500 : totalPrice >= 5000 ? 200 : 0) + (ilkSiparisIndirimi ? 200 : 0);
  const indirimAciklama = totalPrice >= 10000 ? "10.000₺ üzeri alışveriş indirimi 🎉" : totalPrice >= 5000 ? "5.000₺ üzeri alışveriş indirimi 🎁" : "";

  const sonrakiIndirim = totalPrice < 5000
    ? { hedef: 5000, indirim: 200, kalan: 5000 - totalPrice }
    : totalPrice < 10000
    ? { hedef: 10000, indirim: 500, kalan: 10000 - totalPrice }
    : null;

  const genelToplam = totalPrice + kargoUcreti - indirimMiktari;

  const handleArtir = (id: number, quantity: number) => {
    setEklendi(id);
    updateQuantity(id, quantity + 1);
    setTimeout(() => setEklendi(null), 400);
  };

  const handleAzalt = (id: number, quantity: number) => {
    updateQuantity(id, quantity - 1);
  };

  if (items.length === 0) return (
    <main style={{ minHeight: "100vh", background: "#FDF6EE", fontFamily: "sans-serif" }}>
      <header style={{ background: "white", padding: "16px 24px", borderBottom: "1px solid #E8D5B7", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <a href="/" style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: "#5C3D2E", textDecoration: "none" }}>
          evemama<span style={{ color: "#E8845A", fontStyle: "italic" }}>.net</span>
        </a>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: "#5C3D2E" }}>🛒 Sepetim</div>
        <a href="/" style={{ fontSize: 13, color: "#E8845A", textDecoration: "none", fontWeight: 600 }}>← Alışverişe Devam</a>
      </header>

      <div style={{ background: "linear-gradient(135deg, #5C3D2E, #8B5E42)", padding: "12px 24px", textAlign: "center", color: "white", fontSize: 13, fontWeight: 600 }}>
        🚀 1000₺ üzeri ücretsiz kargo &nbsp;|&nbsp; 🎁 5000₺ alışverişe 200₺ indirim &nbsp;|&nbsp; 🎉 10.000₺ alışverişe 500₺ indirim
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", padding: "24px" }}>
        <div style={{ textAlign: "center", background: "white", borderRadius: 24, padding: "48px 32px", boxShadow: "0 8px 32px rgba(92,61,46,0.08)", width: "100%", maxWidth: 420 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🛒</div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: "#5C3D2E", marginBottom: 8 }}>Sepetiniz boş</div>
          <div style={{ fontSize: 14, color: "#5C3D2E", opacity: 0.5, marginBottom: 28 }}>Ürün eklemek için alışverişe başlayın</div>
          <a href="/" style={{ background: "#E8845A", color: "white", padding: "14px 28px", borderRadius: 50, textDecoration: "none", fontWeight: 700, fontSize: 14, display: "inline-block", boxShadow: "0 8px 20px rgba(232,132,90,0.3)" }}>
            Alışverişe Başla 🐾
          </a>
        </div>
      </div>
    </main>
  );

  return (
    <main style={{ minHeight: "100vh", background: "#FDF6EE", fontFamily: "sans-serif" }}>
      <header style={{ background: "white", padding: "16px 24px", borderBottom: "1px solid #E8D5B7", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100 }}>
        <a href="/" style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, color: "#5C3D2E", textDecoration: "none" }}>
          evemama<span style={{ color: "#E8845A", fontStyle: "italic" }}>.net</span>
        </a>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 700, color: "#5C3D2E" }}>
          🛒 Sepetim
          <span style={{ background: "#E8845A", color: "white", borderRadius: 50, fontSize: 12, fontWeight: 700, padding: "2px 9px", marginLeft: 8 }}>{totalItems}</span>
        </div>
        <a href="/" style={{ fontSize: 13, color: "#E8845A", textDecoration: "none", fontWeight: 600 }}>← Devam</a>
      </header>

      {kargoUcreti > 0 ? (
        <div style={{ background: "linear-gradient(135deg, #5C3D2E, #8B5E42)", padding: "12px 24px", textAlign: "center" }}>
          <div style={{ color: "white", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
            🚀 Ücretsiz kargo için <strong style={{ color: "#F4C09A", fontSize: 15 }}>₺{kargoyaKalan.toFixed(2)}</strong> daha alışveriş yap!
          </div>
          <div style={{ maxWidth: 400, margin: "0 auto", background: "rgba(255,255,255,0.2)", borderRadius: 50, height: 8, overflow: "hidden" }}>
            <div style={{ width: `${Math.min((totalPrice / 1000) * 100, 100)}%`, height: "100%", background: "#E8845A", borderRadius: 50, transition: "width .4s ease" }} />
          </div>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, marginTop: 4 }}>₺{totalPrice.toFixed(2)} / ₺1000</div>
        </div>
      ) : (
        <div style={{ background: "linear-gradient(135deg, #8BAF8E, #5C8C60)", padding: "12px 24px", textAlign: "center", color: "white", fontSize: 13, fontWeight: 600 }}>
          🎉 Tebrikler! Kargo ücretsiz! 🐾
        </div>
      )}

      {sonrakiIndirim && (
        <div style={{ background: "linear-gradient(135deg,#FFF5E0,#FFE8C0)", padding: "12px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#5C3D2E", marginBottom: 6 }}>
            🎁 <strong style={{ color: "#E8845A" }}>₺{sonrakiIndirim.kalan.toFixed(2)}</strong> daha ekle, <strong>{sonrakiIndirim.indirim}₺ indirim</strong> kazan!
          </div>
          <div style={{ maxWidth: 400, margin: "0 auto", background: "rgba(92,61,46,0.12)", borderRadius: 50, height: 8, overflow: "hidden" }}>
            <div style={{ width: `${Math.min((totalPrice / sonrakiIndirim.hedef) * 100, 100)}%`, height: "100%", background: "#E8845A", borderRadius: 50, transition: "width .4s ease" }} />
          </div>
          <div style={{ fontSize: 11, color: "#5C3D2E", opacity: 0.6, marginTop: 4 }}>
            ₺{totalPrice.toFixed(2)} / ₺{sonrakiIndirim.hedef.toLocaleString("tr-TR")}
          </div>
        </div>
      )}

      {indirimMiktari > 0 && (
        <div style={{ background: "linear-gradient(135deg,#E8F5E9,#C8E6C9)", padding: "12px 24px", textAlign: "center", color: "#2E7D32", fontSize: 13, fontWeight: 700 }}>
          🎉 Tebrikler! <strong>{indirimMiktari}₺ indirim</strong> kazandınız — sepetinize otomatik uygulandı!
        </div>
      )}

      {/* İlk sipariş indirimi bildirimi - giriş yapılmamışsa */}
      {!kullanici && totalPrice >= 1000 && (
        <div style={{ background: "linear-gradient(135deg,#FFF5F0,#FFE8D5)", padding: "12px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#5C3D2E", marginBottom: 6 }}>
            🎁 İlk siparişinize <strong style={{ color: "#E8845A" }}>200₺ indirim</strong> kazanmak için
            <a href="/giris" style={{ color: "#E8845A", fontWeight: 700, marginLeft: 6, textDecoration: "none" }}>giriş yapın →</a>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "16px" }}>

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: "#5C3D2E" }}>Ürünler ({totalItems})</div>
            <button onClick={() => clearCart()}
              style={{ background: "none", border: "1.5px solid #E8D5B7", color: "#5C3D2E", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: "6px 12px", borderRadius: 50, transition: "all .2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#E8845A"; e.currentTarget.style.color = "#E8845A"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#E8D5B7"; e.currentTarget.style.color = "#5C3D2E"; }}>
              🗑️ Temizle
            </button>
          </div>

          {items.map(item => (
            <div key={item.id} style={{
              background: "white", borderRadius: 16, padding: "14px", marginBottom: 10,
              display: "flex", alignItems: "center", gap: 12,
              boxShadow: eklendi === item.id ? "0 0 0 2px #E8845A" : "0 4px 16px rgba(92,61,46,0.06)",
              opacity: silindi === item.id ? 0.3 : 1,
              transform: eklendi === item.id ? "scale(1.01)" : "scale(1)",
              transition: "all .25s"
            }}>
              <div style={{ width: 64, height: 64, background: "#FDF6EE", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                {item.resim_url ? (
                  <img src={item.resim_url} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "contain", padding: 6, mixBlendMode: "multiply" }} />
                ) : (
                  <span style={{ fontSize: 32 }}>{item.emoji}</span>
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 13, fontWeight: 700, color: "#5C3D2E", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 700, color: "#E8845A" }}>₺{item.price}</div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#FDF6EE", borderRadius: 50, padding: "3px 6px" }}>
                <button onClick={() => handleAzalt(item.id, item.quantity)}
                  style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: "white", cursor: "pointer", fontSize: 16, fontWeight: 700, color: "#5C3D2E", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(92,61,46,0.1)", transition: "transform .15s" }}
                  onMouseDown={e => e.currentTarget.style.transform = "scale(0.85)"}
                  onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}>−</button>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#5C3D2E", minWidth: 20, textAlign: "center" }}>{item.quantity}</span>
                <button onClick={() => handleArtir(item.id, item.quantity)}
                  style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: "#E8845A", cursor: "pointer", fontSize: 16, fontWeight: 700, color: "white", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(232,132,90,0.3)", transition: "transform .15s" }}
                  onMouseDown={e => e.currentTarget.style.transform = "scale(0.85)"}
                  onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}>+</button>
              </div>

              <div style={{ fontFamily: "Georgia, serif", fontSize: 14, fontWeight: 700, color: "#5C3D2E", minWidth: 60, textAlign: "right" }}>
                ₺{(item.price * item.quantity).toFixed(2)}
              </div>

              <button onClick={() => { setSilindi(item.id); setTimeout(() => { removeItem(item.id); setSilindi(null); }, 300); }}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, opacity: 0.3, padding: 4, transition: "all .2s", flexShrink: 0 }}
                onMouseEnter={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "scale(1.2)"; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = "0.3"; e.currentTarget.style.transform = "scale(1)"; }}>
                🗑️
              </button>
            </div>
          ))}
        </div>

        <div style={{ background: "white", borderRadius: 20, padding: "24px", boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: "#5C3D2E", marginBottom: 16 }}>Sipariş Özeti</div>

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 14, color: "#5C3D2E" }}>
            <span>{totalItems} ürün</span>
            <span>₺{totalPrice.toFixed(2)}</span>
          </div>

          {(totalPrice >= 5000 || totalPrice >= 10000) && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 14 }}>
              <span style={{ color: "#2E7D32", fontWeight: 600 }}>🎁 {indirimAciklama}</span>
              <span style={{ color: "#2E7D32", fontWeight: 700 }}>−₺{(totalPrice >= 10000 ? 500 : 200).toFixed(2)}</span>
            </div>
          )}

          {ilkSiparisIndirimi && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 14 }}>
              <span style={{ color: "#2E7D32", fontWeight: 600 }}>🎉 İlk sipariş indirimi</span>
              <span style={{ color: "#2E7D32", fontWeight: 700 }}>−₺200.00</span>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, fontSize: 14, color: "#5C3D2E" }}>
            <span>Kargo</span>
            <span style={{ color: kargoUcreti === 0 ? "#8BAF8E" : "#5C3D2E", fontWeight: kargoUcreti === 0 ? 700 : 400 }}>
              {kargoUcreti === 0 ? "Ücretsiz 🎉" : `₺${kargoUcreti.toFixed(2)}`}
            </span>
          </div>

          {kargoUcreti > 0 && (
            <div style={{ background: "#FDF6EE", borderRadius: 12, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#5C3D2E", textAlign: "center", border: "1.5px dashed #E8D5B7" }}>
              🚀 <strong>₺{kargoyaKalan.toFixed(2)}</strong> daha ekle, kargo ücretsiz!
            </div>
          )}

          {sonrakiIndirim && (
            <div style={{ background: "#FFF8E8", borderRadius: 12, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#5C3D2E", textAlign: "center", border: "1.5px dashed #F4C09A" }}>
              🎁 <strong>₺{sonrakiIndirim.kalan.toFixed(2)}</strong> daha ekle, <strong>{sonrakiIndirim.indirim}₺ indirim</strong> kazan!
            </div>
          )}

          {!kullanici && totalPrice >= 1000 && (
            <div style={{ background: "#FFF5F0", borderRadius: 12, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#5C3D2E", textAlign: "center", border: "1.5px dashed #E8845A" }}>
              🎁 İlk siparişinize <strong>200₺ indirim</strong> için <a href="/giris" style={{ color: "#E8845A", fontWeight: 700 }}>giriş yapın →</a>
            </div>
          )}

          <div style={{ borderTop: "2px solid #FDF6EE", paddingTop: 16, display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
            <span style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: "#5C3D2E" }}>Toplam</span>
            <div style={{ textAlign: "right" }}>
              {indirimMiktari > 0 && (
                <div style={{ fontSize: 13, color: "#5C3D2E", opacity: 0.4, textDecoration: "line-through", marginBottom: 2 }}>
                  ₺{(totalPrice + kargoUcreti).toFixed(2)}
                </div>
              )}
              <span style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: "#E8845A" }}>₺{genelToplam.toFixed(2)}</span>
            </div>
          </div>

          <a href="/odeme"
            style={{ display: "block", background: "#E8845A", color: "white", borderRadius: 14, padding: "16px", textAlign: "center", textDecoration: "none", fontWeight: 700, fontSize: 16, boxShadow: "0 8px 20px rgba(232,132,90,0.3)", transition: "all .2s" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 28px rgba(232,132,90,0.45)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 20px rgba(232,132,90,0.3)"; }}
            onMouseDown={e => e.currentTarget.style.transform = "scale(0.97)"}
            onMouseUp={e => e.currentTarget.style.transform = "translateY(-2px)"}>
            Ödemeye Geç →
          </a>

          <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap", marginTop: 16 }}>
            {["🔒 Güvenli Ödeme", "✅ Orijinal Ürün", "🚀 Hızlı Teslimat", "↩️ İade Garantisi"].map((t, i) => (
              <span key={i} style={{ fontSize: 11, color: "#5C3D2E", opacity: 0.5, background: "#FDF6EE", padding: "5px 10px", borderRadius: 50 }}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}