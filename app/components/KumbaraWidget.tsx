"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

// Sokak Dostları — KANIT (video) temelli anasayfa şeridi. Canlı ₺ sayacı YOK
// (ciro sızıntısı olmasın). İlk gerçek video gelene kadar TAMAMEN gizli: söz
// değil, kanıt. Dosya adı (KumbaraWidget) iç/geçmiş uyumu için korunmuştur.
type Dagitim = { tarih: string; barinak_adi: string | null; sehir: string | null; video_url: string | null; kopek_sayisi: number | null };
type Data = { toplamKopek: number; toplamOgun: number; toplamBarinak: number; sonDagitim: Dagitim | null; dagitimlar: Dagitim[] };

export default function KumbaraWidget() {
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    let iptal = false;
    fetch("/api/kumbara").then(r => r.json()).then((d: Data) => { if (!iptal) setData(d); }).catch(() => {});
    return () => { iptal = true; };
  }, []);

  // İlk video yayınlanana kadar hiç görünmez (kanıt-temelli duruş).
  const videolu = (data?.dagitimlar || []).filter(d => d.video_url);
  if (!data || videolu.length === 0) return null;

  const son = videolu[0];

  return (
    <section style={{ maxWidth: 1100, margin: "0 auto", padding: "8px 14px 44px" }}>
      <style>{`@media (max-width: 768px){ .sd-grid { grid-template-columns: 1fr !important; } }`}</style>

      <div style={{ background: "linear-gradient(135deg,#FFFBF5,#EFF9F0)", border: "2px solid #BFE0C2", borderRadius: 26, padding: "26px 30px", boxShadow: "0 10px 30px rgba(46,125,50,0.07)" }}>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#E1F3E4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>🐾</div>
          <div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 21, fontWeight: 700, color: "#2E7D32" }}>Sokak Dostları</div>
            <div style={{ fontSize: 13.5, color: "#5C3D2E", opacity: 0.75 }}>{"Gelirimizin %5'i ile sokak ve barınak köpeklerine mama veriyoruz — işte kanıtı 👇"}</div>
          </div>
        </div>

        <div className="sd-grid" style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 22, alignItems: "center" }}>
          {/* Son ziyaret videosu */}
          <a href={son.video_url || "#"} target="_blank" rel="noopener noreferrer" style={{ display: "flex", gap: 14, alignItems: "center", background: "white", borderRadius: 16, padding: "14px 16px", textDecoration: "none", color: "#5C3D2E" }}>
            <div style={{ width: 96, height: 68, borderRadius: 12, background: "#FDF6EE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid #E8D5B7" }}>
              <span style={{ fontSize: 28 }}>▶️</span>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#E8845A", marginBottom: 2 }}>SON ZİYARET</div>
              <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.3 }}>{son.barinak_adi || "Barınak"}{son.sehir ? ` · ${son.sehir}` : ""}</div>
              {son.kopek_sayisi ? <div style={{ fontSize: 12.5, opacity: 0.7 }}>{son.kopek_sayisi} köpek doydu 🐕</div> : null}
            </div>
          </a>

          {/* Kümülatif etki — yalnız SAYI (₺ yok) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ background: "white", borderRadius: 14, padding: "14px 10px", textAlign: "center" }}>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 24, fontWeight: 700, color: "#E8845A" }}>{data.toplamKopek.toLocaleString("tr-TR")}</div>
              <div style={{ fontSize: 11.5, color: "#5C3D2E", opacity: 0.7 }}>köpek beslendi</div>
            </div>
            <div style={{ background: "white", borderRadius: 14, padding: "14px 10px", textAlign: "center" }}>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 24, fontWeight: 700, color: "#E8845A" }}>{data.toplamBarinak}</div>
              <div style={{ fontSize: 11.5, color: "#5C3D2E", opacity: 0.7 }}>barınak ziyareti</div>
            </div>
          </div>
        </div>

        <Link href="/kumbara" style={{ display: "block", textAlign: "center", marginTop: 18, background: "#2E7D32", color: "white", borderRadius: 14, padding: "13px", fontSize: 14.5, fontWeight: 700, textDecoration: "none" }}>
          Tüm videolar ve hikaye →
        </Link>
      </div>
    </section>
  );
}
