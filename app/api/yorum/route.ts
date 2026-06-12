export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Ürün yorumları — ÜYE girişli (spam'e karşı) + "Doğrulanmış müşteri" rozeti
// (siparişi olan üye). Okuma RLS ile herkese açık (onayli=true); yazma yalnız
// bu API üzerinden (token doğrulanır, service_role insert eder).
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const NO_STORE = { "Cache-Control": "no-store" };

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

export async function POST(req: NextRequest) {
  const email = await uyeEmail(req);
  if (!email) return NextResponse.json({ error: "Yorum yapmak için giriş yapın." }, { status: 401, headers: NO_STORE });

  let body: { urun_id?: number; puan?: number; yorum?: string; ad?: string } = {};
  try { body = await req.json(); } catch { /* boş gövde */ }

  const urunId = Number(body.urun_id);
  const puan = Math.min(Math.max(Math.round(Number(body.puan) || 5), 1), 5);
  const yorum = (typeof body.yorum === "string" ? body.yorum : "").trim().slice(0, 1000);
  const ad = ((typeof body.ad === "string" ? body.ad : "").trim().slice(0, 60)) || email.split("@")[0];
  if (!urunId || !yorum) return NextResponse.json({ error: "Ürün ve yorum gerekli." }, { status: 400, headers: NO_STORE });

  // Doğrulanmış müşteri mi? (bu e-postayla ödenmiş siparişi var mı)
  let dogrulanmis = false;
  try {
    const { count } = await supabaseAdmin
      .from("siparisler").select("id", { count: "exact", head: true })
      .eq("email", email).eq("odeme_durumu", "odendi");
    dogrulanmis = !!(count && count > 0);
  } catch { /* doğrulanamazsa rozet yok, yorum yine kaydedilir */ }

  try {
    const { data, error } = await supabaseAdmin
      .from("urun_yorumlari")
      .insert({ urun_id: urunId, email, ad, puan, yorum, dogrulanmis, onayli: true })
      .select("id").single();
    if (error) throw error;
    return NextResponse.json({ ok: true, id: data?.id, dogrulanmis }, { headers: NO_STORE });
  } catch (e) {
    console.error("[yorum] POST hatasi:", e);
    return NextResponse.json({ error: "yorum kaydedilemedi" }, { status: 500, headers: NO_STORE });
  }
}
