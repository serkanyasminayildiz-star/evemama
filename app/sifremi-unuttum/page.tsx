"use client";
import Link from "next/link";
import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function SifremiUnuttum() {
  const [email, setEmail] = useState("");
  const [mesaj, setMesaj] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [gonderildi, setGonderildi] = useState(false);

  const handleGonder = async () => {
    if (!email.trim()) { setMesaj("Lütfen e-posta adresini gir."); return; }
    setYukleniyor(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/sifre-yenile`,
      });
      if (error) {
        setMesaj("Hata: " + error.message);
      } else {
        // Güvenlik: e-posta kayıtlı olmasa da aynı mesaj (kullanıcı sızdırma önlemi).
        setGonderildi(true);
        setMesaj("✅ Eğer bu e-posta kayıtlıysa, şifre sıfırlama bağlantısı gönderildi. Gelen kutunu (ve spam klasörünü) kontrol et.");
      }
    } catch (err) {
      console.error("[sifremi-unuttum] resetPasswordForEmail:", err);
      setMesaj("Hata: Sunucuya ulaşılamadı. İnternet bağlantını kontrol edip tekrar dene.");
    } finally {
      setYukleniyor(false);
    }
  };

  const input = { width: "100%", padding: "12px 16px", border: "2px solid #E8D5B7", borderRadius: 12, fontSize: 14, outline: "none", fontFamily: "inherit", color: "#5C3D2E", background: "white", boxSizing: "border-box" as const };
  const label = { fontSize: 13, fontWeight: 600, color: "#5C3D2E", display: "block", marginBottom: 6 };

  return (
    <main style={{ minHeight: "100vh", background: "#FDF6EE", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", padding: 20 }}>
      <div style={{ background: "white", borderRadius: 24, padding: "48px 40px", width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(92,61,46,0.1)" }}>

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 28, fontWeight: 700, color: "#5C3D2E" }}>
            evemama<span style={{ color: "#E8845A", fontStyle: "italic" }}>.net</span>
          </div>
          <div style={{ fontSize: 16, color: "#5C3D2E", opacity: 0.6, marginTop: 8 }}>Şifreni sıfırla</div>
        </div>

        {mesaj && (
          <div style={{ background: mesaj.includes("✅") ? "#E8F5E9" : "#FFEBEE", color: mesaj.includes("✅") ? "#2E7D32" : "#C62828", padding: "12px 16px", borderRadius: 12, marginBottom: 20, fontSize: 14, textAlign: "center", lineHeight: 1.5 }}>
            {mesaj}
          </div>
        )}

        {!gonderildi ? (
          <>
            <div style={{ fontSize: 13, color: "#5C3D2E", opacity: 0.7, marginBottom: 16, lineHeight: 1.6 }}>
              Hesabının e-posta adresini gir; sana şifreni yenilemen için bir bağlantı gönderelim.
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={label}>E-posta</label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="ornek@mail.com" style={input} onKeyDown={e => e.key === "Enter" && !yukleniyor && handleGonder()} />
            </div>
            <button onClick={handleGonder} disabled={yukleniyor} style={{ width: "100%", background: yukleniyor ? "#ccc" : "#E8845A", color: "white", border: "none", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 700, cursor: yukleniyor ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
              {yukleniyor ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}
            </button>
          </>
        ) : (
          <div style={{ fontSize: 13, color: "#5C3D2E", opacity: 0.7, textAlign: "center", lineHeight: 1.6 }}>
            Bağlantı gelmediyse birkaç dakika bekleyip spam klasörünü kontrol et.
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#5C3D2E", opacity: 0.6 }}>
          <Link href="/giris" style={{ color: "#E8845A", fontWeight: 700, textDecoration: "none" }}>← Girişe dön</Link>
        </div>

      </div>
    </main>
  );
}
