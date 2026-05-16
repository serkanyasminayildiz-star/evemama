"use client";
import type { CSSProperties } from "react";

type KargoAyar = {
  ucretsiz_limit?: number | string | null;
  "ucretsiz limit"?: number | string | null;
  sabit_ucret?: number | string | null;
  [k: string]: unknown;
} | null;

type Props = {
  kargoAyar: KargoAyar;
  setKargoAyar: (k: KargoAyar) => void;
  kargoGuncelle: () => Promise<void> | void;
  s: CSSProperties;
  btn: (bg?: string, extra?: CSSProperties) => CSSProperties;
};

// Kargo sayfasi — state/handler parent'tan prop olarak gelir.
// kargoAyar JSON kolonunda hem snake_case (ucretsiz_limit) hem eski
// boslukli ("ucretsiz limit") anahtarlari birlikte tutuluyor; ikisini
// de set ediyoruz (backward compatibility).
export default function Kargo({ kargoAyar, setKargoAyar, kargoGuncelle, s, btn }: Props) {
  return (
    <div>
      <h1 style={{ fontFamily: "Georgia,serif", fontSize: 24, fontWeight: 700, color: "#2C1A0E", marginBottom: 20 }}>Kargo Ayarları</h1>
      <div style={{ background: "white", borderRadius: 18, padding: 28, boxShadow: "0 4px 16px rgba(92,61,46,0.06)", maxWidth: 520 }}>
        {kargoAyar ? (
          <>
            <div style={{ background: "#FDF6EE", borderRadius: 12, padding: "12px 16px", marginBottom: 24, fontSize: 13, color: "#5C3D2E" }}>
              <strong>Mevcut:</strong> Ücretsiz limit = ₺{String(kargoAyar.ucretsiz_limit ?? kargoAyar["ucretsiz limit"] ?? "?")} | Sabit ücret = ₺{String(kargoAyar.sabit_ucret ?? "?")}
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#5C3D2E", display: "block", marginBottom: 8 }}>🎁 Ücretsiz Kargo Limiti (₺)</label>
              <input type="number" step="0.01" value={String(kargoAyar.ucretsiz_limit ?? kargoAyar["ucretsiz limit"] ?? "")}
                onChange={e => setKargoAyar({ ...kargoAyar, ucretsiz_limit: e.target.value, "ucretsiz limit": e.target.value })} style={s} />
              <div style={{ fontSize: 12, color: "#5C3D2E", opacity: 0.5, marginTop: 4 }}>Bu tutarın üzerindeki siparişler ücretsiz kargo</div>
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#5C3D2E", display: "block", marginBottom: 8 }}>🚚 Standart Kargo Ücreti (₺)</label>
              <input type="number" step="0.01" value={String(kargoAyar.sabit_ucret || "")} onChange={e => setKargoAyar({ ...kargoAyar, sabit_ucret: e.target.value })} style={s} />
            </div>
            <button onClick={kargoGuncelle} style={{ ...btn(), padding: "14px 32px", fontSize: 15 }}>💾 Kaydet</button>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "40px 0", opacity: 0.5 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🚚</div>
            <div>Kargo ayarı bulunamadı</div>
          </div>
        )}
      </div>
    </div>
  );
}
