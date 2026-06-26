"use client";
import { useState, useEffect } from "react";

const ADMIN_SIFRE = "evemama2025";

type Kayit = {
  email: string; ad: string; telefon: string; toplam: number;
  sebep: string; paymentStatus: string; urunOzet: string; tarih: string; deneme: number;
};
type Sebep = { sebep: string; adet: number; tutar: number };
type Ozet = { musteri: number; toplamKayip: number; toplamDeneme: number; sebepler: Sebep[] };

export default function BasarisizOdemeler() {
  const [kayitlar, setKayitlar] = useState<Kayit[]>([]);
  const [ozet, setOzet] = useState<Ozet | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState("");
  const [arama, setArama] = useState("");

  useEffect(() => {
    fetch("/api/admin/basarisiz-odemeler", { headers: { Authorization: `Bearer ${ADMIN_SIFRE}` } })
      .then((r) => r.json())
      .then((d) => { if (d.error) setHata(d.error); else { setKayitlar(d.kayitlar || []); setOzet(d.ozet || null); } })
      .catch(() => setHata("Başarısız ödemeler yüklenemedi"))
      .finally(() => setYukleniyor(false));
  }, []);

  const tr = (n: number) => new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  const filtreli = kayitlar.filter((k) => {
    const q = arama.toLowerCase().trim();
    return !q || k.email.toLowerCase().includes(q) || (k.ad || "").toLowerCase().includes(q);
  });

  const inputStyle = { padding: "11px 14px", border: "2px solid #E8D5B7", borderRadius: 10, fontSize: 14, outline: "none", fontFamily: "inherit", color: "#5C3D2E", background: "white" };
  const kart = { background: "white", borderRadius: 16, padding: "18px 22px", boxShadow: "0 4px 16px rgba(92,61,46,0.06)", flex: 1, minWidth: 180 };

  return (
    <div>
      <h1 style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700, color: "#5C3D2E", marginBottom: 4 }}>
        Başarısız Ödemeler <span style={{ fontSize: 14, fontWeight: 400, opacity: 0.6 }}>{ozet?.musteri ?? 0} müşteri</span>
      </h1>
      <p style={{ fontSize: 13, color: "#5C3D2E", opacity: 0.6, marginBottom: 20 }}>
        Ödemeye başlayıp banka/kart tarafında BAŞARISIZ olan denemeler (3DS reddi, yetersiz bakiye vb.). Aynı müşterinin tekrar denemeleri tek satırda toplanır.
      </p>

      {/* Özet kartları */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginBottom: 20 }}>
        <div style={{ ...kart, borderLeft: "4px solid #C62828" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#5C3D2E", opacity: 0.5, textTransform: "uppercase" }}>Tahmini Kayıp Ciro</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#C62828", marginTop: 4 }}>₺{tr(ozet?.toplamKayip ?? 0)}</div>
        </div>
        <div style={kart}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#5C3D2E", opacity: 0.5, textTransform: "uppercase" }}>Etkilenen Müşteri</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#5C3D2E", marginTop: 4 }}>{ozet?.musteri ?? 0}</div>
        </div>
        <div style={kart}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#5C3D2E", opacity: 0.5, textTransform: "uppercase" }}>Toplam Deneme</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#5C3D2E", marginTop: 4 }}>{ozet?.toplamDeneme ?? 0}</div>
        </div>
      </div>

      {/* Sebep dökümü */}
      {ozet && ozet.sebepler.length > 0 && (
        <div style={{ background: "white", borderRadius: 16, padding: 18, marginBottom: 20, boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#5C3D2E", marginBottom: 12 }}>Sebep Dökümü (en çok kayba yol açan)</div>
          {ozet.sebepler.map((s, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: i < ozet.sebepler.length - 1 ? "1px solid #F8F0E3" : "none" }}>
              <span style={{ fontSize: 13, color: "#5C3D2E", flex: 1 }}>{s.sebep}</span>
              <span style={{ fontSize: 13, color: "#5C3D2E", opacity: 0.7, whiteSpace: "nowrap" }}>{s.adet} müşteri · <strong style={{ color: "#C62828" }}>₺{tr(s.tutar)}</strong></span>
            </div>
          ))}
        </div>
      )}

      <input value={arama} onChange={(e) => setArama(e.target.value)} placeholder="🔍 İsim veya e-posta ara..." style={{ ...inputStyle, width: "100%", maxWidth: 360, marginBottom: 16 }} />

      <div style={{ background: "white", borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
        {yukleniyor ? (
          <div style={{ padding: 40, textAlign: "center", color: "#5C3D2E", opacity: 0.6 }}>Yükleniyor...</div>
        ) : hata ? (
          <div style={{ padding: 40, textAlign: "center", color: "#C62828" }}>⚠️ {hata}</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #F3E4CC" }}>
                {["MÜŞTERİ", "E-POSTA", "SEPET", "TUTAR", "DENEME", "SEBEP", "TARİH"].map((h) => (
                  <th key={h} style={{ padding: "12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#5C3D2E", opacity: 0.5, textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtreli.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: "#5C3D2E", opacity: 0.5 }}>Başarısız ödeme kaydı yok.</td></tr>
              ) : filtreli.map((k, idx) => (
                <tr key={k.email + idx} style={{ borderBottom: "1px solid #F8F0E3" }}>
                  <td style={{ padding: "12px", fontWeight: 700, color: "#5C3D2E", fontSize: 14 }}>{k.ad || "—"}</td>
                  <td style={{ padding: "12px", fontSize: 13, color: "#5C3D2E" }}>{k.email}</td>
                  <td style={{ padding: "12px", fontSize: 12, color: "#5C3D2E", opacity: 0.8, maxWidth: 220 }}>{k.urunOzet || "—"}</td>
                  <td style={{ padding: "12px", fontSize: 13, fontWeight: 700, color: "#5C3D2E" }}>₺{tr(k.toplam)}</td>
                  <td style={{ padding: "12px" }}><span style={{ background: "#FFF3E0", color: "#E65100", padding: "3px 10px", borderRadius: 50, fontSize: 12, fontWeight: 700 }}>{k.deneme}</span></td>
                  <td style={{ padding: "12px", fontSize: 12, color: "#C62828", maxWidth: 200 }}>{k.sebep}</td>
                  <td style={{ padding: "12px", fontSize: 13, color: "#5C3D2E", opacity: 0.7 }}>{k.tarih ? new Date(k.tarih).toLocaleDateString("tr-TR") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p style={{ fontSize: 12, color: "#5C3D2E", opacity: 0.5, textAlign: "center", marginTop: 14 }}>
        💡 Yüksek tutarlı kart reddi çoksa: havale/EFT&apos;yi öne çıkar, taksit veya kapıda ödeme ekle.
      </p>
    </div>
  );
}
