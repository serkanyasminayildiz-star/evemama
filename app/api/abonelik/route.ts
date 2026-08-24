export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Soft abonelik: üye bir ürüne "X haftada bir" abone olur. Otomatik tahsilat
// YOK — her dönem hatırlatma + abone indirimiyle kendi öder (cron gönderir).
// 24 Ağu 2026: YENİ KAYIT KAPALI (POST 410 döner). Mevcut aboneler için
// GET (listeleme) ve DELETE (iptal) açık kalır; cron hatırlatmaları sürer.
// Tablo `abonelikler` RLS korumalı → yalnız service_role erişir; üye kendi
// aboneliklerini bu API üzerinden (token doğrulanarak) yönetir.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

// CADENCE_MIN/MAX ve ABONE_INDIRIM kaldırıldı: yeni abonelik alınmıyor, mevcut
// kayıtların periyodu ve indirim yüzdesi satırın kendisinde saklı.

const NO_STORE = { "Cache-Control": "no-store" };

// Bearer token → üye e-postası (yoksa null = giriş yok)
async function uyeEmail(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return null;
  try {
    const { data } = await supabase.auth.getUser(auth.slice(7));
    return data?.user?.email || null;
  } catch {
    return null;
  }
}

// Abone ol — KAPALI
export async function POST() {
  // ABONELİK YENİ KAYITLARA KAPALI (24 Ağu 2026). Yerini "her siparişte %5 puan"
  // aldı. Sebep: abonelik %10'u checkout'ta veremiyordu (indirim yalnız sonraki
  // dönem ABONE10 kuponuyla geliyordu), müşteri indirimi göremeyince sepeti
  // bırakıyordu; ayrıca ABONE10 abonelik kontrolü olmayan açık bir kupondu.
  // MEVCUT abonelikler bilinçli olarak çalışmaya devam eder (GET/DELETE açık,
  // cron hatırlatmaları sürer) — 12 aktif aboneye verilmiş söz bozulmaz.
  // Bu dal, arayüz kaldırıldıktan sonra doğrudan API çağrılarına karşı kapıdır.
  return NextResponse.json(
    { error: "Abonelik sistemi kapatıldı. Artık her siparişinizde puan kazanıyorsunuz." },
    { status: 410, headers: NO_STORE },
  );
}


// Üyenin aktif abonelikleri
export async function GET(req: NextRequest) {
  const email = await uyeEmail(req);
  if (!email) return NextResponse.json({ abonelikler: [] }, { headers: NO_STORE });
  try {
    const { data } = await supabaseAdmin
      .from("abonelikler")
      .select("id, urun_id, urun_adi, urun_slug, cadence_gun, indirim_yuzde, sonraki_tarih")
      .eq("email", email).eq("aktif", true).order("sonraki_tarih", { ascending: true });
    return NextResponse.json({ abonelikler: data || [] }, { headers: NO_STORE });
  } catch (e) {
    console.error("[abonelik] GET hatasi:", e);
    return NextResponse.json({ abonelikler: [] }, { headers: NO_STORE });
  }
}

// İptal (yalnız kendi aboneliğini — email eşleşmesiyle)
export async function DELETE(req: NextRequest) {
  const email = await uyeEmail(req);
  if (!email) return NextResponse.json({ error: "giris gerekli" }, { status: 401, headers: NO_STORE });
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400, headers: NO_STORE });
  try {
    await supabaseAdmin.from("abonelikler").update({ aktif: false }).eq("id", id).eq("email", email);
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (e) {
    console.error("[abonelik] DELETE hatasi:", e);
    return NextResponse.json({ error: "iptal edilemedi" }, { status: 500, headers: NO_STORE });
  }
}
