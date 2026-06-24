export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import * as crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { kuponIndirimiHesapla } from "../kupon-dogrula/route";
import { ILK_SIPARIS, SADAKAT, hesaplaIndirim } from "../../../lib/indirim";
import { sendHavaleTalimatMaili } from "../../../lib/email";

// Sepet ürünü — client'tan gelen JSON şekli (explicit any yerine).
type SepetUrun = { id: string | number; name: string; price: number; quantity: number };

const IYZICO_API_KEY = process.env.IYZICO_API_KEY || "";
const IYZICO_SECRET_KEY = process.env.IYZICO_SECRET_KEY || "";
const IYZICO_BASE_URL = process.env.IYZICO_BASE_URL || "https://api.iyzipay.com";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Sadakat bonusu RLS korumalı tablodadır → okumak/işaretlemek service_role
// gerektirir (anon göremez).
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

// 3DS zorunlu Iyzico CheckoutForm endpoint'i. /auth/ ekli versiyonu (eski hali)
// 3DS adimini atliyor → BDDK 3DS zorunlulugu ihlali + yuksek tutarli
// kartlarda banka reddi (revenue kaybi). Bu endpoint'te Iyzico kart bankasi
// risk skoruna gore SMS 3DS sayfasini otomatik tetikliyor.
const ENDPOINT = "/payment/iyzipos/checkoutform/initialize/ecom";

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
  const body = await req.json();
  const { items, buyer } = body;

  const conversationId = Date.now().toString();
  const randomString = generateRandomString();

  const basketItems = items.map((item: SepetUrun) => ({
    id: item.id.toString(),
    name: item.name,
    category1: "Evcil Hayvan",
    itemType: "PHYSICAL",
    price: (item.price * item.quantity).toFixed(2),
  }));

  const basketTotal = items.reduce((sum: number, item: SepetUrun) =>
    sum + (item.price * item.quantity), 0
  );

  // GÜVENLİK: ödenecek tutar CLIENT'tan ALINMAZ — server hesaplar. Aksi
  // halde tarayıcıdan düşük paidPrice gönderilip indirim manipüle edilebilirdi.
  // Kargo + tutar indirimi + en-avantajlısı ARİTMETİĞİ aşağıda hesaplaIndirim()
  // ile yapılır (client ile TEK KAYNAK). Burada yalnız üyelik bağımlı HAK'lar
  // (ilk sipariş, sadakat bonusu, kupon) DB'den doğrulanıp çözülür.

  // Üye doğrulama (Supabase access_token) — hem ilk sipariş indirimi hem
  // sadakat bonusu için ortak. Üye e-postası odeme_gecici'ye yazılır ki
  // callback'te (odeme/sonuc) "üye mi" belli olsun; sadakat bonusu yalnızca
  // üyelere verilir.
  let uyeEmail: string | null = null;
  const reqAuth = req.headers.get("authorization") || "";
  if (reqAuth.startsWith("Bearer ")) {
    try {
      const { data: authData } = await supabase.auth.getUser(reqAuth.slice(7));
      uyeEmail = authData?.user?.email || null;
    } catch (e) {
      console.error("[odeme] uye token dogrulama:", e);
    }
  }

  // İlk sipariş 200 TL indirimi — SADECE giriş yapmış (üye) ve bu hesapla hiç
  // siparişi olmayan müşteriye. Üye olmayan / 2. siparişini veren ALAMAZ.
  let ilkSiparisHak = false;
  if (uyeEmail && basketTotal >= ILK_SIPARIS.MIN_SEPET) {
    try {
      const { count } = await supabase
        .from("siparisler")
        .select("*", { count: "exact", head: true })
        .eq("email", uyeEmail);
      if (count === 0) ilkSiparisHak = true;
    } catch (e) {
      console.error("[odeme] ilk siparis dogrulama:", e);
    }
  }

  // Sadakat bonusu — üyenin geçerli (kullanılmamış, süresi geçmemiş) bonusu
  // varsa ve sepet bonusun min_sepet'ini karşılıyorsa ödenecek tutardan düşülür.
  // SUNUCUDA doğrulanır; hangi bonusun harcandığı odeme_gecici'ye yazılır,
  // ödeme başarılı olunca (odeme/sonuc) "kullanıldı" işaretlenir.
  let bonusTutar = 0;
  let kullanilanBonusId: number | null = null;
  if (uyeEmail) {
    try {
      const { data: bonuslar } = await supabaseAdmin
        .from("sadakat_bonuslari")
        .select("id, tutar, min_sepet")
        .eq("email", uyeEmail)
        .eq("kullanildi", false)
        .gt("bitis_tarihi", new Date().toISOString())
        .order("tutar", { ascending: false })
        .limit(1);
      const b = bonuslar && bonuslar[0];
      if (b && basketTotal >= (Number(b.min_sepet) || SADAKAT.MIN_SEPET)) {
        bonusTutar = Number(b.tutar) || 0;
        kullanilanBonusId = b.id;
      }
    } catch (e) {
      console.error("[odeme] sadakat bonusu dogrulama:", e);
    }
  }

  // Kupon kodu (müşteri girdiyse) — SUNUCUDA doğrulanır (client'tan gelen
  // tutara güvenilmez). Aynı doğrulama mantığı kupon-dogrula API'siyle ortak.
  let kuponIndirimi = 0;
  let gecerliKuponKod: string | null = null;
  const kuponKodu = (typeof body.kuponKodu === "string" ? body.kuponKodu : "").trim().toUpperCase();
  if (kuponKodu) {
    try {
      const { data: kupon } = await supabaseAdmin.from("kuponlar").select("*").eq("kod", kuponKodu).maybeSingle();
      const sonuc = kuponIndirimiHesapla(kupon, basketTotal);
      if (sonuc.gecerli && kupon) { kuponIndirimi = sonuc.indirim; gecerliKuponKod = kupon.kod; }
    } catch (e) {
      console.error("[odeme] kupon dogrulama:", e);
    }
  }

  // TEK KAYNAK indirim hesabı — client (sepet/odeme) ile AYNI saf fonksiyon.
  // EN AVANTAJLISI (kupon vs otomatik üst üste binmez) ve genelToplam burada.
  const hesap = hesaplaIndirim({ sepetTutari: basketTotal, ilkSiparis: ilkSiparisHak, bonusTutar, kuponIndirimi });

  // Kupon kazandıysa kupon harcanır (kod işaretlenir); değilse bonus (varsa)
  // harcanır. Hangisi → odeme_gecici'ye yazılır, odeme/sonuc'ta işaretlenir.
  const kullanilanKuponKod: string | null = hesap.kuponKazandi ? gecerliKuponKod : null;
  const nihaiBonusId: number | null = hesap.kuponKazandi ? null : kullanilanBonusId;

  const priceStr = basketTotal.toFixed(2);
  const paidPriceStr = hesap.genelToplam.toFixed(2);

  // ── HAVALE/EFT ──────────────────────────────────────────────────────────────
  // Havale seçildiyse iyzico'ya GİTME. Siparişi "ödeme bekliyor (havale)" olarak
  // oluştur, IBAN + sipariş no döndür, talimat maili at. STOK DÜŞÜŞÜ + onay maili
  // admin ödemeyi "ödendi" işaretleyince olur (Faz 2). Bonus/kupon harcaması burada
  // işaretlenir (kart akışındaki gibi). Tutar SUNUCUDA hesaplandı (hesap.genelToplam).
  if (body.yontem === "havale") {
    const siparisNo = "EVE" + Date.now().toString().slice(-8);
    const { error: havaleErr } = await supabase.from("siparisler").insert({
      siparis_no: siparisNo,
      durum: "beklemede",
      odeme_yontemi: "havale",
      odeme_durumu: "bekliyor",
      toplam: hesap.genelToplam,
      ara_toplam: basketTotal,
      ad: buyer.name,
      soyad: buyer.surname,
      email: buyer.email,
      telefon: buyer.phone || "",
      adres: buyer.address,
      sehir: buyer.city,
      urunler: JSON.stringify(items),
      created_at: new Date().toISOString(),
    });
    if (havaleErr) {
      console.error("[odeme] havale siparis kayit hatasi:", havaleErr);
      return NextResponse.json({ error: "Sipariş oluşturulamadı, lütfen tekrar deneyin." }, { status: 500 });
    }
    // Kullanılan sadakat bonusu / kupon harcanır (kart akışı odeme/sonuc ile aynı mantık).
    if (nihaiBonusId) {
      try {
        await supabaseAdmin.from("sadakat_bonuslari")
          .update({ kullanildi: true, kullanildi_siparis_no: siparisNo })
          .eq("id", nihaiBonusId).eq("kullanildi", false);
      } catch (e) { console.error("[odeme] havale bonus isaretleme:", e); }
    }
    if (kullanilanKuponKod) {
      try {
        const { data: k } = await supabaseAdmin.from("kuponlar").select("kullanim_sayisi").eq("kod", kullanilanKuponKod).maybeSingle();
        await supabaseAdmin.from("kuponlar").update({ kullanim_sayisi: (Number(k?.kullanim_sayisi) || 0) + 1 }).eq("kod", kullanilanKuponKod);
      } catch (e) { console.error("[odeme] havale kupon sayaci:", e); }
    }
    try {
      await sendHavaleTalimatMaili({ siparisNo, ad: buyer.name, email: buyer.email, toplam: hesap.genelToplam });
    } catch (e) { console.error("[odeme] havale mail:", e); }
    console.log("[odeme] havale siparis olusturuldu:", siparisNo);
    return NextResponse.json({ havale: true, siparisNo, toplam: paidPriceStr });
  }

  const requestBody = {
    locale: "tr",
    conversationId,
    price: priceStr,
    paidPrice: paidPriceStr,
    currency: "TRY",
    basketId: "B" + conversationId,
    paymentGroup: "PRODUCT",
    callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "https://evemama.net"}/api/odeme/sonuc`,
    enabledInstallments: [1, 2, 3, 6, 9, 12],
    buyer: {
      id: buyer.id || "1",
      name: buyer.name,
      surname: buyer.surname,
      email: buyer.email,
      identityNumber: "74300864791",
      registrationAddress: buyer.address,
      city: buyer.city,
      country: "Turkey",
      ip: "85.34.78.112",
    },
    shippingAddress: {
      contactName: buyer.name + " " + buyer.surname,
      city: buyer.city,
      country: "Turkey",
      address: buyer.address,
    },
    billingAddress: {
      contactName: buyer.name + " " + buyer.surname,
      city: buyer.city,
      country: "Turkey",
      address: buyer.address,
    },
    basketItems,
  };

  const authHeader = generateAuth(randomString, ENDPOINT, requestBody);

  try {
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
    // Eskiden tam JSON yanit loglaniyordu — musteri bilgileri ve token
    // logs'a dusuyordu. Sadece basari/hata durumu + token kisa hash'i
    // tutuyoruz (debug yeterli, PII sizmiyor).
    console.log("[odeme] iyzico response:", {
      status: data.status,
      tokenPrefix: data.token ? String(data.token).slice(0, 8) + "…" : null,
      errorMessage: data.errorMessage || null,
    });

    // Token ile birlikte müşteri bilgilerini geçici olarak kaydet
    if (data.token) {
      await supabase.from("odeme_gecici").upsert({
        token: data.token,
        ad: buyer.name,
        soyad: buyer.surname,
        email: buyer.email,
        telefon: buyer.phone || "",
        adres: buyer.address,
        sehir: buyer.city,
        toplam: parseFloat(paidPriceStr),
        ara_toplam: parseFloat(priceStr),
        urunler: JSON.stringify(items),
        uye_email: uyeEmail, // null ise misafir → sadakat bonusu verilmez
        kullanilan_bonus_id: nihaiBonusId, // bonus yalnızca otomatik indirim kazandıysa harcanır
        kullanilan_kupon_kod: kullanilanKuponKod, // kupon avantajlıysa harcanır
        created_at: new Date().toISOString(),
      }, { onConflict: "token" });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[odeme] payment init error:", err);
    const mesaj = err instanceof Error ? err.message : "odeme baslatilamadi";
    return NextResponse.json({ error: mesaj }, { status: 500 });
  }
}