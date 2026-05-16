"use client";
import type { CSSProperties, Dispatch, SetStateAction } from "react";
import { supabase } from "../../../lib/supabase";

type Soru = {
  id: number | string;
  ad: string;
  soru: string;
  cevap?: string | null;
  created_at: string;
  onaylandi: boolean;
};

type Props = {
  bekleyenSorular: Soru[];
  blogSorular: Soru[];
  cevaplar: Record<string | number, string>;
  setCevaplar: Dispatch<SetStateAction<Record<string | number, string>>>;
  blogSorulariYukle: () => Promise<void> | void;
  istatistikleriYukle: () => Promise<void> | void;
  goster: (mesaj: string) => void;
  btn: (bg?: string, extra?: CSSProperties) => CSSProperties;
};

export default function Blog({ bekleyenSorular, blogSorular, cevaplar, setCevaplar, blogSorulariYukle, istatistikleriYukle, goster, btn }: Props) {
  return (
    <div>
      <h1 style={{ fontFamily: "Georgia,serif", fontSize: 24, fontWeight: 700, color: "#2C1A0E", marginBottom: 20 }}>
        Blog Soruları {bekleyenSorular.length > 0 && <span style={{ background: "#E8845A", color: "white", borderRadius: 50, fontSize: 13, padding: "3px 12px", marginLeft: 10 }}>{bekleyenSorular.length} bekliyor</span>}
      </h1>
      {bekleyenSorular.length > 0 && (
        <div style={{ background: "white", borderRadius: 18, padding: 22, marginBottom: 20, boxShadow: "0 4px 16px rgba(92,61,46,0.06)", border: "2px solid #F4C09A" }}>
          <h2 style={{ fontFamily: "Georgia,serif", fontSize: 15, fontWeight: 700, color: "#2C1A0E", marginBottom: 16 }}>⏳ Bekleyen Sorular</h2>
          {bekleyenSorular.map(bs => (
            <div key={bs.id} style={{ background: "#FFF8E8", borderRadius: 14, padding: 18, marginBottom: 14, border: "1px solid #F4C09A" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <div><span style={{ fontWeight: 700, fontSize: 14, color: "#5C3D2E" }}>{bs.ad}</span><span style={{ fontSize: 11, opacity: 0.5, marginLeft: 8 }}>{new Date(bs.created_at).toLocaleDateString("tr-TR")}</span></div>
                <button onClick={async () => { await supabase.from("blog_sorular").delete().eq("id", bs.id); blogSorulariYukle(); goster("✅ Silindi"); }} style={{ background: "#FFEBEE", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 12, cursor: "pointer", color: "#C62828" }}>🗑️</button>
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#5C3D2E", marginBottom: 12 }}>❓ {bs.soru}</p>
              <div style={{ display: "flex", gap: 8 }}>
                <textarea placeholder="Cevap yazın..." value={cevaplar[bs.id] || ""} onChange={e => setCevaplar(prev => ({ ...prev, [bs.id]: e.target.value }))}
                  rows={3} style={{ flex: 1, padding: "10px 14px", border: "2px solid #E8D5B7", borderRadius: 10, fontSize: 13, outline: "none", fontFamily: "inherit", resize: "vertical" as const }} />
                <button onClick={async () => { const cevap = cevaplar[bs.id]; if (!cevap?.trim()) return; await supabase.from("blog_sorular").update({ cevap, onaylandi: true }).eq("id", bs.id); setCevaplar(prev => { const y = { ...prev }; delete y[bs.id]; return y; }); blogSorulariYukle(); istatistikleriYukle(); goster("✅ Cevap yayınlandı"); }}
                  disabled={!cevaplar[bs.id]?.trim()} style={{ ...btn(!cevaplar[bs.id]?.trim() ? "#ccc" : "#E8845A"), alignSelf: "flex-start" }}>
                  💾 Cevapla
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div style={{ background: "white", borderRadius: 18, padding: 22, boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
        <h2 style={{ fontFamily: "Georgia,serif", fontSize: 15, fontWeight: 700, color: "#2C1A0E", marginBottom: 16 }}>✅ Yayındaki Sorular ({blogSorular.filter(bs => bs.onaylandi).length})</h2>
        {blogSorular.filter(bs => bs.onaylandi).map(bs => (
          <div key={bs.id} style={{ background: "#F9FBF9", borderRadius: 14, padding: 16, marginBottom: 12, border: "1px solid #E8D5B7" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 13 }}>{bs.ad}</span>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={async () => { await supabase.from("blog_sorular").update({ onaylandi: false }).eq("id", bs.id); blogSorulariYukle(); goster("✅ Gizlendi"); }} style={{ background: "#FFF5F0", color: "#E8845A", border: "none", borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Gizle</button>
                <button onClick={async () => { await supabase.from("blog_sorular").delete().eq("id", bs.id); blogSorulariYukle(); istatistikleriYukle(); goster("✅ Silindi"); }} style={{ background: "#FFEBEE", border: "none", borderRadius: 8, padding: "4px 10px", fontSize: 11, cursor: "pointer", color: "#C62828" }}>🗑️</button>
              </div>
            </div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#5C3D2E", marginBottom: bs.cevap ? 8 : 0 }}>❓ {bs.soru}</p>
            {bs.cevap && <div style={{ background: "#FFF5F0", borderRadius: 10, padding: "10px 12px", borderLeft: "3px solid #E8845A", fontSize: 12, color: "#5C3D2E" }}>💬 {bs.cevap}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
