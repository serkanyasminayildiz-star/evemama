"use client";
import type { CSSProperties } from "react";

type Kategori = {
  id: number;
  ad: string;
  slug: string;
  ust_kategori_id?: number | null;
  sira?: number | null;
  aktif: boolean;
};

type YeniKategori = {
  ad: string;
  slug: string;
  ust_kategori_id: string;
  sira: string;
};

type Props = {
  kategoriler: Kategori[];
  yeniKategori: YeniKategori;
  setYeniKategori: (k: YeniKategori) => void;
  kategoriEkle: () => Promise<void> | void;
  kategoriAktifToggle: (id: number, aktif: boolean) => Promise<void> | void;
  kategoriSil: (id: number) => Promise<void> | void;
  setDuzenleKategori: (k: Kategori) => void;
  slugUret: (ad: string) => string;
  s: CSSProperties;
  btn: (bg?: string, extra?: CSSProperties) => CSSProperties;
};

export default function Kategoriler({ kategoriler, yeniKategori, setYeniKategori, kategoriEkle, kategoriAktifToggle, kategoriSil, setDuzenleKategori, slugUret, s, btn }: Props) {
  return (
    <div>
      <h1 style={{ fontFamily: "Georgia,serif", fontSize: 24, fontWeight: 700, color: "#2C1A0E", marginBottom: 20 }}>Kategoriler ({kategoriler.length})</h1>
      <div style={{ background: "white", borderRadius: 18, padding: 22, marginBottom: 16, boxShadow: "0 4px 16px rgba(92,61,46,0.06)", border: "2px solid #E8845A" }}>
        <h2 style={{ fontFamily: "Georgia,serif", fontSize: 15, fontWeight: 700, color: "#2C1A0E", marginBottom: 14 }}>➕ Yeni Kategori Ekle</h2>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#5C3D2E", opacity: 0.6, display: "block", marginBottom: 4 }}>KATEGORİ ADI *</label>
            <input type="text" autoComplete="off" placeholder="Örn: Kedi Maması" value={yeniKategori.ad}
              onChange={e => setYeniKategori({ ...yeniKategori, ad: e.target.value, slug: slugUret(e.target.value) })} style={s} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#5C3D2E", opacity: 0.6, display: "block", marginBottom: 4 }}>SLUG (URL)</label>
            <input type="text" autoComplete="off" placeholder="kedi-mamasi" value={yeniKategori.slug}
              onChange={e => setYeniKategori({ ...yeniKategori, slug: e.target.value })} style={s} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#5C3D2E", opacity: 0.6, display: "block", marginBottom: 4 }}>ÜST KATEGORİ</label>
            <select value={yeniKategori.ust_kategori_id} onChange={e => setYeniKategori({ ...yeniKategori, ust_kategori_id: e.target.value })} style={s}>
              <option value="">— Ana Kategori —</option>
              {kategoriler.filter(k => !k.ust_kategori_id).map(k => <option key={k.id} value={k.id}>{k.ad}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#5C3D2E", opacity: 0.6, display: "block", marginBottom: 4 }}>SIRA</label>
            <input type="number" value={yeniKategori.sira} onChange={e => setYeniKategori({ ...yeniKategori, sira: e.target.value })} style={s} />
          </div>
        </div>
        <button onClick={kategoriEkle} style={btn()}>✅ Kategori Ekle</button>
      </div>
      <div style={{ background: "white", borderRadius: 18, boxShadow: "0 4px 16px rgba(92,61,46,0.06)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#FAF5EF" }}>
              {["ID", "Kategori Adı", "Slug", "Üst Kategori", "Sıra", "Durum", "İşlem"].map(h => (
                <th key={h} style={{ padding: "12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#5C3D2E", opacity: 0.5, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {kategoriler.map(k => (
              <tr key={k.id} style={{ borderBottom: "1px solid #F0E8E0" }}
                onMouseEnter={e => e.currentTarget.style.background = "#FDFAF7"}
                onMouseLeave={e => e.currentTarget.style.background = "white"}>
                <td style={{ padding: "12px", fontSize: 11, opacity: 0.4 }}>{k.id}</td>
                <td style={{ padding: "12px", fontSize: 14, fontWeight: 600, paddingLeft: k.ust_kategori_id ? 28 : 12 }}>
                  {k.ust_kategori_id ? <span style={{ opacity: 0.4, marginRight: 4 }}>└</span> : null}{k.ad}
                </td>
                <td style={{ padding: "12px", fontSize: 12, opacity: 0.6, fontFamily: "monospace" }}>{k.slug}</td>
                <td style={{ padding: "12px", fontSize: 12, opacity: 0.6 }}>{kategoriler.find(u => u.id === k.ust_kategori_id)?.ad || "—"}</td>
                <td style={{ padding: "12px", fontSize: 12 }}>{k.sira}</td>
                <td style={{ padding: "12px" }}>
                  <button onClick={() => kategoriAktifToggle(k.id, k.aktif)}
                    style={{ background: k.aktif ? "#E8F5E9" : "#FFEBEE", color: k.aktif ? "#2E7D32" : "#C62828", border: "none", padding: "3px 10px", borderRadius: 50, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                    {k.aktif ? "Aktif" : "Pasif"}
                  </button>
                </td>
                <td style={{ padding: "12px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => setDuzenleKategori({ ...k })} style={{ background: "#FDF6EE", border: "2px solid #E8D5B7", borderRadius: 8, padding: "5px 10px", fontSize: 12, cursor: "pointer", fontWeight: 600, color: "#5C3D2E" }}>✏️ Düzenle</button>
                    <button onClick={() => kategoriSil(k.id)} style={{ background: "#FFEBEE", border: "none", borderRadius: 8, padding: "5px 9px", fontSize: 13, cursor: "pointer", color: "#C62828" }}>🗑️</button>
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
