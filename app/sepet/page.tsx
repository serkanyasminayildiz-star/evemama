"use client";
import { useCart } from "../../context/CartContext";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import type { User } from "@supabase/supabase-js";
import { KARGO, TUTAR_INDIRIMI, hesaplaIndirim, sepetAgirligiKg, kazanilacakPuan } from "../../lib/indirim";
import { clarityEvent, claritySet } from "../../lib/clarity";

export default function Sepet() {
  const { items, removeItem, updateQuantity, totalItems, totalPrice, clearCart } = useCart();
  const [silindi, setSilindi] = useState<number | null>(null);
  const [eklendi, setEklendi] = useState<number | null>(null);
  const [kullanici, setKullanici] = useState<User | null>(null);
  const [bonus, setBonus] = useState<{ tutar: number; min_sepet: number } | null>(null);
  const [kuponKodu, setKuponKodu] = useState("");
  const [uygulananKupon, setUygulananKupon] = useState<{ kod: string; indirim: number } | null>(null);
  const [kuponMesaj, setKuponMesaj] = useState("");
  const [kuponYukleniyor, setKuponYukleniyor] = useState(false);

  // Üyelik durumu (sadakat bonusu gösterimi + kargo teşviki için).
  useEffect(() => {
    supabase.auth.getUser()
      .then(({ data: { user } }) => setKullanici(user))
      .catch(err => console.error("[sepet] kullanici kontrolu:", err));
  }, []);

  // Sadakat bonusu — üye giriş yapmışsa geçerli bonusunu çek (gösterim için;
  // gerçek indirim ödeme adımında sunucuda yeniden doğrulanır).
  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;
        const res = await fetch("/api/bonus", { headers: { Authorization: `Bearer ${session.access_token}` } });
        const d = await res.json();
        if (d.bonus) setBonus(d.bonus);
      } catch { /* bonus gosterilemezse sepet calismaya devam eder */ }
    })();
  }, []);

  // Kupon kodu doğrulama — sunucuda (kupon-dogrula) sepet tutarına göre.
  const kuponDogrula = async (kod: string, sessiz = false) => {
    if (!kod.trim()) return;
    setKuponYukleniyor(true);
    if (!sessiz) setKuponMesaj("");
    try {
      const res = await fetch("/api/kupon-dogrula", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kod, sepetTutari: totalPrice }),
      });
      const d = await res.json();
      if (d.gecerli) {
        setUygulananKupon({ kod: d.kod, indirim: d.indirim });
        if (typeof window !== "undefined") localStorage.setItem("evemama_kupon", d.kod);
        setKuponMesaj("");
      } else {
        setUygulananKupon(null);
        if (!sessiz) {
          setKuponMesaj(d.mesaj || "Kupon geçersiz.");
          // Clarity: kullanıcı kupon deneyip reddedildi (YENİLE10/İ-I gibi vakaları görünür kılar)
          clarityEvent("kupon-hatasi");
          claritySet("kupon-denenen", kod.trim());
        } else if (typeof window !== "undefined") localStorage.removeItem("evemama_kupon");
      }
    } catch {
      if (!sessiz) setKuponMesaj("Kupon doğrulanamadı, tekrar deneyin.");
    }
    setKuponYukleniyor(false);
  };

  const kuponKaldir = () => {
    setUygulananKupon(null); setKuponKodu(""); setKuponMesaj("");
    if (typeof window !== "undefined") localStorage.removeItem("evemama_kupon");
  };

  // Açılışta / sepet değişince kayıtlı kuponu yeniden doğrula (sepet tutarı
  // değişmiş olabilir → min_sepet / indirim güncel kalsın).
  useEffect(() => {
    const kayitli = typeof window !== "undefined" ? localStorage.getItem("evemama_kupon") : null;
    if (kayitli) { setKuponKodu(kayitli); kuponDogrula(kayitli, true); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPrice]);

  const kargoyaKalan = KARGO.BEDAVA_ESIK - totalPrice;

  const bonusUygulanabilir = !!bonus && totalPrice >= bonus.min_sepet;

  // TEK KAYNAK indirim hesabı — server (api/odeme) ile AYNI saf fonksiyon.
  // EN AVANTAJLISI (kupon vs otomatik üst üste binmez) ve genelToplam burada.
  const hesap = hesaplaIndirim({
    sepetTutari: totalPrice,
    toplamAgirlikKg: sepetAgirligiKg(items),
    bonusTutar: bonusUygulanabilir ? bonus!.tutar : 0,
    kuponIndirimi: uygulananKupon ? uygulananKupon.indirim : 0,
  });
  const kargoUcreti = hesap.kargo;
  const kuponKazandi = hesap.kuponKazandi;
  const indirimMiktari = hesap.indirimMiktari;
  const indirimAciklama = totalPrice >= TUTAR_INDIRIMI.ESIK_2 ? "10.000₺ üzeri alışveriş indirimi 🎉" : totalPrice >= TUTAR_INDIRIMI.ESIK_1 ? "5.000₺ üzeri alışveriş indirimi 🎁" : "";

  // Teşvik, o eşikte görülecek TOPLAM indirimi gösterir: eşikteki tutar
  // indirimine, halihazırda geçerli sadakat bonusu harcaması eklenir (eşik
  // üstünde de geçerli kalır).
  const ekOtomatikIndirim = hesap.bonusIndirimi;
  const sonrakiIndirim = totalPrice < TUTAR_INDIRIMI.ESIK_1
    ? { hedef: TUTAR_INDIRIMI.ESIK_1, indirim: TUTAR_INDIRIMI.INDIRIM_1 + ekOtomatikIndirim, kalan: TUTAR_INDIRIMI.ESIK_1 - totalPrice }
    : totalPrice < TUTAR_INDIRIMI.ESIK_2
    ? { hedef: TUTAR_INDIRIMI.ESIK_2, indirim: TUTAR_INDIRIMI.INDIRIM_2 + ekOtomatikIndirim, kalan: TUTAR_INDIRIMI.ESIK_2 - totalPrice }
    : null;

  const genelToplam = hesap.genelToplam;

  // Sadakat puanı KAZANMA (bu sipariş → BİR SONRAKİ alışveriş). Yalnızca ÜYE.
  // Her siparişte kargo hariç ödenen tutarın %5'i (sipariş başına tavanlı).
  // Misafir kazanmaz. DİKKAT: bu, "5000₺ üzeri tutar indirimi" teşvikinden
  // (sonrakiIndirim — bu siparişe ANINDA uygulanır) AYRI bir şeydir; o BU
  // sipariş için, bu ise SONRAKİ sipariş için kazanılır. İkisi karışmasın diye
  // gösterimde net ayrıldı.
  // Taban = ödenecek tutar − kargo; odeme/sonuc'taki kazanım hesabıyla BİREBİR
  // aynı (tek kaynak: kazanilacakPuan). Kargoya puan verilmez.
  const kazanilacakBonus = kazanilacakPuan(genelToplam - kargoUcreti);

  const handleArtir = (id: number, quantity: number) => {
    setEklendi(id);
    updateQuantity(id, quantity + 1);
    setTimeout(() => setEklendi(null), 400);
  };

  const handleAzalt = (id: number, quantity: number) => {
    updateQuantity(id, quantity - 1);
  };

  if (items.length === 0) return (
    <main style={{ minHeight: "100vh", background: "#FDF6EE", fontFamily: "sans-serif" }}>
      <header style={{ background: "white", padding: "16px 24px", borderBottom: "1px solid #E8D5B7", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/" style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: "#5C3D2E", textDecoration: "none" }}>
          evemama<span style={{ color: "#E8845A", fontStyle: "italic" }}>.net</span>
        </Link>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: "#5C3D2E" }}>🛒 Sepetim</div>
        <Link href="/" style={{ fontSize: 13, color: "#E8845A", textDecoration: "none", fontWeight: 600 }}>← Alışverişe Devam</Link>
      </header>

      <div style={{ background: "linear-gradient(135deg, #5C3D2E, #8B5E42)", padding: "12px 24px", textAlign: "center", color: "white", fontSize: 13, fontWeight: 600 }}>
        🚀 1000₺ üzeri ücretsiz kargo &nbsp;|&nbsp; 🎁 5000₺ alışverişe 200₺ indirim &nbsp;|&nbsp; 🎉 10.000₺ alışverişe 500₺ indirim
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", padding: "24px" }}>
        <div style={{ textAlign: "center", background: "white", borderRadius: 24, padding: "48px 32px", boxShadow: "0 8px 32px rgba(92,61,46,0.08)", width: "100%", maxWidth: 420 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🛒</div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: "#5C3D2E", marginBottom: 8 }}>Sepetiniz boş</div>
          <div style={{ fontSize: 14, color: "#5C3D2E", opacity: 0.5, marginBottom: 28 }}>Ürün eklemek için alışverişe başlayın</div>
          <Link href="/" style={{ background: "#E8845A", color: "white", padding: "14px 28px", borderRadius: 50, textDecoration: "none", fontWeight: 700, fontSize: 14, display: "inline-block", boxShadow: "0 8px 20px rgba(232,132,90,0.3)" }}>
            Alışverişe Başla 🐾
          </Link>
        </div>
      </div>
    </main>
  );

  return (
    <main style={{ minHeight: "100vh", background: "#FDF6EE", fontFamily: "sans-serif" }}>
      <header style={{ background: "white", padding: "16px 24px", borderBottom: "1px solid #E8D5B7", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100 }}>
        <Link href="/" style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, color: "#5C3D2E", textDecoration: "none" }}>
          evemama<span style={{ color: "#E8845A", fontStyle: "italic" }}>.net</span>
        </Link>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 700, color: "#5C3D2E" }}>
          🛒 Sepetim
          <span style={{ background: "#E8845A", color: "white", borderRadius: 50, fontSize: 12, fontWeight: 700, padding: "2px 9px", marginLeft: 8 }}>{totalItems}</span>
        </div>
        <Link href="/" style={{ fontSize: 13, color: "#E8845A", textDecoration: "none", fontWeight: 600 }}>← Devam</Link>
      </header>

      {kargoUcreti > 0 ? (
        <div style={{ background: "linear-gradient(135deg, #5C3D2E, #8B5E42)", padding: "12px 24px", textAlign: "center" }}>
          <div style={{ color: "white", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
            🚀 Ücretsiz kargo için <strong style={{ color: "#F4C09A", fontSize: 15 }}>₺{kargoyaKalan.toFixed(2)}</strong> daha alışveriş yap!
          </div>
          <div style={{ maxWidth: 400, margin: "0 auto", background: "rgba(255,255,255,0.2)", borderRadius: 50, height: 8, overflow: "hidden" }}>
            <div style={{ width: `${Math.min((totalPrice / 1000) * 100, 100)}%`, height: "100%", background: "#E8845A", borderRadius: 50, transition: "width .4s ease" }} />
          </div>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, marginTop: 4 }}>₺{totalPrice.toFixed(2)} / ₺1000</div>
        </div>
      ) : (
        <div style={{ background: "linear-gradient(135deg, #8BAF8E, #5C8C60)", padding: "12px 24px", textAlign: "center", color: "white", fontSize: 13, fontWeight: 600 }}>
          🎉 Tebrikler! Kargo ücretsiz! 🐾
        </div>
      )}

      {sonrakiIndirim && (
        <div style={{ background: "linear-gradient(135deg,#FFF5E0,#FFE8C0)", padding: "12px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#5C3D2E", marginBottom: 6 }}>
            🎁 <strong style={{ color: "#E8845A" }}>₺{sonrakiIndirim.kalan.toFixed(2)}</strong> daha ekle, <strong>bu siparişte toplam {sonrakiIndirim.indirim}₺ indirim</strong> kazan!
          </div>
          <div style={{ maxWidth: 400, margin: "0 auto", background: "rgba(92,61,46,0.12)", borderRadius: 50, height: 8, overflow: "hidden" }}>
            <div style={{ width: `${Math.min((totalPrice / sonrakiIndirim.hedef) * 100, 100)}%`, height: "100%", background: "#E8845A", borderRadius: 50, transition: "width .4s ease" }} />
          </div>
          <div style={{ fontSize: 11, color: "#5C3D2E", opacity: 0.6, marginTop: 4 }}>
            ₺{totalPrice.toFixed(2)} / ₺{sonrakiIndirim.hedef.toLocaleString("tr-TR")}
          </div>
        </div>
      )}

      {indirimMiktari > 0 && (
        <div style={{ background: "linear-gradient(135deg,#E8F5E9,#C8E6C9)", padding: "12px 24px", textAlign: "center", color: "#2E7D32", fontSize: 13, fontWeight: 700 }}>
          ✓ Bu siparişe <strong>{indirimMiktari}₺ indirim</strong> uygulandı 🎉
        </div>
      )}


      <div style={{ maxWidth: 960, margin: "0 auto", padding: "16px" }}>

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: "#5C3D2E" }}>Ürünler ({totalItems})</div>
            <button onClick={() => clearCart()}
              style={{ background: "none", border: "1.5px solid #E8D5B7", color: "#5C3D2E", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: "6px 12px", borderRadius: 50, transition: "all .2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#E8845A"; e.currentTarget.style.color = "#E8845A"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#E8D5B7"; e.currentTarget.style.color = "#5C3D2E"; }}>
              🗑️ Temizle
            </button>
          </div>

          {items.map(item => (
            <div key={item.id} style={{
              background: "white", borderRadius: 16, padding: "14px", marginBottom: 10,
              display: "flex", alignItems: "center", gap: 12,
              boxShadow: eklendi === item.id ? "0 0 0 2px #E8845A" : "0 4px 16px rgba(92,61,46,0.06)",
              opacity: silindi === item.id ? 0.3 : 1,
              transform: eklendi === item.id ? "scale(1.01)" : "scale(1)",
              transition: "all .25s"
            }}>
              <div style={{ width: 64, height: 64, background: "#FDF6EE", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden", position: "relative" }}>
                {item.resim_url ? (
                  <Image src={item.resim_url} alt={item.name} fill sizes="64px" style={{ objectFit: "contain", padding: 6, mixBlendMode: "multiply" }} />
                ) : (
                  <span style={{ fontSize: 32 }}>{item.emoji}</span>
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 13, fontWeight: 700, color: "#5C3D2E", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.slug ? <Link href={`/urun/${item.slug}`} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "none" }}>{item.name}</Link> : item.name}</div>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 700, color: "#E8845A" }}>₺{item.price}</div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#FDF6EE", borderRadius: 50, padding: "3px 6px" }}>
                <button onClick={() => handleAzalt(item.id, item.quantity)}
                  style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: "white", cursor: "pointer", fontSize: 16, fontWeight: 700, color: "#5C3D2E", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(92,61,46,0.1)", transition: "transform .15s" }}
                  onMouseDown={e => e.currentTarget.style.transform = "scale(0.85)"}
                  onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}>−</button>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#5C3D2E", minWidth: 20, textAlign: "center" }}>{item.quantity}</span>
                <button onClick={() => handleArtir(item.id, item.quantity)}
                  style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: "#E8845A", cursor: "pointer", fontSize: 16, fontWeight: 700, color: "white", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(232,132,90,0.3)", transition: "transform .15s" }}
                  onMouseDown={e => e.currentTarget.style.transform = "scale(0.85)"}
                  onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}>+</button>
              </div>

              <div style={{ fontFamily: "Georgia, serif", fontSize: 14, fontWeight: 700, color: "#5C3D2E", minWidth: 60, textAlign: "right" }}>
                ₺{(item.price * item.quantity).toFixed(2)}
              </div>

              <button onClick={() => { setSilindi(item.id); setTimeout(() => { removeItem(item.id); setSilindi(null); }, 300); }}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, opacity: 0.3, padding: 4, transition: "all .2s", flexShrink: 0 }}
                onMouseEnter={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "scale(1.2)"; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = "0.3"; e.currentTarget.style.transform = "scale(1)"; }}>
                🗑️
              </button>
            </div>
          ))}
        </div>

        <div style={{ background: "white", borderRadius: 20, padding: "24px", boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: "#5C3D2E", marginBottom: 16 }}>Sipariş Özeti</div>

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 14, color: "#5C3D2E" }}>
            <span>{totalItems} ürün</span>
            <span>₺{totalPrice.toFixed(2)}</span>
          </div>

          {!kuponKazandi && (totalPrice >= TUTAR_INDIRIMI.ESIK_1 || totalPrice >= TUTAR_INDIRIMI.ESIK_2) && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 14 }}>
              <span style={{ color: "#2E7D32", fontWeight: 600 }}>🎁 {indirimAciklama}</span>
              <span style={{ color: "#2E7D32", fontWeight: 700 }}>−₺{(totalPrice >= TUTAR_INDIRIMI.ESIK_2 ? TUTAR_INDIRIMI.INDIRIM_2 : TUTAR_INDIRIMI.INDIRIM_1).toFixed(2)}</span>
            </div>
          )}

          {!kuponKazandi && bonusUygulanabilir && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 14 }}>
              <span style={{ color: "#2E7D32", fontWeight: 600 }}>🎁 Sadakat bonusu</span>
              <span style={{ color: "#2E7D32", fontWeight: 700 }}>−₺{bonus!.tutar.toFixed(2)}</span>
            </div>
          )}
          {!kuponKazandi && bonus && !bonusUygulanabilir && (
            <div style={{ background: "#FFF7ED", borderRadius: 12, padding: "10px 14px", marginBottom: 10, fontSize: 12, color: "#E8845A", textAlign: "center", border: "1.5px dashed #E8845A" }}>
              🎁 ₺{bonus.tutar.toFixed(2)} sadakat bonusunuz var! Min. ₺{bonus.min_sepet.toFixed(0)} sepet ile kullanabilirsiniz.
            </div>
          )}

          {/* Kupon kodu */}
          {uygulananKupon ? (
            kuponKazandi ? (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, fontSize: 14 }}>
                <span style={{ color: "#2E7D32", fontWeight: 600 }}>🎟️ Kupon: {uygulananKupon.kod}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "#2E7D32", fontWeight: 700 }}>−₺{uygulananKupon.indirim.toFixed(2)}</span>
                  <button onClick={kuponKaldir} style={{ background: "none", border: "none", color: "#C62828", cursor: "pointer", fontSize: 12, textDecoration: "underline", fontFamily: "inherit" }}>kaldır</button>
                </span>
              </div>
            ) : (
              <div style={{ background: "#FFF7ED", borderRadius: 12, padding: "10px 14px", marginBottom: 10, fontSize: 12, color: "#E8845A", textAlign: "center", border: "1.5px dashed #E8845A" }}>
                🎟️ {uygulananKupon.kod} uygulandı ama mevcut indiriminiz daha avantajlı.{" "}
                <button onClick={kuponKaldir} style={{ background: "none", border: "none", color: "#C62828", cursor: "pointer", fontSize: 12, textDecoration: "underline", fontFamily: "inherit" }}>kaldır</button>
              </div>
            )
          ) : (
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={kuponKodu} onChange={e => setKuponKodu(e.target.value.toUpperCase())} onKeyDown={e => e.key === "Enter" && kuponDogrula(kuponKodu)} placeholder="Kupon kodu" style={{ flex: 1, padding: "10px 12px", border: "2px solid #E8D5B7", borderRadius: 10, fontSize: 13, outline: "none", fontFamily: "inherit", color: "#5C3D2E", background: "white", boxSizing: "border-box" as const }} />
                <button onClick={() => kuponDogrula(kuponKodu)} disabled={kuponYukleniyor || !kuponKodu.trim()} style={{ background: kuponYukleniyor || !kuponKodu.trim() ? "#C9B79C" : "#5C3D2E", color: "white", border: "none", borderRadius: 10, padding: "0 16px", fontSize: 13, fontWeight: 700, cursor: kuponYukleniyor || !kuponKodu.trim() ? "not-allowed" : "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>{kuponYukleniyor ? "..." : "Uygula"}</button>
              </div>
              {kuponMesaj && <div style={{ fontSize: 12, color: "#C62828", marginTop: 6 }}>{kuponMesaj}</div>}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, fontSize: 14, color: "#5C3D2E" }}>
            <span>Kargo</span>
            <span style={{ color: kargoUcreti === 0 ? "#8BAF8E" : "#5C3D2E", fontWeight: kargoUcreti === 0 ? 700 : 400 }}>
              {kargoUcreti === 0 ? "Ücretsiz 🎉" : `₺${kargoUcreti.toFixed(2)}`}
            </span>
          </div>

          {kargoUcreti > 0 && (
            <div style={{ background: "#FDF6EE", borderRadius: 12, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#5C3D2E", textAlign: "center", border: "1.5px dashed #E8D5B7" }}>
              🚀 <strong>₺{kargoyaKalan.toFixed(2)}</strong> daha ekle, kargo ücretsiz!
            </div>
          )}

          {sonrakiIndirim && (
            <div style={{ background: "#FFF8E8", borderRadius: 12, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#5C3D2E", textAlign: "center", border: "1.5px dashed #F4C09A" }}>
              🎁 <strong>₺{sonrakiIndirim.kalan.toFixed(2)}</strong> daha ekle, <strong>bu siparişte toplam {sonrakiIndirim.indirim}₺ indirim</strong> kazan!
            </div>
          )}


          {/* Sadakat bonusu KAZANMA — bu sipariş, BİR SONRAKİ alışveriş için. Bu
              siparişe uygulanan indirimlerden (yukarıdaki yeşil satırlar) GÖRSEL
              olarak ayrı (altın tema) ki "şimdi mi kazandım / sonra mı" karışmasın. */}
          {kullanici && kazanilacakBonus > 0 && (
            <div style={{ background: "linear-gradient(135deg,#FFF3D6,#FFE7B0)", borderRadius: 12, padding: "12px 14px", marginBottom: 16, fontSize: 12.5, color: "#6B4E00", textAlign: "center", border: "1.5px solid #E6B800" }}>
              🎁 Bu siparişten <strong>₺{kazanilacakBonus} puan</strong> kazanıyorsunuz — <strong>bir sonraki alışverişinizde</strong> kullanabilirsiniz.
            </div>
          )}

          <div style={{ borderTop: "2px solid #FDF6EE", paddingTop: 16, display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
            <span style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: "#5C3D2E" }}>Toplam</span>
            <div style={{ textAlign: "right" }}>
              {indirimMiktari > 0 && (
                <div style={{ fontSize: 13, color: "#5C3D2E", opacity: 0.4, textDecoration: "line-through", marginBottom: 2 }}>
                  ₺{(totalPrice + kargoUcreti).toFixed(2)}
                </div>
              )}
              <span style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: "#E8845A" }}>₺{genelToplam.toFixed(2)}</span>
            </div>
          </div>

          <Link href="/odeme"
            style={{ display: "block", background: "#E8845A", color: "white", borderRadius: 14, padding: "16px", textAlign: "center", textDecoration: "none", fontWeight: 700, fontSize: 16, boxShadow: "0 8px 20px rgba(232,132,90,0.3)", transition: "all .2s" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 28px rgba(232,132,90,0.45)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 20px rgba(232,132,90,0.3)"; }}
            onMouseDown={e => e.currentTarget.style.transform = "scale(0.97)"}
            onMouseUp={e => e.currentTarget.style.transform = "translateY(-2px)"}>
            Ödemeye Geç →
          </Link>

          <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap", marginTop: 16 }}>
            {["🔒 Güvenli Ödeme", "✅ Orijinal Ürün", "🚀 Hızlı Teslimat", "↩️ İade Garantisi"].map((t, i) => (
              <span key={i} style={{ fontSize: 11, color: "#5C3D2E", opacity: 0.5, background: "#FDF6EE", padding: "5px 10px", borderRadius: 50 }}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}