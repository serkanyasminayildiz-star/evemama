"use client";
import { KARGO } from "../../../lib/indirim";

// Kargo kuralları BİLGİ PANELİ — değerler lib/indirim.ts TEK KAYNAK'tan okunur
// (sepet/ödeme/sunucu hesabıyla birebir aynı sabitler; drift imkânsız).
//
// NOT: Eski düzenlenebilir form kaldırıldı — kargo_ayarlari tablosunu checkout
// HİÇ okumuyordu (süs ayardı; admin 100₺ yazsa da müşteri 29.90 ödüyordu).
// Kural değişikliği kod üzerinden yapılır (lib/indirim.ts KARGO sabitleri).
export default function Kargo() {
  const satir: React.CSSProperties = { display: "flex", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #F0E8E0", fontSize: 14, color: "#5C3D2E" };
  const kademeler = [
    { aralik: "0 – 5 kg", ucret: KARGO.BASLANGIC },
    { aralik: "5 – 10 kg", ucret: KARGO.BASLANGIC + KARGO.KADEME_UCRET },
    { aralik: "10 – 15 kg", ucret: KARGO.BASLANGIC + 2 * KARGO.KADEME_UCRET },
  ];
  return (
    <div>
      <h1 style={{ fontFamily: "Georgia,serif", fontSize: 24, fontWeight: 700, color: "#2C1A0E", marginBottom: 20 }}>Kargo Ayarları</h1>

      <div style={{ background: "white", borderRadius: 18, boxShadow: "0 4px 16px rgba(92,61,46,0.06)", maxWidth: 560, overflow: "hidden", marginBottom: 16 }}>
        <div style={{ background: "#E8F5E9", padding: "14px 16px", fontSize: 13, color: "#2E7D32", fontWeight: 700 }}>
          🎁 Ücretsiz Kargo: sepet ₺{KARGO.BEDAVA_ESIK.toLocaleString("tr-TR")} ve üzeri
        </div>
        <div style={{ padding: "14px 16px", background: "#FAF5EF", fontSize: 11, fontWeight: 700, color: "#5C3D2E", opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Altındaki sepetlerde ağırlık tarifesi (toplam sepet ağırlığı)
        </div>
        {kademeler.map(k => (
          <div key={k.aralik} style={satir}>
            <span>📦 {k.aralik}</span>
            <strong>₺{k.ucret}</strong>
          </div>
        ))}
        <div style={{ ...satir, borderBottom: "none" }}>
          <span>➕ 15 kg üzeri her başlanmış {KARGO.KADEME_KG} kg</span>
          <strong>+₺{KARGO.KADEME_UCRET}</strong>
        </div>
      </div>

      <div style={{ background: "#FDF6EE", borderRadius: 14, padding: "14px 18px", maxWidth: 560, fontSize: 13, color: "#5C3D2E", lineHeight: 1.7 }}>
        <strong>Nasıl çalışır?</strong><br />
        • Ürün ağırlığı, ürün <strong>adından</strong> okunur (&quot;… 12 kg&quot;, &quot;… 400 gr&quot; gibi). Adında ağırlık olmayan ürün <strong>{KARGO.VARSAYILAN_URUN_KG} kg</strong> sayılır.<br />
        • Sepetteki tüm ürünlerin ağırlığı (adet dahil) toplanır, tarife toplam ağırlığa uygulanır. Örn: 2 × 12 kg mama = 24 kg → ₺{KARGO.BASLANGIC + 4 * KARGO.KADEME_UCRET}.<br />
        • Bu değerler kodda tek kaynaktan yönetilir; sepet, ödeme ve sunucu hesabı hep aynı tarifeyi kullanır. Değişiklik istersen söylemen yeterli.
      </div>
    </div>
  );
}
