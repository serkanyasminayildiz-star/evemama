export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Admin sipariş verisi — RLS Faz 2: admin paneli siparisler tablosunu artık
// tarayıcıdan (anon) DEĞİL bu route üzerinden (service_role) okur/günceller.
// Böylece siparisler'e RLS açılınca müşteri PII'sı anon key ile erişilemez olur.
// Auth: Bearer ADMIN_SIFRE (diğer admin API'leriyle aynı desen).
const ADMIN_SIFRE = "evemama2025";
const noStore = { "Cache-Control": "no-store" };

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

// GET ?sayilar=1 → {toplam, bekleyen, bugun} | GET ?durum=<filtre> → sipariş listesi (200)
export async function GET(req: NextRequest) {
  if (!yetkili(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: noStore });
  const sb = adminClient();
  try {
    if (req.nextUrl.searchParams.get("sayilar")) {
      // "Bugün" Türkiye gününe göre (sunucu UTC çalışır; TR = UTC+3 sabit).
      const trSimdi = new Date(Date.now() + 3 * 3600_000);
      const bugunTrBaslangicUtc = new Date(Date.UTC(trSimdi.getUTCFullYear(), trSimdi.getUTCMonth(), trSimdi.getUTCDate()) - 3 * 3600_000);
      const [{ count: toplam }, { count: bekleyen }, { count: bugun }] = await Promise.all([
        sb.from("siparisler").select("*", { count: "exact", head: true }),
        sb.from("siparisler").select("*", { count: "exact", head: true }).eq("durum", "beklemede"),
        sb.from("siparisler").select("*", { count: "exact", head: true }).gte("created_at", bugunTrBaslangicUtc.toISOString()),
      ]);
      return NextResponse.json({ ok: true, toplam: toplam || 0, bekleyen: bekleyen || 0, bugun: bugun || 0 }, { headers: noStore });
    }
    const durum = req.nextUrl.searchParams.get("durum") || "";
    // TÜM geçmiş siparişler döner (eskiden .limit(200) ile son 200 ile sınırlıydı).
    // Sayfalama ŞART: PostgREST tek istekte en fazla 1000 satır verir ve .limit()
    // bunu AŞMAZ — sessizce keser, hata da vermez. Bu repoda aynı tuzak 6 kez vurdu.
    // İkincil sıralama (id) bilinçli: created_at eşit olduğunda satır sırası
    // sayfalar arasında kayarsa kayıt tekrarlanır ya da atlanırdı.
    const SAYFA = 1000;
    const TAVAN_SAYFA = 20; // 20.000 sipariş tavanı — panel kilitlenmesin
    type SiparisSatir = Record<string, unknown>;
    const tumu: SiparisSatir[] = [];
    let kesildi = false;
    for (let s = 0; s < TAVAN_SAYFA; s++) {
      let q = sb.from("siparisler").select("*")
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(s * SAYFA, s * SAYFA + SAYFA - 1);
      if (durum) q = q.eq("durum", durum);
      const { data, error } = await q;
      if (error) throw error;
      if (!data?.length) break;
      tumu.push(...(data as SiparisSatir[]));
      if (data.length < SAYFA) break;
      if (s === TAVAN_SAYFA - 1) kesildi = true; // sessiz kesme YOK — yanıtta bildirilir
    }
    return NextResponse.json({ ok: true, siparisler: tumu, toplam: tumu.length, kesildi }, { headers: noStore });
  } catch (e: unknown) {
    console.error("[admin/siparisler] GET:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "siparişler okunamadı" }, { status: 500, headers: noStore });
  }
}

// PATCH {id, degisiklik: {durum? | odeme_durumu? | kargo_takip?}} — alan beyaz listesi.
export async function PATCH(req: NextRequest) {
  if (!yetkili(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: noStore });
  try {
    const { id, degisiklik } = (await req.json()) as { id?: number; degisiklik?: Record<string, unknown> };
    if (!id || !degisiklik) return NextResponse.json({ error: "id ve degisiklik gerekli" }, { status: 400, headers: noStore });
    const izinli = ["durum", "odeme_durumu", "kargo_takip"] as const;
    const guncelleme: Record<string, string> = {};
    for (const alan of izinli) {
      if (typeof degisiklik[alan] === "string") guncelleme[alan] = degisiklik[alan] as string;
    }
    if (Object.keys(guncelleme).length === 0) {
      return NextResponse.json({ error: "güncellenecek geçerli alan yok" }, { status: 400, headers: noStore });
    }
    const { error } = await adminClient().from("siparisler").update(guncelleme).eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true }, { headers: noStore });
  } catch (e: unknown) {
    console.error("[admin/siparisler] PATCH:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "sipariş güncellenemedi" }, { status: 500, headers: noStore });
  }
}
