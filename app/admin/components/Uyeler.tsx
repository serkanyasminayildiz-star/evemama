"use client";
import { useState, useEffect } from "react";

const ADMIN_SIFRE = "evemama2025";

type Uye = {
  id: string;
  email: string;
  ad: string;
  telefon: string;
  kayit: string;
  siparisSayisi: number;
  harcama: number;
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

export default function Uyeler({ kuponlar, goster }: { kuponlar: Kupon[]; goster: (m: string) => void }) {
  const [uyeler, setUyeler] = useState<Uye[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState("");
  const [arama, setArama] = useState("");
  const [secili, setSecili] = useState<Set<string>>(new Set());
  const [kod, setKod] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);

  const aktifKuponlar = (kuponlar || []).filter((k) => k.aktif !== false);

  useEffect(() => {
    fetch("/api/admin/uyeler", { headers: { Authorization: `Bearer ${ADMIN_SIFRE}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setHata(d.error);
        else setUyeler(d.uyeler || []);
      })
      .catch(() => setHata("Üyeler yüklenemedi"))
      .finally(() => setYukleniyor(false));
  }, []);

  useEffect(() => {
    if (!kod && aktifKuponlar[0]) setKod(aktifKuponlar[0].kod);
  }, [kuponlar]);

  const filtreli = uyeler.filter((u) => {
    const q = arama.toLowerCase().trim();
    if (!q) return true;
    return u.email.toLowerCase().includes(q) || (u.ad || "").toLowerCase().includes(q) || (u.telefon || "").includes(q);
  });
  const tumuSecili = filtreli.length > 0 && filtreli.every((u) => secili.has(u.email));

  const tumunuToggle = () => {
    const ns = new Set(secili);
    if (tumuSecili) filtreli.forEach((u) => ns.delete(u.email));
    else filtreli.forEach((u) => ns.add(u.email));
    setSecili(ns);
  };
  const satirToggle = (email: string) => {
    const ns = new Set(secili);
    if (ns.has(email)) ns.delete(email); else ns.add(email);
    setSecili(ns);
  };

  const kuponGonder = async () => {
    if (!kod) { goster("❌ Önce bir kupon seçin"); return; }
    if (secili.size === 0) { goster("❌ En az bir üye seçin"); return; }
    if (!confirm(`${secili.size} üyeye "${kod}" kuponu e-posta ile gönderilecek. Onaylıyor musunuz?`)) return;
    setGonderiliyor(true);
    try {
      const seciliUyeler = uyeler.filter((u) => secili.has(u.email)).map((u) => ({ email: u.email, ad: u.ad }));
      const res = await fetch("/api/admin/kupon-gonder", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${ADMIN_SIFRE}` },
        body: JSON.stringify({ uyeler: seciliUyeler, kod }),
      });
      const d = await res.json();
      if (d.error) goster("❌ " + d.error);
      else { goster(`✅ ${d.sent} mail gönderildi${d.failed ? `, ${d.failed} başarısız` : ""}`); setSecili(new Set()); }
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
        Üyeler <span style={{ fontSize: 14, fontWeight: 400, opacity: 0.6 }}>{uyeler.length} üye</span>
      </h1>
      <p style={{ fontSize: 13, color: "#5C3D2E", opacity: 0.6, marginBottom: 20 }}>
        Üyeleri seçip aktif bir kuponu e-posta ile gönderebilirsiniz. Kuponlar <strong>Kuponlar</strong> sayfasından oluşturulur.
      </p>

      {/* Üst çubuk: arama + kupon seçici + gönder */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", background: "white", borderRadius: 16, padding: 16, marginBottom: 18, boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
        <input
          value={arama}
          onChange={(e) => setArama(e.target.value)}
          placeholder="🔍 İsim, e-posta veya telefon ara..."
          style={{ ...inputStyle, flex: 1, minWidth: 240 }}
        />
        {aktifKuponlar.length === 0 ? (
          <span style={{ fontSize: 13, color: "#C62828", fontWeight: 600 }}>Aktif kupon yok — önce Kuponlar&apos;dan oluşturun</span>
        ) : (
          <>
            <select value={kod} onChange={(e) => setKod(e.target.value)} style={{ ...inputStyle, minWidth: 240 }}>
              {aktifKuponlar.map((k) => <option key={String(k.id)} value={k.kod}>{kuponEtiket(k)}</option>)}
            </select>
            <button
              onClick={kuponGonder}
              disabled={gonderiliyor || secili.size === 0}
              style={{ background: secili.size === 0 || gonderiliyor ? "#C9B79C" : "#E8845A", color: "white", border: "none", borderRadius: 10, padding: "11px 20px", fontSize: 13, fontWeight: 700, cursor: secili.size === 0 || gonderiliyor ? "not-allowed" : "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
            >
              {gonderiliyor ? "Gönderiliyor..." : `✉️ Kupon Gönder (${secili.size})`}
            </button>
          </>
        )}
      </div>

      {/* Tablo */}
      <div style={{ background: "white", borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
        {yukleniyor ? (
          <div style={{ padding: 40, textAlign: "center", color: "#5C3D2E", opacity: 0.6 }}>Üyeler yükleniyor...</div>
        ) : hata ? (
          <div style={{ padding: 40, textAlign: "center", color: "#C62828" }}>⚠️ {hata}</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #F3E4CC" }}>
                <th style={{ padding: "12px", width: 40 }}>
                  <input type="checkbox" checked={tumuSecili} onChange={tumunuToggle} style={{ cursor: "pointer", accentColor: "#E8845A" }} />
                </th>
                {["ÜYE", "E-POSTA", "TELEFON", "KAYIT", "SİPARİŞ", "HARCAMA"].map((h) => (
                  <th key={h} style={{ padding: "12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#5C3D2E", opacity: 0.5, textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtreli.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: "#5C3D2E", opacity: 0.5 }}>Üye bulunamadı.</td></tr>
              ) : filtreli.map((u) => (
                <tr key={u.id} style={{ borderBottom: "1px solid #F8F0E3", background: secili.has(u.email) ? "#FFF7ED" : "white" }}>
                  <td style={{ padding: "12px", textAlign: "center" }}>
                    <input type="checkbox" checked={secili.has(u.email)} onChange={() => satirToggle(u.email)} style={{ cursor: "pointer", accentColor: "#E8845A" }} />
                  </td>
                  <td style={{ padding: "12px", fontWeight: 700, color: "#5C3D2E", fontSize: 14 }}>{u.ad || "—"}</td>
                  <td style={{ padding: "12px", fontSize: 13, color: "#5C3D2E" }}>{u.email}</td>
                  <td style={{ padding: "12px", fontSize: 13, color: "#5C3D2E", opacity: 0.7 }}>{u.telefon || "—"}</td>
                  <td style={{ padding: "12px", fontSize: 13, color: "#5C3D2E", opacity: 0.7 }}>{u.kayit ? new Date(u.kayit).toLocaleDateString("tr-TR") : "—"}</td>
                  <td style={{ padding: "12px" }}>
                    <span style={{ background: u.siparisSayisi > 0 ? "#E8F5E9" : "#F3E4CC", color: u.siparisSayisi > 0 ? "#2E7D32" : "#5C3D2E", padding: "3px 10px", borderRadius: 50, fontSize: 12, fontWeight: 700 }}>{u.siparisSayisi}</span>
                  </td>
                  <td style={{ padding: "12px", fontSize: 13, fontWeight: 700, color: "#E8845A" }}>{u.harcama > 0 ? `₺${tr(u.harcama)}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
