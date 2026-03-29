"use client";
import { useCart } from "../../context/CartContext";
import { useState } from "react";

export default function Sepet() {
  const { items, removeItem, updateQuantity, totalItems, totalPrice, clearCart } = useCart();
  const [silindi, setSilindi] = useState<number | null>(null);
  const [eklendi, setEklendi] = useState<number | null>(null);

  const kargoUcreti = totalPrice >= 200 ? 0 : 29.90;
  const genelToplam = totalPrice + kargoUcreti;

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
      <header style={{ background: "white", padding: "16px 48px", borderBottom: "1px solid #E8D5B7", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <a href="/" style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: "#5C3D2E", textDecoration: "none" }}>
          evemama<span style={{ color: "#E8845A", fontStyle: "italic" }}>.net</span>
        </a>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: "#5C3D2E" }}>🛒 Sepetim</div>
        <a href="/" style={{ fontSize: 13, color: "#E8845A", textDecoration: "none", fontWeight: 600 }}>← Alışverişe Devam</a>
      </header>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "70vh" }}>
        <div style={{ textAlign: "center", background: "white", borderRadius: 24, padding: "60px 48px", boxShadow: "0 8px 32px rgba(92,61,46,0.08)" }}>
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
      <header style={{ background: "white", padding: "16px 48px", borderBottom: "1px solid #E8D5B7", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100 }}>
        <a href="/" style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: "#5C3D2E", textDecoration: "none" }}>
          evemama<span style={{ color: "#E8845A", fontStyle: "italic" }}>.net</span>
        </a>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: "#5C3D2E" }}>
          🛒 Sepetim
          <span style={{ background: "#E8845A", color: "white", borderRadius: 50, fontSize: 13, fontWeight: 700, padding: "2px 10px", marginLeft: 8 }}>{totalItems}</span>
        </div>
        <a href="/" style={{ fontSize: 13, color: "#E8845A", textDecoration: "none", fontWeight: 600 }}>← Alışverişe Devam</a>
      </header>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px", display: "grid", gridTemplateColumns: "1fr 320px", gap: 24 }}>

        {/* Ürün Listesi */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, color: "#5C3D2E" }}>Ürünler ({totalItems})</div>
            <button onClick={() => clearCart()}
              style={{ background: "none", border: "1.5px solid #E8D5B7", color: "#5C3D2E", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "6px 14px", borderRadius: 50, transition: "all .2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#E8845A"; e.currentTarget.style.color = "#E8845A"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#E8D5B7"; e.currentTarget.style.color = "#5C3D2E"; }}>
              🗑️ Sepeti Temizle
            </button>
          </div>

          {items.map(item => (
            <div key={item.id} style={{
              background: "white", borderRadius: 20, padding: "20px 24px", marginBottom: 12,
              display: "flex", alignItems: "center", gap: 16,
              boxShadow: eklendi === item.id ? "0 0 0 2px #E8845A" : "0 4px 16px rgba(92,61,46,0.06)",
              opacity: silindi === item.id ? 0.3 : 1,
              transform: eklendi === item.id ? "scale(1.01)" : "scale(1)",
              transition: "all .25s"
            }}>
              <div style={{ width: 72, height: 72, background: "#FDF6EE", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
              {item.resim_url ? (
               <img src={item.resim_url} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "contain", padding: 8, mixBlendMode: "multiply" }} />
                 ) : (
               <span style={{ fontSize: 40 }}>{item.emoji}</span>
                )}
              </div>
              <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 700, color: "#5C3D2E", marginBottom: 4 }}>{item.name}</div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 700, color: "#E8845A" }}>₺{item.price}</div>
              </div>

              {/* Adet Kontrolü */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#FDF6EE", borderRadius: 50, padding: "4px 8px" }}>
                <button onClick={() => handleAzalt(item.id, item.quantity)}
                  style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: "white", cursor: "pointer", fontSize: 18, fontWeight: 700, color: "#5C3D2E", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(92,61,46,0.1)", transition: "transform .15s" }}
                  onMouseDown={e => e.currentTarget.style.transform = "scale(0.9)"}
                  onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}>−</button>
                <span style={{ fontSize: 16, fontWeight: 700, color: "#5C3D2E", minWidth: 28, textAlign: "center" }}>{item.quantity}</span>
                <button onClick={() => handleArtir(item.id, item.quantity)}
                  style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: "#E8845A", cursor: "pointer", fontSize: 18, fontWeight: 700, color: "white", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(232,132,90,0.3)", transition: "transform .15s" }}
                  onMouseDown={e => e.currentTarget.style.transform = "scale(0.9)"}
                  onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}>+</button>
              </div>

              <div style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: "#5C3D2E", minWidth: 90, textAlign: "right" }}>
                ₺{(item.price * item.quantity).toFixed(2)}
              </div>

              <button onClick={() => { setSilindi(item.id); setTimeout(() => { removeItem(item.id); setSilindi(null); }, 300); }}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, opacity: 0.3, padding: 4, transition: "opacity .2s, transform .2s" }}
                onMouseEnter={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "scale(1.2)"; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = "0.3"; e.currentTarget.style.transform = "scale(1)"; }}>
                🗑️
              </button>
            </div>
          ))}
        </div>

        {/* Sipariş Özeti */}
        <div style={{ height: "fit-content", position: "sticky", top: 90 }}>
          <div style={{ background: "white", borderRadius: 20, padding: "28px 24px", boxShadow: "0 4px 16px rgba(92,61,46,0.06)", marginBottom: 16 }}>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: "#5C3D2E", marginBottom: 20 }}>Sipariş Özeti</div>

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 14, color: "#5C3D2E" }}>
              <span>{totalItems} ürün</span>
              <span>₺{totalPrice.toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, fontSize: 14, color: "#5C3D2E" }}>
              <span>Kargo</span>
              <span style={{ color: kargoUcreti === 0 ? "#8BAF8E" : "#5C3D2E", fontWeight: kargoUcreti === 0 ? 700 : 400 }}>
                {kargoUcreti === 0 ? "Ücretsiz 🎉" : `₺${kargoUcreti.toFixed(2)}`}
              </span>
            </div>

            {kargoUcreti > 0 && (
              <div style={{ background: "#FDF6EE", borderRadius: 12, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#5C3D2E", textAlign: "center" }}>
                🚀 ₺{(200 - totalPrice).toFixed(2)} daha ekle, kargo ücretsiz!
              </div>
            )}

            <div style={{ borderTop: "2px solid #FDF6EE", paddingTop: 16, display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
              <span style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: "#5C3D2E" }}>Toplam</span>
              <span style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: "#E8845A" }}>₺{genelToplam.toFixed(2)}</span>
            </div>

            <a href="/odeme"
              style={{ display: "block", background: "#E8845A", color: "white", borderRadius: 14, padding: "16px", textAlign: "center", textDecoration: "none", fontWeight: 700, fontSize: 16, boxShadow: "0 8px 20px rgba(232,132,90,0.3)", transition: "transform .15s, box-shadow .15s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 28px rgba(232,132,90,0.4)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 20px rgba(232,132,90,0.3)"; }}>
              Ödemeye Geç →
            </a>
          </div>

          <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
            {["🔒 Güvenli Ödeme", "✅ Orijinal Ürün", "🚀 Hızlı Teslimat", "↩️ İade Garantisi"].map((t, i) => (
              <span key={i} style={{ fontSize: 11, color: "#5C3D2E", opacity: 0.5, background: "white", padding: "5px 10px", borderRadius: 50 }}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}