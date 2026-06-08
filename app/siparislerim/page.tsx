"use client";
import Link from "next/link";
// Müşteri sipariş takip sayfası — giriş yapmis kullanicinin tum
// siparislerini ve durumlarini gosterir. Müşteri kendi email'iyle eslestirilen
// siparisleri görür (siparisler.email = auth.user.email).

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Siparis = {
  id: number | string;
  siparis_no: string;
  durum: string;
  odeme_durumu: string;
  odeme_yontemi: string;
  toplam: number;
  ad: string;
  soyad: string;
  email: string;
  telefon: string;
  adres: string;
  sehir: string;
  kargo_takip?: string | null;
  created_at: string;
};

type Kalem = {
  id: number | string;
  siparis_id: number | string;
  adet: number;
  fiyat: number;
  urun_adi?: string;
  urunler?: { ad: string; resim_url?: string };
};

// Durum -> görsel mapping. Sıra timeline'ı temsil eder.
const DURUM_ADIMLARI = ["beklemede", "hazirlaniyor", "kargoda", "tamamlandi"];

const durumGorseli = (d: string): { etiket: string; bg: string; renk: string; icon: string } => {
  switch (d) {
    case "beklemede":    return { etiket: "Ödeme Bekleniyor", bg: "#FFF8E1", renk: "#F57F17", icon: "⏳" };
    case "hazirlaniyor": return { etiket: "Hazırlanıyor",     bg: "#E3F2FD", renk: "#1565C0", icon: "🔧" };
    case "kargoda":      return { etiket: "Kargoda",          bg: "#FFF3E0", renk: "#E65100", icon: "🚚" };
    case "tamamlandi":   return { etiket: "Teslim Edildi",    bg: "#E8F5E9", renk: "#2E7D32", icon: "✅" };
    case "iptal":        return { etiket: "İptal Edildi",     bg: "#FFEBEE", renk: "#C62828", icon: "❌" };
    case "iade":         return { etiket: "İade Edildi",      bg: "#F3E5F5", renk: "#6A1B9A", icon: "↩️" };
    default:             return { etiket: d || "Bilinmiyor",  bg: "#F5F5F5", renk: "#666",    icon: "❓" };
  }
};

const odemeGorseli = (d: string): { etiket: string; renk: string } => {
  switch (d) {
    case "odendi":    return { etiket: "Ödendi",          renk: "#2E7D32" };
    case "beklemede": return { etiket: "Ödeme Bekleniyor", renk: "#F57F17" };
    case "iptal":     return { etiket: "İptal",            renk: "#C62828" };
    case "iade":      return { etiket: "İade Edildi",      renk: "#6A1B9A" };
    default:          return { etiket: d || "—",           renk: "#666" };
  }
};

export default function Siparislerim() {
  const [yukleniyor, setYukleniyor] = useState(true);
  const [siparisler, setSiparisler] = useState<Siparis[]>([]);
  const [siparisKalemleri, setSiparisKalemleri] = useState<Record<string, Kalem[]>>({});
  const [hata, setHata] = useState<string | null>(null);
  const [girisYok, setGirisYok] = useState(false);
  const [acikSiparis, setAcikSiparis] = useState<string | number | null>(null);

  useEffect(() => {
    const yukle = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setGirisYok(true);
          setYukleniyor(false);
          return;
        }
        // Email ile eslestir — siparisler tablosunda user_id linki yok,
        // email uzerinden buluyoruz. Auth email'i lowercase ve trim'lenmis
        // sekliyle karsilastirma daha guvenli olur.
        const userEmail = (user.email || "").toLowerCase().trim();
        const { data, error } = await supabase
          .from("siparisler")
          .select("*")
          .ilike("email", userEmail)
          .order("created_at", { ascending: false });
        if (error) throw error;
        setSiparisler((data || []) as Siparis[]);
        setYukleniyor(false);
      } catch (err) {
        console.error("[siparislerim]", err);
        setHata("Siparişler yüklenemedi. Sayfayı yenileyin.");
        setYukleniyor(false);
      }
    };
    yukle();
  }, []);

  const kalemleriYukle = async (siparisId: string | number) => {
    if (siparisKalemleri[String(siparisId)]) {
      // Toggle aç/kapa
      setAcikSiparis(acikSiparis === siparisId ? null : siparisId);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("siparis_kalemleri")
        .select("*, urunler(ad, resim_url)")
        .eq("siparis_id", siparisId);
      if (error) throw error;
      setSiparisKalemleri(prev => ({ ...prev, [String(siparisId)]: (data || []) as Kalem[] }));
      setAcikSiparis(siparisId);
    } catch (err) {
      console.error("[siparis kalemleri]", err);
      // siparisler.urunler JSON kolonunu da deneyelim (alternatif sema)
      const s = siparisler.find(x => x.id === siparisId);
      if (s && (s as any).urunler) {
        try {
          const arr = typeof (s as any).urunler === "string" ? JSON.parse((s as any).urunler) : (s as any).urunler;
          setSiparisKalemleri(prev => ({ ...prev, [String(siparisId)]: (arr || []) as Kalem[] }));
          setAcikSiparis(siparisId);
          return;
        } catch {}
      }
      setSiparisKalemleri(prev => ({ ...prev, [String(siparisId)]: [] }));
      setAcikSiparis(siparisId);
    }
  };

  // GİRİŞ YOK EKRANI
  if (girisYok) return (
    <main style={{ minHeight: "100vh", background: "#FDF6EE", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", padding: 20 }}>
      <div style={{ background: "white", borderRadius: 24, padding: "48px 40px", maxWidth: 440, width: "100%", textAlign: "center", boxShadow: "0 20px 60px rgba(92,61,46,0.1)" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🔒</div>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: "#5C3D2E", marginBottom: 10 }}>Giriş Gerekli</h1>
        <p style={{ fontSize: 14, color: "#5C3D2E", opacity: 0.7, lineHeight: 1.6, marginBottom: 24 }}>
          Siparişlerinizi görüntülemek için lütfen giriş yapın.
        </p>
        <Link href="/giris" style={{ background: "#E8845A", color: "white", padding: "14px 32px", borderRadius: 50, textDecoration: "none", fontWeight: 700, fontSize: 15, display: "inline-block", marginRight: 8 }}>
          Giriş Yap
        </Link>
        <Link href="/uye-ol" style={{ background: "#FDF6EE", color: "#5C3D2E", border: "2px solid #E8D5B7", padding: "12px 32px", borderRadius: 50, textDecoration: "none", fontWeight: 700, fontSize: 15, display: "inline-block" }}>
          Üye Ol
        </Link>
      </div>
    </main>
  );

  if (yukleniyor) return (
    <main style={{ minHeight: "100vh", background: "#FDF6EE", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 16, color: "#5C3D2E" }}>Siparişleriniz yükleniyor...</div>
      </div>
    </main>
  );

  return (
    <main style={{ minHeight: "100vh", background: "#FDF6EE", fontFamily: "sans-serif" }}>
      {/* HEADER */}
      <header style={{ background: "white", padding: "16px 48px", borderBottom: "1px solid #E8D5B7", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/" style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: "#5C3D2E", textDecoration: "none" }}>
          evemama<span style={{ color: "#E8845A", fontStyle: "italic" }}>.net</span>
        </Link>
        <Link href="/" style={{ color: "#E8845A", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>← Ana Sayfa</Link>
      </header>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px 80px" }}>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: 28, fontWeight: 700, color: "#5C3D2E", marginBottom: 8 }}>Siparişlerim</h1>
        <p style={{ fontSize: 14, color: "#5C3D2E", opacity: 0.6, marginBottom: 28 }}>{siparisler.length} sipariş bulundu</p>

        {hata && (
          <div role="alert" style={{ background: "#FFEBEE", color: "#C62828", padding: "12px 16px", borderRadius: 12, marginBottom: 20, fontSize: 13, fontWeight: 600 }}>
            ⚠️ {hata}
          </div>
        )}

        {siparisler.length === 0 ? (
          <div style={{ background: "white", borderRadius: 20, padding: "60px 40px", textAlign: "center", boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📦</div>
            <h2 style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, color: "#5C3D2E", marginBottom: 10 }}>Henüz siparişiniz yok</h2>
            <p style={{ fontSize: 14, color: "#5C3D2E", opacity: 0.7, marginBottom: 24 }}>Alışverişe başlamak için ürünleri keşfedin.</p>
            <Link href="/urunler" style={{ background: "#E8845A", color: "white", padding: "12px 28px", borderRadius: 50, textDecoration: "none", fontWeight: 700, fontSize: 14, display: "inline-block" }}>
              Ürünlere Göz At →
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {siparisler.map(sp => {
              const dg = durumGorseli(sp.durum || "beklemede");
              const og = odemeGorseli(sp.odeme_durumu || "beklemede");
              const aktifAdimIdx = DURUM_ADIMLARI.indexOf(sp.durum);
              const tarih = new Date(sp.created_at);
              const acik = acikSiparis === sp.id;
              const kalemler = siparisKalemleri[String(sp.id)] || [];
              return (
                <div key={sp.id} style={{ background: "white", borderRadius: 20, padding: "20px 24px", boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
                  {/* Üst — sipariş no, tarih, durum */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
                    <div>
                      <div style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: "#5C3D2E" }}>#{sp.siparis_no}</div>
                      <div style={{ fontSize: 12, color: "#5C3D2E", opacity: 0.5, marginTop: 2 }}>
                        {tarih.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ background: dg.bg, color: dg.renk, padding: "6px 14px", borderRadius: 50, fontSize: 12, fontWeight: 700 }}>
                        {dg.icon} {dg.etiket}
                      </span>
                      <span style={{ background: "#F5F5F5", color: og.renk, padding: "6px 14px", borderRadius: 50, fontSize: 12, fontWeight: 700 }}>
                        💳 {og.etiket}
                      </span>
                    </div>
                  </div>

                  {/* TIMELINE — eğer iptal/iade değilse */}
                  {!["iptal", "iade"].includes(sp.durum) && (
                    <div style={{ display: "flex", alignItems: "center", marginBottom: 16, padding: "12px 0", borderTop: "1px dashed #F0E8E0", borderBottom: "1px dashed #F0E8E0" }}>
                      {DURUM_ADIMLARI.map((adim, i) => {
                        const tamam = i <= aktifAdimIdx;
                        const aktif = i === aktifAdimIdx;
                        const g = durumGorseli(adim);
                        return (
                          <div key={adim} style={{ flex: 1, display: "flex", alignItems: "center" }}>
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                              <div style={{
                                width: 36, height: 36, borderRadius: "50%",
                                background: tamam ? g.renk : "#F0EBE3",
                                color: tamam ? "white" : "#999",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 16, fontWeight: 700,
                                boxShadow: aktif ? `0 0 0 4px ${g.bg}` : "none",
                                transition: "all .2s",
                              }}>{g.icon}</div>
                              <div style={{ fontSize: 10, fontWeight: 700, color: tamam ? g.renk : "#999", marginTop: 6, textAlign: "center" }}>
                                {g.etiket}
                              </div>
                            </div>
                            {i < DURUM_ADIMLARI.length - 1 && (
                              <div style={{ flex: 0.5, height: 2, background: i < aktifAdimIdx ? "#8BAF8E" : "#F0EBE3", marginBottom: 18, transition: "all .2s" }} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* KARGO TAKİP */}
                  {sp.durum === "kargoda" && sp.kargo_takip && (
                    <div style={{ background: "#FFF3E0", borderRadius: 12, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#5C3D2E" }}>
                      🚚 <strong>Kargo Takip No:</strong> <span style={{ fontFamily: "monospace", fontWeight: 700 }}>{sp.kargo_takip}</span>
                    </div>
                  )}

                  {/* ALT — toplam ve detay buton */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                    <div>
                      <span style={{ fontSize: 12, color: "#5C3D2E", opacity: 0.6 }}>Toplam: </span>
                      <span style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, color: "#E8845A" }}>
                        ₺{parseFloat(String(sp.toplam || 0)).toFixed(2)}
                      </span>
                    </div>
                    <button onClick={() => kalemleriYukle(sp.id)}
                      style={{ background: acik ? "#5C3D2E" : "#FDF6EE", color: acik ? "white" : "#5C3D2E", border: "2px solid #E8D5B7", borderRadius: 50, padding: "8px 18px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                      {acik ? "Kapat ▲" : "Detay Göster ▼"}
                    </button>
                  </div>

                  {/* AÇILIR DETAY */}
                  {acik && (
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #F0E8E0" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#5C3D2E", opacity: 0.5, textTransform: "uppercase", marginBottom: 6 }}>Teslimat Adresi</div>
                          <div style={{ fontSize: 13, color: "#5C3D2E" }}>{sp.adres}</div>
                          <div style={{ fontSize: 13, color: "#5C3D2E", fontWeight: 600, marginTop: 2 }}>{sp.sehir}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#5C3D2E", opacity: 0.5, textTransform: "uppercase", marginBottom: 6 }}>İletişim</div>
                          <div style={{ fontSize: 13, color: "#5C3D2E" }}>{sp.telefon}</div>
                          <div style={{ fontSize: 13, color: "#5C3D2E", opacity: 0.7, marginTop: 2 }}>{sp.email}</div>
                        </div>
                      </div>

                      {kalemler.length > 0 && (
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#5C3D2E", opacity: 0.5, textTransform: "uppercase", marginBottom: 8 }}>
                            Sipariş İçeriği ({kalemler.length} kalem)
                          </div>
                          <div style={{ background: "#FDF6EE", borderRadius: 12, padding: 12 }}>
                            {kalemler.map((k, i) => {
                              const ad = (k as any).urunler?.ad || k.urun_adi || (k as any).ad || (k as any).name || "Ürün";
                              const fiyat = parseFloat(String(k.fiyat || (k as any).birim_fiyat || (k as any).price || 0));
                              const adet = k.adet || (k as any).miktar || (k as any).quantity || 1;
                              return (
                                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13, color: "#5C3D2E", borderBottom: i < kalemler.length - 1 ? "1px dashed #E8D5B7" : "none" }}>
                                  <span>{ad} <span style={{ opacity: 0.5 }}>× {adet}</span></span>
                                  <span style={{ fontWeight: 700 }}>₺{(fiyat * adet).toFixed(2)}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
