"use client";
import { useEffect } from "react";
import { gclidYakala } from "../lib/gclid";

// Google tıklama kimliğini landing URL'den yakalar (layout'ta her sayfada).
// Reklam girişi hangi sayfaya düşerse düşsün kimlik saklanır ve ödemeye
// kadar taşınır; böylece callback kaçırıp sipariş cron'la kurtarılsa bile
// satış Google Ads'e çevrimdışı dönüşüm olarak yüklenebilir. bkz. lib/gclid.ts
export default function GclidYakala() {
  useEffect(() => {
    gclidYakala();
  }, []);
  return null;
}
