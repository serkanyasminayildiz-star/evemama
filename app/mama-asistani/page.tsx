"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useCart } from "../../context/CartContext";

// Mama Asistanı — müşteri dostunun ihtiyacını yazar, AI stoktaki ürünlerden
// en uygun 3'ünü gerekçesiyle önerir. Sonuç kartları /kampanyalar ile birebir.
type OneriUrun = {
  id: number;
  ad: string;
  slug: string;
  fiyat: number;
  indirimli_fiyat: number | null;
  stok: number;
  resim_url: string | null;
};
type Oneri = { urun: OneriUrun; neden: string };

const ORNEKLER = [
  "Tüyleri çok dökülüyor",
  "Midesi hassas, mamasını sık kusuyor",
  "Kilo almaya başladı",
  "Yavru, hangi mamayla başlamalıyım?",
];

export default function MamaAsistani() {
  const { addItem, totalItems } = useCart();
  const [tur, setTur] = useState<"kedi" | "kopek" | "">("");
  const [yas, setYas] = useState("");
  const [cins, setCins] = useState("");
  const [mesaj, setMesaj] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState("");
  const [oneriler, setOneriler] = useState<Oneri[] | null>(null);
  const [notMetni, setNotMetni] = useState<string | null>(null);
  const [eklendi, setEklendi] = useState<number | null>(null);

  useEffect(() => {
    // Ana sayfa şeridinden gelen soru (?q=) forma önceden doldurulur.
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) setMesaj(q.slice(0, 600));
  }, []);

  const handleSor = async () => {
    if (!tur) { setHata("Önce kedi mi köpek mi seç 🙂"); return; }
    if (mesaj.trim().length < 5) { setHata("Dostunun ihtiyacını kısaca yaz (örn: tüyleri çok dökülüyor)."); return; }
    setYukleniyor(true);
    setHata("");
    setOneriler(null);
    try {
      const r = await fetch("/api/mama-asistani", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tur, yas, cins, mesaj }),
      });
      const d = await r.json();
      if (d.ok) {
        setOneriler(d.oneriler || []);
        setNotMetni(d.not || null);
      } else {
        setHata(d.error || "Öneri hazırlanamadı, tekrar dene.");
      }
    } catch {
      setHata("Sunucuya ulaşılamadı. İnternet bağlantını kontrol edip tekrar dene.");
    } finally {
      setYukleniyor(false);
    }
  };

  const handleEkle = (urun: OneriUrun) => {
    if (urun.stok === 0) return;
    addItem({ id: urun.id, name: urun.ad, price: urun.indirimli_fiyat || urun.fiyat, emoji: "🐾", resim_url: urun.resim_url || undefined, slug: urun.slug });
    setEklendi(urun.id);
    setTimeout(() => setEklendi(null), 1200);
  };

  const secBtn = (aktif: boolean) => ({
    padding: "10px 18px", borderRadius: 50, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
    border: `2px solid ${aktif ? "#E8845A" : "#E8D5B7"}`, background: aktif ? "#E8845A" : "white", color: aktif ? "white" : "#5C3D2E",
  });
  const input = { width: "100%", padding: "12px 14px", border: "2px solid #E8D5B7", borderRadius: 12, fontSize: 14, outline: "none", fontFamily: "inherit", color: "#5C3D2E", background: "white", boxSizing: "border-box" as const };

  return (
    <main style={{ minHeight: "100vh", background: "#FDF6EE", fontFamily: "sans-serif" }}>

      <style>{`
        .asistan-wrap { max-width: 860px; margin: 0 auto; padding: 0 24px 64px; }
        .asistan-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
        .header-asistan { padding: 16px 48px; }
        @media (max-width: 768px) {
          .asistan-wrap { padding: 0 14px 64px; }
          .asistan-grid { grid-template-columns: repeat(2,1fr) !important; gap: 10px; }
          .header-asistan { padding: 13px 16px !important; }
        }
        @media (max-width: 480px) {
          .asistan-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

      {/* Header */}
      <header className="header-asistan" style={{ background: "white", borderBottom: "1px solid #E8D5B7", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100 }}>
        <Link href="/" style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, color: "#5C3D2E", textDecoration: "none" }}>
          evemama<span style={{ color: "#E8845A", fontStyle: "italic" }}>.net</span>
        </Link>
        <Link href="/sepet" style={{ background: "#5C3D2E", color: "white", padding: "9px 18px", borderRadius: 50, textDecoration: "none", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
          🛒 {totalItems > 0 && <span style={{ background: "#E8845A", borderRadius: 50, padding: "1px 7px", fontSize: 11 }}>{totalItems}</span>}
        </Link>
      </header>

      <div className="asistan-wrap">

        {/* Başlık */}
        <div style={{ textAlign: "center", padding: "32px 0 24px" }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🤖🐾</div>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 28, fontWeight: 700, color: "#5C3D2E", margin: 0 }}>Mama Asistanı</h1>
          <p style={{ fontSize: 14, color: "#5C3D2E", opacity: 0.7, margin: "10px auto 0", maxWidth: 480, lineHeight: 1.6 }}>
            Dostunun özelliğini veya problemini yaz — stoktaki ürünler arasından ona en uygun mamaları önerelim.
          </p>
        </div>

        {/* Form */}
        <div style={{ background: "white", borderRadius: 24, padding: "26px 22px", boxShadow: "0 4px 24px rgba(92,61,46,0.07)", marginBottom: 28 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#5C3D2E", opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Dostun kim? *</div>
          <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
            <button onClick={() => setTur("kedi")} style={secBtn(tur === "kedi")}>🐱 Kedi</button>
            <button onClick={() => setTur("kopek")} style={secBtn(tur === "kopek")}>🐶 Köpek</button>
          </div>

          <div style={{ fontSize: 12, fontWeight: 700, color: "#5C3D2E", opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Yaş grubu</div>
          <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
            {[["yavru", "🍼 Yavru"], ["yetiskin", "💪 Yetişkin"], ["yasli", "👴 Yaşlı (7+)"]].map(([v, l]) => (
              <button key={v} onClick={() => setYas(yas === v ? "" : v)} style={secBtn(yas === v)}>{l}</button>
            ))}
          </div>

          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#5C3D2E", opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Cinsi (istersen)</div>
            <input value={cins} onChange={e => setCins(e.target.value)} placeholder="örn: Golden Retriever, British Shorthair..." style={input} />
          </div>

          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#5C3D2E", opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>İhtiyacı / problemi *</div>
            <textarea value={mesaj} onChange={e => setMesaj(e.target.value)} rows={3}
              placeholder="örn: Tüyleri çok dökülüyor, kaşınıyor..." style={{ ...input, resize: "vertical" }} />
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
            {ORNEKLER.map(o => (
              <button key={o} onClick={() => setMesaj(o)} style={{ background: "#FDF6EE", border: "1px solid #E8D5B7", borderRadius: 50, padding: "6px 12px", fontSize: 12, color: "#5C3D2E", cursor: "pointer", fontFamily: "inherit" }}>
                {o}
              </button>
            ))}
          </div>

          {hata && (
            <div style={{ background: "#FFEBEE", color: "#C62828", padding: "12px 16px", borderRadius: 12, marginBottom: 14, fontSize: 13, textAlign: "center" }}>{hata}</div>
          )}

          <button onClick={handleSor} disabled={yukleniyor}
            style={{ width: "100%", background: yukleniyor ? "#C9B79C" : "#E8845A", color: "white", border: "none", borderRadius: 14, padding: "15px", fontSize: 15, fontWeight: 700, cursor: yukleniyor ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
            {yukleniyor ? "🐾 Dostuna en uygun mamalar seçiliyor..." : "Öneri Al →"}
          </button>
        </div>

        {/* Sonuçlar */}
        {oneriler !== null && (
          <div>
            {oneriler.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 24px", background: "white", borderRadius: 24 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🐾</div>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 17, color: "#5C3D2E", marginBottom: 8 }}>Bu ihtiyaca tam uyan stokta ürün bulamadık</div>
                <Link href="/urunler" style={{ color: "#E8845A", fontWeight: 700, textDecoration: "none", fontSize: 14 }}>Tüm ürünlere göz at →</Link>
              </div>
            ) : (
              <>
                <h2 style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, color: "#5C3D2E", marginBottom: 16, textAlign: "center" }}>
                  Dostun için önerilerimiz 🎯
                </h2>
                <div className="asistan-grid">
                  {oneriler.map(({ urun, neden }) => (
                    <div key={urun.id} style={{ background: "white", borderRadius: 18, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                      <Link href={`/urun/${urun.slug}`} style={{ textDecoration: "none", display: "block" }}>
                        <div style={{ height: 130, background: "#FDF6EE", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                          {urun.resim_url ? (
                            <Image src={urun.resim_url} alt={urun.ad} fill sizes="(max-width:768px) 50vw, 280px" style={{ objectFit: "contain", padding: 10, mixBlendMode: "multiply" }} />
                          ) : (
                            <div style={{ fontSize: 44, opacity: 0.2 }}>🐾</div>
                          )}
                        </div>
                        <div style={{ padding: "10px 12px 4px" }}>
                          <div style={{ fontFamily: "Georgia, serif", fontSize: 13, fontWeight: 700, color: "#5C3D2E", lineHeight: 1.3 }}>{urun.ad.substring(0, 55)}{urun.ad.length > 55 ? "..." : ""}</div>
                        </div>
                      </Link>
                      <div style={{ padding: "6px 12px 10px", fontSize: 12, color: "#5C3D2E", opacity: 0.8, lineHeight: 1.5, flex: 1 }}>
                        💡 {neden}
                      </div>
                      <div style={{ padding: "0 12px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 700, color: "#5C3D2E" }}>₺{(urun.indirimli_fiyat || urun.fiyat).toFixed(2)}</span>
                        <button onClick={() => handleEkle(urun)}
                          style={{ background: eklendi === urun.id ? "#8BAF8E" : "#E8845A", color: "white", border: "none", borderRadius: 50, padding: "7px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                          {eklendi === urun.id ? "✅" : "+ Sepet"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {notMetni && (
              <div style={{ background: "#FFF8E1", border: "1.5px solid #F9A825", borderRadius: 14, padding: "13px 16px", marginTop: 16, fontSize: 13, color: "#5C3D2E", lineHeight: 1.6 }}>
                ⚠️ {notMetni}
              </div>
            )}
            <div style={{ textAlign: "center", marginTop: 14, fontSize: 11.5, color: "#5C3D2E", opacity: 0.5, lineHeight: 1.6 }}>
              Öneriler yapay zekâ desteklidir ve genel bilgi amaçlıdır; sağlık sorunlarında mutlaka veterinerinize danışın.
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
