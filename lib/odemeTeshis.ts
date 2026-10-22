// Başarısız kart ödemesinin SEBEBİ (22 Eki 2026) — admin + müşteri için.
//
// SORUN: 3D Secure adımında düşen ödemelerde iyzico çoğu zaman errorMessage
// VERMİYOR, yalnız paymentStatus "FAILURE" dönüyor (panelde "3Ds Üye İşyerine
// Döndü"). Admin "Başarısız Ödemeler"de sebep yerine "FAILURE" görüyor,
// müşteri de neden olmadığını bilmeden aynı kartla tekrar tekrar deniyordu
// (13-22 Eki: 7 müşteri, 23 deneme; biri 10 kez).
//
// ÇÖZÜM: errorMessage yoksa bankanın 3DS sonucu (mdStatus) + kart ailesi
// (Bonus, World, Maximum…) okunup okunur bir sebep yazılır → admin hangi
// bankada/neden düştüğünü görür, müşteri ne yapacağını bilir. Ham mdStatus
// sebebin içinde kalır (eşleme yanlışsa bile asıl değer görünsün).
//
// mdStatus (Türkiye 3D Secure standardı): 1 tam doğrulama; 0 doğrulama
// başarısız (yanlış/süresi dolmuş SMS şifresi ya da banka reddi); 2-4 kart ya
// da banka 3D Secure'a kayıtlı değil / yarım doğrulama; 5-8 banka tarafı hata.

type IyzicoSonuc = {
  errorMessage?: unknown;
  mdStatus?: unknown;
  cardFamily?: unknown;
  cardAssociation?: unknown;
};

export type RetSebebi = {
  sebep: string;          // admin panel (basarisiz_odemeler.error_message)
  musteriMesaji: string;  // sonuç sayfası ("hata" parametresi); boşsa genel yönerge
};

function mdAciklama(md: string): string {
  if (md === "0") return "3D Secure (SMS) doğrulaması başarısız";
  if (md === "2" || md === "3" || md === "4") return "Kart 3D Secure'a kayıtlı değil";
  if (md === "5" || md === "6" || md === "7" || md === "8") return "Bankanın 3D Secure sistemi yanıt vermedi";
  return "";
}

export function retSebebi(d: IyzicoSonuc): RetSebebi {
  const mesaj = String(d.errorMessage ?? "").trim();
  if (mesaj) return { sebep: mesaj, musteriMesaji: mesaj };

  const md = d.mdStatus != null && d.mdStatus !== "" ? String(d.mdStatus) : "";
  const kart = [d.cardFamily, d.cardAssociation].map(v => String(v ?? "").trim()).filter(Boolean).join(" ");
  const aciklama = mdAciklama(md);
  const sebep = [
    (aciklama || "Banka doğrulaması tamamlanamadı (iyzico sebep vermedi)") + (md ? ` (mdStatus ${md})` : ""),
    kart,
  ].filter(Boolean).join(" · ");
  return { sebep, musteriMesaji: aciklama };
}
