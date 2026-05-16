"use client";
import type { CSSProperties } from "react";
import { supabase } from "../../../lib/supabase";

type Kupon = {
  id: number | string;
  kod: string;
  indirim_tipi: "yuzde" | "tl" | string;
  indirim_degeri: number;
  min_sepet?: number | null;
  kullanim_sayisi?: number | null;
  kullanim_limiti?: number | null;
  bitis_tarihi?: string | null;
  aktif?: boolean;
};

type YeniKupon = {
  kod: string;
  indirim_tipi: string;
  indirim_degeri: string;
  min_sepet: string;
  kullanim_limiti: string;
  bitis_tarihi: string;
};

type Props = {
  yeniKupon: YeniKupon;
  setYeniKupon: (k: YeniKupon) => void;
  kuponlar: Kupon[];
  kuponEkle: () => Promise<void> | void;
  kuponlariYukle: () => Promise<void> | void;
  goster: (mesaj: string) => void;
  s: CSSProperties;
  btn: (bg?: string, extra?: CSSProperties) => CSSProperties;
};

// Kuponlar — toggle/sil islemleri inline supabase cagrisi yapiyor;
// parent'tan kuponlariYukle + goster prop'lariyla state refresh.
export default function Kuponlar({ yeniKupon, setYeniKupon, kuponlar, kuponEkle, kuponlariYukle, goster, s, btn }: Props) {
  return (
    <div>
      <h1 style={{ fontFamily: "Georgia,serif", fontSize: 24, fontWeight: 700, color: "#2C1A0E", marginBottom: 20 }}>Kupon Yönetimi</h1>
      <div style={{ background: "white", borderRadius: 18, padding: 22, marginBottom: 16, boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
        <h2 style={{ fontFamily: "Georgia,serif", fontSize: 15, fontWeight: 700, color: "#2C1A0E", marginBottom: 14 }}>➕ Yeni Kupon Oluştur</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <div><label style={{ fontSize: 11, fontWeight: 700, color: "#5C3D2E", opacity: 0.6, display: "block", marginBottom: 4 }}>KOD *</label><input type="text" autoComplete="off" placeholder="INDIRIM20" value={yeniKupon.kod} onChange={e => setYeniKupon({ ...yeniKupon, kod: e.target.value.toUpperCase() })} style={s} /></div>
          <div><label style={{ fontSize: 11, fontWeight: 700, color: "#5C3D2E", opacity: 0.6, display: "block", marginBottom: 4 }}>İNDİRİM TİPİ</label><select value={yeniKupon.indirim_tipi} onChange={e => setYeniKupon({ ...yeniKupon, indirim_tipi: e.target.value })} style={s}><option value="yuzde">Yüzde (%)</option><option value="tl">Sabit TL</option></select></div>
          <div><label style={{ fontSize: 11, fontWeight: 700, color: "#5C3D2E", opacity: 0.6, display: "block", marginBottom: 4 }}>DEĞER *</label><input type="number" placeholder={yeniKupon.indirim_tipi === "yuzde" ? "20" : "50"} value={yeniKupon.indirim_degeri} onChange={e => setYeniKupon({ ...yeniKupon, indirim_degeri: e.target.value })} style={s} /></div>
          <div><label style={{ fontSize: 11, fontWeight: 700, color: "#5C3D2E", opacity: 0.6, display: "block", marginBottom: 4 }}>MİN. SEPET ₺</label><input type="number" placeholder="0" value={yeniKupon.min_sepet} onChange={e => setYeniKupon({ ...yeniKupon, min_sepet: e.target.value })} style={s} /></div>
          <div><label style={{ fontSize: 11, fontWeight: 700, color: "#5C3D2E", opacity: 0.6, display: "block", marginBottom: 4 }}>KULLANIM LİMİTİ</label><input type="number" value={yeniKupon.kullanim_limiti} onChange={e => setYeniKupon({ ...yeniKupon, kullanim_limiti: e.target.value })} style={s} /></div>
          <div><label style={{ fontSize: 11, fontWeight: 700, color: "#5C3D2E", opacity: 0.6, display: "block", marginBottom: 4 }}>BİTİŞ TARİHİ</label><input type="date" value={yeniKupon.bitis_tarihi} onChange={e => setYeniKupon({ ...yeniKupon, bitis_tarihi: e.target.value })} style={s} /></div>
        </div>
        <div style={{ marginTop: 12 }}><button onClick={kuponEkle} style={btn()}>Kupon Oluştur →</button></div>
      </div>
      <div style={{ background: "white", borderRadius: 18, padding: 22, boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ background: "#FAF5EF" }}>
            {["Kod", "İndirim", "Min Sepet", "Kullanım", "Bitiş", "Durum", ""].map(h => <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#5C3D2E", opacity: 0.5, textTransform: "uppercase" }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {kuponlar.map(k => <tr key={k.id} style={{ borderBottom: "1px solid #F0E8E0" }}>
              <td style={{ padding: "12px", fontWeight: 700, color: "#E8845A", fontFamily: "monospace", fontSize: 15 }}>{k.kod}</td>
              <td style={{ padding: "12px", fontSize: 14, fontWeight: 700 }}>{k.indirim_degeri}{k.indirim_tipi === "yuzde" ? "%" : "₺"}</td>
              <td style={{ padding: "12px", fontSize: 13 }}>₺{k.min_sepet || 0}</td>
              <td style={{ padding: "12px", fontSize: 13 }}>{k.kullanim_sayisi || 0}/{k.kullanim_limiti}</td>
              <td style={{ padding: "12px", fontSize: 12, opacity: 0.6 }}>{k.bitis_tarihi ? new Date(k.bitis_tarihi).toLocaleDateString("tr-TR") : "Süresiz"}</td>
              <td style={{ padding: "12px" }}><span style={{ background: k.aktif ? "#E8F5E9" : "#FFEBEE", color: k.aktif ? "#2E7D32" : "#C62828", padding: "3px 9px", borderRadius: 50, fontSize: 11, fontWeight: 700 }}>{k.aktif ? "Aktif" : "Pasif"}</span></td>
              <td style={{ padding: "12px" }}>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={async () => { await supabase.from("kuponlar").update({ aktif: !k.aktif }).eq("id", k.id); kuponlariYukle(); goster("✅ Güncellendi"); }} style={{ background: "#FDF6EE", border: "2px solid #E8D5B7", borderRadius: 8, padding: "5px 10px", fontSize: 11, cursor: "pointer", color: "#5C3D2E" }}>{k.aktif ? "Pasife Al" : "Aktife Al"}</button>
                  <button onClick={async () => { await supabase.from("kuponlar").delete().eq("id", k.id); kuponlariYukle(); goster("✅ Silindi"); }} style={{ background: "#FFEBEE", border: "none", borderRadius: 8, padding: "5px 9px", fontSize: 13, cursor: "pointer", color: "#C62828" }}>🗑️</button>
                </div>
              </td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
