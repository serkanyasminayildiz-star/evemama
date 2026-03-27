"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function UyeOl() {
  const [ad, setAd] = useState("");
  const [email, setEmail] = useState("");
  const [telefon, setTelefon] = useState("");
  const [sifre, setSifre] = useState("");
  const [sifre2, setSifre2] = useState("");
  const [mesaj, setMesaj] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);

  const handleUyeOl = async () => {
    if (sifre !== sifre2) { setMesaj("Şifreler eşleşmiyor!"); return; }
    setYukleniyor(true);
    const { error } = await supabase.auth.signUp({
      email, password: sifre,
      options: { data: { full_name: ad, phone: telefon } }
    });
    setMesaj(error ? "Hata: " + error.message : "✅ Kayıt başarılı! E-postanı kontrol et.");
    setYukleniyor(false);
  };

  const input = { width: "100%", padding: "12px 16px", border: "2px solid #E8D5B7", borderRadius: 12, fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box" as const };
  const label = { fontSize: 13, fontWeight: 600, color: "#5C3D2E", display: "block", marginBottom: 6 };

  return (
    <main style={{ minHeight: "100vh", background: "#FDF6EE", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", padding: 20 }}>
      <div style={{ background: "white", borderRadius: 24, padding: "48px 40px", width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(92,61,46,0.1)" }}>
        
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 28, fontWeight: 700, color: "#5C3D2E" }}>
            evemama<span style={{ color: "#E8845A", fontStyle: "italic" }}>.net</span>
          </div>
          <div style={{ fontSize: 16, color: "#5C3D2E", opacity: 0.6, marginTop: 8 }}>Yeni hesap oluştur</div>
        </div>

        {mesaj && (
          <div style={{ background: mesaj.includes("✅") ? "#E8F5E9" : "#FFEBEE", color: mesaj.includes("✅") ? "#2E7D32" : "#C62828", padding: "12px 16px", borderRadius: 12, marginBottom: 20, fontSize: 14, textAlign: "center" }}>
            {mesaj}
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={label}>Ad Soyad</label>
          <input value={ad} onChange={e => setAd(e.target.value)} type="text" placeholder="Adınız Soyadınız" style={input} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={label}>E-posta</label>
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="ornek@mail.com" style={input} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={label}>Telefon</label>
          <input value={telefon} onChange={e => setTelefon(e.target.value)} type="tel" placeholder="0555 123 45 67" style={input} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={label}>Şifre</label>
          <input value={sifre} onChange={e => setSifre(e.target.value)} type="password" placeholder="En az 6 karakter" style={input} />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={label}>Şifre Tekrar</label>
          <input value={sifre2} onChange={e => setSifre2(e.target.value)} type="password" placeholder="Şifrenizi tekrar girin" style={input} />
        </div>

        <div style={{ marginBottom: 24, display: "flex", alignItems: "flex-start", gap: 10 }}>
          <input type="checkbox" style={{ marginTop: 2, accentColor: "#E8845A", width: 16, height: 16, flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: "#5C3D2E", opacity: 0.65, lineHeight: 1.5 }}>
            <a href="#" style={{ color: "#E8845A", textDecoration: "none", fontWeight: 600 }}>Kullanım koşullarını</a> ve{" "}
            <a href="#" style={{ color: "#E8845A", textDecoration: "none", fontWeight: 600 }}>Gizlilik politikasını</a> okudum, kabul ediyorum.
          </span>
        </div>

        <button onClick={handleUyeOl} disabled={yukleniyor} style={{ width: "100%", background: yukleniyor ? "#ccc" : "#E8845A", color: "white", border: "none", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          {yukleniyor ? "Kaydediliyor..." : "Üye Ol 🐾"}
        </button>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#5C3D2E", opacity: 0.6 }}>
          Zaten hesabın var mı?{" "}
          <a href="/giris" style={{ color: "#E8845A", fontWeight: 700, textDecoration: "none" }}>Giriş Yap</a>
        </div>

      </div>
    </main>
  );
}