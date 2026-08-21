export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { kartOdemeAcik, ulkeKodu } from "../../../../lib/fraudKoruma";

// Checkout açılırken çağrılır: bu bağlantıda kartla ödeme sunulabilir mi?
// Yurtdışı IP'de kart seçeneği GİZLENİR (havale/EFT açık kalır) — müşteri
// kartı seçip en sonda reddedilmek yerine baştan doğru seçeneği görür.
// Sunucu tarafı asıl zorlamayı /api/odeme'de yapar; bu yalnız UX içindir.
export async function GET(req: NextRequest) {
  const acik = kartOdemeAcik(req);
  const ulke = ulkeKodu(req);
  // ÖLÇÜM: kart istemcide gizlendiği için bu kişiler /api/odeme'ye hiç
  // ulaşmaz → engellendikleri başka hiçbir yerde görünmez. Kapının gerçek
  // müşteriye maliyetini görebilmek için burada logluyoruz. Vercel loglarında
  // "[kontrol] yurtdisi checkout" ara: sık çıkan ülke varsa (örn. DE — oradaki
  // Türk müşteriler) lib/fraudKoruma.ts → KART_ULKELERI listesine eklenir.
  if (!acik) console.warn("[kontrol] yurtdisi checkout — kart gizlendi:", ulke);
  return NextResponse.json(
    { kartAcik: acik, ulke: ulke || null },
    { headers: { "Cache-Control": "no-store" } },
  );
}
