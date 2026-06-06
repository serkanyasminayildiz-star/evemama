export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Terk edilen sepet = ödeme başlatılmış ama tamamlanmamış kayıtlar. Ödeme
// başlatılınca odeme_gecici'ye yazılır; tamamlanınca (odeme/sonuc) silinir.
// Yani odeme_gecici'de KALANLAR = terk edilmiş sepetler (satın almışlar yok).
const ADMIN_SIFRE = "evemama2025";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export async function GET(req: NextRequest) {
  if ((req.headers.get("authorization") || "") !== `Bearer ${ADMIN_SIFRE}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  try {
    const sb = adminClient();

    const { data: gecici, error } = await sb
      .from("odeme_gecici")
      .select("token, ad, soyad, email, telefon, toplam, urunler, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;

    // Üye mi misafir mi — auth.users e-postaları (service_role varsa)
    const uyeEmails = new Set<string>();
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { data: list } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
        for (const u of list?.users || []) if (u.email) uyeEmails.add(u.email.toLowerCase());
      } catch (e) {
        console.error("[terk-edilen] uye listesi:", e);
      }
    }

    // E-posta bazlı grupla — aynı kişinin birden çok denemesi tek satır.
    const map = new Map<string, {
      email: string; ad: string; telefon: string; toplam: number;
      urunOzet: string; urunSayisi: number; tarih: string; deneme: number; uye: boolean;
    }>();

    for (const g of gecici || []) {
      const e = (g.email || "").toLowerCase().trim();
      if (!e) continue;
      if (!map.has(e)) {
        let urunSayisi = 0;
        let urunOzet = "";
        try {
          const arr = typeof g.urunler === "string" ? JSON.parse(g.urunler) : g.urunler;
          if (Array.isArray(arr)) {
            urunSayisi = arr.reduce((s: number, i: any) => s + (Number(i.quantity) || 1), 0);
            urunOzet = arr.map((i: any) => `${Number(i.quantity) || 1}x ${i.name || "Ürün"}`).join(", ");
          }
        } catch { /* urunler parse edilemezse ozet bos kalir */ }
        map.set(e, {
          email: e,
          ad: `${g.ad || ""} ${g.soyad || ""}`.trim(),
          telefon: g.telefon || "",
          toplam: parseFloat(String(g.toplam)) || 0,
          urunOzet,
          urunSayisi,
          tarih: g.created_at,
          deneme: 1,
          uye: uyeEmails.has(e),
        });
      } else {
        map.get(e)!.deneme += 1;
      }
    }

    const sepetler = Array.from(map.values());
    return NextResponse.json({ sepetler, toplam: sepetler.length }, { headers: { "Cache-Control": "no-store" } });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "terk edilen sepetler alınamadı";
    console.error("[admin/terk-edilen] hata:", e);
    return NextResponse.json({ error: msg }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
