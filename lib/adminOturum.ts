// Admin oturumu (14 Eki 2026) — şifre YALNIZ SUNUCUDA.
//
// AÇIK: ADMIN_SIFRE = "evemama2025" istemci koduna gömülüydü → /admin sayfasının
// herkese giden JS dosyasında açıkça duruyordu. Şifreyi okuyan herkes admin
// API'lerini çağırabiliyordu: sipariş + müşteri verisi, ürün/fiyat yazma ve
// toplu silme, havale "ödendi" onayı, müşteriye e-posta, e-fatura kesme.
//
// YENİ: şifre yalnız Vercel ortam değişkeninde (ADMIN_SIFRE, evemama-u7wz
// Production). Giriş /api/admin/giris'te doğrulanır → imzalı, httpOnly +
// SameSite=Strict çerez (12 saat; tarayıcı kapanınca da düşer). Admin API'leri
// bu çerezi ya da sunucu-sunucu/manuel çağrı için "Bearer <env şifresi>" kabul
// eder. İmza anahtarı şifrenin kendisi → şifre değişince tüm oturumlar düşer.
// Env yoksa giriş KAPALI (fail-closed) — eski sabit şifreye ASLA geri düşülmez.
//
// Yalnız sunucu (route handler) kullanır; istemci koduna import ETME.

import * as crypto from "crypto";
import type { NextRequest, NextResponse } from "next/server";

export const ADMIN_CEREZ = "evemama_admin";
const OTURUM_SN = 12 * 3600;

function sifre(): string {
  return process.env.ADMIN_SIFRE || "";
}

/** Sunucuda şifre tanımlı mı (giriş ekranına anlamlı hata için). */
export function adminSifresiTanimli(): boolean {
  return sifre().length > 0;
}

function imza(son: number): string {
  return crypto.createHmac("sha256", sifre()).update(`evemama-admin|${son}`).digest("base64url");
}

/** Sabit süreli karşılaştırma — özetler eşit uzunlukta, uzunluk da sızmaz. */
function esit(a: string, b: string): boolean {
  const ozet = (v: string) => crypto.createHash("sha256").update(v).digest();
  return crypto.timingSafeEqual(ozet(a), ozet(b));
}

export function sifreDogru(aday: unknown): boolean {
  const s = sifre();
  return !!s && typeof aday === "string" && aday.length > 0 && esit(aday, s);
}

/** Başarılı girişte oturum çerezini yanıta yazar. */
export function oturumAc(res: NextResponse): void {
  const son = Math.floor(Date.now() / 1000) + OTURUM_SN;
  res.cookies.set(ADMIN_CEREZ, `${son}.${imza(son)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api", // yalnız API çağrılarına gider
    // maxAge YOK → tarayıcı kapanınca silinir; 12 saat sınırı imzanın içinde.
  });
}

/** Admin API kapısı: geçerli oturum çerezi VEYA Bearer <env şifresi>. */
export function adminYetkili(req: NextRequest): boolean {
  if (!sifre()) return false;
  const [sonMetin, imz] = (req.cookies.get(ADMIN_CEREZ)?.value || "").split(".");
  const son = Number(sonMetin);
  if (imz && Number.isInteger(son) && son > Date.now() / 1000 && esit(imz, imza(son))) return true;
  const auth = req.headers.get("authorization") || "";
  return auth.startsWith("Bearer ") && sifreDogru(auth.slice(7));
}
