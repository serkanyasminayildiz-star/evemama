export default function robots() {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/odeme/"] },
    sitemap: "https://evemama.net/sitemap.xml",
  };
}