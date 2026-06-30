"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function SiparislerPage() {
  const [siparisler, setSiparisler] = useState([]);
  const [acikSiparisId, setAcikSiparisId] = useState(null);
  const [siparisKalemleri, setSiparisKalemleri] = useState({});
  const [yukleniyor, setYukleniyor] = useState(null);
  const [faturaIslem, setFaturaIslem] = useState(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("siparisler").select("*").order("created_at", { ascending: false });
      setSiparisler(data || []);
    })();
  }, []);

  const detayYukle = async (siparisId) => {
    if (acikSiparisId === siparisId) { setAcikSiparisId(null); return; }
    setAcikSiparisId(siparisId);
    setYukleniyor(siparisId);
    const { data } = await supabase.from("siparis_kalemleri").select("*").eq("siparis_id", siparisId);
    setSiparisKalemleri(prev => ({ ...prev, [siparisId]: data || [] }));
    setYukleniyor(null);
  };

  // e-Arşiv fatura kes — /api/admin/fatura-kes (Nilvera). Sunucuda idempotent.
  const faturaKes = async (sp) => {
    if (sp.fatura_kesildi) return;
    if (!window.confirm(`#${sp.siparis_no} (${sp.ad} ${sp.soyad}) için e-Arşiv faturası kesilsin mi?`)) return;
    setFaturaIslem(sp.id);
    try {
      const r = await fetch("/api/admin/fatura-kes", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer evemama2025" },
        body: JSON.stringify({ siparisId: sp.id }),
      });
      const d = await r.json();
      if (d.ok) {
        alert(`✅ Fatura ${d.zaten ? "zaten kesilmiş" : "kesildi"}\nNo: ${d.faturaNo || "-"}\nUUID: ${d.uuid}`);
        setSiparisler(prev => prev.map(x => x.id === sp.id ? { ...x, fatura_kesildi: true, fatura_uuid: d.uuid, fatura_no: d.faturaNo } : x));
      } else {
        alert(`❌ Fatura kesilemedi: ${d.error || "bilinmeyen hata"}`);
      }
    } catch (e) {
      alert(`❌ Hata: ${e.message}`);
    }
    setFaturaIslem(null);
  };

  return (
    <div>
      <h1 style={{ color: "#2C1A0E", marginBottom: 20 }}>🛒 Sipariş Yönetimi</h1>
      {siparisler.map(sp => (
        <div key={sp.id} style={{ background: "white", borderRadius: 18, marginBottom: 15, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
          <div style={{ padding: "15px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FAF5EF", borderRadius: "18px 18px 0 0" }}>
            <span><b>#{sp.siparis_no}</b> - {sp.ad} {sp.soyad}</span>
            <div>
              <span style={{ marginRight: 15, fontWeight: "bold" }}>₺{parseFloat(sp.toplam).toFixed(2)}</span>
              <button onClick={() => faturaKes(sp)} disabled={sp.fatura_kesildi || faturaIslem === sp.id}
                title={sp.fatura_kesildi ? `Fatura: ${sp.fatura_no || sp.fatura_uuid || ""}` : "e-Arşiv faturası kes"}
                style={{ padding: "6px 12px", borderRadius: 8, border: "none", marginRight: 8, fontWeight: 700, color: "white", background: sp.fatura_kesildi ? "#8BAF8E" : "#E8845A", cursor: sp.fatura_kesildi ? "default" : "pointer" }}>
                {faturaIslem === sp.id ? "⏳..." : sp.fatura_kesildi ? "✓ Fatura Kesildi" : "🧾 Fatura Kes"}
              </button>
              <button onClick={() => detayYukle(sp.id)} style={{ padding: "6px 12px", borderRadius: 8, border: "2px solid #E8D5B7", cursor: "pointer" }}>
                {yukleniyor === sp.id ? "⏳..." : acikSiparisId === sp.id ? "Kapat" : "Detay"}
              </button>
            </div>
          </div>
          {acikSiparisId === sp.id && (
            <div style={{ padding: 20 }}>
              <div style={{ marginBottom: 15, fontSize: 13 }}>📍 {sp.adres} - {sp.sehir} | 📞 {sp.telefon}</div>
              <div style={{ background: "#F8F4F0", padding: 15, borderRadius: 12 }}>
                <div style={{ fontSize: 11, fontWeight: "bold", opacity: 0.5, marginBottom: 10 }}>SİPARİŞ İÇERİĞİ</div>
                {siparisKalemleri[sp.id]?.map((k, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px dashed #E8D5B7" }}>
                    <span>{k.urun_adi || k.ad || k.name || "Ürün"} x {k.adet || k.quantity || 1}</span>
                    <span style={{ fontWeight: "bold" }}>₺{(parseFloat(k.fiyat || k.price || 0) * (k.adet || 1)).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
