"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Dagitim = { tarih: string; barinak_adi: string | null; sehir: string | null; video_url: string | null; kopek_sayisi: number | null };
type KumbaraData = {
  guncelKumbara: number; toplamKopek: number; toplamOgun: number; toplamBarinak: number;
  katkiSayisi: number; sonDagitim: Dagitim | null; tesekkurIsimleri: string[];
};

export default function KumbaraWidget() {
  const [data, setData] = useState<KumbaraData | null>(null);
  const [gosterilen, setGosterilen] = useState(0); // count-up animasyonu için

  useEffect(() => {
    let iptal = false;
    fetch("/api/kumbara").then(r => r.json()).then((d: KumbaraData) => { if (!iptal) setData(d); }).catch(() => {});
    return () => { iptal = true; };
  }, []);

  // Tutar 0'dan hedefe count-up (requestAnimationFrame — Date.now kullanmadan).
  useEffect(() => {
    if (!data || data.guncelKumbara <= 0) return; // 0 ise gösterilen zaten 0 (initial); animasyona gerek yok
    const hedef = data.guncelKumbara;
    let raf = 0; let baslangic = 0;
    const tik = (t: number) => {
      if (!baslangic) baslangic = t;
      const p = Math.min(1, (t - baslangic) / 1100);
      setGosterilen(hedef * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tik); else setGosterilen(hedef);
    };
    raf = requestAnimationFrame(tik);
    return () => cancelAnimationFrame(raf);
  }, [data]);

  if (!data) return null; // yüklenene kadar boşluk (hero altı, LCP-kritik değil)

  const { toplamKopek, toplamBarinak, sonDagitim, tesekkurIsimleri } = data;
  const hicDagitimYok = toplamBarinak === 0;
  const tl = (n: number) => "₺" + Math.round(n).toLocaleString("tr-TR");

  return (
    <section style={{ maxWidth: 1100, margin: "0 auto", padding: "8px 14px 44px" }}>
      <style>{`@keyframes kumbaraKay { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .kumbara-track { display: inline-flex; gap: 28px; padding-left: 28px; animation: kumbaraKay 40s linear infinite; }
        @media (max-width: 768px){ .kumbara-grid { grid-template-columns: 1fr !important; } .kumbara-card { padding: 22px 18px !important; } }`}</style>

      <div className="kumbara-card" style={{ background: "linear-gradient(135deg,#FFFBF5,#EFF9F0)", border: "2px solid #BFE0C2", borderRadius: 26, padding: "28px 32px", boxShadow: "0 10px 30px rgba(46,125,50,0.07)" }}>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#E1F3E4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>🐾</div>
          <div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 21, fontWeight: 700, color: "#2E7D32" }}>Pati Kumbarası</div>
            <div style={{ fontSize: 13.5, color: "#5C3D2E", opacity: 0.75 }}>{"Her alışverişin %5'ini BİZ karşılıyoruz — sokak ve barınak köpeklerine mama (sana ekstra ücret yok)"}</div>
          </div>
        </div>

        <div className="kumbara-grid" style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 24, alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontFamily: "Georgia, serif", fontSize: 40, fontWeight: 700, color: "#2E7D32", lineHeight: 1 }}>{tl(gosterilen)}</span>
              <span style={{ fontSize: 13, color: "#5C3D2E", opacity: 0.7 }}>bu hafta biriken</span>
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 7, marginTop: 14, background: "white", borderRadius: 50, padding: "7px 14px", fontSize: 12.5, fontWeight: 700, color: "#2E7D32", border: "1px solid #BFE0C2" }}>
              📅 Bu pazar barınağa gidiyor, videosu yayınlanacak
            </div>
            {sonDagitim?.video_url && (
              <a href={sonDagitim.video_url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, fontSize: 13, fontWeight: 700, color: "#E8845A", textDecoration: "none" }}>
                ▶️ Geçen pazar: {sonDagitim.barinak_adi || "barınak"}{sonDagitim.kopek_sayisi ? ` — ${sonDagitim.kopek_sayisi} köpek` : ""}
              </a>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {hicDagitimYok ? (
              <div style={{ gridColumn: "1 / -1", background: "white", borderRadius: 14, padding: "16px", textAlign: "center", border: "1px solid #EADfce" }}>
                <div style={{ fontSize: 13, color: "#5C3D2E", lineHeight: 1.55 }}>İlk barınak ziyareti <strong>önümüzdeki pazar</strong> — ilk video yolda! 🐕</div>
              </div>
            ) : (
              <>
                <div style={{ background: "white", borderRadius: 14, padding: "14px 10px", textAlign: "center" }}>
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 24, fontWeight: 700, color: "#E8845A" }}>{toplamKopek.toLocaleString("tr-TR")}</div>
                  <div style={{ fontSize: 11.5, color: "#5C3D2E", opacity: 0.7 }}>köpek beslendi</div>
                </div>
                <div style={{ background: "white", borderRadius: 14, padding: "14px 10px", textAlign: "center" }}>
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 24, fontWeight: 700, color: "#E8845A" }}>{toplamBarinak}</div>
                  <div style={{ fontSize: 11.5, color: "#5C3D2E", opacity: 0.7 }}>barınak ziyareti</div>
                </div>
              </>
            )}
          </div>
        </div>

        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #DDEEDD" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#5C3D2E", opacity: 0.6, marginBottom: 8 }}>💚 Alışverişiyle bir patiyi doyuran dostlarımıza teşekkürler</div>
          {tesekkurIsimleri.length > 0 ? (
            <div style={{ overflow: "hidden", whiteSpace: "nowrap", WebkitMaskImage: "linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent)", maskImage: "linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent)" }}>
              <div className="kumbara-track">
                {[...tesekkurIsimleri, ...tesekkurIsimleri].map((isim, i) => (
                  <span key={i} style={{ fontSize: 13, fontWeight: 700, color: "#2E7D32", flexShrink: 0 }}>🐾 {isim}</span>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: "#5C3D2E", opacity: 0.7 }}>{"İlk teşekkür senin olabilir — ödeme sırasında kutucuğu işaretle 🐾"}</div>
          )}
        </div>

        <Link href="/kumbara" style={{ display: "block", textAlign: "center", marginTop: 18, background: "#2E7D32", color: "white", borderRadius: 14, padding: "13px", fontSize: 14.5, fontWeight: 700, textDecoration: "none" }}>
          Hikaye, videolar ve dağıtımlar →
        </Link>
      </div>
    </section>
  );
}
