export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Üyeler Supabase auth.users'da tutuluyor (uye-ol sadece auth.signUp yapıyor,
// ayrı profil tablosu yok). auth.users SADECE service_role key ile listelenir
// — anon key yetmez. Bu yüzden bu route server-only + SERVICE_ROLE kullanır.
//
// Güvenlik: admin panel şifresi (client'taki ADMIN_SIFRE ile aynı) Bearer
// olarak beklenir — anonim erişimi engeller (mevcut admin paneliyle aynı
// güvenlik seviyesi). NOT: ileride Supabase auth admin rolüne taşınması
// önerilir; şu an client şifresi network'te görünür.
const ADMIN_SIFRE = "evemama2025";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export async function GET(req: NextRequest) {
  if ((req.headers.get("authorization") || "") !== `Bearer ${ADMIN_SIFRE}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY tanımlı değil (Vercel env)" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const sb = adminClient();

    // 1) Üyeler — Supabase auth.users
    const { data: list, error } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) throw error;

    // 2) Sipariş özeti — email bazlı sayı + toplam harcama + ad/soyad/telefon.
    //    (Üye auth.users'da; isim/telefon orada yok — siparişlerden türetilir.)
    const { data: siparisler } = await sb
      .from("siparisler")
      .select("email, ad, soyad, telefon, toplam");

    const ozet: Record<string, { sayisi: number; harcama: number; ad: string; soyad: string; telefon: string }> = {};
    for (const s of siparisler || []) {
      const e = (s.email || "").toLowerCase().trim();
      if (!e) continue;
      if (!ozet[e]) ozet[e] = { sayisi: 0, harcama: 0, ad: "", soyad: "", telefon: "" };
      ozet[e].sayisi += 1;
      ozet[e].harcama += parseFloat(String(s.toplam)) || 0;
      if (s.ad) ozet[e].ad = s.ad;
      if (s.soyad) ozet[e].soyad = s.soyad;
      if (s.telefon) ozet[e].telefon = s.telefon;
    }

    const uyeler = (list?.users || []).map((u) => {
      const e = (u.email || "").toLowerCase().trim();
      const o = ozet[e];
      const meta = (u.user_metadata || {}) as Record<string, string>;
      const adFromSiparis = o ? `${o.ad || ""} ${o.soyad || ""}`.trim() : "";
      const ad = adFromSiparis || meta.name || meta.full_name || "";
      return {
        id: u.id,
        email: u.email || "",
        ad,
        telefon: o?.telefon || meta.phone || "",
        kayit: u.created_at,
        siparisSayisi: o?.sayisi || 0,
        harcama: o?.harcama || 0,
      };
    });
    // En yeni üye üstte
    uyeler.sort((a, b) => String(b.kayit || "").localeCompare(String(a.kayit || "")));

    return NextResponse.json({ uyeler, toplam: uyeler.length }, { headers: { "Cache-Control": "no-store" } });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "üyeler alınamadı";
    console.error("[admin/uyeler] hata:", e);
    return NextResponse.json({ error: msg }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
