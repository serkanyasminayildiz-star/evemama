"use client";
import { useState, useEffect, useCallback } from "react";

const ADMIN_SIFRE = "evemama2025";

type Dagitim = { id: number; tarih: string; tutar: number; barinak_adi: string | null; sehir: string | null; video_url: string | null; kopek_sayisi: number | null; ogun_sayisi: number | null; not_metni: string | null; created_at: string };
const bosForm = { tarih: "", tutar: "", barinak_adi: "", sehir: "", video_url: "", kopek_sayisi: "", ogun_sayisi: "", not_metni: "" };

export default function Kumbara() {
  const [dagitimlar, setDagitimlar] = useState<Dagitim[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState("");
  const [form, setForm] = useState({ ...bosForm });
  const [kaydediliyor, setKaydediliyor] = useState(false);

  const yukle = useCallback(() => {
    fetch("/api/admin/kumbara", { headers: { Authorization: `Bearer ${ADMIN_SIFRE}` } })
      .then(r => r.json())
      .then(adm => { if (adm.error) setHata(adm.error); else setDagitimlar(adm.dagitimlar || []); })
      .catch(() => setHata("Yüklenemedi")).finally(() => setYukleniyor(false));
  }, []);

  useEffect(() => { yukle(); }, [yukle]);

  const ekle = async () => {
    if (!form.tarih || !form.tutar) { setHata("Tarih ve tutar zorunlu"); return; }
    setKaydediliyor(true); setHata("");
    try {
      const r = await fetch("/api/admin/kumbara", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${ADMIN_SIFRE}` }, body: JSON.stringify(form) });
      const d = await r.json();
      if (d.error) setHata(d.error);
      else { setForm({ ...bosForm }); yukle(); }
    } catch { setHata("Eklenemedi"); }
    setKaydediliyor(false);
  };

  const sil = async (id: number) => {
    if (!window.confirm("Bu dağıtım kaydı silinsin mi?")) return;
    await fetch(`/api/admin/kumbara?id=${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${ADMIN_SIFRE}` } });
    yukle();
  };

  const tl = (n: number) => "₺" + (Number(n) || 0).toLocaleString("tr-TR");
  const inp = { width: "100%", padding: "10px 12px", border: "1px solid #E0D8CC", borderRadius: 8, fontSize: 14, boxSizing: "border-box" as const, marginBottom: 8, color: "#5C3D2E", background: "white", fontFamily: "inherit" };
  const lbl = { fontSize: 12, fontWeight: 700, color: "#5C3D2E", opacity: 0.65, marginBottom: 4, display: "block" };

  return (
    <div style={{ color: "#5C3D2E" }}>
      <h2 style={{ fontFamily: "Georgia, serif", fontSize: 24, fontWeight: 700, marginBottom: 6 }}>🐾 Sokak Dostları</h2>

      <div style={{ background: "linear-gradient(135deg,#EFF9F0,#E1F3E4)", border: "1.5px solid #BFE0C2", borderRadius: 14, padding: "14px 18px", marginBottom: 20, fontSize: 13, lineHeight: 1.6, opacity: 0.9 }}>
        Her hafta gelirinin %5&apos;i ile mama alıp barınağa/sokağa götür, <strong>videoya çek</strong>, sonra aşağıdan kaydet. Video eklenince anasayfada <strong>Sokak Dostları şeridi otomatik açılır</strong> (ilk video gelene kadar gizli). Sitede hiçbir ₺ tutarı görünmez — yalnız köpek/öğün/ziyaret sayısı.
      </div>

      <div style={{ background: "white", border: "1px solid #E8D5B7", borderRadius: 14, padding: "18px 20px", marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Yeni pazar dağıtımı ekle</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><label style={lbl}>Tarih (pazar) *</label><input type="date" value={form.tarih} onChange={e => setForm({ ...form, tarih: e.target.value })} style={inp} /></div>
          <div><label style={lbl}>Verilen mama tutarı (₺) *</label><input type="number" value={form.tutar} onChange={e => setForm({ ...form, tutar: e.target.value })} placeholder="Örn. 2480" style={inp} /></div>
          <div><label style={lbl}>Barınak adı</label><input value={form.barinak_adi} onChange={e => setForm({ ...form, barinak_adi: e.target.value })} placeholder="Umut Barınağı" style={inp} /></div>
          <div><label style={lbl}>Şehir</label><input value={form.sehir} onChange={e => setForm({ ...form, sehir: e.target.value })} placeholder="İzmir" style={inp} /></div>
          <div><label style={lbl}>Beslenen köpek sayısı</label><input type="number" value={form.kopek_sayisi} onChange={e => setForm({ ...form, kopek_sayisi: e.target.value })} placeholder="12" style={inp} /></div>
          <div><label style={lbl}>Öğün sayısı (opsiyonel)</label><input type="number" value={form.ogun_sayisi} onChange={e => setForm({ ...form, ogun_sayisi: e.target.value })} placeholder="60" style={inp} /></div>
        </div>
        <label style={lbl}>Video linki (YouTube / Instagram)</label>
        <input value={form.video_url} onChange={e => setForm({ ...form, video_url: e.target.value })} placeholder="https://..." style={inp} />
        <label style={lbl}>Not (opsiyonel)</label>
        <textarea value={form.not_metni} onChange={e => setForm({ ...form, not_metni: e.target.value })} placeholder="Kısa açıklama..." rows={2} style={{ ...inp, resize: "vertical" as const }} />
        {hata && <div style={{ background: "#FFEBEE", color: "#C62828", padding: "8px 12px", borderRadius: 8, fontSize: 13, marginBottom: 10 }}>{hata}</div>}
        <button onClick={ekle} disabled={kaydediliyor} style={{ background: kaydediliyor ? "#A5C8A7" : "#2E7D32", color: "white", border: "none", borderRadius: 10, padding: "12px 22px", fontSize: 14, fontWeight: 700, cursor: kaydediliyor ? "not-allowed" : "pointer", fontFamily: "inherit" }}>{kaydediliyor ? "Kaydediliyor..." : "💾 Dağıtımı Kaydet"}</button>
      </div>

      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Geçmiş dağıtımlar ({dagitimlar.length})</h3>
      {yukleniyor ? (
        <div style={{ opacity: 0.6, fontSize: 14 }}>Yükleniyor...</div>
      ) : dagitimlar.length === 0 ? (
        <div style={{ opacity: 0.6, fontSize: 14 }}>Henüz dağıtım yok — ilk pazar ziyaretinden sonra buradan ekleyeceksin.</div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {dagitimlar.map(d => (
            <div key={d.id} style={{ background: "white", border: "1px solid #E8D5B7", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{d.barinak_adi || "Barınak"}{d.sehir ? ` · ${d.sehir}` : ""} — {tl(d.tutar)}</div>
                <div style={{ fontSize: 12.5, opacity: 0.7 }}>{d.tarih}{d.kopek_sayisi ? ` · ${d.kopek_sayisi} köpek` : ""}{d.ogun_sayisi ? ` · ${d.ogun_sayisi} öğün` : ""}</div>
              </div>
              {d.video_url && <a href={d.video_url} target="_blank" rel="noopener noreferrer" style={{ color: "#E8845A", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>▶️ Video</a>}
              <button onClick={() => sil(d.id)} style={{ background: "#FFEBEE", color: "#C62828", border: "none", borderRadius: 8, padding: "7px 12px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Sil</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
