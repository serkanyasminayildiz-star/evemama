import { NextRequest, NextResponse } from "next/server";

// BAKIM MODU — env ile anahtarlanır: BAKIM_MODU="true" iken tüm vitrin
// /bakim sayfasına yönlenir. Kapatmak için Vercel'de değeri "false" yap
// (veya değişkeni sil) → redeploy gerekmez, anında normale döner.
//
// AÇIK KALANLAR (bilinçli):
//  • /admin + /api/admin  → stok/katalog girişi bakım sırasında yapılabilsin
//  • /api/*               → admin API'leri ve ödeme callback'leri kırılmasın
//  • /bakim               → sonsuz döngü olmasın
//  • sitemap/robots/feed  → Google taraması "site yok" sanmasın
//  • statik dosyalar      → bakım sayfasının görselleri yüklensin
export function middleware(req: NextRequest) {
  if (process.env.BAKIM_MODU !== "true") return NextResponse.next();

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
