"use client";
import { useState, useEffect } from "react";
import { adminYaz } from "../adminYaz";

// Abonelikler sekmesi — abone listesi + ürün kırılımı + sıklık özeti.
// Veri /api/admin/yaz select üzerinden (abonelikler RLS'li; anon okuyamaz).
// Soft abonelik modeli: oto-çekim yok; dönemi gelince cron ABONE10 kuponlu
// hatırlatma maili atar, müşteri kendisi sipariş verir.
type Abonelik = {
  id: number;
  email: string | null;
  urun_adi: string | null;
  urun_slug: string | null;
  cadence_gun: number | null;
  indirim_yuzde: number | null;
  sonraki_tarih: string | null;
  son_hatirlatma: string | null;
  aktif: boolean | null;
  created_at: string | null;
};

function siklikMetni(gun: number | null): string {
  if (!gun) return "—";
  return gun % 7 === 0 ? `${gun / 7} haftada bir` : `${gun} günde bir`;
}
function tarih(t: string | null): string {
  if (!t) return "—";
  const d = new Date(t);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("tr-TR");
}

export default function Abonelikler({ goster }: { goster: (m: string) => void }) {
  const [abonelikler, setAbonelikler] = useState<Abonelik[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await adminYaz("abonelikler", "select");
      if (error) goster("❌ Abonelikler yüklenemedi: " + error.message);
      setAbonelikler((data as unknown as Abonelik[]) || []);
      setYukleniyor(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sayfa açılışında tek sefer yüklenir
  }, []);

  const aktifler = abonelikler.filter(a => a.aktif !== false);
  // Ürün kırılımı: hangi ürüne kaç AKTİF abone var (çoktan aza)
  const urunKirilimi = Object.entries(
    aktifler.reduce<Record<string, number>>((m, a) => {
      const ad = a.urun_adi || "(ürün adı yok)";
      m[ad] = (m[ad] || 0) + 1;
      return m;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);
  // Sıklık dağılımı
  const sikliklar = Object.entries(
    aktifler.reduce<Record<string, number>>((m, a) => {
      const k = siklikMetni(a.cadence_gun);
      m[k] = (m[k] || 0) + 1;
      return m;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);

  const kart = (icon: string, deger: string | number, etiket: string, renk = "#E8845A") => (
    <div style={{ background: "white", borderRadius: 18, padding: 20, boxShadow: "0 4px 16px rgba(92,61,46,0.06)", textAlign: "center" }}>
      <div style={{ fontSize: 26, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontFamily: "Georgia,serif", fontSize: 30, fontWeight: 700, color: renk }}>{deger}</div>
      <div style={{ fontSize: 12, color: "#5C3D2E", opacity: 0.7, marginTop: 4 }}>{etiket}</div>
    </div>
  );

  return (
    <div>
      <h1 style={{ fontFamily: "Georgia,serif", fontSize: 24, fontWeight: 700, color: "#2C1A0E", marginBottom: 6 }}>Abonelikler ({abonelikler.length})</h1>
      <p style={{ fontSize: 13, color: "#5C3D2E", opacity: 0.6, marginBottom: 20 }}>
        Soft model: otomatik çekim yok — dönemi gelen aboneye ABONE10 kuponlu hatırlatma maili gider, müşteri kendisi sipariş verir.
      </p>

      {yukleniyor ? (
        <div style={{ textAlign: "center", padding: "60px 0", fontSize: 32 }}>⏳</div>
      ) : abonelikler.length === 0 ? (
        <div style={{ background: "white", borderRadius: 18, padding: "48px 24px", textAlign: "center", boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
          <div style={{ fontSize: 44, marginBottom: 10 }}>🔄</div>
          <div style={{ fontFamily: "Georgia,serif", fontSize: 17, color: "#5C3D2E", marginBottom: 6 }}>Henüz abonelik yok</div>
          <div style={{ fontSize: 13, color: "#5C3D2E", opacity: 0.6 }}>Üyeler ürün sayfasındaki &quot;Abone Ol&quot; kutusundan abonelik başlatabilir (%10 indirim vaadi).</div>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 20 }}>
            {kart("🔄", abonelikler.length, "Toplam Abonelik")}
            {kart("✅", aktifler.length, "Aktif", "#2E7D32")}
            {kart("🚫", abonelikler.length - aktifler.length, "İptal", "#C62828")}
            {kart("⏱️", sikliklar[0]?.[0] || "—", "En yaygın sıklık", "#5C3D2E")}
          </div>

          <div style={{ background: "white", borderRadius: 18, padding: 20, boxShadow: "0 4px 16px rgba(92,61,46,0.06)", marginBottom: 20 }}>
            <div style={{ fontFamily: "Georgia,serif", fontSize: 15, fontWeight: 700, color: "#2C1A0E", marginBottom: 12 }}>📦 Ürün kırılımı (aktif aboneler)</div>
            {urunKirilimi.length === 0 ? (
              <div style={{ fontSize: 13, opacity: 0.6, color: "#5C3D2E" }}>Aktif abonelik yok.</div>
            ) : urunKirilimi.map(([ad, sayi]) => (
              <div key={ad} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "8px 4px", borderBottom: "1px solid #F5EFE8", fontSize: 13, color: "#5C3D2E" }}>
                <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ad}</span>
                <strong style={{ flexShrink: 0 }}>{sayi} abone</strong>
              </div>
            ))}
          </div>

          <div style={{ background: "white", borderRadius: 18, boxShadow: "0 4px 16px rgba(92,61,46,0.06)", overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 760 }}>
                <thead>
                  <tr style={{ background: "#FAF5EF" }}>
                    {["E-posta", "Ürün", "Sıklık", "Sonraki Hatırlatma", "Son Hatırlatma", "Durum", "Başlangıç"].map(h => (
                      <th key={h} style={{ padding: "12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#5C3D2E", opacity: 0.5, textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {abonelikler.map(a => (
                    <tr key={a.id} style={{ borderBottom: "1px solid #F0E8E0" }}>
                      <td style={{ padding: "10px 12px", fontSize: 12.5 }}>{a.email || "—"}</td>
                      <td style={{ padding: "10px 12px", maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.urun_adi || "—"}</td>
                      <td style={{ padding: "10px 12px" }}>{siklikMetni(a.cadence_gun)}</td>
                      <td style={{ padding: "10px 12px" }}>{tarih(a.sonraki_tarih)}</td>
                      <td style={{ padding: "10px 12px", opacity: 0.7 }}>{tarih(a.son_hatirlatma)}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ background: a.aktif !== false ? "#E8F5E9" : "#FFEBEE", color: a.aktif !== false ? "#2E7D32" : "#C62828", padding: "2px 9px", borderRadius: 50, fontSize: 11, fontWeight: 700 }}>
                          {a.aktif !== false ? "Aktif" : "İptal"}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px", opacity: 0.6 }}>{tarih(a.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
