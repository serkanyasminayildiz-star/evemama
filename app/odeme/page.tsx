"use client";
import { useState, useEffect, type ChangeEvent } from "react";
import Link from "next/link";
import { useCart } from "../../context/CartContext";
import { supabase } from "../../lib/supabase";
import { KARGO, TUTAR_INDIRIMI, SADAKAT, hesaplaIndirim, sepetAgirligiKg } from "../../lib/indirim";
import { HAVALE_HESAP } from "../../lib/havale";
import { ELDEN_TESLIMAT, eldenUygun, teslimBilgisi } from "../../lib/eldenTeslimat";
import { clarityEvent, claritySet } from "../../lib/clarity";
import { telefonGecerli } from "../../lib/fraudKoruma";
import { TR_ILLER, IL_LISTESI } from "../../lib/tr-iller";

export default function Odeme() {
  const { items, totalPrice, clearCart } = useCart();
  const [yukleniyor, setYukleniyor] = useState(false);
  const [odemeYontemi, setOdemeYontemi] = useState<"kart" | "havale" | "elden">("kart");
  // Yurtdışı IP'de kartla ödeme kapalıdır (kart deneme saldırısı koruması);
  // havale/EFT açık kalır. Sunucu /api/odeme'de de zorlar — bu yalnız UX.
  // Varsayılan AÇIK: kontrol yanıtı gelene kadar gerçek müşteri engellenmez.
  const [kartAcik, setKartAcik] = useState(true);
  const [sozlesme, setSozlesme] = useState(false);
  const [aydinlatma, setAydinlatma] = useState(false);
  const [hata, setHata] = useState("");
  const [uye, setUye] = useState(false);
  const [bonus, setBonus] = useState<{ tutar: number; min_sepet: number } | null>(null);
  const [kuponKodu, setKuponKodu] = useState("");
  const [uygulananKupon, setUygulananKupon] = useState<{ kod: string; indirim: number } | null>(null);
  const [kuponMesaj, setKuponMesaj] = useState("");
  const [kuponYukleniyor, setKuponYukleniyor] = useState(false);
  const [form, setForm] = useState({
    name: "", surname: "", email: "",
    phone: "", address: "", city: "", ilce: ""
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm({ ...form, [e.target.name]: e.target.value });

  // Üyelik durumu (sadakat bonusu + kargo teşviki gösterimi için).
  useEffect(() => {
    supabase.auth.getUser()
      .then(({ data: { user } }) => setUye(!!user))
      .catch(err => console.error("[odeme] uye kontrolu:", err));
  }, []);

  // Sadakat bonusu — üye giriş yapmışsa geçerli bonusu (gösterim için;
  // gerçek indirim handleOde'de sunucuda doğrulanır).
  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;
        const res = await fetch("/api/bonus", { headers: { Authorization: `Bearer ${session.access_token}` } });
        const d = await res.json();
        if (d.bonus) setBonus(d.bonus);
      } catch { /* bonus gosterilemezse odeme calismaya devam eder */ }
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
          // Clarity: kupon reddi görünür olsun (yazım hatası/limit/süre vakaları)
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

  useEffect(() => {
    const kayitli = typeof window !== "undefined" ? localStorage.getItem("evemama_kupon") : null;
    if (kayitli) { setKuponKodu(kayitli); kuponDogrula(kayitli, true); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPrice]);

  const kdv = totalPrice * 0.20;
  const bonusUygulanabilir = !!bonus && totalPrice >= bonus.min_sepet;

  // TEK KAYNAK indirim hesabı — server (api/odeme) + sepet ile AYNI saf fonksiyon.
  const hesap = hesaplaIndirim({
    sepetTutari: totalPrice,
    toplamAgirlikKg: sepetAgirligiKg(items),
    bonusTutar: bonusUygulanabilir ? bonus!.tutar : 0,
    kuponIndirimi: uygulananKupon ? uygulananKupon.indirim : 0,
  });
  const kargoUcreti = hesap.kargo;
  const kuponKazandi = hesap.kuponKazandi;
  const indirimMiktari = hesap.indirimMiktari;
  const indirimAciklama = totalPrice >= TUTAR_INDIRIMI.ESIK_2 ? "10.000₺ üzeri indirim" : totalPrice >= TUTAR_INDIRIMI.ESIK_1 ? "5.000₺ üzeri indirim" : "";
  const indirimEtiketleri = kuponKazandi
    ? `Kupon ${uygulananKupon!.kod}`
    : [indirimAciklama, bonusUygulanabilir ? "Sadakat bonusu" : ""].filter(Boolean).join(" + ");
  const genelToplam = hesap.genelToplam;

  // İzmir elden teslimat: il=İzmir + kapsam ilçesi + sepet ≥ MIN_SEPET ise seçenek
  // görünür; elden seçiliyken KARGO ALINMAZ → ödenecek = toplam - kargo.
  const eldenKonumUygun = eldenUygun(form.city, form.ilce);
  const eldenSecilebilir = eldenKonumUygun && totalPrice >= ELDEN_TESLIMAT.MIN_SEPET;
  const eldenAktif = odemeYontemi === "elden" && eldenSecilebilir;
  const odenecekToplam = eldenAktif ? Math.max(0, genelToplam - kargoUcreti) : genelToplam;
  useEffect(() => {
    // İl/ilçe değişip kapsamdan çıkarsa elden seçimi karta döner (gizli seçim kalmasın).
    if (odemeYontemi === "elden" && !eldenSecilebilir) setOdemeYontemi(kartAcik ? "kart" : "havale");
    // Kart kapalıysa (yurtdışı) seçili yöntem havaleye kayar.
    if (odemeYontemi === "kart" && !kartAcik) setOdemeYontemi("havale");
  }, [odemeYontemi, eldenSecilebilir, kartAcik]);

  useEffect(() => {
    // Bağlantının ülkesini sor; yalnız "kart kapalı" yanıtında UI'ı daralt.
    // Hata/timeout durumunda hiçbir şey yapma → kart açık kalır (fail-open).
    let iptal = false;
    fetch("/api/odeme/kontrol")
      .then(r => r.json())
      .then(d => { if (!iptal && d?.kartAcik === false) setKartAcik(false); })
      .catch(() => {});
    return () => { iptal = true; };
  }, []);

  // Sadakat bonusu KAZANMA (bu sipariş → BİR SONRAKİ alışveriş). Yalnızca ÜYE.
  // Ödenecek tutara (genelToplam) göre eşik: ≥5000 → 200, ≥3000 → 150 —
  // odeme/sonuc'taki kurallarla BİREBİR AYNI. Sepetteki ile de aynı (tek kaynak).
  // Eşik ÖDENEN tutara (genelToplam) göredir; "sepete X ekle" deltası YANLIŞ
  // olurdu (ekledikçe tutar indirimi paidPrice'ı düşürür). Net eşik ifadesi.
  const kazanilacakBonus = genelToplam >= SADAKAT.KAZAN_ESIK_2 ? SADAKAT.KAZAN_2 : genelToplam >= SADAKAT.KAZAN_ESIK_1 ? SADAKAT.KAZAN_1 : 0;

  const handleOde = async () => {
    if (!sozlesme || !aydinlatma) { setHata("Lütfen yukarıdaki sözleşme onay kutularını işaretleyin."); return; }
    if (!form.name || !form.surname || !form.email || !form.address || !form.city || !form.ilce) { setHata("Lütfen tüm zorunlu alanları doldurun (il ve ilçe dahil)."); return; }
    // Telefon artık ZORUNLU: kargo teslimatı için gerekli + sahte numarayla
    // yapılan kart deneme saldırılarını keser (sunucuda da doğrulanır).
    const telKontrol = telefonGecerli(form.phone);
    if (!telKontrol.gecerli) { setHata(telKontrol.sebep || "Geçerli bir cep telefonu girin."); return; }
    setHata("");
    setYukleniyor(true);
    // Clarity funnel: ödeme denemesi + seçilen yöntem (kart/havale/elden)
    clarityEvent("odeme-basladi");
    claritySet("odeme-yontemi", odemeYontemi);
    try {
      // Üyelik doğrulaması SUNUCUDA yapılır (ilk sipariş indirimi için).
      // Oturum token'ını gönderiyoruz; sunucu indirimi/tutarı kendisi
      // hesaplar — bu yüzden tutar artık tarayıcıdan güven kaynağı değil.
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/odeme", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ items, buyer: { name: form.name, surname: form.surname, email: form.email, phone: form.phone, address: form.ilce ? `${form.address}, ${form.ilce}` : form.address, city: form.city }, ilce: form.ilce, kuponKodu: uygulananKupon?.kod || "", yontem: odemeYontemi }),
      });
      const data = await res.json();
      // Sunucu hataları (429 hız limiti, 400 telefon, 403 yurtdışı kart, 500)
      // yöntem dallarından ÖNCE ele alınır ki sunucunun net mesajı olduğu gibi
      // gösterilsin — kart dalı yalnız `errorMessage` okuduğu için bunlar
      // "Bilinmeyen hata" olarak görünüyordu.
      if (!res.ok) {
        if (data?.error === "kart-yurtdisi") {
          setKartAcik(false);          // kart seçeneğini gizle
          setOdemeYontemi("havale");   // müşteriyi çalışan yönteme al
          setHata(data.mesaj || "Yurt dışı bağlantılarda kartla ödeme kapalıdır. Havale/EFT ile devam edebilirsiniz.");
        } else {
          setHata(data?.error || data?.errorMessage || "İşlem tamamlanamadı, lütfen tekrar deneyin.");
        }
        setYukleniyor(false);
        return;
      }
      // Elden teslim: sipariş "ödeme bekliyor (elden)" oluştu → onay sayfasına git.
      if (odemeYontemi === "elden") {
        if (data.elden && data.siparisNo) {
          clearCart();
          window.location.href = `/odeme/elden?siparis=${encodeURIComponent(data.siparisNo)}&tutar=${encodeURIComponent(data.toplam || odenecekToplam.toFixed(2))}&teslim=${encodeURIComponent(data.teslim || "")}`;
        } else {
          setHata("Sipariş oluşturulamadı: " + (data.error || "Bilinmeyen hata"));
          setYukleniyor(false);
        }
        return;
      }
      // Havale: sipariş "ödeme bekliyor" olarak oluştu → sepeti temizle, onay sayfasına git.
      if (odemeYontemi === "havale") {
        if (data.havale && data.siparisNo) {
          clearCart();
          window.location.href = `/odeme/havale?siparis=${encodeURIComponent(data.siparisNo)}&tutar=${encodeURIComponent(data.toplam || genelToplam.toFixed(2))}`;
        } else {
          setHata("Sipariş oluşturulamadı: " + (data.error || "Bilinmeyen hata"));
          setYukleniyor(false);
        }
        return;
      }
      // Kart: iyzico güvenli ödeme sayfasına yönlendir.
      if (data.status === "success" && data.paymentPageUrl) {
        window.location.href = data.paymentPageUrl;
      } else {
        setHata("Ödeme başlatılamadı: " + (data.errorMessage || "Bilinmeyen hata"));
        setYukleniyor(false);
      }
    } catch {
      setHata("Bir hata oluştu, lütfen tekrar deneyin.");
      setYukleniyor(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "12px 16px",
    border: "2px solid #E8D5B7", borderRadius: 12,
    fontSize: 14, outline: "none",
    fontFamily: "inherit", color: "#5C3D2E", background: "white", boxSizing: "border-box" as const,
    marginBottom: 12,
  };

  return (
    <main style={{ minHeight: "100vh", background: "#FDF6EE", fontFamily: "sans-serif" }}>

      <style>{`
        .odeme-layout { max-width: 980px; margin: 0 auto; padding: 32px 24px; display: grid; grid-template-columns: 1fr 340px; gap: 24px; }
        .odeme-header { padding: 16px 48px; }
        .odeme-yontem-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .ad-soyad-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
        .ozet-sticky { height: fit-content; position: sticky; top: 90px; }
        @media (max-width: 768px) {
          .odeme-layout { grid-template-columns: 1fr !important; padding: 16px 14px 96px; gap: 16px; }
          .odeme-header { padding: 13px 16px !important; }
          .odeme-yontem-grid { grid-template-columns: 1fr !important; }
          .ad-soyad-grid { grid-template-columns: 1fr 1fr; }
          .ozet-sticky { position: static !important; }
        }
        @media (max-width: 480px) {
          .ad-soyad-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <header className="odeme-header" style={{ background: "white", borderBottom: "1px solid #E8D5B7", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100 }}>
        <Link href="/" style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, color: "#5C3D2E", textDecoration: "none" }}>
          evemama<span style={{ color: "#E8845A", fontStyle: "italic" }}>.net</span>
        </Link>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 700, color: "#5C3D2E" }}>💳 Güvenli Ödeme</div>
        <Link href="/sepet" style={{ fontSize: 13, color: "#E8845A", textDecoration: "none", fontWeight: 600 }}>← Sepet</Link>
      </header>

      <div className="odeme-layout">

        <div>
          <div style={{ background: "white", borderRadius: 20, padding: "24px", marginBottom: 16, boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: "#5C3D2E", marginBottom: 18 }}>👤 Teslimat Bilgileri</div>
            <div className="ad-soyad-grid">
              <input name="name" placeholder="Ad *" value={form.name} onChange={handleChange} style={inputStyle} />
              <input name="surname" placeholder="Soyad *" value={form.surname} onChange={handleChange} style={inputStyle} />
            </div>
            <input name="email" type="email" placeholder="E-posta *" value={form.email} onChange={handleChange} style={inputStyle} />
            <input name="phone" type="tel" inputMode="numeric" autoComplete="tel" placeholder="Cep Telefonu * (0532 XXX XX XX)" value={form.phone} onChange={handleChange} style={inputStyle} />
            <input name="address" placeholder="Adres *" value={form.address} onChange={handleChange} style={inputStyle} />
            <select name="city" value={form.city} onChange={e => setForm({ ...form, city: e.target.value, ilce: "" })} style={{ ...inputStyle, cursor: "pointer" }}>
              <option value="">İl seçin *</option>
              {IL_LISTESI.map(il => <option key={il} value={il}>{il}</option>)}
            </select>
            <select name="ilce" value={form.ilce} onChange={handleChange} disabled={!form.city} style={{ ...inputStyle, marginBottom: 0, cursor: form.city ? "pointer" : "not-allowed", opacity: form.city ? 1 : 0.55 }}>
              <option value="">{form.city ? "İlçe seçin *" : "Önce il seçin"}</option>
              {(form.city ? TR_ILLER[form.city] || [] : []).map(ilce => <option key={ilce} value={ilce}>{ilce}</option>)}
            </select>
          </div>

          <div style={{ background: "white", borderRadius: 20, padding: "24px", marginBottom: 16, boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: "#5C3D2E", marginBottom: 18 }}>💳 Ödeme Yöntemi</div>
            <div className="odeme-yontem-grid">
              {([
                ...(kartAcik ? [{ id: "kart" as const, icon: "💳", title: "Kredi / Banka Kartı", sub: "Taksit seçeneği mevcut" }] : []),
                { id: "havale" as const, icon: "🏦", title: "Banka Havalesi / EFT", sub: "Banka hesabına havale/EFT" },
                ...(eldenSecilebilir ? [{ id: "elden" as const, icon: "🛵", title: "Elden Teslim — Aynı Gün", sub: "İzmir merkez · kapıda nakit · kargo yok" }] : []),
              ]).map(o => (
                <div key={o.id} onClick={() => setOdemeYontemi(o.id)}
                  style={{ border: `2px solid ${odemeYontemi === o.id ? "#E8845A" : "#E8D5B7"}`, borderRadius: 16, padding: "14px 16px", cursor: "pointer", background: odemeYontemi === o.id ? "#FFF5F0" : "white", transition: "all .2s", display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${odemeYontemi === o.id ? "#E8845A" : "#E8D5B7"}`, background: odemeYontemi === o.id ? "#E8845A" : "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {odemeYontemi === o.id && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "white" }} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#5C3D2E" }}>{o.icon} {o.title}</div>
                    <div style={{ fontSize: 11, color: "#5C3D2E", opacity: 0.5 }}>{o.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {odemeYontemi === "kart" && (
              <div style={{ marginTop: 14, background: "#FDF6EE", borderRadius: 14, padding: "12px 16px", fontSize: 13, color: "#5C3D2E", opacity: 0.8 }}>
                🔒 Kart bilgileriniz <strong>iyzico</strong>&apos;nun güvenli sayfasında girilecektir.
              </div>
            )}

            {!kartAcik && (
              <div style={{ marginTop: 14, background: "#FFF8E1", border: "1.5px dashed #F9A825", borderRadius: 14, padding: "12px 16px", fontSize: 13, color: "#5C3D2E", lineHeight: 1.6 }}>
                🌍 Yurt dışı bağlantılarda güvenlik nedeniyle <strong>kartla ödeme kapalıdır</strong>. Siparişinizi <strong>havale/EFT</strong> ile tamamlayabilirsiniz. Türkiye&apos;den bağlanıyorsanız lütfen VPN&apos;i kapatıp sayfayı yenileyin.
              </div>
            )}

            {eldenKonumUygun && !eldenSecilebilir && (
              <div style={{ marginTop: 14, background: "#FFF8E1", border: "1.5px dashed #F9A825", borderRadius: 14, padding: "12px 16px", fontSize: 13, color: "#5C3D2E", lineHeight: 1.6 }}>
                🛵 <strong>İzmir Aynı Gün Elden Teslimat</strong> minimum ₺{ELDEN_TESLIMAT.MIN_SEPET.toLocaleString("tr-TR")} sepette geçerli — <strong>₺{(ELDEN_TESLIMAT.MIN_SEPET - totalPrice).toFixed(2)}</strong> daha ekleyin, bugün kapınıza getirelim!
              </div>
            )}

            {eldenAktif && (
              <div style={{ marginTop: 14, background: "#F0FAF1", border: "1.5px solid #8BAF8E", borderRadius: 14, padding: "16px 18px" }}>
                <div style={{ fontWeight: 700, color: "#2E7D32", marginBottom: 10, fontSize: 14 }}>🛵 İzmir Elden Teslimat — {form.ilce}</div>
                <div style={{ fontSize: 13, color: "#5C3D2E", lineHeight: 1.8 }}>
                  📦 <strong>{teslimBilgisi().metin}</strong> <span style={{ opacity: 0.6 }}>(saat 12:00&apos;a kadar verilen siparişler aynı gün)</span><br />
                  💵 Ödeme: <strong>kapıda nakit — ₺{odenecekToplam.toFixed(2)}</strong> <span style={{ opacity: 0.6 }}>(çok yakında kapıda kartla ödeme)</span><br />
                  📅 Teslimat günleri: Pazartesi – Cumartesi · Teslimattan önce telefonla haber veriyoruz
                </div>
              </div>
            )}

            {odemeYontemi === "havale" && (
              <div style={{ marginTop: 14, background: "#FDF6EE", borderRadius: 14, padding: "18px" }}>
                <div style={{ fontWeight: 700, color: "#5C3D2E", marginBottom: 12, fontSize: 14 }}>🏦 Banka Hesap Bilgileri</div>
                <div style={{ background: "white", borderRadius: 12, padding: "12px 14px", marginBottom: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#5C3D2E" }}>{HAVALE_HESAP.banka}</div>
                  <div style={{ fontSize: 12, color: "#5C3D2E", opacity: 0.6 }}>IBAN: {HAVALE_HESAP.iban}</div>
                  <div style={{ fontSize: 12, color: "#5C3D2E", opacity: 0.6 }}>Alıcı: {HAVALE_HESAP.unvan}</div>
                </div>
                <div style={{ fontSize: 12, color: "#E8845A", fontWeight: 600, lineHeight: 1.5 }}>⚠️ &quot;Siparişi Tamamla&quot;ya basın; sipariş numaranızı açıklamaya yazıp havale yapın. (IBAN + sipariş no onay sayfasında ve e-postanızda da olacak.)</div>
              </div>
            )}
          </div>

        </div>

        <div className="ozet-sticky">
          <div style={{ background: "white", borderRadius: 20, padding: "24px", boxShadow: "0 4px 16px rgba(92,61,46,0.06)", marginBottom: 14 }}>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: "#5C3D2E", marginBottom: 16 }}>🧾 Sipariş Özeti</div>
            {items.map(item => (
              <div key={item.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 13, color: "#5C3D2E" }}>
                <span style={{ flex: 1, paddingRight: 8 }}>{item.slug ? <Link href={`/urun/${item.slug}`} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "none" }}>{item.name.substring(0, 30)}{item.name.length > 30 ? "..." : ""}</Link> : <>{item.name.substring(0, 30)}{item.name.length > 30 ? "..." : ""}</>} <span style={{ opacity: 0.5 }}>x{item.quantity}</span></span>
                <span style={{ fontWeight: 700, flexShrink: 0 }}>₺{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div style={{ borderTop: "1px solid #F0E8E0", paddingTop: 14, marginTop: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13, color: "#5C3D2E" }}>
                <span>Ara Toplam</span><span>₺{totalPrice.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13, color: "#5C3D2E" }}>
                <span>KDV (%20)</span><span>₺{kdv.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, fontSize: 13, color: "#5C3D2E" }}>
                <span>Kargo</span>
                <span style={{ color: eldenAktif || kargoUcreti === 0 ? "#8BAF8E" : "#5C3D2E", fontWeight: eldenAktif || kargoUcreti === 0 ? 700 : 400 }}>
                  {eldenAktif ? "Elden Teslim 🛵 Ücretsiz" : kargoUcreti === 0 ? "Ücretsiz 🎉" : `₺${kargoUcreti.toFixed(2)}`}
                </span>
              </div>
              {indirimMiktari > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, fontSize: 13, color: "#2E7D32", fontWeight: 600 }}>
                  <span>🎁 {indirimEtiketleri}</span>
                  <span>−₺{indirimMiktari.toFixed(2)}</span>
                </div>
              )}

              {/* Kupon kodu */}
              <div style={{ marginBottom: 14 }}>
                {uygulananKupon ? (
                  kuponKazandi ? (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
                      <span style={{ color: "#2E7D32", fontWeight: 600 }}>🎟️ {uygulananKupon.kod} uygulandı</span>
                      <button onClick={kuponKaldir} style={{ background: "none", border: "none", color: "#C62828", cursor: "pointer", fontSize: 11, textDecoration: "underline", fontFamily: "inherit" }}>kaldır</button>
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: "#E8845A" }}>🎟️ {uygulananKupon.kod} uygulandı ama mevcut indiriminiz daha avantajlı.{" "}
                      <button onClick={kuponKaldir} style={{ background: "none", border: "none", color: "#C62828", cursor: "pointer", fontSize: 11, textDecoration: "underline", fontFamily: "inherit" }}>kaldır</button>
                    </div>
                  )
                ) : (
                  <>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input value={kuponKodu} onChange={e => setKuponKodu(e.target.value.toUpperCase())} onKeyDown={e => e.key === "Enter" && kuponDogrula(kuponKodu)} placeholder="Kupon kodu" style={{ flex: 1, padding: "10px 12px", border: "2px solid #E8D5B7", borderRadius: 10, fontSize: 13, outline: "none", fontFamily: "inherit", color: "#5C3D2E", background: "white", boxSizing: "border-box" as const }} />
                      <button onClick={() => kuponDogrula(kuponKodu)} disabled={kuponYukleniyor || !kuponKodu.trim()} style={{ background: kuponYukleniyor || !kuponKodu.trim() ? "#C9B79C" : "#5C3D2E", color: "white", border: "none", borderRadius: 10, padding: "0 14px", fontSize: 13, fontWeight: 700, cursor: kuponYukleniyor || !kuponKodu.trim() ? "not-allowed" : "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>{kuponYukleniyor ? "..." : "Uygula"}</button>
                    </div>
                    {kuponMesaj && <div style={{ fontSize: 11, color: "#C62828", marginTop: 6 }}>{kuponMesaj}</div>}
                  </>
                )}
              </div>

              {/* Sadakat bonusu KAZANMA — bu sipariş, BİR SONRAKİ alışveriş için.
                  Uygulanan indirimlerden (yukarıdaki yeşil satır) görsel olarak
                  ayrı (altın tema) ki "şimdi mi / sonra mı" karışmasın. */}
              {uye && kazanilacakBonus > 0 && (
                <div style={{ background: "linear-gradient(135deg,#FFF3D6,#FFE7B0)", borderRadius: 12, padding: "12px 14px", marginBottom: 14, fontSize: 12.5, color: "#6B4E00", textAlign: "center", border: "1.5px solid #E6B800" }}>
                  🎁 Bu siparişle <strong>bir sonraki alışverişinizde</strong> kullanmak üzere <strong>₺{kazanilacakBonus}</strong> sadakat bonusu kazanıyorsunuz!
                  {kazanilacakBonus === 150 && (
                    <><br />Ödemeniz <strong>₺5.000</strong> ve üzeri olursa bonusunuz <strong>₺200</strong> olur.</>
                  )}
                </div>
              )}
              {uye && kazanilacakBonus === 0 && genelToplam >= KARGO.BEDAVA_ESIK && (
                <div style={{ background: "linear-gradient(135deg,#FFF3D6,#FFE7B0)", borderRadius: 12, padding: "12px 14px", marginBottom: 14, fontSize: 12.5, color: "#6B4E00", textAlign: "center", border: "1.5px solid #E6B800" }}>
                  🎁 Ödemeniz <strong>₺3.000</strong> ve üzeri olursa, bir sonraki alışverişiniz için <strong>₺150</strong> sadakat bonusu kazanırsınız!
                </div>
              )}

              <div style={{ borderTop: "2px solid #FDF6EE", paddingTop: 14, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontFamily: "Georgia, serif", fontSize: 17, fontWeight: 700, color: "#5C3D2E" }}>Toplam</span>
                <span style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: "#E8845A" }}>₺{odenecekToplam.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Sözleşmeler — butonun HEMEN ÜSTÜNDE (müşteri görmeden basıp takılmasın) */}
          <div style={{ background: "white", borderRadius: 20, padding: "20px 24px", marginBottom: 14, boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 700, color: "#5C3D2E", marginBottom: 16 }}>📋 Sözleşmeler</div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
              <input type="checkbox" checked={sozlesme} onChange={e => setSozlesme(e.target.checked)}
                style={{ width: 18, height: 18, marginTop: 2, accentColor: "#E8845A", flexShrink: 0, cursor: "pointer" }} />
              <span style={{ fontSize: 13, color: "#5C3D2E", lineHeight: 1.6 }}>
                <Link href="/mesafeli-satis" style={{ color: "#E8845A", fontWeight: 700, textDecoration: "none" }}>Mesafeli Satış Sözleşmesi</Link>&apos;ni ve{" "}
                <Link href="/kullanim-kosullari" style={{ color: "#E8845A", fontWeight: 700, textDecoration: "none" }}>Ön Bilgilendirme Formu</Link>&apos;nu okudum, onaylıyorum. <span style={{ color: "red" }}>*</span>
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <input type="checkbox" checked={aydinlatma} onChange={e => setAydinlatma(e.target.checked)}
                style={{ width: 18, height: 18, marginTop: 2, accentColor: "#E8845A", flexShrink: 0, cursor: "pointer" }} />
              <span style={{ fontSize: 13, color: "#5C3D2E", lineHeight: 1.6 }}>
                <Link href="/kvkk" style={{ color: "#E8845A", fontWeight: 700, textDecoration: "none" }}>KVKK Aydınlatma Metni</Link>&apos;ni okudum,{" "}
                <Link href="/gizlilik" style={{ color: "#E8845A", fontWeight: 700, textDecoration: "none" }}>Gizlilik Politikası</Link>&apos;nı kabul ediyorum. <span style={{ color: "red" }}>*</span>
              </span>
            </div>
            {hata && (
              <div style={{ background: "#FFEBEE", color: "#C62828", padding: "10px 14px", borderRadius: 10, marginTop: 14, fontSize: 13, fontWeight: 600 }}>
                ❌ {hata}
              </div>
            )}
          </div>

          {/* Buton artık DEVRE DIŞI değil — kutular işaretsizse tıklayınca handleOde uyarı verir */}
          <button onClick={handleOde} disabled={yukleniyor}
            style={{ width: "100%", background: "#E8845A", color: "white", border: "none", borderRadius: 16, padding: "16px", fontSize: 16, fontWeight: 700, cursor: yukleniyor ? "not-allowed" : "pointer", fontFamily: "inherit", boxShadow: "0 8px 20px rgba(232,132,90,0.3)", transition: "all .2s", opacity: yukleniyor ? 0.7 : 1 }}>
            {yukleniyor ? "Yükleniyor..." : odemeYontemi === "elden" ? "Siparişi Tamamla 🛵" : odemeYontemi === "havale" ? "Siparişi Tamamla 🏦" : "Ödemeye Geç 🔒"}
          </button>

          <div style={{ textAlign: "center", marginTop: 10, fontSize: 11, color: "#5C3D2E", opacity: 0.4 }}>
            iyzico güvencesiyle korumalı ödeme
          </div>

          <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 12, flexWrap: "wrap" }}>
            {["🔒 SSL", "✅ Orijinal", "🚀 Hızlı Teslimat", "↩️ İade Garantisi"].map((t, i) => (
              <span key={i} style={{ fontSize: 10, color: "#5C3D2E", opacity: 0.5, background: "#FDF6EE", padding: "4px 8px", borderRadius: 50 }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      <style>{`.odeme-bottom-nav { display: none; } @media(max-width:768px){ .odeme-bottom-nav { display: grid !important; grid-template-columns: repeat(4,1fr); position: fixed; bottom: 0; left: 0; right: 0; z-index: 300; background: rgba(253,246,238,0.97); backdrop-filter: blur(14px); border-top: 1px solid rgba(92,61,46,.08); padding: 8px 0 20px; } }`}</style>
      <nav className="odeme-bottom-nav" style={{ display: "none" }}>
        <Link href="/" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, textDecoration: "none", padding: 4 }}>
          <span style={{ fontSize: 22 }}>🏠</span><span style={{ fontSize: 10, fontWeight: 600, color: "#5C3D2E", opacity: 0.4 }}>Anasayfa</span>
        </Link>
        <Link href="/urunler" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, textDecoration: "none", padding: 4 }}>
          <span style={{ fontSize: 22 }}>🛍️</span><span style={{ fontSize: 10, fontWeight: 600, color: "#5C3D2E", opacity: 0.4 }}>Ürünler</span>
        </Link>
        <Link href="/sepet" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, textDecoration: "none", padding: 4 }}>
          <span style={{ fontSize: 22 }}>🛒</span><span style={{ fontSize: 10, fontWeight: 600, color: "#5C3D2E", opacity: 0.4 }}>Sepet</span>
        </Link>
        <Link href="/sepet" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, textDecoration: "none", padding: 4 }}>
          <span style={{ fontSize: 22 }}>💳</span><span style={{ fontSize: 10, fontWeight: 600, color: "#E8845A", opacity: 1 }}>Ödeme</span>
        </Link>
      </nav>

    </main>
  );
}