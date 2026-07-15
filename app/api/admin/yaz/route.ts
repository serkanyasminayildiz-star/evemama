export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Admin YAZMA proxy'si — RLS Faz 3: admin panelin katalog/kupon/blog/site ayarı
// yazmaları tarayıcı (anon) yerine buradan (service_role) geçer. Böylece bu
// tablolarda RLS açılınca anon key ile YAZMA (fiyat vandalizmi vb.) imkânsız olur.
// Auth: Bearer ADMIN_SIFRE. Tablo + işlem beyaz listeli; filtreler eq eşleşmesi.
const ADMIN_SIFRE = "evemama2025";
const noStore = { "Cache-Control": "no-store" };

const TABLOLAR = ["urunler", "kategoriler", "markalar", "kuponlar", "blog_sorular", "site_ayarlari", "abonelikler"] as const;
type Tablo = (typeof TABLOLAR)[number];
const ISLEMLER = ["insert", "update", "delete", "upsert", "delete_hepsi", "select"] as const;
type Islem = (typeof ISLEMLER)[number];

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export async function POST(req: NextRequest) {
  if ((req.headers.get("authorization") || "") !== `Bearer ${ADMIN_SIFRE}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: noStore });
  }
  try {
    const govde = (await req.json()) as {
      tablo?: string; islem?: string;
      veri?: Record<string, unknown> | Record<string, unknown>[];
      filtre?: Record<string, unknown>;
      onConflict?: string;
    };
    const tablo = govde.tablo as Tablo;
    const islem = govde.islem as Islem;
    if (!TABLOLAR.includes(tablo)) return NextResponse.json({ error: "geçersiz tablo" }, { status: 400, headers: noStore });
    if (!ISLEMLER.includes(islem)) return NextResponse.json({ error: "geçersiz işlem" }, { status: 400, headers: noStore });

    const sb = adminClient();
    const t = sb.from(tablo);
    let sonuc: { data: unknown; error: { message: string } | null };

    if (islem === "select") {
      // Admin listeleri (kuponlar/blog_sorular gibi RLS ile API'den kapatılan tablolar).
      let q = t.select("*").order("created_at", { ascending: false }).limit(500);
      if (govde.filtre) for (const [alan, deger] of Object.entries(govde.filtre)) q = q.eq(alan, deger);
      sonuc = await q;
    } else if (islem === "insert") {
      sonuc = await t.insert(govde.veri as Record<string, unknown>).select();
    } else if (islem === "upsert") {
      sonuc = await t.upsert(govde.veri as Record<string, unknown>, govde.onConflict ? { onConflict: govde.onConflict } : undefined).select();
    } else if (islem === "update") {
      if (!govde.filtre || Object.keys(govde.filtre).length === 0) {
        return NextResponse.json({ error: "update için filtre zorunlu" }, { status: 400, headers: noStore });
      }
      let q = t.update(govde.veri as Record<string, unknown>);
      for (const [alan, deger] of Object.entries(govde.filtre)) q = q.eq(alan, deger);
      sonuc = await q.select();
    } else if (islem === "delete") {
      if (!govde.filtre || Object.keys(govde.filtre).length === 0) {
        return NextResponse.json({ error: "delete için filtre zorunlu" }, { status: 400, headers: noStore });
      }
      let q = t.delete();
      for (const [alan, deger] of Object.entries(govde.filtre)) q = q.eq(alan, deger);
      sonuc = await q.select();
    } else {
      // delete_hepsi — yalnız CSV içe aktarma öncesi ürün tablosunu boşaltmak için.
      if (tablo !== "urunler") return NextResponse.json({ error: "delete_hepsi yalnız urunler için" }, { status: 400, headers: noStore });
      sonuc = await t.delete().neq("id", 0).select("id");
    }

    if (sonuc.error) return NextResponse.json({ ok: false, error: sonuc.error.message }, { status: 500, headers: noStore });
    return NextResponse.json({ ok: true, data: sonuc.data ?? [] }, { headers: noStore });
  } catch (e: unknown) {
    console.error("[admin/yaz]", e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false, error: "işlem başarısız" }, { status: 500, headers: noStore });
  }
}
