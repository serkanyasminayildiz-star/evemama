"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Dagitim = { tarih: string; tutar: number; barinak_adi: string | null; sehir: string | null; video_url: string | null; kopek_sayisi: number | null; ogun_sayisi: number | null; not_metni: string | null };
type KumbaraData = {
  guncelKumbara: number; toplamKopek: number; toplamOgun: number; toplamBarinak: number;
  katkiSayisi: number; sonDagitim: Dagitim | null; dagitimlar: Dagitim[]; tesekkurIsimleri: string[];
};

const tl = (n: number) => "₺" + Math.round(n || 0).toLocaleString("tr-TR");
const tarihFmt = (s: string) => { try { return new Date(s).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }); } catch { return s; } };

export default function KumbaraIcerik() {
  const [data, setData] = useState<KumbaraData | null>(null);
  useEffect(() => {
    let iptal = false;
    fetch("/api/kumbara").then(r => r.json()).then((d: KumbaraData) => { if (!iptal) setData(d); }).catch(() => {});
    return () => { iptal = true; };
  }, []);

  const dagitimlar = data?.dagitimlar || [];
  const videolu = dagitimlar.filter(d => d.video_url);
  const isimler = data?.tesekkurIsimleri || [];
  const hicEtki = (data?.toplamBarinak || 0) === 0;

  const kart = { background: "white", borderRadius: 18, padding: "20px 22px", border: "1px solid #E8D5B7" } as const;

  return (
    <main style={{ minHeight: "100vh", background: "#FDF6EE", fontFamily: "sans-serif", color: "#5C3D2E" }}>
      <header style={{ background: "white", borderBottom: "1px solid #E8D5B7", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 50 }}>
        <Link href="/" style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, color: "#5C3D2E", textDecoration: "none" }}>evemama<span style={{ color: "#E8845A", fontStyle: "italic" }}>.net</span></Link>
        <Link href="/urunler" style={{ color: "#E8845A", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>Ürünler →</Link>
      </header>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 20px 64px" }}>

        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 52 }}>🐾</div>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 30, fontWeight: 700, margin: "6px 0" }}>Pati Kumbarası</h1>
          <p style={{ fontSize: 16, opacity: 0.85, lineHeight: 1.6, maxWidth: 640, margin: "0 auto" }}>{"Sen dostuna mama al — biz sokaktaki dostuna verelim. Her alışverişin %5'ini KENDİ cebimizden, sokak ve barınak köpeklerine orijinal Royal Canin mama olarak bağışlıyoruz. Sana ekstra ücret yok."}</p>
        </div>

        <div style={{ background: "linear-gradient(135deg,#2E7D32,#43A047)", color: "white", borderRadius: 22, padding: "28px 24px", textAlign: "center", marginBottom: 18 }}>
          <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 4 }}>BU HAFTA KUMBARADA</div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 44, fontWeight: 700, lineHeight: 1 }}>{tl(data?.guncelKumbara || 0)}</div>
          {(data?.katkiSayisi || 0) > 0
            ? <div style={{ fontSize: 14, opacity: 0.92, marginTop: 10 }}>💚 {data?.katkiSayisi} dostumuz alışverişiyle destek oldu — teşekkürler!</div>
            : <div style={{ fontSize: 14, opacity: 0.92, marginTop: 10 }}>{"İlk patiyi senin alışverişin doyursun 🐾"}</div>}
        </div>

        {/* Haftalık döngü — şeffaflık (sıfırlama pazar dağıtımına bağlı) */}
        <div style={{ background: "white", border: "1px solid #E8D5B7", borderRadius: 14, padding: "12px 18px", marginBottom: 18, fontSize: 13, color: "#5C3D2E", lineHeight: 1.6, textAlign: "center" }}>
          🔄 Bu tutar bu haftaya ait. Her hafta biriken miktar <strong>her pazar barınağa verilip sıfırlanır</strong> — yeni hafta sıfırdan başlar.
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 36 }}>
          {[
            { s: hicEtki ? "—" : (data?.toplamKopek || 0).toLocaleString("tr-TR"), l: "köpek beslendi" },
            { s: hicEtki ? "—" : (data?.toplamOgun || 0).toLocaleString("tr-TR"), l: "öğün mama" },
            { s: hicEtki ? "—" : String(data?.toplamBarinak || 0), l: "barınak ziyareti" },
          ].map((m, i) => (
            <div key={i} style={{ background: "white", borderRadius: 16, padding: "18px 8px", textAlign: "center", border: "1px solid #E8D5B7" }}>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700, color: "#E8845A" }}>{m.s}</div>
              <div style={{ fontSize: 12.5, opacity: 0.7 }}>{m.l}</div>
            </div>
          ))}
        </div>

        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Nasıl çalışıyor?</h2>
          <div style={{ display: "grid", gap: 12 }}>
            {[
              ["1", "Sen alışveriş yap", "Her ödenmiş siparişin %5'i otomatik olarak Pati Kumbarası'na eklenir. Ekstra ödeme yok — biz cebimizden veriyoruz."],
              ["2", "Kumbara dolar", "Hafta boyunca her siparişle kumbara büyür. Tutarı bu sayfada ve anasayfada şeffafça görürsün."],
              ["3", "Her pazar barınağa", "Biriken para ile her pazar bir barınağa gidip köpeklere orijinal Royal Canin mama veriyoruz — ve videosunu burada yayınlıyoruz."],
            ].map(([n, t, d]) => (
              <div key={n} style={{ display: "flex", gap: 14, ...kart, alignItems: "flex-start" }}>
                <span style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 50, background: "#2E7D32", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{n}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>{t}</div>
                  <div style={{ fontSize: 14, opacity: 0.85, lineHeight: 1.6 }}>{d}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Pazar ziyaretleri & videolar</h2>
          {videolu.length === 0 ? (
            <div style={{ ...kart, textAlign: "center", padding: "28px 20px" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🎥</div>
              <div style={{ fontSize: 15, lineHeight: 1.6 }}>İlk barınak ziyaretimiz ve videosu <strong>önümüzdeki pazar</strong> yayında! Her pazar yeni bir video sözü veriyoruz. 🐕</div>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              {videolu.map((d, i) => (
                <a key={i} href={d.video_url || "#"} target="_blank" rel="noopener noreferrer" style={{ ...kart, display: "flex", gap: 14, alignItems: "center", textDecoration: "none", color: "#5C3D2E" }}>
                  <div style={{ width: 90, height: 64, borderRadius: 12, background: "#FDF6EE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid #E8D5B7" }}>
                    <span style={{ fontSize: 26 }}>▶️</span>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{d.barinak_adi || "Barınak"}{d.sehir ? ` · ${d.sehir}` : ""}</div>
                    <div style={{ fontSize: 13, opacity: 0.7 }}>{tarihFmt(d.tarih)}{d.kopek_sayisi ? ` · ${d.kopek_sayisi} köpek` : ""}{d.tutar ? ` · ${tl(d.tutar)} mama` : ""}</div>
                    {d.not_metni && <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4, lineHeight: 1.5 }}>{d.not_metni}</div>}
                  </div>
                </a>
              ))}
            </div>
          )}
        </section>

        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Teşekkür duvarı 💚</h2>
          <p style={{ fontSize: 14, opacity: 0.75, marginBottom: 16 }}>{"Alışverişiyle bir sokak dostunu doyuran ve isminin görünmesine izin veren dostlarımız. Ödeme sırasında kutucuğu işaretleyerek sen de yer alabilirsin."}</p>
          {isimler.length === 0 ? (
            <div style={{ ...kart, textAlign: "center" }}>{"İlk teşekkür senin olabilir 🐾"}</div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {isimler.map((isim, i) => (
                <span key={i} style={{ background: "#EFF9F0", border: "1px solid #BFE0C2", color: "#2E7D32", borderRadius: 50, padding: "6px 14px", fontSize: 13, fontWeight: 700 }}>🐾 {isim}</span>
              ))}
            </div>
          )}
        </section>

        <div style={{ textAlign: "center" }}>
          <Link href="/urunler" style={{ display: "inline-block", background: "#E8845A", color: "white", padding: "15px 34px", borderRadius: 50, fontWeight: 700, fontSize: 15, textDecoration: "none", boxShadow: "0 8px 20px rgba(232,132,90,0.3)" }}>Alışveriş yap, bir patiyi doyur →</Link>
        </div>

      </div>
    </main>
  );
}
