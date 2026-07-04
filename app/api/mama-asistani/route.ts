export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";
import { oneriUret } from "../../../lib/mamaAsistani";

// Mama Asistanı — ÜYELERE ÖZEL (ücretli AI çağrısı: hem maliyet koruması hem
// üyelik teşviki). Supabase Bearer token doğrulanır (api/yorum ile aynı desen);
// ek olarak girdi sınırları + best-effort hız limiti (kullanıcı bazlı).
const noStore = { "Cache-Control": "no-store" };
const istekler = new Map<string, number[]>(); // üye e-postası → istek zaman damgaları
const LIMIT = 8;               // pencere başına istek
const PENCERE_MS = 5 * 60_000; // 5 dk

function hizAsildi(ip: string): boolean {
  const simdi = Date.now();
  const eski = (istekler.get(ip) || []).filter(t => simdi - t < PENCERE_MS);
  if (eski.length >= LIMIT) { istekler.set(ip, eski); return true; }
  eski.push(simdi);
  istekler.set(ip, eski);
  return false;
}

function metin(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

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
  try {
    const email = await uyeEmail(req);
    if (!email) {
      return NextResponse.json({ error: "uyelik-gerekli" }, { status: 401, headers: noStore });
    }
    if (hizAsildi(email)) {
      return NextResponse.json({ error: "Çok sık denedin — birkaç dakika sonra tekrar dene." }, { status: 429, headers: noStore });
    }

    const govde = (await req.json()) as Record<string, unknown>;
    const tur = govde.tur === "kedi" || govde.tur === "kopek" ? govde.tur : null;
    const mesaj = metin(govde.mesaj, 600);
    const yas = metin(govde.yas, 30);
    const cins = metin(govde.cins, 80);

    if (!tur) return NextResponse.json({ error: "Kedi mi köpek mi seç." }, { status: 400, headers: noStore });
    if (mesaj.length < 5) return NextResponse.json({ error: "Dostunun ihtiyacını kısaca yaz (örn: tüyleri çok dökülüyor)." }, { status: 400, headers: noStore });

    const sonuc = await oneriUret({ tur, mesaj, yas: yas || undefined, cins: cins || undefined });
    return NextResponse.json({ ok: true, ...sonuc }, { headers: noStore });
  } catch (e: unknown) {
    // Gerçek hata (model emekliliği dahil) log'a AYNEN — istemciye dostça mesaj.
    console.error("[mama-asistani]", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Öneri şu an hazırlanamadı, lütfen biraz sonra tekrar dene." }, { status: 500, headers: noStore });
  }
}
