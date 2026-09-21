// Google tıklama kimliği (gclid / gbraid / wbraid) yakalama — TEK KAYNAK (21 Eyl 2026).
//
// NEDEN VAR: Google Ads dönüşüm etiketi YALNIZ müşterinin gördüğü başarı
// sayfasında tetikleniyor (app/odeme/sonuc/page.tsx) ve sunucu tarafında
// dönüşüm bildirimi yok. 17-18 Eyl'de iyzico callback'i kaçırınca müşteri o
// sayfaya hiç ulaşamadı → siparişler mutabakat cron'uyla kurtarıldı ama
// Google Ads 3 satışı (₺13.675,78) HİÇ görmedi. Tıklama kimliği de
// saklanmadığı için geriye dönük çevrimdışı yükleme yapılamadı → kalıcı kayıp.
//
// Bu modül tıklama kimliğini ilk girişte saklar, ödeme başlatınca siparişe
// yazılır. Callback bir daha kaçırırsa kurtarılan siparişler Google Ads'e
// çevrimdışı dönüşüm (CSV) olarak yüklenebilir — ölçüm kaybı olmaz.
//
// Sayfa geçişleri hard-redirect olduğu için (bkz. ClarityKimlik) yakalama
// her sayfada yeniden çalışır; reklam girişi hangi sayfaya düşerse düşsün
// kimlik localStorage'a bir kez yazılır ve ödemeye kadar taşınır.

const ANAHTAR = "evemama_gclid";
const GECERLILIK_GUN = 90; // Google'ın tıklama atıf penceresi

// gclid haricindekiler önekle saklanır ki CSV yüklemesinde hangi sütuna
// gideceği belli olsun (Google'ın şablonunda ayrı sütunlar var).
const PARAMLAR = ["gclid", "wbraid", "gbraid"] as const;

// Kimlik alfanümerik + - _ . olur. Saklamadan ÖNCE süzülür: localStorage'dan
// gelen değer sunucuya gönderilecek, çöp/enjeksiyon girmesin.
const DESEN = /^[A-Za-z0-9_.-]{1,200}$/;

type Kayit = { id: string; t: number };

/** Landing URL'de tıklama kimliği varsa sakla. Her sayfa yüklenişinde çağrılır. */
export function gclidYakala(): void {
  if (typeof window === "undefined") return;
  try {
    const sp = new URLSearchParams(window.location.search);
    for (const p of PARAMLAR) {
      const ham = (sp.get(p) || "").trim();
      if (!ham || !DESEN.test(ham)) continue;
      // gclid düz saklanır; diğerleri önekli (CSV'de farklı sütuna gider).
      const id = p === "gclid" ? ham : `${p}:${ham}`;
      const kayit: Kayit = { id, t: Date.now() };
      window.localStorage.setItem(ANAHTAR, JSON.stringify(kayit));
      return; // ilk bulunan kazanır (gclid önceliklidir, sırayı PARAMLAR belirler)
    }
  } catch {
    /* localStorage kapalı/dolu → sessizce geç, ödeme akışını asla bozma */
  }
}

/** Saklı tıklama kimliği (süresi geçmişse null). Ödeme başlatılırken okunur. */
export function gclidOku(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const ham = window.localStorage.getItem(ANAHTAR);
    if (!ham) return null;
    const k = JSON.parse(ham) as Kayit;
    if (!k?.id || typeof k.t !== "number") return null;
    if (Date.now() - k.t > GECERLILIK_GUN * 86400_000) {
      window.localStorage.removeItem(ANAHTAR);
      return null;
    }
    return k.id;
  } catch {
    return null;
  }
}

/**
 * Sunucu tarafı süzgeç — istemciden gelen değere GÜVENİLMEZ.
 * Desene uymayan / çok uzun değer null döner (DB'ye çöp yazılmaz).
 */
export function gclidTemizle(ham: unknown): string | null {
  const s = typeof ham === "string" ? ham.trim() : "";
  if (!s) return null;
  // Önekli biçim de kabul: "wbraid:XXX" / "gbraid:XXX"
  const govde = s.includes(":") ? s.slice(s.indexOf(":") + 1) : s;
  const onek = s.includes(":") ? s.slice(0, s.indexOf(":")) : "";
  if (onek && onek !== "wbraid" && onek !== "gbraid") return null;
  if (!DESEN.test(govde)) return null;
  return s.length <= 210 ? s : null;
}
