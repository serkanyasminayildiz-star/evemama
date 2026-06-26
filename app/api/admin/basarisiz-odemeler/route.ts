export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Başarısız/yarım ödemeler (basarisiz_odemeler). odeme/sonuc başarısız dalında
// yazılır → gelir kaybı + sebep ölçümü. RLS korumalı tablo → service_role.
const ADMIN_SIFRE = "evemama2025";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

type Kayit = {
  email: string; ad: string; telefon: string; toplam: number;
  sebep: string; paymentStatus: string; urunOzet: string; tarih: string; deneme: number;
};

export async function GET(req: NextRequest) {
  if ((req.headers.get("authorization") || "") !== `Bearer ${ADMIN_SIFRE}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  try {
    const sb = adminClient();
    const { data, error } = await sb
      .from("basarisiz_odemeler")
      .select("email, ad, soyad, telefon, toplam, payment_status, error_code, error_message, urunler, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;

    // E-posta bazlı grupla — aynı müşterinin tekrar denemeleri tek satır (deneme).
    // Kayıp ciro = benzersiz müşterilerin sepet tutarı toplamı (tekrarları toplamaz).
    const map = new Map<string, Kayit>();
    for (const r of data || []) {
      const e = (r.email || "").toLowerCase().trim() || "(bilinmiyor)";
      if (!map.has(e)) {
        let urunOzet = "";
        try {
          const arr = typeof r.urunler === "string" ? JSON.parse(r.urunler) : r.urunler;
          if (Array.isArray(arr)) urunOzet = arr.map((i: { quantity?: number; name?: string }) => `${Number(i.quantity) || 1}x ${i.name || "Ürün"}`).join(", ");
        } catch { /* parse edilemezse ozet bos */ }
        map.set(e, {
          email: e,
          ad: `${r.ad || ""} ${r.soyad || ""}`.trim(),
          telefon: r.telefon || "",
          toplam: parseFloat(String(r.toplam)) || 0,
          sebep: (r.error_message || r.payment_status || "Bilinmiyor").trim(),
          paymentStatus: r.payment_status || "",
          urunOzet,
          tarih: r.created_at,
          deneme: 1,
        });
      } else {
        map.get(e)!.deneme += 1;
      }
    }

    const kayitlar = Array.from(map.values());
    const toplamKayip = kayitlar.reduce((s, k) => s + k.toplam, 0);
    const toplamDeneme = kayitlar.reduce((s, k) => s + k.deneme, 0);

    // Sebep dökümü — hangi hata ne kadar kayba yol açıyor
    const sebepMap = new Map<string, { sebep: string; adet: number; tutar: number }>();
    for (const k of kayitlar) {
      const cur = sebepMap.get(k.sebep) || { sebep: k.sebep, adet: 0, tutar: 0 };
      cur.adet += 1; cur.tutar += k.toplam;
      sebepMap.set(k.sebep, cur);
    }
    const sebepler = Array.from(sebepMap.values()).sort((a, b) => b.tutar - a.tutar);

    return NextResponse.json(
      { kayitlar, ozet: { musteri: kayitlar.length, toplamKayip, toplamDeneme, sebepler } },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "başarısız ödemeler alınamadı";
    console.error("[admin/basarisiz-odemeler] hata:", e);
    return NextResponse.json({ error: msg }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
