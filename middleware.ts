import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ── BAKIM MODU ──────────────────────────────────────────────────────────────
// Site geçici olarak müşterilere KAPALI. Admin paneli (/admin, /api/admin) ve
// in-flight ödeme callback'i (/api/odeme/sonuc) AÇIK kalır.
//
// KAPATMAK (siteyi tekrar AÇMAK) İÇİN: BAKIM = false yap (veya bu dosyayı sil),
// sonra commit + push. ~1-2 dk içinde site normale döner.
const BAKIM = true;

// Bakım modunda bile erişilebilir kalan yollar (admin + ödeme sonucu)
const ACIK_YOLLAR = ["/admin", "/api/admin", "/api/odeme/sonuc"];

const BAKIM_HTML = `<!DOCTYPE html>
<html lang="tr"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="robots" content="noindex" />
<title>Kısa bir bakımdayız — evemama.net</title>
</head>
<body style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#FDF6EE;color:#5C3D2E;display:flex;min-height:100vh;align-items:center;justify-content:center;text-align:center;padding:24px;box-sizing:border-box;">
  <div style="max-width:460px;">
    <div style="font-size:64px;margin-bottom:12px;">🐾</div>
    <h1 style="font-family:Georgia,serif;font-size:26px;margin:0 0 12px;">Kısa bir bakımdayız</h1>
    <p style="font-size:15px;line-height:1.6;opacity:.8;margin:0 0 22px;">evemama.net'i sizin için iyileştiriyoruz. Çok kısa süre sonra yeniden buradayız. Anlayışınız için teşekkürler. 🧡</p>
    <p style="font-size:14px;margin:0;">Sipariş ve sorularınız için:<br/>
      <a href="https://wa.me/905347488001" style="display:inline-block;margin-top:10px;background:#25D366;color:#fff;font-weight:700;text-decoration:none;padding:12px 24px;border-radius:50px;">📱 WhatsApp: 0534 748 80 01</a>
    </p>
  </div>
</body></html>`;

export function middleware(req: NextRequest) {
  if (!BAKIM) return NextResponse.next();

  const { pathname } = req.nextUrl;
  if (ACIK_YOLLAR.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  return new NextResponse(BAKIM_HTML, {
    status: 503,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "retry-after": "7200",
    },
  });
}

export const config = {
  // Statik dosyalar (_next) hariç tüm istekler bakım kontrolünden geçer.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
