"use client";
import { useState } from "react";

export default function Iletisim() {
  const [form, setForm] = useState({ ad: "", soyad: "", email: "", mesaj: "", kvkk: false, acikRiza: false });
  const [gonderildi, setGonderildi] = useState(false);

  const handleGonder = () => {
    if (!form.ad || !form.email || !form.mesaj || !form.kvkk) return;
    setGonderildi(true);
  };

  return (
    <main style={{ minHeight: "100vh", background: "#FDF6EE", fontFamily: "sans-serif" }}>
      <header style={{ background: "white", padding: "16px 48px", borderBottom: "1px solid #E8D5B7", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <a href="/" style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: "#5C3D2E", textDecoration: "none" }}>evemama<span style={{ color: "#E8845A", fontStyle: "italic" }}>.net</span></a>
      </header>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
        <div>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 36, fontWeight: 700, color: "#5C3D2E", marginBottom: 8 }}>Bize Ulaşın</h1>
          <div style={{ width: 60, height: 4, background: "#E8845A", borderRadius: 2, marginBottom: 32 }} />
          <p style={{ fontSize: 15, color: "#5C3D2E", opacity: 0.7, lineHeight: 1.7, marginBottom: 32 }}>
            Sorularınız, talepleriniz ve siparişlerinizle ilgili bizimle iletişime geçebilirsiniz. En kısa sürede size dönüş sağlıyoruz.
          </p>

          {[
            { icon: "📞", title: "Müşteri Hizmetleri", value: "+90 552 090 80 01", sub: "Çalışma saatleri: 09:00 - 18:00" },
            { icon: "📧", title: "E-posta", value: "info@evemama.net", sub: "En geç 24 saat içinde yanıt" },
            { icon: "📍", title: "Adres", value: "Atilla Mah. 349. Sok. No:55/A", sub: "Konak / İzmir" },
          ].map((item, i) => (
            <div key={i} style={{ background: "white", borderRadius: 20, padding: "20px 24px", marginBottom: 16, display: "flex", gap: 16, alignItems: "flex-start", boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
              <span style={{ fontSize: 28 }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#5C3D2E", opacity: 0.5, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>{item.title}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#5C3D2E", marginBottom: 2 }}>{item.value}</div>
                <div style={{ fontSize: 13, color: "#5C3D2E", opacity: 0.55 }}>{item.sub}</div>
              </div>
            </div>
          ))}

          <div style={{ background: "#FDF6EE", borderRadius: 16, padding: "16px 20px", marginTop: 8, fontSize: 13, color: "#5C3D2E", opacity: 0.7 }}>
            📩 Göndermiş olduğunuz mesajlar en geç 24 saat içerisinde müşteri temsilcilerimiz tarafından yanıtlanır.
          </div>
        </div>

        <div style={{ background: "white", borderRadius: 24, padding: "36px 32px", boxShadow: "0 4px 24px rgba(92,61,46,0.07)" }}>
          {gonderildi ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: "#5C3D2E", marginBottom: 8 }}>Mesajınız İletildi!</div>
              <div style={{ fontSize: 14, color: "#5C3D2E", opacity: 0.6 }}>En kısa sürede size dönüş yapacağız.</div>
            </div>
          ) : (
            <>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: "#5C3D2E", marginBottom: 24 }}>Mesaj Gönder</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#5C3D2E", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>Ad *</label>
                  <input value={form.ad} onChange={e => setForm({ ...form, ad: e.target.value })} placeholder="Adınız" style={{ width: "100%", padding: "12px 14px", border: "2px solid #E8D5B7", borderRadius: 12, fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box" as const }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#5C3D2E", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>Soyad</label>
                  <input value={form.soyad} onChange={e => setForm({ ...form, soyad: e.target.value })} placeholder="Soyadınız" style={{ width: "100%", padding: "12px 14px", border: "2px solid #E8D5B7", borderRadius: 12, fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box" as const }} />
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#5C3D2E", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>E-posta *</label>
                <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} type="email" placeholder="ornek@mail.com" style={{ width: "100%", padding: "12px 14px", border: "2px solid #E8D5B7", borderRadius: 12, fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box" as const }} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#5C3D2E", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>Mesajınız *</label>
                <textarea value={form.mesaj} onChange={e => setForm({ ...form, mesaj: e.target.value })} placeholder="Mesajınızı buraya yazın..." rows={5} style={{ width: "100%", padding: "12px 14px", border: "2px solid #E8D5B7", borderRadius: 12, fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box" as const, resize: "vertical" }} />
              </div>
              <div style={{ marginBottom: 10, display: "flex", alignItems: "flex-start", gap: 10 }}>
                <input type="checkbox" checked={form.kvkk} onChange={e => setForm({ ...form, kvkk: e.target.checked })} style={{ marginTop: 3, accentColor: "#E8845A", width: 16, height: 16, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "#5C3D2E", lineHeight: 1.6 }}>
                  <a href="/kvkk" style={{ color: "#E8845A", textDecoration: "none", fontWeight: 700 }}>KVKK Aydınlatma Metni</a>'ni okudum, anladım ve kabul ediyorum. <span style={{ color: "red" }}>*</span>
                </span>
              </div>
              <div style={{ marginBottom: 20, display: "flex", alignItems: "flex-start", gap: 10 }}>
                <input type="checkbox" checked={form.acikRiza} onChange={e => setForm({ ...form, acikRiza: e.target.checked })} style={{ marginTop: 3, accentColor: "#E8845A", width: 16, height: 16, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "#5C3D2E", lineHeight: 1.6 }}>
                  <a href="/acik-riza" style={{ color: "#E8845A", textDecoration: "none", fontWeight: 700 }}>Açık Rıza Metni</a>'ni okudum, anladım ve kabul ediyorum.
                </span>
              </div>
              <button onClick={handleGonder} disabled={!form.ad || !form.email || !form.mesaj || !form.kvkk}
                style={{ width: "100%", background: (!form.ad || !form.email || !form.mesaj || !form.kvkk) ? "#ccc" : "#E8845A", color: "white", border: "none", borderRadius: 14, padding: "15px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                Gönder →
              </button>
            </>
          )}
        </div>
      </div>

      <footer style={{ background: "#2C1A0E", padding: "32px 48px", textAlign: "center" }}>
        <div style={{ fontSize: 13, color: "#FDF6EE", opacity: 0.3 }}>© 2025 evemama.net — Tüm hakları saklıdır.</div>
      </footer>
    </main>
  );
}