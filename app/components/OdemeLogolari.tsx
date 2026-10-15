// iyzico'nun zorunlu tuttuğu ödeme logoları: "iyzico ile Öde" + Mastercard, Visa,
// American Express, Troy. Kaynak: iyzico logo paketi (docs.iyzico.com → Ek Bilgiler →
// iyzico Logo Paketi), dosyalar değiştirilmeden public/iyzico/ altında.
// tema="koyu": koyu zemin (footer) → beyaz bant; "acik": açık zemin → renkli bant.
// SVG olduğu için next/image yerine <img>; genişlik/yükseklik verildi → yüklemede kayma yok.
import type { CSSProperties } from "react";

const BANT = {
  koyu: { src: "/iyzico/logo_band_white.svg", en: 456, boy: 32 },
  acik: { src: "/iyzico/logo_band_colored.svg", en: 429, boy: 32 },
} as const;

export default function OdemeLogolari({ tema = "koyu", yukseklik = 26, style }: { tema?: "koyu" | "acik"; yukseklik?: number; style?: CSSProperties }) {
  const b = BANT[tema];
  const genislik = Math.round((b.en / b.boy) * yukseklik);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={b.src}
      alt="iyzico ile Öde — Mastercard, Visa, American Express ve Troy ile güvenli ödeme"
      width={genislik}
      height={yukseklik}
      loading="lazy"
      decoding="async"
      style={{ display: "block", width: genislik, maxWidth: "100%", height: "auto", ...style }}
    />
  );
}
