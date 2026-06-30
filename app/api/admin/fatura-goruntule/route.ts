export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { faturaPdfArsiv } from "../../../../lib/nilvera/client";

// Kesilmiş e-Arşiv faturayı PDF olarak göster (admin). Sipariş → fatura_uuid →
// Nilvera PDF (base64) → inline application/pdf. Auth: Bearer ADMIN_SIFRE.
const ADMIN_SIFRE = "evemama2025";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
function yetkili(req: NextRequest) {
  return (req.headers.get("authorization") || "") === `Bearer ${ADMIN_SIFRE}`;
}
const noStore = { "Cache-Control": "no-store" };

export async function GET(req: NextRequest) {
  if (!yetkili(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: noStore });
  try {
    const siparisId = req.nextUrl.searchParams.get("siparisId");
    if (!siparisId) return NextResponse.json({ error: "siparisId gerekli" }, { status: 400, headers: noStore });

    const sb = adminClient();
    const { data: sip, error } = await sb
      .from("siparisler")
      .select("fatura_uuid, fatura_no, siparis_no")
      .eq("id", siparisId)
      .single();
    if (error || !sip) return NextResponse.json({ error: "sipariş bulunamadı" }, { status: 404, headers: noStore });
    if (!sip.fatura_uuid) return NextResponse.json({ error: "bu siparişte kesilmiş fatura yok" }, { status: 400, headers: noStore });

    const pdf = await faturaPdfArsiv(sip.fatura_uuid as string);
    const dosyaAdi = `fatura-${sip.fatura_no || sip.siparis_no || sip.fatura_uuid}.pdf`;
    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${dosyaAdi}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "fatura görüntülenemedi" }, { status: 500, headers: noStore });
  }
}
