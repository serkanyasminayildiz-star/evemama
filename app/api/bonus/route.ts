export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Giriş yapmış üyenin kullanılabilir sadakat bonusunu döner (sepet/ödeme
// sayfasında göstermek için). Sadece GÖSTERİM amaçlı — gerçek indirim
// odeme/route.ts'te sunucuda yeniden doğrulanıp uygulanır (güvenlik).
function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) {
    return NextResponse.json({ bonus: null }, { headers: { "Cache-Control": "no-store" } });
  }

  const sb = adminClient();
  let email: string | null = null;
  try {
    const { data } = await sb.auth.getUser(auth.slice(7));
    email = data?.user?.email || null;
  } catch {
    email = null;
  }
  if (!email) {
    return NextResponse.json({ bonus: null }, { headers: { "Cache-Control": "no-store" } });
  }

  const { data: bonuslar } = await sb
    .from("sadakat_bonuslari")
    .select("tutar, min_sepet, bitis_tarihi")
    .eq("email", email)
    .eq("kullanildi", false)
    .gt("bitis_tarihi", new Date().toISOString())
    .order("tutar", { ascending: false })
    .limit(1);

  const b = (bonuslar && bonuslar[0]) || null;
  return NextResponse.json(
    { bonus: b ? { tutar: Number(b.tutar), min_sepet: Number(b.min_sepet), bitis: b.bitis_tarihi } : null },
    { headers: { "Cache-Control": "no-store" } },
  );
}
