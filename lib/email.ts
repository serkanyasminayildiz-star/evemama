// Resend uzerinden transactional email gonderimi.
//
// Kullanim: sendSiparisOnayMaili({ siparisNo, ad, email, urunler, toplam, ... })
//
// Onemli: email gonderimi BASARISIZ OLURSA bile siparis akisini bozmayiz —
// hata loglanir, false donulur. Siparis Supabase'e zaten kaydedilmis olur,
// musteri /siparislerim sayfasindan goruntuleyebilir.
//
// FROM adresi: evemama.net Resend'de Verified, siparis@evemama.net ile gonderilir.
import { Resend } from "resend";
import { HAVALE_HESAP } from "./havale";

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
// FROM adresi hardcoded — Vercel UI'da env var'i set ederken yapistirma
// sorunlari (underscore vs space, gizli karakterler) iki kez musteri
// mailleri patlatti. Domain (evemama.net) Resend'de Verified, "siparis@"
// inbox'i olmasa bile FROM olarak gonderim icin yetkili.
const FROM_EMAIL = "evemama.net <siparis@evemama.net>";

// Lazy init — env var yoksa Resend client olusturmayalim ki module load
// sirasinda crash etmesin. Production'da env var set olunca otomatik calisir.
let resend: Resend | null = null;
function getResend(): Resend | null {
  if (!RESEND_API_KEY) return null;
  if (!resend) resend = new Resend(RESEND_API_KEY);
  return resend;
}

export type SiparisUrun = {
  ad?: string;
  isim?: string;
  baslik?: string;
  adet?: number;
  miktar?: number;
  fiyat?: number;
  birim_fiyat?: number;
  resim?: string;
  gorsel?: string;
};

export type SiparisOnayParams = {
  siparisNo: string;
  ad: string;
  soyad?: string;
  email: string;
  urunler: SiparisUrun[] | null | undefined;
  toplam: number;
  araToplam?: number;
  adres?: string;
  sehir?: string;
  telefon?: string;
};

function tr(n: number): string {
  return new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function getUrunAd(u: SiparisUrun): string {
  return u.ad || u.isim || u.baslik || "Urun";
}
function getUrunAdet(u: SiparisUrun): number {
  return Number(u.adet || u.miktar || 1);
}
function getUrunFiyat(u: SiparisUrun): number {
  return Number(u.fiyat || u.birim_fiyat || 0);
}

function buildHTML(p: SiparisOnayParams): string {
  const urunler = Array.isArray(p.urunler) ? p.urunler : [];
  const satirlar = urunler.map((u) => {
    const ad = getUrunAd(u);
    const adet = getUrunAdet(u);
    const fiyat = getUrunFiyat(u);
    const toplam = adet * fiyat;
    return `
      <tr>
        <td style="padding:12px 8px;border-bottom:1px solid #eee;font-size:14px;color:#333;">
          ${ad}
          <div style="font-size:12px;color:#888;margin-top:4px;">${adet} adet × ${tr(fiyat)} ₺</div>
        </td>
        <td style="padding:12px 8px;border-bottom:1px solid #eee;font-size:14px;color:#333;text-align:right;white-space:nowrap;">
          ${tr(toplam)} ₺
        </td>
      </tr>
    `;
  }).join("");

  const adresHTML = p.adres
    ? `
      <p style="margin:0 0 6px 0;font-size:14px;color:#333;">
        <strong>${p.ad}${p.soyad ? " " + p.soyad : ""}</strong>
      </p>
      <p style="margin:0 0 6px 0;font-size:14px;color:#555;">${p.adres}${p.sehir ? ", " + p.sehir : ""}</p>
      ${p.telefon ? `<p style="margin:0;font-size:14px;color:#555;">Tel: ${p.telefon}</p>` : ""}
    `
    : "";

  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Siparişiniz alındı — ${p.siparisNo}</title>
</head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#fff;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#ff6b35 0%,#f7931e 100%);padding:32px 24px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:28px;font-weight:700;">evemama.net</h1>
      <p style="margin:8px 0 0 0;color:rgba(255,255,255,0.95);font-size:14px;">Evcil dostunuzun dükkânı</p>
    </div>

    <!-- Başarı mesajı -->
    <div style="padding:32px 24px;text-align:center;border-bottom:1px solid #eee;">
      <div style="font-size:48px;margin-bottom:8px;">📦</div>
      <h2 style="margin:0 0 8px 0;color:#1a1a1a;font-size:22px;">Siparişiniz alındı!</h2>
      <p style="margin:0;color:#555;font-size:15px;line-height:1.5;">
        Merhaba ${p.ad},<br>
        Siparişinizi aldık ve hazırlamaya başladık.
      </p>
      <div style="display:inline-block;margin-top:16px;padding:8px 18px;background:#fff5ed;border:1px solid #ff6b35;border-radius:8px;color:#ff6b35;font-weight:600;font-size:15px;">
        Sipariş No: ${p.siparisNo}
      </div>
    </div>

    <!-- Ürün listesi -->
    <div style="padding:24px;">
      <h3 style="margin:0 0 16px 0;color:#1a1a1a;font-size:16px;">Sipariş Detayı</h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        ${satirlar}
        <tr>
          <td style="padding:16px 8px 8px 8px;font-size:16px;font-weight:700;color:#1a1a1a;">
            Toplam
          </td>
          <td style="padding:16px 8px 8px 8px;font-size:18px;font-weight:700;color:#ff6b35;text-align:right;">
            ${tr(p.toplam)} ₺
          </td>
        </tr>
      </table>
    </div>

    ${adresHTML ? `
    <!-- Adres -->
    <div style="padding:0 24px 24px 24px;">
      <h3 style="margin:0 0 12px 0;color:#1a1a1a;font-size:16px;">Teslimat Adresi</h3>
      <div style="background:#f9fafb;padding:16px;border-radius:8px;">
        ${adresHTML}
      </div>
    </div>` : ""}

    <!-- Aşamalar -->
    <div style="padding:0 24px 24px 24px;">
      <h3 style="margin:0 0 16px 0;color:#1a1a1a;font-size:16px;">Siparişiniz nerede?</h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <tr>
          <td width="25%" style="text-align:center;padding:8px 4px;">
            <div style="width:32px;height:32px;background:#ff6b35;color:#fff;border-radius:50%;line-height:32px;margin:0 auto 6px auto;font-size:14px;font-weight:700;">✓</div>
            <div style="font-size:11px;color:#ff6b35;font-weight:600;">Alındı</div>
          </td>
          <td width="25%" style="text-align:center;padding:8px 4px;">
            <div style="width:32px;height:32px;background:#ff6b35;color:#fff;border-radius:50%;line-height:32px;margin:0 auto 6px auto;font-size:14px;font-weight:700;">2</div>
            <div style="font-size:11px;color:#ff6b35;font-weight:600;">Hazırlanıyor</div>
          </td>
          <td width="25%" style="text-align:center;padding:8px 4px;">
            <div style="width:32px;height:32px;background:#e5e7eb;color:#9ca3af;border-radius:50%;line-height:32px;margin:0 auto 6px auto;font-size:14px;font-weight:700;">3</div>
            <div style="font-size:11px;color:#9ca3af;">Kargoda</div>
          </td>
          <td width="25%" style="text-align:center;padding:8px 4px;">
            <div style="width:32px;height:32px;background:#e5e7eb;color:#9ca3af;border-radius:50%;line-height:32px;margin:0 auto 6px auto;font-size:14px;font-weight:700;">4</div>
            <div style="font-size:11px;color:#9ca3af;">Teslim</div>
          </td>
        </tr>
      </table>
      <p style="margin:16px 0 0 0;text-align:center;font-size:13px;color:#666;line-height:1.5;">
        Kargoya verildiğinde size kargo takip numaranızı ileteceğiz.<br>
        Sipariş durumunuzu istediğiniz zaman aşağıdaki butondan takip edebilirsiniz.
      </p>
      <div style="text-align:center;margin-top:20px;">
        <a href="https://evemama.net/siparislerim"
           style="display:inline-block;padding:12px 28px;background:#ff6b35;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">
          Siparişlerimi Görüntüle
        </a>
      </div>
    </div>

    <!-- Yardım -->
    <div style="padding:20px 24px;background:#f9fafb;text-align:center;border-top:1px solid #eee;">
      <p style="margin:0 0 8px 0;font-size:13px;color:#666;">Sorunuz mu var?</p>
      <p style="margin:0;font-size:14px;color:#333;">
        <a href="https://wa.me/905347488001" style="color:#25D366;text-decoration:none;font-weight:600;">WhatsApp: 0534 748 80 01</a>
      </p>
    </div>

    <!-- Footer -->
    <div style="padding:20px 24px;text-align:center;background:#1a1a1a;color:#9ca3af;font-size:12px;line-height:1.6;">
      <p style="margin:0 0 6px 0;">evemama.net — Evcil Dostunuzun Dükkânı</p>
      <p style="margin:0;">© ${new Date().getFullYear()} Tüm hakları saklıdır.</p>
    </div>
  </div>
</body>
</html>`;
}

function buildText(p: SiparisOnayParams): string {
  const urunler = Array.isArray(p.urunler) ? p.urunler : [];
  const satirlar = urunler.map((u) => {
    const ad = getUrunAd(u);
    const adet = getUrunAdet(u);
    const fiyat = getUrunFiyat(u);
    return `  - ${ad} (${adet} x ${tr(fiyat)} TL)`;
  }).join("\n");

  return `evemama.net - Siparis Onayi

Merhaba ${p.ad},

Siparisiniz alindi ve hazirlanmaya basladi.

Siparis No: ${p.siparisNo}

Urunler:
${satirlar}

Toplam: ${tr(p.toplam)} TL

${p.adres ? `Teslimat Adresi:\n${p.ad}${p.soyad ? " " + p.soyad : ""}\n${p.adres}${p.sehir ? ", " + p.sehir : ""}\n${p.telefon || ""}` : ""}

Siparis durumunuzu takip edin:
https://evemama.net/siparislerim

Sorulariniz icin WhatsApp: 0534 748 80 01

evemama.net
`;
}

export async function sendSiparisOnayMaili(p: SiparisOnayParams): Promise<boolean> {
  const client = getResend();
  if (!client) {
    console.warn("[email] RESEND_API_KEY tanimli degil, mail gonderilmedi:", p.siparisNo);
    return false;
  }
  if (!p.email) {
    console.warn("[email] email adresi bos, gonderilmedi:", p.siparisNo);
    return false;
  }
  try {
    const { data, error } = await client.emails.send({
      from: FROM_EMAIL,
      to: p.email,
      subject: `Siparisiniz alindi - ${p.siparisNo}`,
      html: buildHTML(p),
      text: buildText(p),
    });
    if (error) {
      console.error("[email] Resend error:", { siparisNo: p.siparisNo, error });
      return false;
    }
    console.log("[email] gonderildi:", { siparisNo: p.siparisNo, id: data?.id, to: p.email });
    return true;
  } catch (err) {
    console.error("[email] exception:", { siparisNo: p.siparisNo, err: err instanceof Error ? err.message : String(err) });
    return false;
  }
}

// ── Kampanya / kupon maili ─────────────────────────────────────────────
// Admin panelindeki "Üyeler" sayfasından seçili üyelere, "Kuponlar"da
// oluşturulmuş bir kuponu hazır şablonla gönderir.
export type KuponMailParams = {
  email: string;
  ad?: string;
  kod: string;
  indirimMetni: string;    // ör. "%15 indirim" / "₺50 indirim"
  minSepetMetni?: string;  // ör. "Min. ₺200 sepet tutarı"
  bitisMetni?: string;     // ör. "Son kullanım: 30.06.2026"
};

function buildKuponHTML(p: KuponMailParams): string {
  return `<!DOCTYPE html>
<html lang="tr"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>Size özel indirim kuponu</title></head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#fff;">
    <div style="background:linear-gradient(135deg,#ff6b35 0%,#f7931e 100%);padding:32px 24px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:28px;font-weight:700;">evemama.net</h1>
      <p style="margin:8px 0 0 0;color:rgba(255,255,255,0.95);font-size:14px;">Evcil dostunuzun dükkanı</p>
    </div>
    <div style="padding:32px 24px 8px;text-align:center;">
      <div style="font-size:46px;margin-bottom:8px;">🎁</div>
      <h2 style="margin:0 0 8px 0;color:#1a1a1a;font-size:22px;">Size özel bir hediyemiz var!</h2>
      <p style="margin:0;color:#555;font-size:15px;line-height:1.5;">Merhaba ${p.ad || "değerli müşterimiz"},<br>Aşağıdaki kuponu ödeme adımında kullanarak ${p.indirimMetni.toLocaleLowerCase("tr-TR")} kazanabilirsiniz.</p>
    </div>
    <div style="padding:16px 24px 24px;">
      <div style="border:2px dashed #ff6b35;border-radius:16px;padding:24px 16px;text-align:center;background:#fff7ed;">
        <div style="font-size:26px;font-weight:800;color:#ff6b35;margin-bottom:12px;">${p.indirimMetni}</div>
        <div style="display:inline-block;background:#1a1a1a;color:#fff;font-family:monospace;font-size:22px;font-weight:700;letter-spacing:2px;padding:12px 22px;border-radius:10px;">${p.kod}</div>
        ${p.minSepetMetni ? `<p style="margin:14px 0 0;font-size:13px;color:#6b7280;">${p.minSepetMetni}</p>` : ""}
        ${p.bitisMetni ? `<p style="margin:4px 0 0;font-size:13px;color:#9ca3af;">${p.bitisMetni}</p>` : ""}
      </div>
    </div>
    <div style="padding:0 24px 32px;text-align:center;">
      <a href="https://www.evemama.net" style="display:inline-block;padding:14px 32px;background:#ff6b35;color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;">Hemen Alışverişe Başla →</a>
    </div>
    <div style="padding:20px 24px;background:#f9fafb;text-align:center;border-top:1px solid #eee;">
      <p style="margin:0 0 8px 0;font-size:13px;color:#666;">Sorularınız için bize ulaşın:</p>
      <p style="margin:0;font-size:14px;color:#333;"><a href="https://wa.me/905347488001" style="color:#25D366;text-decoration:none;font-weight:600;">WhatsApp: 0534 748 80 01</a></p>
    </div>
    <div style="padding:18px 24px;text-align:center;background:#1a1a1a;color:#9ca3af;font-size:12px;line-height:1.6;">
      <p style="margin:0 0 6px 0;">evemama.net — Evcil Dostunuzun Dükkanı</p>
      <p style="margin:0;">© ${new Date().getFullYear()} Tüm hakları saklıdır.</p>
    </div>
  </div>
</body></html>`;
}

export async function sendKuponMaili(p: KuponMailParams): Promise<boolean> {
  const client = getResend();
  if (!client) {
    console.warn("[email] RESEND_API_KEY tanimli degil, kupon maili gonderilmedi:", p.email);
    return false;
  }
  if (!p.email) return false;
  try {
    const { data, error } = await client.emails.send({
      from: FROM_EMAIL,
      to: p.email,
      subject: `🎁 Size özel indirim kuponu: ${p.kod}`,
      html: buildKuponHTML(p),
    });
    if (error) {
      console.error("[email] kupon maili hatasi:", { email: p.email, error });
      return false;
    }
    return Boolean(data?.id);
  } catch (err) {
    console.error("[email] kupon maili exception:", { email: p.email, err: err instanceof Error ? err.message : String(err) });
    return false;
  }
}

// ── Terk edilmiş sepet hatırlatma maili ────────────────────────────────
// Admin "Terk Edilen Sepetler" sayfasından, ödemesini tamamlamamış
// müşterilere sepet hatırlatması + indirim kuponu gönderir.
export type HatirlatmaMailParams = {
  email: string;
  ad?: string;
  urunOzet?: string;       // ör. "1x Royal Canin Kitten 10 Kg"
  kod: string;
  indirimMetni: string;
  minSepetMetni?: string;
  bitisMetni?: string;
};

function buildHatirlatmaHTML(p: HatirlatmaMailParams): string {
  return `<!DOCTYPE html>
<html lang="tr"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>Sepetinizi unutmadınız mı?</title></head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#fff;">
    <div style="background:linear-gradient(135deg,#ff6b35 0%,#f7931e 100%);padding:32px 24px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:28px;font-weight:700;">evemama.net</h1>
      <p style="margin:8px 0 0 0;color:rgba(255,255,255,0.95);font-size:14px;">Evcil dostunuzun dükkanı</p>
    </div>
    <div style="padding:32px 24px 8px;text-align:center;">
      <div style="font-size:46px;margin-bottom:8px;">🛒</div>
      <h2 style="margin:0 0 8px 0;color:#1a1a1a;font-size:22px;">Sepetinizi unutmadınız mı?</h2>
      <p style="margin:0;color:#555;font-size:15px;line-height:1.5;">Merhaba ${p.ad || "değerli müşterimiz"},<br>Sepetinizde sizi bekleyen ürünler var. Üstelik size özel bir de indirim kuponumuz!</p>
    </div>
    ${p.urunOzet ? `<div style="padding:8px 24px 0;"><div style="background:#f9fafb;border:1px solid #eee;border-radius:12px;padding:14px 18px;font-size:14px;color:#374151;text-align:center;">🐾 ${p.urunOzet}</div></div>` : ""}
    <div style="padding:16px 24px 8px;">
      <div style="border:2px dashed #ff6b35;border-radius:16px;padding:22px 16px;text-align:center;background:#fff7ed;">
        <div style="font-size:24px;font-weight:800;color:#ff6b35;margin-bottom:10px;">${p.indirimMetni}</div>
        <div style="display:inline-block;background:#1a1a1a;color:#fff;font-family:monospace;font-size:21px;font-weight:700;letter-spacing:2px;padding:11px 20px;border-radius:10px;">${p.kod}</div>
        ${p.minSepetMetni ? `<p style="margin:12px 0 0;font-size:13px;color:#6b7280;">${p.minSepetMetni}</p>` : ""}
        ${p.bitisMetni ? `<p style="margin:4px 0 0;font-size:13px;color:#9ca3af;">${p.bitisMetni}</p>` : ""}
      </div>
    </div>
    <div style="padding:8px 24px 32px;text-align:center;">
      <a href="https://www.evemama.net/sepet" style="display:inline-block;padding:14px 32px;background:#ff6b35;color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;">Sepete Dön & Tamamla →</a>
    </div>
    <div style="padding:18px 24px;text-align:center;background:#1a1a1a;color:#9ca3af;font-size:12px;line-height:1.6;">
      <p style="margin:0 0 6px 0;">evemama.net — Evcil Dostunuzun Dükkanı</p>
      <p style="margin:0;">© ${new Date().getFullYear()} Tüm hakları saklıdır.</p>
    </div>
  </div>
</body></html>`;
}

export async function sendHatirlatmaMaili(p: HatirlatmaMailParams): Promise<boolean> {
  const client = getResend();
  if (!client) {
    console.warn("[email] RESEND_API_KEY tanimli degil, hatirlatma maili gonderilmedi:", p.email);
    return false;
  }
  if (!p.email) return false;
  try {
    const { data, error } = await client.emails.send({
      from: FROM_EMAIL,
      to: p.email,
      subject: `🛒 Sepetinizi unutmadınız mı? Size özel ${p.kod} kuponu`,
      html: buildHatirlatmaHTML(p),
    });
    if (error) {
      console.error("[email] hatirlatma maili hatasi:", { email: p.email, error });
      return false;
    }
    return Boolean(data?.id);
  } catch (err) {
    console.error("[email] hatirlatma maili exception:", { email: p.email, err: err instanceof Error ? err.message : String(err) });
    return false;
  }
}

// ── Replenishment / "Maman bitiyor" hatırlatma maili ───────────────────────
// Cron (api/cron/replenishment) ~28 gün önce sipariş verip yeni sipariş
// vermemiş müşterilere otomatik gönderir: dostunun maması bitiyor + %10 kupon.
export type ReplenishmentMailParams = {
  email: string;
  ad?: string;
  sonUrun?: string; // ör. "Royal Canin Kitten 10 Kg" (kişiselleştirme, opsiyonel)
  kod: string;      // ör. "YENILE10"
};

function buildReplenishmentHTML(p: ReplenishmentMailParams): string {
  const urunSatiri = p.sonUrun
    ? `<strong>${p.sonUrun}</strong> başta olmak üzere sevimli dostunuzun maması`
    : `Sevimli dostunuzun maması`;
  return `<!DOCTYPE html>
<html lang="tr"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>Maması bitmek üzere mi?</title></head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#fff;">
    <div style="background:linear-gradient(135deg,#ff6b35 0%,#f7931e 100%);padding:32px 24px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:28px;font-weight:700;">evemama.net</h1>
      <p style="margin:8px 0 0 0;color:rgba(255,255,255,0.95);font-size:14px;">Evcil dostunuzun dükkanı</p>
    </div>
    <div style="padding:32px 24px 8px;text-align:center;">
      <div style="font-size:46px;margin-bottom:8px;">🐾</div>
      <h2 style="margin:0 0 8px 0;color:#1a1a1a;font-size:22px;">Maması bitmek üzere mi?</h2>
      <p style="margin:0;color:#555;font-size:15px;line-height:1.6;">Merhaba ${p.ad || "değerli müşterimiz"},<br>Yaklaşık 4 hafta önce sipariş vermiştiniz — ${urunSatiri} bitmek üzeredir. Dostunuzu aç bırakmayın, hemen yenileyin! 🧡</p>
    </div>
    <div style="padding:16px 24px 8px;">
      <div style="border:2px dashed #ff6b35;border-radius:16px;padding:22px 16px;text-align:center;background:#fff7ed;">
        <div style="font-size:22px;font-weight:800;color:#ff6b35;margin-bottom:10px;">Yenilemenize özel %10 indirim</div>
        <div style="display:inline-block;background:#1a1a1a;color:#fff;font-family:monospace;font-size:21px;font-weight:700;letter-spacing:2px;padding:11px 20px;border-radius:10px;">${p.kod}</div>
        <p style="margin:12px 0 0;font-size:13px;color:#6b7280;">Ödeme adımında kuponu girin.</p>
      </div>
    </div>
    <div style="padding:8px 24px 32px;text-align:center;">
      <a href="https://www.evemama.net/urunler" style="display:inline-block;padding:14px 32px;background:#ff6b35;color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;">Hemen Sipariş Ver →</a>
    </div>
    <div style="padding:18px 24px;text-align:center;background:#1a1a1a;color:#9ca3af;font-size:12px;line-height:1.6;">
      <p style="margin:0 0 6px 0;">evemama.net — Evcil Dostunuzun Dükkanı</p>
      <p style="margin:0;">© ${new Date().getFullYear()} Tüm hakları saklıdır.</p>
    </div>
  </div>
</body></html>`;
}

export async function sendReplenishmentMaili(p: ReplenishmentMailParams): Promise<boolean> {
  const client = getResend();
  if (!client) {
    console.warn("[email] RESEND_API_KEY tanimli degil, replenishment maili gonderilmedi:", p.email);
    return false;
  }
  if (!p.email) return false;
  try {
    const { data, error } = await client.emails.send({
      from: FROM_EMAIL,
      to: p.email,
      subject: "🐾 Maması bitmek üzere mi? Yenilemenize özel %10 indirim",
      html: buildReplenishmentHTML(p),
    });
    if (error) {
      console.error("[email] replenishment maili hatasi:", { email: p.email, error });
      return false;
    }
    return Boolean(data?.id);
  } catch (err) {
    console.error("[email] replenishment maili exception:", { email: p.email, err: err instanceof Error ? err.message : String(err) });
    return false;
  }
}

// ── Abonelik dönem hatırlatma maili ────────────────────────────────────────
// Cron (api/cron/replenishment) içinden, aboneliğin sonraki_tarih'i gelince
// gönderir: "aboneliğin hazır, %10 abone indiriminle yenile".
export type AbonelikMailParams = {
  email: string;
  ad?: string;
  urunAdi?: string;
  urunSlug?: string;
  kod: string; // ör. "ABONE10"
};

function buildAbonelikHTML(p: AbonelikMailParams): string {
  const urunCumle = p.urunAdi
    ? `<strong>${p.urunAdi}</strong> aboneliğinizin`
    : `aboneliğinizin`;
  const ctaHref = p.urunSlug
    ? `https://www.evemama.net/urun/${p.urunSlug}`
    : "https://www.evemama.net/urunler";
  return `<!DOCTYPE html>
<html lang="tr"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>Aboneliğiniz hazır</title></head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#fff;">
    <div style="background:linear-gradient(135deg,#ff6b35 0%,#f7931e 100%);padding:32px 24px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:28px;font-weight:700;">evemama.net</h1>
      <p style="margin:8px 0 0 0;color:rgba(255,255,255,0.95);font-size:14px;">Evcil dostunuzun dükkanı</p>
    </div>
    <div style="padding:32px 24px 8px;text-align:center;">
      <div style="font-size:46px;margin-bottom:8px;">🔄</div>
      <h2 style="margin:0 0 8px 0;color:#1a1a1a;font-size:22px;">Yenileme zamanı geldi!</h2>
      <p style="margin:0;color:#555;font-size:15px;line-height:1.6;">Merhaba ${p.ad || "değerli müşterimiz"},<br>${urunCumle} dönemi geldi — sevimli dostunuzun maması bitmek üzeredir 🐾. Abone indiriminiz hazır, tek tıkla yenileyin!</p>
    </div>
    <div style="padding:16px 24px 8px;">
      <div style="border:2px dashed #ff6b35;border-radius:16px;padding:22px 16px;text-align:center;background:#fff7ed;">
        <div style="font-size:22px;font-weight:800;color:#ff6b35;margin-bottom:10px;">Abonelere özel %10 indirim</div>
        <div style="display:inline-block;background:#1a1a1a;color:#fff;font-family:monospace;font-size:21px;font-weight:700;letter-spacing:2px;padding:11px 20px;border-radius:10px;">${p.kod}</div>
        <p style="margin:12px 0 0;font-size:13px;color:#6b7280;">Ödeme adımında kuponu girin.</p>
      </div>
    </div>
    <div style="padding:8px 24px 24px;text-align:center;">
      <a href="${ctaHref}" style="display:inline-block;padding:14px 32px;background:#ff6b35;color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;">Hemen Sipariş Ver →</a>
    </div>
    <div style="padding:0 24px 28px;text-align:center;">
      <a href="https://www.evemama.net/aboneliklerim" style="color:#9ca3af;font-size:12px;text-decoration:underline;">Aboneliğimi yönet / iptal et</a>
    </div>
    <div style="padding:18px 24px;text-align:center;background:#1a1a1a;color:#9ca3af;font-size:12px;line-height:1.6;">
      <p style="margin:0 0 6px 0;">evemama.net — Evcil Dostunuzun Dükkanı</p>
      <p style="margin:0;">© ${new Date().getFullYear()} Tüm hakları saklıdır.</p>
    </div>
  </div>
</body></html>`;
}

export async function sendAbonelikHatirlatma(p: AbonelikMailParams): Promise<boolean> {
  const client = getResend();
  if (!client) {
    console.warn("[email] RESEND_API_KEY tanimli degil, abonelik maili gonderilmedi:", p.email);
    return false;
  }
  if (!p.email) return false;
  try {
    const { data, error } = await client.emails.send({
      from: FROM_EMAIL,
      to: p.email,
      subject: "🔄 Aboneliğiniz hazır — %10 abone indiriminizle yenileyin",
      html: buildAbonelikHTML(p),
    });
    if (error) {
      console.error("[email] abonelik maili hatasi:", { email: p.email, error });
      return false;
    }
    return Boolean(data?.id);
  } catch (err) {
    console.error("[email] abonelik maili exception:", { email: p.email, err: err instanceof Error ? err.message : String(err) });
    return false;
  }
}

// Havale/EFT talimat maili — sipariş "ödeme bekliyor (havale)" olarak oluşunca
// müşteriye IBAN + sipariş no + tutar gönderir. Açıklamaya sipariş no yazması
// vurgulanır (ödeme eşleştirmesi için). Best-effort: hata akışı bozmaz.
export async function sendHavaleTalimatMaili(p: { siparisNo: string; ad?: string; email: string; toplam: number | string }): Promise<boolean> {
  const client = getResend();
  if (!client) {
    console.warn("[email] RESEND_API_KEY tanimli degil, havale maili gonderilmedi:", p.email);
    return false;
  }
  if (!p.email) return false;
  const tutar = Number(p.toplam || 0).toFixed(2);
  const html = `<!doctype html><html><body style="margin:0;background:#f4f4f5;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#fff;">
    <div style="background:linear-gradient(135deg,#5C3D2E,#8B5E42);padding:28px 24px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:26px;font-weight:700;">evemama.net</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.95);font-size:14px;">Siparişiniz alındı 🏦</p>
    </div>
    <div style="padding:28px 24px 8px;text-align:center;">
      <div style="font-size:44px;margin-bottom:8px;">🏦</div>
      <h2 style="margin:0 0 8px;color:#1a1a1a;font-size:21px;">Havale/EFT bekleniyor</h2>
      <p style="margin:0;color:#555;font-size:15px;line-height:1.6;">Merhaba ${p.ad || "değerli müşterimiz"},<br>Siparişiniz oluşturuldu. Aşağıdaki hesaba ödemenizi yaptığınızda onaylayıp kargoya vereceğiz.</p>
    </div>
    <div style="padding:16px 24px;">
      <div style="border:2px solid #E8D5B7;border-radius:14px;padding:18px;background:#FDF6EE;">
        <div style="display:flex;justify-content:space-between;margin-bottom:10px;"><span style="color:#6b7280;font-size:13px;">Sipariş No</span><strong style="color:#5C3D2E;font-size:14px;">${p.siparisNo}</strong></div>
        <div style="display:flex;justify-content:space-between;margin-bottom:14px;"><span style="color:#6b7280;font-size:13px;">Tutar</span><strong style="color:#E8845A;font-size:18px;">₺${tutar}</strong></div>
        <div style="border-top:1px dashed #E8D5B7;padding-top:12px;font-size:14px;color:#5C3D2E;line-height:1.9;">
          <div><strong>Banka:</strong> ${HAVALE_HESAP.banka}</div>
          <div><strong>IBAN:</strong> ${HAVALE_HESAP.iban}</div>
          <div><strong>Alıcı:</strong> ${HAVALE_HESAP.unvan}</div>
        </div>
      </div>
      <div style="background:#FFF3E0;border-radius:12px;padding:12px 14px;margin-top:14px;font-size:13px;color:#E65100;font-weight:600;">⚠️ Açıklamaya mutlaka sipariş numaranızı (${p.siparisNo}) yazın — ödemenizi eşleştirebilmemiz için gereklidir.</div>
    </div>
    <div style="padding:18px 24px;text-align:center;background:#1a1a1a;color:#9ca3af;font-size:12px;line-height:1.6;">
      <p style="margin:0 0 6px;">evemama.net — Evcil Dostunuzun Dükkanı</p>
      <p style="margin:0;">© ${new Date().getFullYear()} Tüm hakları saklıdır.</p>
    </div>
  </div>
</body></html>`;
  try {
    const { data, error } = await client.emails.send({
      from: FROM_EMAIL,
      to: p.email,
      subject: `🏦 Sipariş ${p.siparisNo} — Havale/EFT bilgileri`,
      html,
    });
    if (error) {
      console.error("[email] havale maili hatasi:", { email: p.email, error });
      return false;
    }
    return Boolean(data?.id);
  } catch (err) {
    console.error("[email] havale maili exception:", { email: p.email, err: err instanceof Error ? err.message : String(err) });
    return false;
  }
}

// ── İzmir elden teslimat — sipariş alındı maili ──────────────────────────────
// Elden teslim siparişi oluşunca müşteriye teslim günü + kapıda nakit bilgisi.
export async function sendEldenTeslimMaili(p: { siparisNo: string; ad?: string; email: string; toplam: number | string; teslimMetni: string }): Promise<boolean> {
  const client = getResend();
  if (!client) {
    console.warn("[email] RESEND_API_KEY tanimli degil, elden teslim maili gonderilmedi:", p.email);
    return false;
  }
  if (!p.email) return false;
  const tutar = typeof p.toplam === "number" ? tr(p.toplam) : p.toplam;
  const html = `
  <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#5C3D2E;line-height:1.6;">
    <div style="font-family:Georgia,serif;font-size:22px;font-weight:700;margin-bottom:14px;">evemama<span style="color:#E8845A;font-style:italic;">.net</span></div>
    <h2 style="font-size:19px;">Siparişin alındı — elden teslim ediyoruz! 🛵</h2>
    <p>Merhaba${p.ad ? " " + p.ad : ""}, <strong>#${p.siparisNo}</strong> numaralı siparişin İzmir içi elden teslimat kapsamında hazırlanıyor.</p>
    <div style="background:#FDF6EE;border-radius:14px;padding:16px 18px;margin:18px 0;">
      <div style="font-size:14px;margin-bottom:6px;">📦 Teslimat: <strong>${p.teslimMetni}</strong></div>
      <div style="font-size:14px;margin-bottom:6px;">💵 Ödeme: <strong>Kapıda nakit — ₺${tutar}</strong></div>
      <div style="font-size:12.5px;opacity:0.7;">Teslimattan önce telefonla haber vereceğiz. Lütfen ödeme tutarını nakit hazır bulundur.</div>
    </div>
    <p style="font-size:12.5px;opacity:0.6;">Sorun/değişiklik için bu maile yanıt verebilir ya da sitedeki iletişim sayfasını kullanabilirsin.</p>
    <hr style="border:none;border-top:1px solid #E8D5B7;margin:20px 0;">
    <p style="font-size:12px;opacity:0.5;">evemama.net · Dostlarının mama ve ihtiyaçları 🐾</p>
  </div>`;
  try {
    const { data, error } = await client.emails.send({
      from: FROM_EMAIL,
      to: p.email,
      subject: `Siparişin alındı — İzmir elden teslimat 🛵 (#${p.siparisNo})`,
      html,
      text: `Siparisin alindi (#${p.siparisNo}). Teslimat: ${p.teslimMetni}. Odeme: kapida nakit ₺${tutar}. Teslimattan once telefonla haber verecegiz.`,
    });
    if (error) {
      console.error("[email] elden teslim maili hatasi:", { email: p.email, error });
      return false;
    }
    return Boolean(data?.id);
  } catch (err) {
    console.error("[email] elden teslim maili exception:", { email: p.email, err: err instanceof Error ? err.message : String(err) });
    return false;
  }
}

// ── İletişim formu → info@evemama.net ────────────────────────────────────────
// Müşterinin yazdığı mesajı işletmeye iletir; replyTo=müşteri (inbox'tan
// direkt "Yanıtla" çalışsın). Kullanıcı girdisi HTML'e kaçırılarak basılır.
export type IletisimParams = {
  ad: string;
  soyad?: string;
  email: string;
  mesaj: string;
  acikRiza?: boolean;
};

const ILETISIM_TO = "info@evemama.net";

function htmlKacir(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function sendIletisimMaili(p: IletisimParams): Promise<boolean> {
  const client = getResend();
  if (!client) {
    console.warn("[email] RESEND_API_KEY yok, iletisim maili gonderilmedi");
    return false;
  }
  const tamAd = `${p.ad}${p.soyad ? " " + p.soyad : ""}`.trim();
  const html = `
  <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#5C3D2E;line-height:1.6;">
    <div style="font-family:Georgia,serif;font-size:20px;font-weight:700;margin-bottom:4px;">evemama<span style="color:#E8845A;font-style:italic;">.net</span></div>
    <div style="font-size:12px;opacity:0.6;margin-bottom:16px;">İletişim formu mesajı</div>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr><td style="padding:6px 10px;background:#FDF6EE;font-weight:700;width:110px;">Ad Soyad</td><td style="padding:6px 10px;">${htmlKacir(tamAd)}</td></tr>
      <tr><td style="padding:6px 10px;background:#FDF6EE;font-weight:700;">E-posta</td><td style="padding:6px 10px;">${htmlKacir(p.email)}</td></tr>
      <tr><td style="padding:6px 10px;background:#FDF6EE;font-weight:700;">Açık rıza</td><td style="padding:6px 10px;">${p.acikRiza ? "Evet" : "Hayır"} (KVKK: Evet)</td></tr>
    </table>
    <div style="margin-top:16px;padding:14px 16px;background:#FDF6EE;border-radius:12px;font-size:14px;white-space:pre-wrap;">${htmlKacir(p.mesaj)}</div>
    <p style="font-size:12px;opacity:0.5;margin-top:16px;">Bu maile "Yanıtla" dediğinizde cevap doğrudan müşteriye (${htmlKacir(p.email)}) gider.</p>
  </div>`;
  try {
    const { data, error } = await client.emails.send({
      from: FROM_EMAIL,
      to: ILETISIM_TO,
      replyTo: p.email,
      subject: `📩 İletişim formu — ${tamAd}`,
      html,
      text: `İletişim formu\nAd Soyad: ${tamAd}\nE-posta: ${p.email}\nAçık rıza: ${p.acikRiza ? "Evet" : "Hayır"}\n\n${p.mesaj}`,
    });
    if (error) {
      console.error("[email] iletisim maili hatasi:", { from: p.email, error });
      return false;
    }
    return Boolean(data?.id);
  } catch (err) {
    console.error("[email] iletisim maili exception:", { from: p.email, err: err instanceof Error ? err.message : String(err) });
    return false;
  }
}
