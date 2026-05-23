// Sepet terk maili — odeme sayfasinda email girip ödemeyi tamamlamayan
// müşterilere 1 saat sonra hatirlatma maili gonderir.
//
// Sıkı kural: bu fonksiyon HER ZAMAN hata yutar. Cron icerisinde
// cagrildiginda bir musterinin mail'i basarisiz olursa, diger musterileri
// engellememeli. Tek mail icin try/catch, dis exception sizmasi yasak.
//
// FROM adresi: domain Resend'de dogrulanmissa `siparis@evemama.net`,
// degilse `onboarding@resend.dev` (sandbox).
import { Resend } from "resend";
import { resolveFromEmail } from "./email-from";

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";

let resend: Resend | null = null;
function getResend(): Resend | null {
  if (!RESEND_API_KEY) return null;
  if (!resend) resend = new Resend(RESEND_API_KEY);
  return resend;
}

// odeme_gecici.urunler JSON'undaki yapi /api/odeme'de bu sekilde
// kaydediliyor: { id, name, price, quantity, resim_url, emoji }.
export type TerkUrun = {
  id?: number | string;
  name?: string;
  price?: number;
  quantity?: number;
  resim_url?: string;
};

export type SepetTerkParams = {
  email: string;
  ad: string;
  urunler: TerkUrun[];
  toplam: number;
};

function tr(n: number): string {
  return new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function buildHTML(p: SepetTerkParams): string {
  const urunler = Array.isArray(p.urunler) ? p.urunler : [];
  const satirlar = urunler.map((u) => {
    const ad = u.name || "Ürün";
    const adet = Number(u.quantity || 1);
    const fiyat = Number(u.price || 0);
    const satirToplam = adet * fiyat;
    const resim = u.resim_url
      ? `<img src="${u.resim_url}" alt="" width="64" height="64" style="width:64px;height:64px;object-fit:contain;background:#fff;border-radius:8px;border:1px solid #eee;" />`
      : `<div style="width:64px;height:64px;background:#FDF6EE;border-radius:8px;display:inline-block;text-align:center;line-height:64px;font-size:28px;">🐾</div>`;
    return `
      <tr>
        <td style="padding:12px 8px;border-bottom:1px solid #eee;vertical-align:top;width:80px;">
          ${resim}
        </td>
        <td style="padding:12px 8px;border-bottom:1px solid #eee;font-size:14px;color:#333;">
          ${ad}
          <div style="font-size:12px;color:#888;margin-top:4px;">${adet} adet × ${tr(fiyat)} ₺</div>
        </td>
        <td style="padding:12px 8px;border-bottom:1px solid #eee;font-size:14px;color:#333;text-align:right;white-space:nowrap;vertical-align:top;">
          ${tr(satirToplam)} ₺
        </td>
      </tr>
    `;
  }).join("");

  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Sepetinizi unutmadınız mı?</title>
</head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#fff;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#ff6b35 0%,#f7931e 100%);padding:32px 24px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:28px;font-weight:700;">evemama.net</h1>
      <p style="margin:8px 0 0 0;color:rgba(255,255,255,0.95);font-size:14px;">Evcil dostunuzun dükkânı</p>
    </div>

    <!-- Mesaj -->
    <div style="padding:32px 24px;text-align:center;border-bottom:1px solid #eee;">
      <div style="font-size:48px;margin-bottom:8px;">🛒</div>
      <h2 style="margin:0 0 8px 0;color:#1a1a1a;font-size:22px;">Sepetinizi unutmadınız mı?</h2>
      <p style="margin:0;color:#555;font-size:15px;line-height:1.6;">
        Merhaba ${p.ad},<br>
        Sepetinize eklediğiniz ürünler hâlâ sizi bekliyor.
        Siparişinizi tamamlamak için sadece birkaç tık kaldı.
      </p>
    </div>

    <!-- Ürün listesi -->
    <div style="padding:24px;">
      <h3 style="margin:0 0 16px 0;color:#1a1a1a;font-size:16px;">Sepetinizdekiler</h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        ${satirlar}
        <tr>
          <td colspan="2" style="padding:16px 8px 8px 8px;font-size:16px;font-weight:700;color:#1a1a1a;">
            Toplam
          </td>
          <td style="padding:16px 8px 8px 8px;font-size:18px;font-weight:700;color:#ff6b35;text-align:right;">
            ${tr(p.toplam)} ₺
          </td>
        </tr>
      </table>
    </div>

    <!-- CTA -->
    <div style="padding:0 24px 32px 24px;text-align:center;">
      <a href="https://evemama.net/sepet"
         style="display:inline-block;padding:14px 36px;background:#ff6b35;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:16px;">
        Siparişi Tamamla →
      </a>
      <p style="margin:12px 0 0 0;font-size:12px;color:#999;">
        Fiyatlar değişebilir, stok sınırlı olabilir.
      </p>
    </div>

    <!-- Güven bandı -->
    <div style="padding:20px 24px;background:#f9fafb;border-top:1px solid #eee;border-bottom:1px solid #eee;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="25%" style="text-align:center;font-size:11px;color:#666;line-height:1.5;">
            <div style="font-size:18px;margin-bottom:4px;">✓</div>
            %100 Orijinal
          </td>
          <td width="25%" style="text-align:center;font-size:11px;color:#666;line-height:1.5;">
            <div style="font-size:18px;margin-bottom:4px;">⚡</div>
            Aynı Gün Kargo
          </td>
          <td width="25%" style="text-align:center;font-size:11px;color:#666;line-height:1.5;">
            <div style="font-size:18px;margin-bottom:4px;">🔒</div>
            Güvenli Ödeme
          </td>
          <td width="25%" style="text-align:center;font-size:11px;color:#666;line-height:1.5;">
            <div style="font-size:18px;margin-bottom:4px;">↩️</div>
            14 Gün İade
          </td>
        </tr>
      </table>
    </div>

    <!-- Yardım -->
    <div style="padding:20px 24px;text-align:center;">
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

function buildText(p: SepetTerkParams): string {
  const urunler = Array.isArray(p.urunler) ? p.urunler : [];
  const satirlar = urunler.map((u) => {
    const ad = u.name || "Ürün";
    const adet = Number(u.quantity || 1);
    const fiyat = Number(u.price || 0);
    return `  - ${ad} (${adet} x ${tr(fiyat)} TL)`;
  }).join("\n");

  return `evemama.net - Sepetinizi unutmadiniz mi?

Merhaba ${p.ad},

Sepetinize ekledikleriniz hala sizi bekliyor.

Sepetinizdekiler:
${satirlar}

Toplam: ${tr(p.toplam)} TL

Siparisi tamamlamak icin:
https://evemama.net/sepet

Sorulariniz icin WhatsApp: 0534 748 80 01

evemama.net
`;
}

export async function sendSepetTerkMaili(p: SepetTerkParams): Promise<boolean> {
  const client = getResend();
  if (!client) {
    console.warn("[email-terk] RESEND_API_KEY tanimli degil, mail gonderilmedi:", p.email);
    return false;
  }
  if (!p.email) {
    return false;
  }
  try {
    const { data, error } = await client.emails.send({
      from: resolveFromEmail(),
      to: p.email,
      subject: "Sepetinizi unutmadınız mı? 🛒",
      html: buildHTML(p),
      text: buildText(p),
    });
    if (error) {
      console.error("[email-terk] Resend error:", { to: p.email, error });
      return false;
    }
    console.log("[email-terk] gonderildi:", { id: data?.id, to: p.email });
    return true;
  } catch (err: any) {
    console.error("[email-terk] exception:", { to: p.email, err: err?.message || err });
    return false;
  }
}
