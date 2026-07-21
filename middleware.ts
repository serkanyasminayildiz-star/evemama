import { NextRequest, NextResponse } from "next/server";

// BAKIM MODU — anahtar VERİTABANINDA (site_ayarlari.bakim_modu = "true"/"false").
// Admin panelden tek tıkla açılır/kapanır; redeploy GEREKMEZ (~15 sn'de etkili).
// Acil durum için env override: BAKIM_MODU=true → DB'ye bakmadan bakım.
//
// AÇIK KALANLAR (bilinçli): /admin + /api/* (stok girişi + ödeme callback'leri),
// /bakim (döngü olmasın), sitemap/robots/feed (Google "site yok" sanmasın),
// statik dosyalar. Bu yollar DB'ye HİÇ sormaz (gecikme eklemez).
const CACHE_MS = 15_000; // bayrak en fazla bu kadar bayat kalır
let cache = { deger: false, zaman: 0 };

async function bakimAcikMi(): Promise<boolean> {
  if (process.env.BAKIM_MODU === "true") return true;
  const simdi = Date.now();
  if (simdi - cache.zaman < CACHE_MS) return cache.deger;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return false;
  try {
    const r = await fetch(`${url}/rest/v1/site_ayarlari?anahtar=eq.bakim_modu&select=deger`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(2000),
      cache: "no-store",
    });
    const veri = (await r.json()) as Array<{ deger?: string }>;
    const acik = veri?.[0]?.deger === "true";
    cache = { deger: acik, zaman: simdi };
    return acik;
  } catch {
    // FAIL-OPEN: ayar okunamazsa site AÇIK kalır (yanlışlıkla kapatmaktansa açık kalsın).
    cache = { deger: false, zaman: simdi };
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const muaf =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api") ||
    pathname === "/bakim" ||
    pathname === "/sitemap.xml" ||
    pathname === "/robots.txt" ||
    pathname === "/urunler.xml" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    /\.(png|jpg|jpeg|webp|avif|svg|ico|txt|xml|css|js|woff2?)$/i.test(pathname);
  if (muaf) return NextResponse.next();

  if (!(await bakimAcikMi())) return NextResponse.next();

  // 307 (geçici) — kalıcı yönlendirme tarayıcıda önbelleğe alınıp bakım
  // bitince "site hâlâ bakımda" gibi görünürdü.
  const url = req.nextUrl.clone();
  url.pathname = "/bakim";
  url.search = "";
  return NextResponse.redirect(url, 307);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
