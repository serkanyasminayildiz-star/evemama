"use client";
import { useState } from "react";
import { useCart } from "../../context/CartContext";

export default function Odeme() {
  const { items, totalPrice, clearCart } = useCart();
  const [yukleniyor, setYukleniyor] = useState(false);
  const [odemeYontemi, setOdemeYontemi] = useState<"kart" | "havale">("kart");
  const [sozlesme, setSozlesme] = useState(false);
  const [aydinlatma, setAydinlatma] = useState(false);
  const [hata, setHata] = useState("");
  const [form, setForm] = useState({
    name: "", surname: "", email: "",
    phone: "", address: "", city: ""
  });

  const handleChange = (e: any) => setForm({ ...form, [e.target.name]: e.target.value });

  const kargoUcreti = totalPrice >= 200 ? 0 : 29.90;
  const kdv = totalPrice * 0.20;
  const genelToplam = totalPrice + kargoUcreti;

  const handleOde = async () => {
    if (!sozlesme || !aydinlatma) {
      setHata("Lütfen sözleşmeleri kabul edin.");
      return;
    }
    if (!form.name || !form.surname || !form.email || !form.address || !form.city) {
      setHata("Lütfen tüm zorunlu alanları doldurun.");
      return;
    }
    setHata("");
    setYukleniyor(true);

    if (odemeYontemi === "havale") {
      window.location.href = "/odeme/havale";
      return;
    }

    try {
      const res = await fetch("/api/odeme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          totalPrice: genelToplam,
          buyer: {
            name: form.name,
            surname: form.surname,
            email: form.email,
            phone: form.phone,
            address: form.address,
            city: form.city,
          },
        }),
      });
      const data = await res.json();
      if (data.checkoutFormContent) {
        // iyzico formunu sayfaya enjekte et
        const div = document.createElement("div");
        div.innerHTML = data.checkoutFormContent;
        document.body.appendChild(div);
        const script = div.querySelector("script");
        if (script) {
          const newScript = document.createElement("script");
          newScript.src = script.src;
          document.body.appendChild(newScript);
        }
      } else {
        setHata("Ödeme başlatılamadı: " + (data.errorMessage || "Bilinmeyen hata"));
      }
    } catch (err) {
      setHata("Bir hata oluştu, lütfen tekrar deneyin.");
    }
    setYukleniyor(false);
  };

  const inputStyle = {
    width: "100%", padding: "12px 16px",
    border: "2px solid #E8D5B7", borderRadius: 12,
    fontSize: 14, outline: "none",
    fontFamily: "inherit", boxSizing: "border-box" as const
  };

  return (
    <main style={{ minHeight: "100vh", background: "#FDF6EE", fontFamily: "sans-serif" }}>
      <header style={{ background: "white", padding: "16px 48px", borderBottom: "1px solid #E8D5B7", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100 }}>
        <a href="/" style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: "#5C3D2E", textDecoration: "none" }}>
          evemama<span style={{ color: "#E8845A", fontStyle: "italic" }}>.net</span>
        </a>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: "#5C3D2E" }}>💳 Güvenli Ödeme</div>
        <a href="/sepet" style={{ fontSize: 13, color: "#E8845A", textDecoration: "none", fontWeight: 600 }}>← Sepete Dön</a>
      </header>

      <div style={{ maxWidth: 980, margin: "0 auto", padding: "32px 24px", display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>

        <div>
          {/* Kişisel Bilgiler */}
          <div style={{ background: "white", borderRadius: 20, padding: "28px 24px", marginBottom: 20, boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: "#5C3D2E", marginBottom: 20 }}>👤 Teslimat Bilgileri</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <input name="name" placeholder="Ad *" value={form.name} onChange={handleChange} style={inputStyle} />
              <input name="surname" placeholder="Soyad *" value={form.surname} onChange={handleChange} style={inputStyle} />
            </div>
            <input name="email" type="email" placeholder="E-posta *" value={form.email} onChange={handleChange} style={{ ...inputStyle, marginBottom: 12 }} />
            <input name="phone" placeholder="Telefon" value={form.phone} onChange={handleChange} style={{ ...inputStyle, marginBottom: 12 }} />
            <input name="address" placeholder="Adres *" value={form.address} onChange={handleChange} style={{ ...inputStyle, marginBottom: 12 }} />
            <input name="city" placeholder="Şehir *" value={form.city} onChange={handleChange} style={inputStyle} />
          </div>

          {/* Ödeme Yöntemi */}
          <div style={{ background: "white", borderRadius: 20, padding: "28px 24px", marginBottom: 20, boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: "#5C3D2E", marginBottom: 20 }}>💳 Ödeme Yöntemi</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { id: "kart", icon: "💳", title: "Kredi / Banka Kartı", sub: "Taksit seçeneği mevcut" },
                { id: "havale", icon: "🏦", title: "Banka Havalesi / EFT", sub: "Havale ile %3 indirim" },
              ].map(o => (
                <div key={o.id} onClick={() => setOdemeYontemi(o.id as any)}
                  style={{ border: `2px solid ${odemeYontemi === o.id ? "#E8845A" : "#E8D5B7"}`, borderRadius: 16, padding: "16px 20px", cursor: "pointer", background: odemeYontemi === o.id ? "#FFF5F0" : "white", transition: "all .2s", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${odemeYontemi === o.id ? "#E8845A" : "#E8D5B7"}`, background: odemeYontemi === o.id ? "#E8845A" : "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {odemeYontemi === o.id && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "white" }} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#5C3D2E" }}>{o.icon} {o.title}</div>
                    <div style={{ fontSize: 11, color: "#5C3D2E", opacity: 0.5 }}>{o.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {odemeYontemi === "kart" && (
              <div style={{ marginTop: 16, background: "#FDF6EE", borderRadius: 14, padding: "14px 18px", fontSize: 13, color: "#5C3D2E", opacity: 0.8 }}>
                🔒 Kart bilgileriniz bir sonraki adımda <strong>iyzico</strong>'nun güvenli sayfasında girilecektir. Taksit seçenekleri de orada görünecek.
              </div>
            )}

            {odemeYontemi === "havale" && (
              <div style={{ marginTop: 16, background: "#FDF6EE", borderRadius: 14, padding: "20px" }}>
                <div style={{ fontWeight: 700, color: "#5C3D2E", marginBottom: 12, fontSize: 14 }}>🏦 Banka Hesap Bilgileri</div>
                {[
                  { banka: "Ziraat Bankası", iban: "TR00 0000 0000 0000 0000 0000 00" },
                  { banka: "İş Bankası", iban: "TR00 0000 0000 0000 0000 0000 00" },
                ].map((b, i) => (
                  <div key={i} style={{ background: "white", borderRadius: 12, padding: "12px 16px", marginBottom: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#5C3D2E" }}>{b.banka}</div>
                    <div style={{ fontSize: 12, color: "#5C3D2E", opacity: 0.6 }}>IBAN: {b.iban}</div>
                    <div style={{ fontSize: 12, color: "#5C3D2E", opacity: 0.6 }}>Hesap: evemama.net</div>
                  </div>
                ))}
                <div style={{ fontSize: 12, color: "#E8845A", fontWeight: 600 }}>⚠️ Açıklamaya sipariş numaranızı yazmayı unutmayın!</div>
              </div>
            )}
          </div>

          {/* Sözleşmeler */}
          <div style={{ background: "white", borderRadius: 20, padding: "24px", boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 700, color: "#5C3D2E", marginBottom: 16 }}>📋 Sözleşmeler</div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
              <input type="checkbox" checked={sozlesme} onChange={e => setSozlesme(e.target.checked)}
                style={{ width: 18, height: 18, marginTop: 2, accentColor: "#E8845A", flexShrink: 0, cursor: "pointer" }} />
              <span style={{ fontSize: 13, color: "#5C3D2E", lineHeight: 1.6 }}>
                <a href="#" style={{ color: "#E8845A", fontWeight: 700, textDecoration: "none" }}>Mesafeli Satış Sözleşmesi</a>'ni ve{" "}
                <a href="#" style={{ color: "#E8845A", fontWeight: 700, textDecoration: "none" }}>Ön Bilgilendirme Formu</a>'nu okudum, onaylıyorum. <span style={{ color: "red" }}>*</span>
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <input type="checkbox" checked={aydinlatma} onChange={e => setAydinlatma(e.target.checked)}
                style={{ width: 18, height: 18, marginTop: 2, accentColor: "#E8845A", flexShrink: 0, cursor: "pointer" }} />
              <span style={{ fontSize: 13, color: "#5C3D2E", lineHeight: 1.6 }}>
                <a href="#" style={{ color: "#E8845A", fontWeight: 700, textDecoration: "none" }}>KVKK Aydınlatma Metni</a>'ni okudum,{" "}
                <a href="#" style={{ color: "#E8845A", fontWeight: 700, textDecoration: "none" }}>Gizlilik Politikası</a>'nı kabul ediyorum. <span style={{ color: "red" }}>*</span>
              </span>
            </div>

            {hata && (
              <div style={{ background: "#FFEBEE", color: "#C62828", padding: "10px 14px", borderRadius: 10, marginTop: 14, fontSize: 13 }}>
                ❌ {hata}
              </div>
            )}
          </div>
        </div>

        {/* Sipariş Özeti */}
        <div style={{ height: "fit-content", position: "sticky", top: 90 }}>
          <div style={{ background: "white", borderRadius: 20, padding: "28px 24px", boxShadow: "0 4px 16px rgba(92,61,46,0.06)", marginBottom: 16 }}>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: "#5C3D2E", marginBottom: 16 }}>🧾 Sipariş Özeti</div>

            {items.map(item => (
              <div key={item.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 13, color: "#5C3D2E" }}>
                <span>{item.emoji} {item.name} <span style={{ opacity: 0.5 }}>x{item.quantity}</span></span>
                <span style={{ fontWeight: 700 }}>₺{item.price * item.quantity}</span>
              </div>
            ))}

            <div style={{ borderTop: "1px solid #F0E8E0", paddingTop: 14, marginTop: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13, color: "#5C3D2E" }}>
                <span>Ara Toplam</span><span>₺{totalPrice.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13, color: "#5C3D2E" }}>
                <span>KDV (%20)</span><span>₺{kdv.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, fontSize: 13, color: "#5C3D2E" }}>
                <span>Kargo</span>
                <span style={{ color: kargoUcreti === 0 ? "#8BAF8E" : "#5C3D2E", fontWeight: kargoUcreti === 0 ? 700 : 400 }}>
                  {kargoUcreti === 0 ? "Ücretsiz 🎉" : `₺${kargoUcreti.toFixed(2)}`}
                </span>
              </div>
              <div style={{ borderTop: "2px solid #FDF6EE", paddingTop: 14, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontFamily: "Georgia, serif", fontSize: 17, fontWeight: 700, color: "#5C3D2E" }}>Toplam</span>
                <span style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: "#E8845A" }}>₺{genelToplam.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <button onClick={handleOde} disabled={yukleniyor || !sozlesme || !aydinlatma}
            style={{ width: "100%", background: (!sozlesme || !aydinlatma) ? "#ccc" : "#E8845A", color: "white", border: "none", borderRadius: 16, padding: "18px", fontSize: 16, fontWeight: 700, cursor: (!sozlesme || !aydinlatma) ? "not-allowed" : "pointer", fontFamily: "inherit", boxShadow: "0 8px 20px rgba(232,132,90,0.3)", transition: "all .2s" }}>
            {yukleniyor ? "Yükleniyor..." : odemeYontemi === "havale" ? "Siparişi Tamamla 🏦" : "Ödemeye Geç 🔒"}
          </button>

          <div style={{ textAlign: "center", marginTop: 12, fontSize: 11, color: "#5C3D2E", opacity: 0.4 }}>
            iyzico güvencesiyle korumalı ödeme
          </div>

          <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 14, flexWrap: "wrap" }}>
            {["🔒 SSL", "✅ Orijinal", "🚀 Hızlı Teslimat", "↩️ İade Garantisi"].map((t, i) => (
              <span key={i} style={{ fontSize: 10, color: "#5C3D2E", opacity: 0.5, background: "#FDF6EE", padding: "4px 8px", borderRadius: 50 }}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}