"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { useCart } from "../../../context/CartContext";
import { kategoriSeo } from "./seoIcerik";

type Urun = {
  id: number;
  ad: string;
  slug: string;
  fiyat: number;
  indirimli_fiyat?: number | null;
  resim_url?: string | null;
  stok?: number | null;
  markalar?: { ad: string } | null;
  kategoriler?: { ad?: string; slug?: string } | null;
};
type Kategori = {
  id: number;
  ad: string;
  slug: string;
  ust_kategori_id?: number | null;
  sira?: number | null;
  aktif?: boolean;
};

export default function KategoriClient() {
  const { slug } = useParams();
  const seo = typeof slug === "string" ? kategoriSeo[slug] : undefined;
  const [kategori, setKategori] = useState<Kategori | null>(null);
  const [altKategoriler, setAltKategoriler] = useState<Kategori[]>([]);
  const [tumKategoriler, setTumKategoriler] = useState<Kategori[]>([]);
  const [urunler, setUrunler] = useState<Urun[]>([]);
  const [filtrelenmis, setFiltrelenmis] = useState<Urun[]>([]);
  const [markalar, setMarkalar] = useState<string[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [seciliMarka, setSeciliMarka] = useState("");
  const [seciliAltKat, setSeciliAltKat] = useState("");
  const [siralama, setSiralama] = useState("varsayilan");
  const [sayfa, setSayfa] = useState(1);
  const [eklendi, setEklendi] = useState<number | null>(null);
  const [filtrePanelAcik, setFiltrePanelAcik] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const { addItem, totalItems } = useCart();
  const sayfaBasina = 24;

  useEffect(() => {
    if (!slug) return;
    setYukleniyor(true);
    setHata(null);

    const veriYukle = async () => {
      try {
        // .single() yerine .limit(1) — DB'de duplicate slug varsa
        // .single() exception firlatir ve sayfa "yuklenemedi" hatasi verir.
        // NOT: kategoriler tablosunda 'aciklama' kolonu yok — SELECT'ten cikarildi.
        const { data: katList, error: katErr } = await supabase.from("kategoriler")
          .select("id, ad, slug, ust_kategori_id, aktif").eq("slug", slug).limit(1);
        if (katErr) throw katErr;
        const kat = katList?.[0];
        if (!kat) { setYukleniyor(false); return; }
        setKategori(kat);

        const { data: tumKatData, error: tkErr } = await supabase.from("kategoriler")
          .select("id, ad, slug, ust_kategori_id");
        if (tkErr) throw tkErr;
        setTumKategoriler(tumKatData || []);

        const { data: altKat, error: akErr } = await supabase.from("kategoriler")
          .select("id, ad, slug, ust_kategori_id, sira")
          .eq("ust_kategori_id", kat.id).eq("aktif", true).order("sira");
        if (akErr) throw akErr;
        setAltKategoriler(altKat || []);

        const { data: seviye1, error: s1Err } = await supabase.from("kategoriler").select("id")
          .or(`id.eq.${kat.id},ust_kategori_id.eq.${kat.id}`);
        if (s1Err) throw s1Err;
        const idler1 = seviye1?.map(k => k.id) || [kat.id];

        const { data: seviye2, error: s2Err } = await supabase.from("kategoriler").select("id")
          .in("ust_kategori_id", idler1);
        if (s2Err) throw s2Err;
        const idler2 = seviye2?.map(k => k.id) || [];

        const { data: seviye3, error: s3Err } = await supabase.from("kategoriler").select("id")
          .in("ust_kategori_id", [...idler1, ...idler2]);
        if (s3Err) throw s3Err;
        const idler3 = seviye3?.map(k => k.id) || [];

        const tumIdler = [...new Set([...idler1, ...idler2, ...idler3])];

        const { data: urunData, error: urErr } = await supabase.from("urunler")
          .select("*, markalar(ad), kategoriler(ad, slug)")
          .in("kategori_id", tumIdler)
          .neq("aktif", false)
          .limit(1000);
        if (urErr) throw urErr;

        setUrunler(urunData || []);
        setFiltrelenmis(urunData || []);
        const markaSet = new Set(urunData?.map((u: Urun) => u.markalar?.ad).filter(Boolean));
        setMarkalar(Array.from(markaSet) as string[]);
      } catch (err) {
        console.error("[kategori] veri yukleme hatasi:", err);
        setHata("Kategori verileri yüklenemedi. Sayfayı yenileyin veya ana sayfaya dönün.");
      } finally {
        setYukleniyor(false);
      }
    };

    veriYukle();
  }, [slug]);

  useEffect(() => {
    let sonuc = [...urunler];
    if (seciliMarka) sonuc = sonuc.filter(u => u.markalar?.ad === seciliMarka);
    if (seciliAltKat) {
      const altSluglar = (s: string): string[] => {
        const kat = tumKategoriler.find(k => k.slug === s);
        if (!kat) return [s];
        const altlar = tumKategoriler.filter(k => k.ust_kategori_id === kat.id);
        return [s, ...altlar.flatMap(a => altSluglar(a.slug))];
      };
      const sluglar = altSluglar(seciliAltKat);
      sonuc = sonuc.filter(u => sluglar.includes(u.kategoriler?.slug ?? ""));
    }
    if (siralama === "ucuz") sonuc.sort((a, b) => (a.indirimli_fiyat || a.fiyat) - (b.indirimli_fiyat || b.fiyat));
    if (siralama === "pahali") sonuc.sort((a, b) => (b.indirimli_fiyat || b.fiyat) - (a.indirimli_fiyat || a.fiyat));
    if (siralama === "az") sonuc.sort((a, b) => a.ad.localeCompare(b.ad));
    setFiltrelenmis(sonuc);
    setSayfa(1);
  }, [seciliMarka, seciliAltKat, siralama, urunler, tumKategoriler]);

  const handleEkle = (urun: Urun) => {
    addItem({ id: urun.id, name: urun.ad, price: urun.indirimli_fiyat || urun.fiyat, emoji: "🐾", resim_url: urun.resim_url || undefined, slug: urun.slug });
    setEklendi(urun.id);
    setTimeout(() => setEklendi(null), 1500);
  };

  const sayfadakiUrunler = filtrelenmis.slice((sayfa - 1) * sayfaBasina, sayfa * sayfaBasina);
  const toplamSayfa = Math.ceil(filtrelenmis.length / sayfaBasina);

  const FiltrePaneli = () => (
    <div>
      {altKategoriler.length > 0 && (
        <div style={{ background: "white", borderRadius: 20, padding: "20px", marginBottom: 16, boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 700, color: "#5C3D2E", marginBottom: 12 }}>📁 Alt Kategoriler</div>
          <div onClick={() => { setSeciliAltKat(""); setFiltrePanelAcik(false); }}
            style={{ padding: "8px 12px", borderRadius: 10, cursor: "pointer", background: !seciliAltKat ? "#FFF5F0" : "none", color: !seciliAltKat ? "#E8845A" : "#5C3D2E", fontWeight: !seciliAltKat ? 700 : 400, fontSize: 14, marginBottom: 4 }}>
            Tümü ({urunler.length})
          </div>
          {altKategoriler.map((alt, i) => {
            const altSluglar = (s: string): string[] => {
              const k = tumKategoriler.find(k => k.slug === s);
              if (!k) return [s];
              const altlar = tumKategoriler.filter(a => a.ust_kategori_id === k.id);
              return [s, ...altlar.flatMap(a => altSluglar(a.slug))];
            };
            const sayi = urunler.filter(u => altSluglar(alt.slug).includes(u.kategoriler?.slug ?? "")).length;
            return (
              <div key={i} onClick={() => { setSeciliAltKat(alt.slug); setFiltrePanelAcik(false); }}
                style={{ padding: "8px 12px", borderRadius: 10, cursor: "pointer", background: seciliAltKat === alt.slug ? "#FFF5F0" : "none", color: seciliAltKat === alt.slug ? "#E8845A" : "#5C3D2E", fontWeight: seciliAltKat === alt.slug ? 700 : 400, fontSize: 14, marginBottom: 4, display: "flex", justifyContent: "space-between" }}>
                <span>{alt.ad}</span><span style={{ opacity: 0.5, fontSize: 12 }}>{sayi}</span>
              </div>
            );
          })}
        </div>
      )}
      {markalar.length > 0 && (
        <div style={{ background: "white", borderRadius: 20, padding: "20px", marginBottom: 16, boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 700, color: "#5C3D2E", marginBottom: 12 }}>🏷️ Markalar</div>
          <div onClick={() => { setSeciliMarka(""); setFiltrePanelAcik(false); }}
            style={{ padding: "8px 12px", borderRadius: 10, cursor: "pointer", background: !seciliMarka ? "#FFF5F0" : "none", color: !seciliMarka ? "#E8845A" : "#5C3D2E", fontWeight: !seciliMarka ? 700 : 400, fontSize: 14, marginBottom: 4 }}>
            Tümü
          </div>
          {(markalar as string[]).map((m, i) => (
            <div key={i} onClick={() => { setSeciliMarka(m); setFiltrePanelAcik(false); }}
              style={{ padding: "8px 12px", borderRadius: 10, cursor: "pointer", background: seciliMarka === m ? "#FFF5F0" : "none", color: seciliMarka === m ? "#E8845A" : "#5C3D2E", fontWeight: seciliMarka === m ? 700 : 400, fontSize: 14, marginBottom: 4 }}>
              {m}
            </div>
          ))}
        </div>
      )}
      <div style={{ background: "white", borderRadius: 20, padding: "20px", boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 700, color: "#5C3D2E", marginBottom: 12 }}>🔃 Sıralama</div>
        {[
          { value: "varsayilan", label: "Varsayılan" },
          { value: "ucuz", label: "Önce Ucuz" },
          { value: "pahali", label: "Önce Pahalı" },
          { value: "az", label: "A'dan Z'ye" },
        ].map((s, i) => (
          <div key={i} onClick={() => { setSiralama(s.value); setFiltrePanelAcik(false); }}
            style={{ padding: "8px 12px", borderRadius: 10, cursor: "pointer", background: siralama === s.value ? "#FFF5F0" : "none", color: siralama === s.value ? "#E8845A" : "#5C3D2E", fontWeight: siralama === s.value ? 700 : 400, fontSize: 14, marginBottom: 4 }}>
            {s.label}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <main style={{ minHeight: "100vh", background: "#FDF6EE", fontFamily: "sans-serif" }}>

      {hata && (
        <div role="alert" style={{ background: "#FFEBEE", color: "#C62828", padding: "10px 16px", textAlign: "center", fontSize: 13, fontWeight: 600, borderBottom: "1px solid #FFCDD2" }}>
          ⚠️ {hata}
          <button onClick={() => setHata(null)} style={{ background: "none", border: "none", color: "#C62828", fontSize: 16, marginLeft: 10, cursor: "pointer", fontWeight: 700 }}>×</button>
        </div>
      )}

      <style>{`
        .kat-layout { max-width: 1400px; margin: 0 auto; padding: 0 24px 48px; display: grid; grid-template-columns: 260px 1fr; gap: 24px; }
        .urun-grid-kat { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
        .filtre-panel-desktop { display: block; }
        .filtre-btn-mob { display: none; }
        .filtre-overlay { display: none; }
        .header-kat { padding: 16px 48px; }
        @media (max-width: 768px) {
          .kat-layout { grid-template-columns: 1fr !important; padding: 0 14px 96px; }
          .urun-grid-kat { grid-template-columns: repeat(2,1fr) !important; gap: 10px; }
          .filtre-panel-desktop { display: none; }
          .filtre-btn-mob { display: flex; }
          .header-kat { padding: 13px 16px !important; }
          .filtre-overlay { display: block; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 400; }
          .filtre-drawer { position: fixed; bottom: 0; left: 0; right: 0; z-index: 500; background: #FDF6EE; border-radius: 24px 24px 0 0; padding: 20px 16px 40px; max-height: 80vh; overflow-y: auto; }
        }
        @media (max-width: 480px) {
          .urun-grid-kat { grid-template-columns: repeat(2,1fr) !important; }
        }
      `}</style>

      {filtrePanelAcik && (
        <>
          <div className="filtre-overlay" onClick={() => setFiltrePanelAcik(false)} />
          <div className="filtre-drawer">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontFamily: "Georgia,serif", fontSize: 18, fontWeight: 700, color: "#5C3D2E" }}>Filtrele & Sırala</div>
              <button onClick={() => setFiltrePanelAcik(false)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#5C3D2E" }}>✕</button>
            </div>
            <FiltrePaneli />
          </div>
        </>
      )}

      <header style={{ background: "white", borderBottom: "1px solid #E8D5B7", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100 }} className="header-kat">
        <Link href="/" style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, color: "#5C3D2E", textDecoration: "none" }}>
          evemama<span style={{ color: "#E8845A", fontStyle: "italic" }}>.net</span>
        </Link>
        <Link href="/sepet" style={{ background: "#5C3D2E", color: "white", padding: "9px 18px", borderRadius: 50, textDecoration: "none", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
          🛒 {totalItems > 0 && <span style={{ background: "#E8845A", borderRadius: 50, padding: "1px 7px", fontSize: 11 }}>{totalItems}</span>}
        </Link>
      </header>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "12px 16px", fontSize: 13, color: "#5C3D2E", opacity: 0.6 }}>
        <Link href="/" style={{ color: "#E8845A", textDecoration: "none" }}>Ana Sayfa</Link>
        {kategori && <> / <span>{kategori.ad}</span></>}
      </div>

      <div className="kat-layout">
        <div className="filtre-panel-desktop">
          <FiltrePaneli />
        </div>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 12 }}>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, color: "#5C3D2E", margin: 0 }}>
              {kategori?.ad}
              <span style={{ fontSize: 13, fontWeight: 400, opacity: 0.5, marginLeft: 8 }}>({filtrelenmis.length})</span>
            </h1>
            <button className="filtre-btn-mob" onClick={() => setFiltrePanelAcik(true)}
              style={{ display: "none", alignItems: "center", gap: 6, background: "white", border: "2px solid #E8D5B7", borderRadius: 50, padding: "8px 16px", fontSize: 13, fontWeight: 600, color: "#5C3D2E", cursor: "pointer", flexShrink: 0 }}>
              🔧 Filtre {(seciliMarka || seciliAltKat || siralama !== "varsayilan") ? "●" : ""}
            </button>
          </div>

          {altKategoriler.length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
              <button onClick={() => setSeciliAltKat("")}
                style={{ padding: "7px 14px", borderRadius: 50, border: `2px solid ${!seciliAltKat ? "#E8845A" : "#E8D5B7"}`, background: !seciliAltKat ? "#E8845A" : "white", color: !seciliAltKat ? "white" : "#5C3D2E", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
                Tümü
              </button>
              {altKategoriler.map((alt, i) => (
                <button key={i} onClick={() => setSeciliAltKat(alt.slug)}
                  style={{ padding: "7px 14px", borderRadius: 50, border: `2px solid ${seciliAltKat === alt.slug ? "#E8845A" : "#E8D5B7"}`, background: seciliAltKat === alt.slug ? "#E8845A" : "white", color: seciliAltKat === alt.slug ? "white" : "#5C3D2E", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
                  {alt.ad}
                </button>
              ))}
            </div>
          )}

          {yukleniyor ? (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: "#5C3D2E" }}>Yükleniyor...</div>
            </div>
          ) : sayfadakiUrunler.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>😢</div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: "#5C3D2E" }}>Bu kategoride ürün bulunamadı</div>
            </div>
          ) : (
            <div className="urun-grid-kat">
              {sayfadakiUrunler.map((urun, i) => (
                <div key={i} style={{ background: "white", borderRadius: 18, overflow: "hidden", transition: "transform .2s, box-shadow .2s" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(92,61,46,0.1)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
                  <Link href={`/urun/${urun.slug}`} style={{ textDecoration: "none", display: "block" }}>
                    <div style={{ height: 140, background: "#FDF6EE", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                      {urun.resim_url ? (
                        <Image src={urun.resim_url} alt={urun.ad} fill sizes="(max-width:768px) 50vw, (max-width:1200px) 33vw, 320px" style={{ objectFit: "contain", padding: 10, mixBlendMode: "multiply" }} />
                      ) : (
                        <div style={{ fontSize: 48, opacity: 0.2 }}>🐾</div>
                      )}
                      {urun.stok === 0 && (
                        <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ background: "#5C3D2E", color: "white", fontSize: 10, fontWeight: 700, padding: "5px 10px", borderRadius: 50 }}>Stokta Yok</span>
                        </div>
                      )}
                      {urun.stok != null && urun.stok > 0 && urun.stok <= 5 && (
                        <span style={{ position: "absolute", top: 8, left: 8, background: "#E8845A", color: "white", fontSize: 9, fontWeight: 700, padding: "3px 7px", borderRadius: 50 }}>Son {urun.stok}!</span>
                      )}
                    </div>
                    <div style={{ padding: "10px 12px 6px" }}>
                      {urun.markalar && <div style={{ fontSize: 9, fontWeight: 700, color: "#8BAF8E", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 3 }}>{urun.markalar.ad}</div>}
                      <div style={{ fontFamily: "Georgia, serif", fontSize: 13, fontWeight: 700, color: "#5C3D2E", lineHeight: 1.3 }}>{urun.ad.substring(0, 50)}{urun.ad.length > 50 ? "..." : ""}</div>
                    </div>
                  </Link>
                  <div style={{ padding: "0 12px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 700, color: "#5C3D2E" }}>₺{(urun.indirimli_fiyat || urun.fiyat).toFixed(2)}</span>
                      {urun.indirimli_fiyat && <span style={{ fontSize: 10, color: "#5C3D2E", opacity: 0.4, textDecoration: "line-through", marginLeft: 4 }}>₺{urun.fiyat.toFixed(2)}</span>}
                    </div>
                    <button onClick={() => handleEkle(urun)} disabled={urun.stok === 0}
                      style={{ background: eklendi === urun.id ? "#8BAF8E" : urun.stok === 0 ? "#ccc" : "#E8845A", color: "white", border: "none", borderRadius: 50, padding: "7px 12px", fontSize: 11, fontWeight: 700, cursor: urun.stok === 0 ? "not-allowed" : "pointer" }}>
                      {eklendi === urun.id ? "✅" : "+ Sepet"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {toplamSayfa > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 28, flexWrap: "wrap" }}>
              <button onClick={() => setSayfa(s => Math.max(1, s - 1))} disabled={sayfa === 1}
                style={{ padding: "9px 16px", border: "2px solid #E8D5B7", borderRadius: 12, background: "white", cursor: sayfa === 1 ? "not-allowed" : "pointer", color: "#5C3D2E", fontWeight: 600, opacity: sayfa === 1 ? 0.4 : 1, fontSize: 13 }}>← Önceki</button>
              {Array.from({ length: Math.min(5, toplamSayfa) }, (_, i) => {
                const p = sayfa <= 3 ? i + 1 : sayfa - 2 + i;
                if (p > toplamSayfa) return null;
                return (
                  <button key={p} onClick={() => setSayfa(p)}
                    style={{ padding: "9px 14px", border: `2px solid ${sayfa === p ? "#E8845A" : "#E8D5B7"}`, borderRadius: 12, background: sayfa === p ? "#E8845A" : "white", cursor: "pointer", color: sayfa === p ? "white" : "#5C3D2E", fontWeight: 700, fontSize: 13 }}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => setSayfa(s => Math.min(toplamSayfa, s + 1))} disabled={sayfa === toplamSayfa}
                style={{ padding: "9px 16px", border: "2px solid #E8D5B7", borderRadius: 12, background: "white", cursor: sayfa === toplamSayfa ? "not-allowed" : "pointer", color: "#5C3D2E", fontWeight: 600, opacity: sayfa === toplamSayfa ? 0.4 : 1, fontSize: 13 }}>Sonraki →</button>
            </div>
          )}
        </div>
      </div>

      {seo && (
        <section style={{ maxWidth: 1400, margin: "0 auto", padding: "8px 24px 56px" }}>
          <div style={{ background: "white", borderRadius: 20, padding: "32px 36px", boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
            <h2 style={{ fontFamily: "Georgia,serif", fontSize: 24, fontWeight: 700, color: "#5C3D2E", marginBottom: 16 }}>{seo.h1} Hakkında</h2>
            {seo.intro.map((p, i) => (
              <p key={i} style={{ fontSize: 15, color: "#5C3D2E", opacity: 0.82, lineHeight: 1.85, marginBottom: 14 }}>{p}</p>
            ))}
            {seo.faq.length > 0 && (
              <>
                <h3 style={{ fontFamily: "Georgia,serif", fontSize: 19, fontWeight: 700, color: "#5C3D2E", margin: "26px 0 14px" }}>Sıkça Sorulan Sorular</h3>
                {seo.faq.map((f, i) => (
                  <div key={i} style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#5C3D2E", marginBottom: 5 }}>{f.soru}</div>
                    <p style={{ fontSize: 14, color: "#5C3D2E", opacity: 0.78, lineHeight: 1.7, margin: 0 }}>{f.cevap}</p>
                  </div>
                ))}
              </>
            )}
          </div>
        </section>
      )}

      <nav style={{ display: "none" }} className="mob-bottom">
        <style>{`.mob-bottom { display: none; } @media(max-width:768px){ .mob-bottom { display: grid !important; grid-template-columns: repeat(4,1fr); position: fixed; bottom: 0; left: 0; right: 0; z-index: 300; background: rgba(253,246,238,0.97); backdrop-filter: blur(14px); border-top: 1px solid rgba(92,61,46,.08); padding: 8px 0 20px; } }`}</style>
        <Link href="/" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, textDecoration: "none", padding: 4 }}>
          <span style={{ fontSize: 22 }}>🏠</span><span style={{ fontSize: 10, fontWeight: 600, color: "#5C3D2E", opacity: 0.4 }}>Anasayfa</span>
        </Link>
        <Link href="/urunler" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, textDecoration: "none", padding: 4 }}>
          <span style={{ fontSize: 22 }}>🔍</span><span style={{ fontSize: 10, fontWeight: 600, color: "#5C3D2E", opacity: 0.4 }}>Ara</span>
        </Link>
        <Link href="/favoriler" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, textDecoration: "none", padding: 4 }}>
          <span style={{ fontSize: 22 }}>❤️</span><span style={{ fontSize: 10, fontWeight: 600, color: "#5C3D2E", opacity: 0.4 }}>Favoriler</span>
        </Link>
        <Link href="/sepet" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, textDecoration: "none", padding: 4 }}>
          <span style={{ fontSize: 22 }}>🛒</span><span style={{ fontSize: 10, fontWeight: 600, color: "#E8845A", opacity: 1 }}>Sepet</span>
        </Link>
      </nav>

    </main>
  );
}