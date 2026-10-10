import type { CSSProperties } from "react";
import { ILETISIM } from "../../lib/iletisim";

// Çalışma saatleri bloğu — TEK BİLEŞEN (10.10.2026). Footer'larda ve iletişim
// sayfasında aynı bilgi, aynı cümle, göze batan biçimde görünsün diye.
// Saat/metin değişirse yalnız lib/iletisim.ts güncellenir.
//
// Hook YOK — hem sunucu (iade, kvkk…) hem istemci (anasayfa, iletişim)
// sayfalarında doğrudan kullanılabilir.
//
//   tema="koyu" → koyu footer zemini (#2C1A0E) üstünde turuncu vurgulu kutu
//   tema="acik" → açık zemin, iletişim kartlarıyla aynı aileden belirgin kart

type Props = { tema: "koyu" | "acik"; style?: CSSProperties };

const TURUNCU = "#E8845A";
const KAHVE = "#5C3D2E";
const KREM = "#FDF6EE";

export default function MesaiBilgisi({ tema, style }: Props) {
  const koyu = tema === "koyu";

  const kutu: CSSProperties = koyu
    ? {
        display: "inline-flex", gap: 12, alignItems: "flex-start", textAlign: "left",
        padding: "14px 18px", borderRadius: 14, maxWidth: 420,
        background: "rgba(232,132,90,0.12)", border: "1px solid rgba(232,132,90,0.45)",
      }
    : {
        display: "flex", gap: 16, alignItems: "flex-start",
        padding: "20px 24px", borderRadius: 20, background: "white",
        borderLeft: `5px solid ${TURUNCU}`, boxShadow: "0 4px 16px rgba(92,61,46,0.08)",
      };

  return (
    <div role="note" aria-label="Çalışma saatleri" style={{ ...kutu, ...style }}>
      <span aria-hidden style={{ fontSize: koyu ? 22 : 28, lineHeight: 1 }}>🕘</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: koyu ? 11 : 12, fontWeight: 700, color: TURUNCU, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
          Çalışma Saatlerimiz
        </div>
        <div style={{ fontSize: koyu ? 14 : 16, fontWeight: 600, color: koyu ? KREM : KAHVE, lineHeight: 1.4 }}>
          {ILETISIM.MESAI_GUNLER}{" "}
          <span style={{ fontWeight: 800, color: TURUNCU, whiteSpace: "nowrap" }}>{ILETISIM.MESAI_SAAT}</span>
        </div>
        <div style={{ fontSize: koyu ? 12 : 13, color: koyu ? KREM : KAHVE, opacity: koyu ? 0.8 : 0.75, marginTop: 4, lineHeight: 1.5 }}>
          {ILETISIM.MESAI_DISI_NOT}
        </div>
      </div>
    </div>
  );
}
