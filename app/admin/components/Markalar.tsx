"use client";
import type { CSSProperties } from "react";

type Marka = { id: number; ad: string; slug: string; aktif: boolean };
type YeniMarka = { ad: string; slug: string };

type Props = {
  markalar: Marka[];
  yeniMarka: YeniMarka;
  setYeniMarka: (m: YeniMarka) => void;
  markaEkle: () => Promise<void> | void;
  markaAktifToggle: (id: number, aktif: boolean) => Promise<void> | void;
  markaSil: (id: number) => Promise<void> | void;
  setDuzenleMarka: (m: Marka) => void;
  slugUret: (ad: string) => string;
  s: CSSProperties;
  btn: (bg?: string, extra?: CSSProperties) => CSSProperties;
};

export default function Markalar({ markalar, yeniMarka, setYeniMarka, markaEkle, markaAktifToggle, markaSil, setDuzenleMarka, slugUret, s, btn }: Props) {
  return (
    <div>
      <h1 style={{ fontFamily: "Georgia,serif", fontSize: 24, fontWeight: 700, color: "#2C1A0E", marginBottom: 20 }}>Markalar ({markalar.length})</h1>
      <div style={{ background: "white", borderRadius: 18, padding: 22, marginBottom: 16, boxShadow: "0 4px 16px rgba(92,61,46,0.06)", border: "2px solid #E8845A" }}>
        <h2 style={{ fontFamily: "Georgia,serif", fontSize: 15, fontWeight: 700, color: "#2C1A0E", marginBottom: 14 }}>➕ Yeni Marka Ekle</h2>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr auto", gap: 10, alignItems: "flex-end" }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#5C3D2E", opacity: 0.6, display: "block", marginBottom: 4 }}>MARKA ADI *</label>
            <input type="text" autoComplete="off" placeholder="Örn: Royal Canin" value={yeniMarka.ad}
              onChange={e => setYeniMarka({ ...yeniMarka, ad: e.target.value, slug: slugUret(e.target.value) })} style={s} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#5C3D2E", opacity: 0.6, display: "block", marginBottom: 4 }}>SLUG (URL)</label>
            <input type="text" autoComplete="off" placeholder="royal-canin" value={yeniMarka.slug}
              onChange={e => setYeniMarka({ ...yeniMarka, slug: e.target.value })} style={s} />
          </div>
          <button onClick={markaEkle} style={{ ...btn(), padding: "12px 22px" }}>✅ Ekle</button>
        </div>
      </div>
      <div style={{ background: "white", borderRadius: 18, boxShadow: "0 4px 16px rgba(92,61,46,0.06)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#FAF5EF" }}>
              {["ID", "Marka Adı", "Slug", "Durum", "İşlem"].map(h => (
                <th key={h} style={{ padding: "12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#5C3D2E", opacity: 0.5, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {markalar.map(m => (
              <tr key={m.id} style={{ borderBottom: "1px solid #F0E8E0" }}
                onMouseEnter={e => e.currentTarget.style.background = "#FDFAF7"}
                onMouseLeave={e => e.currentTarget.style.background = "white"}>
                <td style={{ padding: "12px", fontSize: 11, opacity: 0.4 }}>{m.id}</td>
                <td style={{ padding: "12px", fontSize: 14, fontWeight: 600 }}>{m.ad}</td>
                <td style={{ padding: "12px", fontSize: 12, opacity: 0.6, fontFamily: "monospace" }}>{m.slug}</td>
                <td style={{ padding: "12px" }}>
                  <button onClick={() => markaAktifToggle(m.id, m.aktif)}
                    style={{ background: m.aktif ? "#E8F5E9" : "#FFEBEE", color: m.aktif ? "#2E7D32" : "#C62828", border: "none", padding: "3px 10px", borderRadius: 50, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                    {m.aktif ? "Aktif" : "Pasif"}
                  </button>
                </td>
                <td style={{ padding: "12px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => setDuzenleMarka({ ...m })} style={{ background: "#FDF6EE", border: "2px solid #E8D5B7", borderRadius: 8, padding: "5px 10px", fontSize: 12, cursor: "pointer", fontWeight: 600, color: "#5C3D2E" }}>✏️ Düzenle</button>
                    <button onClick={() => markaSil(m.id)} style={{ background: "#FFEBEE", border: "none", borderRadius: 8, padding: "5px 9px", fontSize: 13, cursor: "pointer", color: "#C62828" }}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
