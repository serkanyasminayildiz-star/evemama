// Ödeme akışı fraud korumaları (21 Ağu 2026).
//
// TETİKLEYEN OLAY: Mısır IP'li (102.41.93.29) bir saldırgan sahte isim/adres
// ("ada anmewr adwq", "1 qwe qweqwe") ve geçersiz telefonlarla (53252352333)
// çalıntı kart denedi; 3DS onu durdurdu ama bankalar iyzico'ya fraud bildirdi →
// iyzico hesaba ZORUNLU 3DS açtı. Devam ederse hesap askıya alınabilir.
// Bu modül üç katman sağlar: hız limiti, telefon doğrulama, ülke kapısı.
//
// TASARIM İLKESİ: gerçek müşteriyi ASLA engelleme. Her kural, meşru bir
// siparişin geçeceği şekilde gevşek; yalnız otomatik/özensiz saldırıyı keser.

// ── 1) HIZ LİMİTİ ───────────────────────────────────────────────────────────
// Bellek içi ve instance-lokal (serverless'ta her örnek kendi sayacını tutar)
// → tam koruma değil, "best effort". Kart deneyiciler saniyeler içinde onlarca
// deneme yaptığı için pratikte aynı örneğe düşer ve yakalanır. Saldırı ısrar
// ederse DB tabanlı sayaca geçilmeli.
type Damga = number[];
const sayaclar = new Map<string, Damga>();

export function hizAsildi(anahtar: string, limit: number, pencereMs: number): boolean {
  const simdi = Date.now();
  const gecmis = (sayaclar.get(anahtar) || []).filter(t => simdi - t < pencereMs);
  if (gecmis.length >= limit) {
    sayaclar.set(anahtar, gecmis); // pencereyi kaydır, sayacı şişirme
    return true;
  }
  gecmis.push(simdi);
  sayaclar.set(anahtar, gecmis);
  // Bellek koruması: sözlük şişerse en eskileri at (uzun ömürlü instance).
  if (sayaclar.size > 5000) {
    for (const [k, v] of sayaclar) {
      if (!v.length || simdi - v[v.length - 1] > pencereMs) sayaclar.delete(k);
    }
  }
  return false;
}

/**
 * İstek sahibinin IP'si — hız limitinin anahtarı, bu yüzden TAKLİT EDİLEMEZ
 * olmalı. Sıralama bilinçli: `x-vercel-*` başlıklarını Vercel edge'i her zaman
 * kendisi yazar (istemcinin gönderdiği değer ezilir — canlıda doğrulandı),
 * `x-real-ip` de Vercel tarafından set edilir. `x-forwarded-for` en sonda ve
 * yalnız SON hop okunur: istemci kendi listesini gönderirse sahte değerler
 * BAŞA eklenir, gerçek IP sona yazılır — ilk hop'u okumak hız limitini
 * her istekte farklı sahte IP göndererek atlatmayı mümkün kılardı.
 */
export function istekIp(req: { headers: { get(ad: string): string | null } }): string {
  const vercelXff = (req.headers.get("x-vercel-forwarded-for") || "").split(",").pop()?.trim();
  if (vercelXff) return vercelXff;
  const realIp = (req.headers.get("x-real-ip") || "").trim();
  if (realIp) return realIp;
  const xff = (req.headers.get("x-forwarded-for") || "").split(",").pop()?.trim();
  return xff || "bilinmiyor";
}

// ── 2) TELEFON DOĞRULAMA (TR cep) ───────────────────────────────────────────
// Örnekler bilinçli olarak maskeli (XXX): gerçek bir aboneye ait olabilecek
// numara ne arayüzde ne kodda örnek olarak yazılmaz.
/** "+90 532 XXX XX XX", "0532...", "532..." → 10 haneli düz numara; çözülemezse "". */
export function telefonNormalize(ham: string): string {
  let d = String(ham || "").replace(/\D/g, "");
  if (d.startsWith("0090")) d = d.slice(4);
  else if (d.startsWith("90") && d.length > 10) d = d.slice(2);
  if (d.startsWith("0")) d = d.slice(1);
  return d;
}

export function telefonGecerli(ham: string): { gecerli: boolean; sebep?: string } {
  const d = telefonNormalize(ham);
  if (!d) return { gecerli: false, sebep: "Telefon numarası gerekli." };
  if (d.length !== 10 || !d.startsWith("5")) {
    return { gecerli: false, sebep: "Geçerli bir cep telefonu girin (örn. 0532 XXX XX XX)." };
  }
  // Saldırganın kullandığı desenler: 53252352333 / 52352352333 gibi az çeşitli,
  // tekrarlı rakamlar. Gerçek numaralarda en az 3 farklı rakam bulunur.
  const farkli = new Set(d).size;
  if (farkli <= 2) return { gecerli: false, sebep: "Telefon numarası geçersiz görünüyor." };
  if (/(\d)\1{5,}/.test(d)) return { gecerli: false, sebep: "Telefon numarası geçersiz görünüyor." };
  if (d === "5555555555" || d === "5000000000") return { gecerli: false, sebep: "Telefon numarası geçersiz görünüyor." };
  return { gecerli: true };
}

// ── 3) ÜLKE KAPISI ──────────────────────────────────────────────────────────
// SİTE GENELİNDE IP ENGELİ YOK (bilinçli): Googlebot, Merchant Center feed
// çekimi ve Clarity yurtdışı IP'lerden gelir — engellenirse SEO ve Shopping
// reklamları ölür. Kapı YALNIZ kartlı ödeme başlatmada uygulanır; yurtdışından
// gelen kullanıcı havale/EFT ile (peşin, fraud riski sıfır) alışverişe devam eder.
// Kartla ödemeye izin verilen ülkeler. Yurtdışındaki Türk müşteriler (Almanya,
// Hollanda...) Türkiye'ye sipariş verebilir; onlar da kesiliyorsa buraya ülke
// kodu eklemek yeterli — TEK SATIRLIK genişletme. Karar için Vercel loglarında
// "[kontrol] yurtdisi checkout" satırlarına bak: hangi ülke, ne sıklıkta.
export const KART_ULKELERI = ["TR"] as const;

/** Vercel'in coğrafi başlığı. Bilinmiyorsa "" döner → kapı UYGULANMAZ (fail-open). */
export function ulkeKodu(req: { headers: { get(ad: string): string | null } }): string {
  return (req.headers.get("x-vercel-ip-country") || "").toUpperCase();
}

/** Kartla ödeme bu istek için açık mı? Ülke okunamazsa AÇIK sayılır. */
export function kartOdemeAcik(req: { headers: { get(ad: string): string | null } }): boolean {
  const ulke = ulkeKodu(req);
  return ulke === "" || (KART_ULKELERI as readonly string[]).includes(ulke);
}
