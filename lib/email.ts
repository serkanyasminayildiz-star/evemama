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
  } catch (err: any) {
    console.error("[email] exception:", { siparisNo: p.siparisNo, err: err?.message || err });
    return false;
  }
}
