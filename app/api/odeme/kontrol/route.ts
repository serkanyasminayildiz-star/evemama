export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { kartOdemeAcik, ulkeKodu } from "../../../../lib/fraudKoruma";

// Checkout açılırken çağrılır: bu bağlantıda kartla ödeme sunulabilir mi?
// Yurtdışı IP'de kart seçeneği GİZLENİR (havale/EFT açık kalır) — müşteri
// kartı seçip en sonda reddedilmek yerine baştan doğru seçeneği görür.
// Sunucu tarafı asıl zorlamayı /api/odeme'de yapar; bu yalnız UX içindir.
export async function GET(req: NextRequest) {
  return NextResponse.json(
    { kartAcik: kartOdemeAcik(req), ulke: ulkeKodu(req) || null },
    { headers: { "Cache-Control": "no-store" } },
  );
}
