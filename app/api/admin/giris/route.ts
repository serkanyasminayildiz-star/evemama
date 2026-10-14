export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { adminSifresiTanimli, oturumAc, sifreDogru } from "../../../../lib/adminOturum";
import { hizAsildi, istekIp } from "../../../../lib/fraudKoruma";

// Admin girişi (14 Eki 2026) — şifre SUNUCUDA doğrulanır (bkz. lib/adminOturum.ts).
// Eskiden /admin şifreyi tarayıcıda karşılaştırıyordu → şifre herkese giden JS'teydi.
const noStore = { "Cache-Control": "no-store" };

export async function POST(req: NextRequest) {
  // Kaba kuvvet freni: IP başına 15 dk'da 10 deneme.
  if (hizAsildi(`admin-giris:${istekIp(req)}`, 10, 15 * 60_000)) {
    return NextResponse.json({ error: "Çok fazla deneme. Lütfen 15 dakika sonra tekrar deneyin." }, { status: 429, headers: noStore });
  }
  if (!adminSifresiTanimli()) {
    console.error("[admin-giris] ADMIN_SIFRE ortam degiskeni tanimli degil");
    return NextResponse.json({ error: "Sunucuda admin şifresi tanımlı değil (ADMIN_SIFRE)." }, { status: 503, headers: noStore });
  }
  let sifre: unknown = "";
  try {
    sifre = ((await req.json()) as { sifre?: unknown })?.sifre;
  } catch {
    // gövde yok/bozuk → hatalı şifre
  }
  if (!sifreDogru(sifre)) {
    return NextResponse.json({ error: "Hatalı şifre!" }, { status: 401, headers: noStore });
  }
  const res = NextResponse.json({ ok: true }, { headers: noStore });
  oturumAc(res);
  return res;
}
