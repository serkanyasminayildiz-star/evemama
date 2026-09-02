export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import * as crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { sendSiparisOnayMaili } from "../../../../lib/email";
import { SADAKAT, KARGO, kazanilacakPuan, kargoUcretiKg, sepetAgirligiKg } from "../../../../lib/indirim";

const IYZICO_API_KEY = process.env.IYZICO_API_KEY || "";
const IYZICO_SECRET_KEY = process.env.IYZICO_SECRET_KEY || "";
const IYZICO_BASE_URL = process.env.IYZICO_BASE_URL || "https://api.iyzipay.com";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://evemama.net";

// ANON İSTEMCİ YOK (bilinçli): bu route'un dokunduğu tabloların HEPSİ RLS
// korumalı (odeme_gecici, siparisler, urunler, sadakat_bonuslari, kuponlar,
// basarisiz_odemeler). Anon istemci burada sessiz veri kaybına yol açıyordu —
// başarısız ödemelerde müşteri bilgisi boş yazılıyordu. Tek istemci: service_role.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const ENDPOINT = "/payment/iyzipos/checkoutform/auth/ecom/detail";

function generateRandomString(): string {
  return process.hrtime()[0] + Math.random().toString(8).slice(2);
}

function generateAuth(randomString: string, uri: string, body: Record<string, unknown>): string {
  const signature = crypto
    .createHmac("sha256", IYZICO_SECRET_KEY)
    .update(randomString + uri + JSON.stringify(body))
    .digest("hex");

  const authParams = [
    `apiKey:${IYZICO_API_KEY}`,
    `randomKey:${randomString}`,
    `signature:${signature}`,
  ].join("&");

  return "IYZWSv2 " + Buffer.from(authParams).toString("base64");
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const token = formData.get("token") as string;

    if (!token) {
      return NextResponse.redirect(`${SITE_URL}/odeme/sonuc?durum=basarisiz`, { status: 303 });
    }

    const randomString = generateRandomString();
    const requestBody = { locale: "tr", token };
    const authHeader = generateAuth(randomString, ENDPOINT, requestBody);

    const response = await fetch(`${IYZICO_BASE_URL}${ENDPOINT}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
        "x-iyzi-rnd": randomString,
        "x-iyzi-client-version": "iyzipay-node-2.0.65",
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    // Tam yanit yerine sadece durum + odeme bilgisi loglanir (PII / kart
    // sayisi sizmasin). Hata durumunda errorMessage da yer alir.
    console.log("[odeme/sonuc] iyzico result:", {
      status: data.status,
      paymentStatus: data.paymentStatus,
      paidPrice: data.paidPrice || null,
      errorMessage: data.errorMessage || null,
    });

    if (data.status === "success" && data.paymentStatus === "SUCCESS") {
      
      const siparisNo = "EVE" + Date.now().toString().slice(-8);

      // Geçici tablodan müşteri bilgilerini al
      const { data: gecici } = await supabaseAdmin
        .from("odeme_gecici")
        .select("*")
        .eq("token", token)
        .single();

      // Siparişi kaydet
      const { error } = await supabaseAdmin.from("siparisler").insert({
        siparis_no: siparisNo,
        durum: "hazirlaniyor",
        odeme_yontemi: "kredi_karti",
        odeme_durumu: "odendi",
        toplam: data.paidPrice,
        ara_toplam: data.price,
        iyzico_token: token,
        ad: gecici?.ad || "",
        soyad: gecici?.soyad || "",
        email: gecici?.email || "",
        telefon: gecici?.telefon || "",
        adres: gecici?.adres || "",
        sehir: gecici?.sehir || "",
        urunler: gecici?.urunler || null,
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.error("[odeme/sonuc] siparis kayit hatasi:", { siparisNo, error });
      } else {
        console.log("[odeme/sonuc] siparis kaydedildi:", siparisNo);
        // Geçici kaydı sil
        await supabaseAdmin.from("odeme_gecici").delete().eq("token", token);

        // STOK DÜŞ — satılan her ürünün stoğunu adedi kadar azalt. Bu ana kadar
        // HİÇ yapılmıyordu (satışta stok düşmüyordu). gecici DB'den silindiği için
        // olası çift callback'te 2. çağrıda gecici null olur → stok çift düşmez
        // (idempotent). urunler.stok RLS korumalı → service_role (supabaseAdmin) şart.
        // Best-effort: stok hatası siparişi/ödemeyi bozmasın.
        try {
          let kalemler: { id?: number | string; quantity?: number; adet?: number; miktar?: number }[] = [];
          const ham = gecici?.urunler;
          if (typeof ham === "string") { try { kalemler = JSON.parse(ham); } catch { kalemler = []; } }
          else if (Array.isArray(ham)) kalemler = ham;
          for (const k of kalemler) {
            const urunId = Number(k.id);
            const adet = Number(k.quantity ?? k.adet ?? k.miktar ?? 1) || 1;
            if (!urunId || adet <= 0) continue;
            const { data: u } = await supabaseAdmin.from("urunler").select("stok").eq("id", urunId).maybeSingle();
            if (u) {
              const yeniStok = Math.max(0, (Number(u.stok) || 0) - adet);
              await supabaseAdmin.from("urunler").update({ stok: yeniStok }).eq("id", urunId);
            }
          }
          console.log("[odeme/sonuc] stok dusuruldu:", siparisNo, (kalemler || []).length, "kalem");
        } catch (e) {
          console.error("[odeme/sonuc] stok dusurme hatasi:", e);
        }

        // Sipariş onay maili — best-effort, hata olsa bile akışı bozma.
        // RESEND_API_KEY yoksa fonksiyon zaten sessizce false döner.
        //
        // await ŞART: Vercel serverless'te response (redirect) dönünce
        // function sonlanır. await edilmeyen (fire-and-forget) mail gönderimi
        // yarıda kesilir → bazı siparişlerde mail GİTMEZ (race condition:
        // redirect'e yetişen gider, yetişemeyen ölür). await ile gönderim
        // redirect'ten ÖNCE tamamlanır. sendSiparisOnayMaili kendi içinde
        // hatayı yutar (false döner), yine de dış try/catch güvence.
        if (gecici?.email) {
          try {
            await sendSiparisOnayMaili({
              siparisNo,
              ad: gecici.ad || "",
              soyad: gecici.soyad || "",
              email: gecici.email,
              urunler: gecici.urunler || [],
              toplam: data.paidPrice,
              araToplam: data.price,
              adres: gecici.adres || "",
              sehir: gecici.sehir || "",
              telefon: gecici.telefon || "",
            });
          } catch (e) {
            console.error("[odeme/sonuc] mail gonderim hatasi:", e);
          }
        }

        // Kullanılan sadakat bonusunu "kullanıldı" işaretle. odeme/route bu
        // siparişe bonus uyguladıysa kullanilan_bonus_id dolu gelir.
        // .eq(kullanildi=false) → double-spend koruması (zaten kullanılmışsa etkisiz).
        if (gecici?.kullanilan_bonus_id) {
          try {
            await supabaseAdmin.from("sadakat_bonuslari")
              .update({ kullanildi: true, kullanildi_siparis_no: siparisNo })
              .eq("id", gecici.kullanilan_bonus_id)
              .eq("kullanildi", false);
          } catch (e) {
            console.error("[odeme/sonuc] bonus isaretleme hatasi:", e);
          }
        }

        // Kullanılan kupon varsa kullanım sayacını artır (kullanım limiti takibi).
        if (gecici?.kullanilan_kupon_kod) {
          try {
            const { data: k } = await supabaseAdmin
              .from("kuponlar").select("kullanim_sayisi").eq("kod", gecici.kullanilan_kupon_kod).maybeSingle();
            await supabaseAdmin.from("kuponlar")
              .update({ kullanim_sayisi: (Number(k?.kullanim_sayisi) || 0) + 1 })
              .eq("kod", gecici.kullanilan_kupon_kod);
          } catch (e) {
            console.error("[odeme/sonuc] kupon kullanim sayaci hatasi:", e);
          }
        }

        // Sadakat puanı KAZANMA — sipariş başarılı + ÜYE. Misafir puan ALMAZ.
        // Her siparişte kargo hariç ödenen tutarın %5'i (sipariş başına tavan
        // uygulanır); min 1000 TL sepet + 60 gün geçerli.
        //
        // TABAN = ödenen − kargo. Kargo burada, sepet/ödeme ekranlarıyla BİREBİR
        // aynı tek kaynaktan (KARGO eşiği + kargoUcretiKg/sepetAgirligiKg) yeniden
        // hesaplanır; aksi halde müşteriye gösterilen puan ile yüklenen puan
        // tutmazdı. Sepet çözülemezse kargo 0 sayılır (müşteri lehine).
        const odenen = parseFloat(String(data.paidPrice)) || 0;
        let kargoTutari = 0;
        try {
          const kalemler = typeof gecici?.urunler === "string" ? JSON.parse(gecici.urunler) : gecici?.urunler;
          const araToplam = parseFloat(String(gecici?.ara_toplam ?? "")) || 0;
          if (Array.isArray(kalemler) && araToplam < KARGO.BEDAVA_ESIK) {
            kargoTutari = kargoUcretiKg(sepetAgirligiKg(kalemler));
          }
        } catch (e) {
          console.error("[odeme/sonuc] puan tabani icin kargo hesabi:", e);
        }
        const bonusTutar = kazanilacakPuan(odenen - kargoTutari);
        if (gecici?.uye_email && bonusTutar > 0) {
          try {
            await supabaseAdmin.from("sadakat_bonuslari").insert({
              email: gecici.uye_email,
              tutar: bonusTutar,
              min_sepet: SADAKAT.MIN_SEPET,
              bitis_tarihi: new Date(Date.now() + SADAKAT.GECERLILIK_GUN * 24 * 60 * 60 * 1000).toISOString(),
              kaynak_siparis_no: siparisNo,
            });
            console.log("[odeme/sonuc] sadakat bonusu olusturuldu:", { email: gecici.uye_email, tutar: bonusTutar, siparisNo });
          } catch (e) {
            console.error("[odeme/sonuc] sadakat bonusu hatasi:", e);
          }
        }
      }

      // tutar query parametresi Google Ads conversion tracking icin lazim
      // (gtag 'value' alanina yazilir). transaction_id de gtag'a gider —
      // ayni siparis birden fazla kez conversion olarak sayilmasin diye.
      // email Google Customer Reviews opt-in widget'i icin gerekli; URL'de
      // gecmesi musterinin kendi sayfasi acildiginda bir kerelik kullanilir.
      const emailEnc = encodeURIComponent(gecici?.email || "");
      return NextResponse.redirect(`${SITE_URL}/odeme/sonuc?durum=basarili&siparis=${siparisNo}&tutar=${data.paidPrice}&email=${emailEnc}`, { status: 303 });
    } else {
      // BAŞARISIZ/YARIM ÖDEME — neden + tutar logla (gelir kaybı ölçümü).
      // Best-effort: log hatası ödeme akışını/redirect'i ASLA bozmasın.
      try {
        // supabaseAdmin ŞART: odeme_gecici RLS korumalı (14 Tem'de açıldı) →
        // anon istemci HİÇBİR satır göremez. Bu satır anon kaldığı için başarısız
        // ödemelerde müşteri bilgisi (ad/e-posta/telefon/sepet/tutar) NULL
        // yazılıyordu; panelde hepsi "(bilinmiyor) · ₺0" olarak tek satıra
        // gruplanıyor, kimin ödeyemediği görünmüyordu.
        const { data: gecici } = await supabaseAdmin.from("odeme_gecici").select("*").eq("token", token).maybeSingle();
        await supabaseAdmin.from("basarisiz_odemeler").insert({
          token,
          email: gecici?.email || null,
          ad: gecici?.ad || null,
          soyad: gecici?.soyad || null,
          telefon: gecici?.telefon || null,
          toplam: gecici?.toplam ?? data.price ?? null,
          iyzico_status: data.status || null,
          payment_status: data.paymentStatus || null,
          error_code: data.errorCode != null ? String(data.errorCode) : null,
          error_message: data.errorMessage || null,
          urunler: gecici?.urunler ?? null,
        });
        console.log("[odeme/sonuc] basarisiz odeme loglandi:", { paymentStatus: data.paymentStatus, errorMessage: data.errorMessage, toplam: gecici?.toplam });
      } catch (e) {
        console.error("[odeme/sonuc] basarisiz odeme log hatasi:", e);
      }
      // RET SEBEBİNİ MÜŞTERİYE TAŞI. iyzico anlamlı ve eyleme dönük mesajlar
      // döndürüyor ("Son kullanma tarihi hatalı", "Kart limiti yetersiz",
      // "Kartınız internetten alışverişe kapalıdır. Açtırmak için … SMS …") ama
      // bunlar yalnız basarisiz_odemeler tablosuna yazılıyordu; müşteri sadece
      // "Ödeme tamamlanamadı" görüp ayrılıyordu. Sebebi bilmeyen müşteri
      // düzeltemez. Mesaj URL'de taşınır; sonuç sayfası eyleme çevirir.
      const hataMesaji = String(data.errorMessage || "").slice(0, 200);
      const hataKodu = data.errorCode != null ? String(data.errorCode).slice(0, 20) : "";
      const ek = [
        hataMesaji ? `hata=${encodeURIComponent(hataMesaji)}` : "",
        hataKodu ? `kod=${encodeURIComponent(hataKodu)}` : "",
      ].filter(Boolean).join("&");
      return NextResponse.redirect(`${SITE_URL}/odeme/sonuc?durum=basarisiz${ek ? "&" + ek : ""}`, { status: 303 });
    }
  } catch (err) {
    console.error("[odeme/sonuc] callback error:", err);
    return NextResponse.redirect(`${SITE_URL}/odeme/sonuc?durum=basarisiz`, { status: 303 });
  }
}