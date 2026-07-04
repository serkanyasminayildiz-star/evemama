export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { oneriUret } from "../../../lib/mamaAsistani";

// Mama Asistanı — public endpoint ama ücretli API çağırıyor: girdiler sınırlanır +
// IP başına best-effort hız sınırı (serverless instance-lokal; tam koruma değil,
// kaba kötüye kullanımı keser).
const noStore = { "Cache-Control": "no-store" };
const istekler = new Map<string, number[]>(); // ip → zaman damgaları
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

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "bilinmiyor";
    if (hizAsildi(ip)) {
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
