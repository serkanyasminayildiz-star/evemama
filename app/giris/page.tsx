"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function GirisYap() {
  const [email, setEmail] = useState("");
  const [sifre, setSifre] = useState("");
  const [mesaj, setMesaj] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);

  const handleGiris = async () => {
    setYukleniyor(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: sifre });
    if (error) {
      setMesaj("Hata: E-posta veya şifre yanlış!");
    } else {
      setMesaj("✅ Giriş başarılı! Yönlendiriliyorsunuz...");
      setTimeout(() => { window.location.href = "/"; }, 1500);
    }
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
          <div style={{ fontSize: 16, color: "#5C3D2E", opacity: 0.6, marginTop: 8 }}>Hesabına giriş yap</div>
        </div>

        {mesaj && (
          <div style={{ background: mesaj.includes("✅") ? "#E8F5E9" : "#FFEBEE", color: mesaj.includes("✅") ? "#2E7D32" : "#C62828", padding: "12px 16px", borderRadius: 12, marginBottom: 20, fontSize: 14, textAlign: "center" }}>
            {mesaj}
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={label}>E-posta</label>
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="ornek@mail.com" style={input} />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label style={label}>Şifre</label>
          <input value={sifre} onChange={e => setSifre(e.target.value)} type="password" placeholder="••••••••" style={input} onKeyDown={e => e.key === "Enter" && handleGiris()} />
        </div>

        <div style={{ textAlign: "right", marginBottom: 24 }}>
          <a href="#" style={{ fontSize: 12, color: "#E8845A", textDecoration: "none", fontWeight: 600 }}>Şifremi unuttum</a>
        </div>

        <button onClick={handleGiris} disabled={yukleniyor} style={{ width: "100%", background: yukleniyor ? "#ccc" : "#E8845A", color: "white", border: "none", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          {yukleniyor ? "Giriş yapılıyor..." : "Giriş Yap 🐾"}
        </button>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#5C3D2E", opacity: 0.6 }}>
          Hesabın yok mu?{" "}
          <a href="/uye-ol" style={{ color: "#E8845A", fontWeight: 700, textDecoration: "none" }}>Üye Ol</a>
        </div>

      </div>
    </main>
  );
}