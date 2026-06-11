export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Soft abonelik: üye bir ürüne "X haftada bir" abone olur. Otomatik tahsilat
// YOK — her dönem hatırlatma + abone indirimiyle kendi öder (cron gönderir).
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

const CADENCE_MIN = 14;   // 2 hafta
const CADENCE_MAX = 84;   // 12 hafta
const ABONE_INDIRIM = 10; // %

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

// Abone ol / güncelle
export async function POST(req: NextRequest) {
  const email = await uyeEmail(req);
  if (!email) return NextResponse.json({ error: "Abone olmak için giriş yapın." }, { status: 401, headers: NO_STORE });

  let body: { urun_id?: number; urun_adi?: string; urun_slug?: string; cadence_gun?: number } = {};
  try { body = await req.json(); } catch { /* boş gövde */ }
  const urunId = Number(body.urun_id);
  if (!urunId) return NextResponse.json({ error: "urun_id gerekli" }, { status: 400, headers: NO_STORE });

  const cadence = Math.min(Math.max(Number(body.cadence_gun) || 28, CADENCE_MIN), CADENCE_MAX);
  const sonraki = new Date(Date.now() + cadence * 24 * 60 * 60 * 1000).toISOString();

  try {
    const { data: mevcut } = await supabaseAdmin
      .from("abonelikler").select("id").eq("email", email).eq("urun_id", urunId).eq("aktif", true).maybeSingle();
    if (mevcut) {
      await supabaseAdmin.from("abonelikler").update({ cadence_gun: cadence, sonraki_tarih: sonraki }).eq("id", mevcut.id);
    } else {
      await supabaseAdmin.from("abonelikler").insert({
        email, urun_id: urunId, urun_adi: body.urun_adi || null, urun_slug: body.urun_slug || null,
        cadence_gun: cadence, indirim_yuzde: ABONE_INDIRIM, aktif: true, sonraki_tarih: sonraki,
      });
    }
    return NextResponse.json({ ok: true, indirim_yuzde: ABONE_INDIRIM }, { headers: NO_STORE });
  } catch (e) {
    console.error("[abonelik] POST hatasi:", e);
    return NextResponse.json({ error: "abonelik kaydedilemedi" }, { status: 500, headers: NO_STORE });
  }
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
