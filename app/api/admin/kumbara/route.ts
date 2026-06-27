export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Pati Kumbarası — pazar dağıtımları (admin yazar). kumbara_dagitim RLS'i
// anon-yazmaya kapalı → service_role. Auth: diğer admin API'leriyle aynı
// (Bearer ADMIN_SIFRE).
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
    const { data, error } = await adminClient().from("kumbara_dagitim").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ dagitimlar: data || [] }, { headers: noStore });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "alınamadı" }, { status: 500, headers: noStore });
  }
}

export async function POST(req: NextRequest) {
  if (!yetkili(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: noStore });
  try {
    const b = await req.json();
    if (!b.tarih) return NextResponse.json({ error: "Tarih zorunlu" }, { status: 400, headers: noStore });
    const { error } = await adminClient().from("kumbara_dagitim").insert({
      tarih: b.tarih,
      tutar: Number(b.tutar) || 0,
      barinak_adi: (b.barinak_adi || "").trim() || null,
      sehir: (b.sehir || "").trim() || null,
      video_url: (b.video_url || "").trim() || null,
      kopek_sayisi: Number(b.kopek_sayisi) || 0,
      ogun_sayisi: Number(b.ogun_sayisi) || 0,
      not_metni: (b.not_metni || "").trim() || null,
    });
    if (error) throw error;
    return NextResponse.json({ ok: true }, { headers: noStore });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "eklenemedi" }, { status: 500, headers: noStore });
  }
}

export async function DELETE(req: NextRequest) {
  if (!yetkili(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: noStore });
  try {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400, headers: noStore });
    const { error } = await adminClient().from("kumbara_dagitim").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true }, { headers: noStore });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "silinemedi" }, { status: 500, headers: noStore });
  }
}
