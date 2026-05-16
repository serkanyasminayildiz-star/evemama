// Robots.txt — bot allow/disallow kurallari.
// Disallow kararlari:
// - /admin, /api/, /odeme — auth/transactional, indexlenmemeli (ayrica
//   bu sayfalarin metadata'sinda noindex var, robots ek savunma).
// - /sepet, /giris, /uye-ol — kullanici-spesifik / transactional.
// - /*.xml — feed'ler crawler botlari icin gereksiz (Google direkt feed
//   indexlemiyor, sitemap ile geliyor).
export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/api/",
        "/odeme",
        "/sepet",
        "/giris",
        "/uye-ol",
        "/cimri.xml",
        "/urunler.xml",
      ],
    },
    sitemap: "https://www.evemama.net/sitemap.xml",
    host: "https://www.evemama.net",
  };
}
