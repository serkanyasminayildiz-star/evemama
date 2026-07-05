// İzmir içi AYNI GÜN ELDEN TESLİMAT — TEK KAYNAK (kurallar + ilçe listesi +
// teslim günü hesabı). Checkout, ürün sayfası, ana sayfa ve sunucu (api/odeme)
// hep buradan okur.
//
// Kurallar (4 Tem 2026, işletme kararı):
//  • Kapsam: İzmir'in 9 merkez ilçesi (aşağıda) — uzak ilçelere (Tire, Bergama,
//    Çeşme, Selçuk...) verilmez.
//  • Saat 12:00'a kadar verilen sipariş AYNI GÜN 15:00–18:00 arası elden teslim;
//    12:00 sonrası ertesi teslim gününe sarkar.
//  • Teslimat günleri: Pazartesi–Cumartesi (Pazar teslimat YOK).
//  • Ödeme: kapıda NAKİT (fiziki POS başvurusu yapıldı; yakında kapıda kart).

export const ELDEN_TESLIMAT = {
  IL: "İzmir",
  ILCELER: ["Balçova", "Bayraklı", "Bornova", "Buca", "Gaziemir", "Karabağlar", "Karşıyaka", "Konak", "Narlıdere"] as readonly string[],
  KESIM_SAATI: 12,                 // bu saate kadar sipariş → aynı gün
  TESLIM_ARALIGI: "15:00 – 18:00", // teslim saat aralığı
  GUNLER: "Pazartesi – Cumartesi", // Pazar teslimat yok
  ODEME_NOTU: "Kapıda nakit ödeme (çok yakında kapıda kartla ödeme)",
} as const;

/** İl + ilçe bu hizmetin kapsamında mı? (Türkçe-duyarsız karşılaştırma) */
export function eldenUygun(il: string, ilce: string): boolean {
  if ((il || "").toLocaleLowerCase("tr-TR") !== ELDEN_TESLIMAT.IL.toLocaleLowerCase("tr-TR")) return false;
  const i = (ilce || "").toLocaleLowerCase("tr-TR").trim();
  return ELDEN_TESLIMAT.ILCELER.some(x => x.toLocaleLowerCase("tr-TR") === i);
}

export type TeslimBilgi = {
  gun: "bugün" | "yarın" | "Pazartesi";
  metin: string; // örn. "Bugün 15:00 – 18:00 arası kapında"
};

/** Şu an sipariş verilse teslim NE ZAMAN? Türkiye saatiyle (UTC+3, sabit) hesaplar:
 *  Pazar → Pazartesi; hafta içi/Cmt saat<12 → bugün; ≥12 → ertesi gün
 *  (Cumartesi ≥12 → Pazar teslim olmadığından Pazartesi). */
export function teslimBilgisi(simdi?: Date): TeslimBilgi {
  const tr = new Date((simdi ? simdi.getTime() : Date.now()) + 3 * 3600_000);
  const gunNo = tr.getUTCDay();   // 0=Pazar, 6=Cumartesi
  const saat = tr.getUTCHours();
  let gun: TeslimBilgi["gun"];
  if (gunNo === 0) gun = "Pazartesi";                       // Pazar günü sipariş → Pazartesi
  else if (saat < ELDEN_TESLIMAT.KESIM_SAATI) gun = "bugün"; // kesimden önce → aynı gün
  else if (gunNo === 6) gun = "Pazartesi";                   // Cumartesi kesim sonrası → Pazartesi
  else gun = "yarın";
  const baslik = gun === "bugün" ? "Bugün" : gun === "yarın" ? "Yarın" : "Pazartesi";
  return { gun, metin: `${baslik} ${ELDEN_TESLIMAT.TESLIM_ARALIGI} arası kapında` };
}
