"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function SifreYenile() {
  const [asama, setAsama] = useState<"kontrol" | "hazir" | "gecersiz">("kontrol");
  const [sifre, setSifre] = useState("");
  const [sifre2, setSifre2] = useState("");
  const [mesaj, setMesaj] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);

  useEffect(() => {
    // Recovery bağlantısı: supabase-js (detectSessionInUrl) URL'deki token'ı
    // işleyip oturum kurar + PASSWORD_RECOVERY olayını tetikler. Oturum varsa
    // yeni şifre formu; yoksa (süresi dolmuş/geçersiz bağlantı) uyarı gösterilir.
    let cozuldu = false;
    const hazirla = () => { if (!cozuldu) { cozuldu = true; setAsama("hazir"); } };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) hazirla();
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session) hazirla(); });
    const zamanlayici = setTimeout(() => { if (!cozuldu) setAsama("gecersiz"); }, 3000);
    return () => { subscription.unsubscribe(); clearTimeout(zamanlayici); };
  }, []);

  const handleYenile = async () => {
    if (sifre.length < 6) { setMesaj("Şifre en az 6 karakter olmalı."); return; }
    if (sifre !== sifre2) { setMesaj("Şifreler eşleşmiyor!"); return; }
    setYukleniyor(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: sifre });
      if (error) {
        setMesaj("Hata: " + error.message);
      } else {
        setMesaj("✅ Şifren güncellendi! Giriş sayfasına yönlendiriliyorsun...");
        setTimeout(() => { window.location.href = "/giris"; }, 1800);
      }
    } catch (err) {
      console.error("[sifre-yenile] updateUser:", err);
      setMesaj("Hata: Sunucuya ulaşılamadı. Tekrar dene.");
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
          <div style={{ fontSize: 16, color: "#5C3D2E", opacity: 0.6, marginTop: 8 }}>Yeni şifre belirle</div>
        </div>

        {asama === "kontrol" && (
          <div style={{ textAlign: "center", padding: "24px 0", fontSize: 14, color: "#5C3D2E", opacity: 0.7 }}>⏳ Bağlantı doğrulanıyor...</div>
        )}

        {asama === "gecersiz" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ background: "#FFEBEE", color: "#C62828", padding: "12px 16px", borderRadius: 12, marginBottom: 20, fontSize: 14, lineHeight: 1.5 }}>
              Bağlantı geçersiz veya süresi dolmuş. Lütfen yeniden şifre sıfırlama isteği gönder.
            </div>
            <Link href="/sifremi-unuttum" style={{ color: "#E8845A", fontWeight: 700, textDecoration: "none", fontSize: 14 }}>Yeni bağlantı iste →</Link>
          </div>
        )}

        {asama === "hazir" && (
          <>
            {mesaj && (
              <div style={{ background: mesaj.includes("✅") ? "#E8F5E9" : "#FFEBEE", color: mesaj.includes("✅") ? "#2E7D32" : "#C62828", padding: "12px 16px", borderRadius: 12, marginBottom: 20, fontSize: 14, textAlign: "center", lineHeight: 1.5 }}>
                {mesaj}
              </div>
            )}
            <div style={{ marginBottom: 16 }}>
              <label style={label}>Yeni Şifre</label>
              <input value={sifre} onChange={e => setSifre(e.target.value)} type="password" placeholder="En az 6 karakter" style={input} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={label}>Yeni Şifre (Tekrar)</label>
              <input value={sifre2} onChange={e => setSifre2(e.target.value)} type="password" placeholder="Şifreni tekrar gir" style={input} onKeyDown={e => e.key === "Enter" && !yukleniyor && handleYenile()} />
            </div>
            <button onClick={handleYenile} disabled={yukleniyor} style={{ width: "100%", background: yukleniyor ? "#ccc" : "#E8845A", color: "white", border: "none", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 700, cursor: yukleniyor ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
              {yukleniyor ? "Güncelleniyor..." : "Şifreyi Güncelle 🐾"}
            </button>
          </>
        )}

      </div>
    </main>
  );
}
