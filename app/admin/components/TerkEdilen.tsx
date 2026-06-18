"use client";
import { useState, useEffect } from "react";

const ADMIN_SIFRE = "evemama2025";

type Sepet = {
  email: string;
  ad: string;
  telefon: string;
  toplam: number;
  urunOzet: string;
  urunSayisi: number;
  tarih: string;
  deneme: number;
  uye: boolean;
};
type Kupon = {
  id: number | string;
  kod: string;
  indirim_tipi: string;
  indirim_degeri: number;
  min_sepet?: number | null;
  aktif?: boolean;
};

function kuponEtiket(k: Kupon): string {
  const ind = k.indirim_tipi === "yuzde" ? `%${k.indirim_degeri} indirim` : `₺${k.indirim_degeri} indirim`;
  const min = k.min_sepet ? ` (min ₺${k.min_sepet})` : "";
  return `${k.kod} — ${ind}${min}`;
}

export default function TerkEdilen({ kuponlar, goster }: { kuponlar: Kupon[]; goster: (m: string) => void }) {
  const [sepetler, setSepetler] = useState<Sepet[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState("");
  const [arama, setArama] = useState("");
  const [secili, setSecili] = useState<Set<string>>(new Set());
  const [kod, setKod] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);

  const aktifKuponlar = (kuponlar || []).filter((k) => k.aktif !== false);

  useEffect(() => {
    fetch("/api/admin/terk-edilen", { headers: { Authorization: `Bearer ${ADMIN_SIFRE}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setHata(d.error);
        else setSepetler(d.sepetler || []);
      })
      .catch(() => setHata("Sepetler yüklenemedi"))
      .finally(() => setYukleniyor(false));
  }, []);

  // Kuponlar yüklenince ilk aktif kuponu varsayılan seç (kod boşken, bir kez).
  // Kasıtlı: yalnız kuponlar değişince çalışsın; aktifKuponlar (her render türetilir)
  // ve kod deps'e eklenmez (sonsuz/gereksiz çalışmayı önler).
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (!kod && aktifKuponlar[0]) setKod(aktifKuponlar[0].kod);
  }, [kuponlar]);
  /* eslint-enable react-hooks/exhaustive-deps */

  const filtreli = sepetler.filter((s) => {
    const q = arama.toLowerCase().trim();
    if (!q) return true;
    return s.email.toLowerCase().includes(q) || (s.ad || "").toLowerCase().includes(q);
  });
  const tumuSecili = filtreli.length > 0 && filtreli.every((s) => secili.has(s.email));

  const tumunuToggle = () => {
    const ns = new Set(secili);
    if (tumuSecili) filtreli.forEach((s) => ns.delete(s.email));
    else filtreli.forEach((s) => ns.add(s.email));
    setSecili(ns);
  };
  const satirToggle = (email: string) => {
    const ns = new Set(secili);
    if (ns.has(email)) ns.delete(email); else ns.add(email);
    setSecili(ns);
  };

  const hatirlatmaGonder = async () => {
    if (!kod) { goster("❌ Önce bir kupon seçin"); return; }
    if (secili.size === 0) { goster("❌ En az bir sepet seçin"); return; }
    if (!confirm(`${secili.size} müşteriye "${kod}" kuponuyla sepet hatırlatması gönderilecek. Onaylıyor musunuz?`)) return;
    setGonderiliyor(true);
    try {
      const seciliSepetler = sepetler
        .filter((s) => secili.has(s.email))
        .map((s) => ({ email: s.email, ad: s.ad, urunOzet: s.urunOzet }));
      const res = await fetch("/api/admin/sepet-hatirlat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${ADMIN_SIFRE}` },
        body: JSON.stringify({ sepetler: seciliSepetler, kod }),
      });
      const d = await res.json();
      if (d.error) goster("❌ " + d.error);
      else { goster(`✅ ${d.sent} hatırlatma gönderildi${d.failed ? `, ${d.failed} başarısız` : ""}`); setSecili(new Set()); }
    } catch {
      goster("❌ Gönderim sırasında hata oluştu");
    }
    setGonderiliyor(false);
  };

  const inputStyle = { padding: "11px 14px", border: "2px solid #E8D5B7", borderRadius: 10, fontSize: 14, outline: "none", fontFamily: "inherit", color: "#5C3D2E", background: "white" };
  const tr = (n: number) => new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

  return (
    <div>
      <h1 style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700, color: "#5C3D2E", marginBottom: 4 }}>
        Terk Edilen Sepetler <span style={{ fontSize: 14, fontWeight: 400, opacity: 0.6 }}>{sepetler.length} müşteri</span>
      </h1>
      <p style={{ fontSize: 13, color: "#5C3D2E", opacity: 0.6, marginBottom: 20 }}>
        Ödemesini tamamlamamış müşteriler (üye + misafir). Satın almış olanlar listelenmez.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", background: "white", borderRadius: 16, padding: 16, marginBottom: 18, boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
        <input value={arama} onChange={(e) => setArama(e.target.value)} placeholder="🔍 İsim veya e-posta ara..." style={{ ...inputStyle, flex: 1, minWidth: 240 }} />
        {aktifKuponlar.length === 0 ? (
          <span style={{ fontSize: 13, color: "#C62828", fontWeight: 600 }}>Aktif kupon yok — önce Kuponlar&apos;dan oluşturun</span>
        ) : (
          <>
            <select value={kod} onChange={(e) => setKod(e.target.value)} style={{ ...inputStyle, minWidth: 240 }}>
              {aktifKuponlar.map((k) => <option key={String(k.id)} value={k.kod}>{kuponEtiket(k)}</option>)}
            </select>
            <button
              onClick={hatirlatmaGonder}
              disabled={gonderiliyor || secili.size === 0}
              style={{ background: secili.size === 0 || gonderiliyor ? "#C9B79C" : "#E8845A", color: "white", border: "none", borderRadius: 10, padding: "11px 20px", fontSize: 13, fontWeight: 700, cursor: secili.size === 0 || gonderiliyor ? "not-allowed" : "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
            >
              {gonderiliyor ? "Gönderiliyor..." : `✉️ Hatırlatma Gönder (${secili.size})`}
            </button>
          </>
        )}
      </div>

      <div style={{ background: "white", borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
        {yukleniyor ? (
          <div style={{ padding: 40, textAlign: "center", color: "#5C3D2E", opacity: 0.6 }}>Sepetler yükleniyor...</div>
        ) : hata ? (
          <div style={{ padding: 40, textAlign: "center", color: "#C62828" }}>⚠️ {hata}</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #F3E4CC" }}>
                <th style={{ padding: "12px", width: 40 }}>
                  <input type="checkbox" checked={tumuSecili} onChange={tumunuToggle} style={{ cursor: "pointer", accentColor: "#E8845A" }} />
                </th>
                {["MÜŞTERİ", "E-POSTA", "SEPET", "TUTAR", "DENEME", "TARİH"].map((h) => (
                  <th key={h} style={{ padding: "12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#5C3D2E", opacity: 0.5, textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtreli.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: "#5C3D2E", opacity: 0.5 }}>Terk edilmiş sepet yok.</td></tr>
              ) : filtreli.map((s) => (
                <tr key={s.email} style={{ borderBottom: "1px solid #F8F0E3", background: secili.has(s.email) ? "#FFF7ED" : "white" }}>
                  <td style={{ padding: "12px", textAlign: "center" }}>
                    <input type="checkbox" checked={secili.has(s.email)} onChange={() => satirToggle(s.email)} style={{ cursor: "pointer", accentColor: "#E8845A" }} />
                  </td>
                  <td style={{ padding: "12px" }}>
                    <div style={{ fontWeight: 700, color: "#5C3D2E", fontSize: 14 }}>{s.ad || "—"}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: s.uye ? "#2E7D32" : "#8B6F47", marginTop: 2 }}>{s.uye ? "● ÜYE" : "○ Misafir"}</div>
                  </td>
                  <td style={{ padding: "12px", fontSize: 13, color: "#5C3D2E" }}>{s.email}</td>
                  <td style={{ padding: "12px", fontSize: 12, color: "#5C3D2E", opacity: 0.8, maxWidth: 240 }}>{s.urunOzet || "—"}</td>
                  <td style={{ padding: "12px", fontSize: 13, fontWeight: 700, color: "#5C3D2E" }}>₺{tr(s.toplam)}</td>
                  <td style={{ padding: "12px" }}>
                    <span style={{ background: "#FFF3E0", color: "#E65100", padding: "3px 10px", borderRadius: 50, fontSize: 12, fontWeight: 700 }}>{s.deneme}</span>
                  </td>
                  <td style={{ padding: "12px", fontSize: 13, color: "#5C3D2E", opacity: 0.7 }}>{s.tarih ? new Date(s.tarih).toLocaleDateString("tr-TR") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p style={{ fontSize: 12, color: "#5C3D2E", opacity: 0.5, textAlign: "center", marginTop: 14 }}>
        💡 Misafirlerin de kullanabilmesi için genel (üyelik şartsız) bir kupon seçin. Test için kendi adresinize gönderebilirsiniz.
      </p>
    </div>
  );
}
