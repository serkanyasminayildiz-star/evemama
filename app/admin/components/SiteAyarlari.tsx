"use client";
import type { CSSProperties } from "react";

type SiteAyarlar = Record<string, string>;

type Props = {
  siteAyarlari: SiteAyarlar;
  setSiteAyarlari: (a: SiteAyarlar) => void;
  siteAyarKaydet: (anahtar: string, deger: string) => Promise<void> | void;
  s: CSSProperties;
  btn: (bg?: string, extra?: CSSProperties) => CSSProperties;
};

// Site Ayarlari — Iyzico, Havale ve Iletisim ayarlari icin key-value editor.
// alanlar 'as const' ile tanimli; tip 'text' | 'email' literal'i guvenli.
export default function SiteAyarlari({ siteAyarlari, setSiteAyarlari, siteAyarKaydet, s, btn }: Props) {
  const bolumler = [
    { baslik: "💳 İyzico Ödeme", alanlar: [{ key: "iyzico_api_key", label: "API Key", tip: "text" as const }, { key: "iyzico_secret_key", label: "Secret Key", tip: "text" as const }, { key: "iyzico_base_url", label: "Base URL", tip: "text" as const }] },
    { baslik: "🏦 Havale / EFT", alanlar: [{ key: "havale_banka1", label: "Banka Adı", tip: "text" as const }, { key: "havale_iban1", label: "IBAN", tip: "text" as const }, { key: "havale_ad1", label: "Hesap Sahibi", tip: "text" as const }] },
    { baslik: "📞 İletişim", alanlar: [{ key: "whatsapp_no", label: "WhatsApp No", tip: "text" as const }, { key: "site_email", label: "E-posta", tip: "email" as const }] },
  ];

  return (
    <div>
      <h1 style={{ fontFamily: "Georgia,serif", fontSize: 24, fontWeight: 700, color: "#2C1A0E", marginBottom: 20 }}>Site Ayarları</h1>
      {bolumler.map((bolum, bi) => (
        <div key={bi} style={{ background: "white", borderRadius: 18, padding: 24, marginBottom: 16, boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
          <h2 style={{ fontFamily: "Georgia,serif", fontSize: 15, fontWeight: 700, color: "#2C1A0E", marginBottom: 16 }}>{bolum.baslik}</h2>
          {bolum.alanlar.map(({ key, label, tip }) => (
            <div key={key} style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#5C3D2E", opacity: 0.7, display: "block", marginBottom: 6 }}>{label}</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input type={tip} autoComplete="off" value={siteAyarlari[key] || ""} onChange={e => setSiteAyarlari({ ...siteAyarlari, [key]: e.target.value })} style={{ ...s, flex: 1, marginBottom: 0 }} />
                <button onClick={() => siteAyarKaydet(key, siteAyarlari[key] || "")} style={{ ...btn(), padding: "10px 16px" }}>Kaydet</button>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
