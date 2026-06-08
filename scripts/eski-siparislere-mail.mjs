// Son 7 gunde basarili odeme yapmis musterilere onay mailini (gec) gondermek
// icin tek seferlik script. RESEND_FROM_EMAIL env var Vercel'de eksik
// oldugu donemde olusan musteri kayipsini kapatmak icin.
//
// Kullanim:
//   node --env-file=.env.local scripts/eski-siparislere-mail.mjs --limit 1     # test
//   node --env-file=.env.local scripts/eski-siparislere-mail.mjs --limit 999   # hepsi
//
// --dry-run ile gercekten mail gondermez, sadece ne yapacagini gosterir.

import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    limit: { type: "string", default: "1" },
    "dry-run": { type: "boolean", default: false },
    skip: { type: "string", default: "" },
    only: { type: "string", default: "" },
  },
});

const SKIP = (values.skip || "").split(",").map((x) => x.trim()).filter(Boolean);
const ONLY = (values.only || "").split(",").map((x) => x.trim()).filter(Boolean);
const LIMIT = parseInt(values.limit, 10);
const DRY_RUN = values["dry-run"];

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "evemama.net <siparis@evemama.net>";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("HATA: NEXT_PUBLIC_SUPABASE_URL veya NEXT_PUBLIC_SUPABASE_ANON_KEY .env.local'da yok");
  process.exit(1);
}
if (!RESEND_KEY) {
  console.error("HATA: RESEND_API_KEY .env.local'da yok");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const resend = new Resend(RESEND_KEY);

const haftaOnce = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

console.log(`[script] Filter: created_at >= ${haftaOnce}, odeme_durumu = 'odendi', limit = ${LIMIT}`);
if (DRY_RUN) console.log(`[script] DRY RUN modu — mail GONDERILMEYECEK`);

const { data: siparisler, error } = await supabase
  .from("siparisler")
  .select("siparis_no, ad, soyad, email, telefon, adres, sehir, urunler, toplam, ara_toplam, created_at")
  .eq("odeme_durumu", "odendi")
  .gte("created_at", haftaOnce)
  .not("email", "is", null)
  .neq("email", "")
  .order("created_at", { ascending: false })
  .limit(LIMIT);

if (error) {
  console.error("[script] Supabase sorgu hatasi:", error);
  process.exit(1);
}

console.log(`[script] ${siparisler.length} siparis bulundu\n`);

function tr(n) {
  return new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n) || 0);
}

function buildHTML(s) {
  let urunler = s.urunler;
  if (typeof urunler === "string") {
    try { urunler = JSON.parse(urunler); } catch { urunler = []; }
  }
  if (!Array.isArray(urunler)) urunler = [];

  const satirlar = urunler.map((u) => {
    const ad = u.ad || u.isim || u.baslik || u.name || "Urun";
    const adet = Number(u.adet || u.miktar || u.quantity || 1);
    const fiyat = Number(u.fiyat || u.birim_fiyat || u.price || 0);
    const toplam = adet * fiyat;
    return `<tr>
      <td style="padding:12px 8px;border-bottom:1px solid #eee;font-size:14px;color:#333;">
        ${ad}
        <div style="font-size:12px;color:#888;margin-top:4px;">${adet} adet × ${tr(fiyat)} ₺</div>
      </td>
      <td style="padding:12px 8px;border-bottom:1px solid #eee;font-size:14px;color:#333;text-align:right;white-space:nowrap;">${tr(toplam)} ₺</td>
    </tr>`;
  }).join("");

  const adresHTML = s.adres ? `
    <div style="padding:0 24px 24px 24px;">
      <h3 style="margin:0 0 12px 0;color:#1a1a1a;font-size:16px;">Teslimat Adresi</h3>
      <div style="background:#f9fafb;padding:16px;border-radius:8px;">
        <p style="margin:0 0 6px 0;font-size:14px;color:#333;"><strong>${s.ad || ""} ${s.soyad || ""}</strong></p>
        <p style="margin:0 0 6px 0;font-size:14px;color:#555;">${s.adres}${s.sehir ? ", " + s.sehir : ""}</p>
        ${s.telefon ? `<p style="margin:0;font-size:14px;color:#555;">Tel: ${s.telefon}</p>` : ""}
      </div>
    </div>` : "";

  return `<!DOCTYPE html>
<html lang="tr"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>Siparisiniz alindi - ${s.siparis_no}</title></head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#fff;">
    <div style="background:linear-gradient(135deg,#ff6b35 0%,#f7931e 100%);padding:32px 24px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:28px;font-weight:700;">evemama.net</h1>
      <p style="margin:8px 0 0 0;color:rgba(255,255,255,0.95);font-size:14px;">Evcil dostunuzun dukkani</p>
    </div>
    <div style="padding:32px 24px;text-align:center;border-bottom:1px solid #eee;">
      <div style="font-size:48px;margin-bottom:8px;">📋</div>
      <h2 style="margin:0 0 8px 0;color:#1a1a1a;font-size:22px;">Sipariş Onay Kaydınız</h2>
      <p style="margin:0;color:#555;font-size:15px;line-height:1.5;">Merhaba ${s.ad || ""},<br>Daha önce verdiğiniz <strong>#${s.siparis_no}</strong> numaralı siparişinizin onay kaydıdır.</p>
      <div style="display:inline-block;margin-top:16px;padding:8px 18px;background:#fff5ed;border:1px solid #ff6b35;border-radius:8px;color:#ff6b35;font-weight:600;font-size:15px;">Siparis No: ${s.siparis_no}</div>
      <div style="margin:16px auto 0;max-width:440px;padding:12px 16px;background:#f0f7ff;border:1px solid #cfe3ff;border-radius:8px;font-size:13px;color:#345;line-height:1.6;">ℹ️ <strong>Bilgilendirme:</strong> Bu, daha önce verdiğiniz sipariş için <strong>gecikmiş onay mailidir</strong> (teknik bir aksaklık nedeniyle zamanında gönderilememiştir). Yeni bir sipariş değildir — siparişiniz çoktan hazırlandı/kargolandı. Ekstra bir işlem yapmanıza gerek yoktur.</div>
    </div>
    <div style="padding:24px;">
      <h3 style="margin:0 0 16px 0;color:#1a1a1a;font-size:16px;">Siparis Detayi</h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        ${satirlar}
        <tr>
          <td style="padding:16px 8px 8px 8px;font-size:16px;font-weight:700;color:#1a1a1a;">Toplam</td>
          <td style="padding:16px 8px 8px 8px;font-size:18px;font-weight:700;color:#ff6b35;text-align:right;">${tr(s.toplam)} ₺</td>
        </tr>
      </table>
    </div>
    ${adresHTML}
    <div style="padding:0 24px 24px 24px;text-align:center;">
      <a href="https://evemama.net/siparislerim" style="display:inline-block;padding:12px 28px;background:#ff6b35;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">Siparislerimi Goruntule</a>
    </div>
    <div style="padding:20px 24px;background:#f9fafb;text-align:center;border-top:1px solid #eee;">
      <p style="margin:0 0 8px 0;font-size:13px;color:#666;">Sorunuz mu var?</p>
      <p style="margin:0;font-size:14px;color:#333;"><a href="https://wa.me/905347488001" style="color:#25D366;text-decoration:none;font-weight:600;">WhatsApp: 0534 748 80 01</a></p>
    </div>
    <div style="padding:20px 24px;text-align:center;background:#1a1a1a;color:#9ca3af;font-size:12px;line-height:1.6;">
      <p style="margin:0 0 6px 0;">evemama.net — Evcil Dostunuzun Dukkani</p>
      <p style="margin:0;">© ${new Date().getFullYear()} Tum haklari saklidir.</p>
    </div>
  </div>
</body></html>`;
}

let basarili = 0, basarisiz = 0;

for (const s of siparisler) {
  const tarih = new Date(s.created_at).toLocaleString("tr-TR");
  const label = `${s.siparis_no} | ${s.email} | ${tarih} | ${tr(s.toplam)} TL`;

  if (ONLY.length && !ONLY.includes(s.siparis_no)) {
    continue;
  }

  if (SKIP.includes(s.siparis_no)) {
    console.log(`ATLA ${label} (zaten gonderildi)`);
    continue;
  }

  if (DRY_RUN) {
    console.log(`[dry-run] ${label}`);
    basarili++;
    continue;
  }

  try {
    const { data, error: sendErr } = await resend.emails.send({
      from: FROM_EMAIL,
      to: s.email,
      subject: `Sipariş onay kaydınız (gecikmiş bilgilendirme) - ${s.siparis_no}`,
      html: buildHTML(s),
    });
    if (sendErr) {
      console.error(`HATA ${label} ::`, sendErr.message || JSON.stringify(sendErr));
      basarisiz++;
    } else {
      console.log(`OK   ${label} :: ${data?.id || ""}`);
      basarili++;
    }
  } catch (err) {
    console.error(`HATA ${label} ::`, err.message || err);
    basarisiz++;
  }

  // Resend free tier: 2 req/sn. 600ms ile guvenli alt sinirda kal.
  await new Promise((r) => setTimeout(r, 600));
}

console.log(`\n[script] Bitti: ${basarili} basarili, ${basarisiz} basarisiz`);
