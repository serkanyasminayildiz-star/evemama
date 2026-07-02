"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Abonelik = {
  id: number;
  urun_id: number;
  urun_adi: string | null;
  urun_slug: string | null;
  cadence_gun: number;
  indirim_yuzde: number;
  sonraki_tarih: string;
};

export default function Aboneliklerim() {
  const [token, setToken] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [abonelikler, setAbonelikler] = useState<Abonelik[]>([]);
  const [iptalEdilen, setIptalEdilen] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const t = session?.access_token || null;
      setToken(t);
      if (!t) { setYukleniyor(false); return; }
      try {
        const res = await fetch("/api/abonelik", { headers: { Authorization: `Bearer ${t}` } });
        const d = await res.json();
        setAbonelikler(d.abonelikler || []);
      } catch { /* liste alınamazsa boş gösterilir */ }
      setYukleniyor(false);
    })();
  }, []);

  const iptalEt = async (id: number) => {
    if (!token) return;
    setIptalEdilen(id);
    try {
      const res = await fetch(`/api/abonelik?id=${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setAbonelikler(prev => prev.filter(a => a.id !== id));
    } catch { /* sessiz */ }
    setIptalEdilen(null);
  };

  return (
    <main style={{ minHeight: "100vh", background: "#FDF6EE", fontFamily: "sans-serif" }}>
      <header style={{ background: "white", padding: "16px 24px", borderBottom: "1px solid #E8D5B7", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100 }}>
        <Link href="/" style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, color: "#5C3D2E", textDecoration: "none" }}>
          evemama<span style={{ color: "#E8845A", fontStyle: "italic" }}>.net</span>
        </Link>
        <Link href="/" style={{ fontSize: 13, color: "#E8845A", textDecoration: "none", fontWeight: 600 }}>← Ana Sayfa</Link>
      </header>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 20px 64px" }}>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700, color: "#5C3D2E", marginBottom: 6 }}>🔄 Aboneliklerim</h1>
        <p style={{ fontSize: 14, color: "#5C3D2E", opacity: 0.6, marginBottom: 28 }}>Düzenli teslimat aboneliklerin — her dönem %10 indirim ve hatırlatma.</p>

        {yukleniyor ? (
          <div style={{ textAlign: "center", padding: "48px 0", fontSize: 32 }}>⏳</div>
        ) : !token ? (
          <div style={{ background: "white", borderRadius: 20, padding: "40px 28px", textAlign: "center", boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
            <div style={{ fontSize: 15, color: "#5C3D2E", marginBottom: 20 }}>Aboneliklerinizi görmek için giriş yapın.</div>
            <Link href="/giris?returnUrl=/aboneliklerim" style={{ background: "#E8845A", color: "white", padding: "12px 28px", borderRadius: 50, textDecoration: "none", fontWeight: 700, fontSize: 14 }}>Giriş Yap →</Link>
          </div>
        ) : abonelikler.length === 0 ? (
          <div style={{ background: "white", borderRadius: 20, padding: "40px 28px", textAlign: "center", boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🐾</div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: "#5C3D2E", marginBottom: 8 }}>Henüz aboneliğiniz yok</div>
            <div style={{ fontSize: 14, color: "#5C3D2E", opacity: 0.6, marginBottom: 20 }}>Bir ürün sayfasından düzenli teslimata abone olun, %10 indirim kazanın.</div>
            <Link href="/urunler" style={{ background: "#E8845A", color: "white", padding: "12px 28px", borderRadius: 50, textDecoration: "none", fontWeight: 700, fontSize: 14 }}>Ürünlere Göz At →</Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {abonelikler.map(a => (
              <div key={a.id} style={{ background: "white", borderRadius: 16, padding: "18px 20px", boxShadow: "0 4px 16px rgba(92,61,46,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontWeight: 700, color: "#5C3D2E", fontSize: 15, marginBottom: 6 }}>
                    {a.urun_slug ? (
                      <Link href={`/urun/${a.urun_slug}`} style={{ color: "#5C3D2E", textDecoration: "none" }}>{a.urun_adi || "Ürün"}</Link>
                    ) : (a.urun_adi || "Ürün")}
                  </div>
                  <div style={{ fontSize: 13, color: "#5C3D2E", opacity: 0.7, lineHeight: 1.6 }}>
                    🔄 Her {Math.max(1, Math.round(a.cadence_gun / 7))} haftada bir &nbsp;·&nbsp; %{a.indirim_yuzde} indirim<br />
                    📅 Sonraki hatırlatma: {new Date(a.sonraki_tarih).toLocaleDateString("tr-TR")}
                  </div>
                </div>
                <button onClick={() => iptalEt(a.id)} disabled={iptalEdilen === a.id}
                  style={{ background: "none", border: "1.5px solid #E8D5B7", color: "#C62828", borderRadius: 10, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: iptalEdilen === a.id ? "not-allowed" : "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                  {iptalEdilen === a.id ? "..." : "İptal Et"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
