import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['iyzipay'],
  images: {
    // next/image External URL'leri sadece allowlist'ten cekiyor — XSS/SSRF
    // riskine karsi guvenlik. Urun resimleri Supabase Storage'tan geliyor.
    remotePatterns: [
      {
        // *.supabase.co — Supabase proje ref'i degisse bile (orn. eski
        // jjdzeowqxhghzyhjyqwe → guncel curbhyfhyanwqtduegng) gorseller
        // kirilmasin diye wildcard. Yol public storage ile sinirli, bu yuzden
        // next/image yalnizca herkese acik urun gorsellerini optimize eder.
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        // platincdn.com — bezos tedarikci feed'inden gelen urun gorselleri
        // (21 Tem 2026 ice aktarim). Bu host allowlist'te olmadigi icin
        // next/image tum bezos urunlerinin gorselini engelliyordu (admin
        // listesinde bos kareler). Gorseller kucuk (~11 KB ortalama).
        protocol: "https",
        hostname: "platincdn.com",
        pathname: "/**",
      },
    ],
    // Modern formatlar — Next/Image otomatik AVIF/WebP uretir, browser
    // accept header'ina gore uygun olani sunulur. Eski browser'larda
    // orijinal format dusulur.
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;