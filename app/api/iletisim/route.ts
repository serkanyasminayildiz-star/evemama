export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { sendIletisimMaili } from "../../../lib/email";

// İletişim formu → info@evemama.net maili. Public endpoint (form herkese açık);
// alanlar sunucuda doğrulanır + uzunluk sınırlanır (spam/istismar dampingi).
const noStore = { "Cache-Control": "no-store" };

function metin(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export async function POST(req: NextRequest) {
  try {
    const govde = (await req.json()) as Record<string, unknown>;
    const ad = metin(govde.ad, 100);
    const soyad = metin(govde.soyad, 100);
    const email = metin(govde.email, 200);
    const mesaj = metin(govde.mesaj, 5000);
    const kvkk = govde.kvkk === true;
    const acikRiza = govde.acikRiza === true;

    if (!ad || !mesaj) return NextResponse.json({ error: "Ad ve mesaj zorunlu." }, { status: 400, headers: noStore });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return NextResponse.json({ error: "Geçerli bir e-posta adresi girin." }, { status: 400, headers: noStore });
    }
    if (!kvkk) return NextResponse.json({ error: "KVKK onayı gerekli." }, { status: 400, headers: noStore });

    const gonderildi = await sendIletisimMaili({ ad, soyad, email, mesaj, acikRiza });
    if (!gonderildi) {
      return NextResponse.json({ error: "Mesaj gönderilemedi, lütfen tekrar deneyin." }, { status: 500, headers: noStore });
    }
    return NextResponse.json({ ok: true }, { headers: noStore });
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400, headers: noStore });
  }
}
