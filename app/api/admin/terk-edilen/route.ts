export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Terk edilen sepet = ödeme başlatılmış ama tamamlanmamış kayıtlar. Ödeme
// başlatılınca odeme_gecici'ye yazılır; tamamlanınca (odeme/sonuc) silinir.
// Yani odeme_gecici'de KALANLAR = terk edilmiş sepetler (satın almışlar yok).
const ADMIN_SIFRE = "evemama2025";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export async function GET(req: NextRequest) {
  if ((req.headers.get("authorization") || "") !== `Bearer ${ADMIN_SIFRE}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  try {
    const sb = adminClient();

    // SAYFALAMA ŞART: PostgREST tek istekte en fazla 1000 satır döndürür
    // (.limit(5000) bunu AŞMAZ, sessizce yok sayılır). Sayfalama olmadan
    // yalnız EN YENİ 1000 satır geliyordu — 21 Ağu'daki kart deneme saldırısı
    // tek başına 994 satır ürettiği için pencereyi tamamen doldurmuş ve ondan
    // ÖNCEKİ bütün terk edilmiş sepetler admin panelde görünmez olmuştu.
    // İkincil sıralama (token) bilinçli: created_at eşitliğinde satır sırası
    // sayfalar arasında kayarsa kayıt tekrarlanır ya da atlanırdı.
    const SAYFA = 1000;
    const TAVAN_SAYFA = 50; // 50.000 satır tavanı — admin sayfası kilitlenmesin
    type GeciciSatir = {
      token: string; ad: string | null; soyad: string | null; email: string | null;
      telefon: string | null; toplam: number | string | null; urunler: unknown; created_at: string;
    };
    const gecici: GeciciSatir[] = [];
    let kesildi = false;
    for (let s = 0; s < TAVAN_SAYFA; s++) {
      const { data, error } = await sb
        .from("odeme_gecici")
        .select("token, ad, soyad, email, telefon, toplam, urunler, created_at")
        .order("created_at", { ascending: false })
        .order("token", { ascending: false })
        .range(s * SAYFA, s * SAYFA + SAYFA - 1);
      if (error) throw error;
      if (!data?.length) break;
      gecici.push(...(data as GeciciSatir[]));
      if (data.length < SAYFA) break;
      if (s === TAVAN_SAYFA - 1) kesildi = true; // sessiz kesme YOK — yanıtta bildirilir
    }

    // Üye mi misafir mi — auth.users e-postaları (service_role varsa)
    const uyeEmails = new Set<string>();
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { data: list } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
        for (const u of list?.users || []) if (u.email) uyeEmails.add(u.email.toLowerCase());
      } catch (e) {
        console.error("[terk-edilen] uye listesi:", e);
      }
    }

    // SONRADAN SİPARİŞ VERENLER: odeme_gecici'den silme TOKEN bazlıdır, yani
    // Nisan'da sepeti terk edip Mayıs'ta ayrı bir oturumda sipariş veren müşteri
    // eski kaydıyla bu listede kalır. Bu kişilere "sepetinizi unuttunuz" kuponu
    // gitmesin diye işaretleniyor (listeden ÇIKARILMIYOR — panelde görünür kalsın,
    // kararı yönetici versin). Aynı 1000 satır tavanı burada da geçerli → sayfalı.
    const siparisVerenler = new Set<string>();
    for (let s = 0; s < TAVAN_SAYFA; s++) {
      const { data, error: sipHata } = await sb
        .from("siparisler")
        .select("email")
        .order("email", { ascending: true })
        .range(s * SAYFA, s * SAYFA + SAYFA - 1);
      if (sipHata) { console.error("[terk-edilen] siparis e-postalari:", sipHata); break; }
      if (!data?.length) break;
      for (const o of data) {
        const e = String((o as { email?: string }).email || "").toLowerCase().trim();
        if (e) siparisVerenler.add(e);
      }
      if (data.length < SAYFA) break;
    }

    // E-posta bazlı grupla — aynı kişinin birden çok denemesi tek satır.
    const map = new Map<string, {
      email: string; ad: string; telefon: string; toplam: number;
      urunOzet: string; urunSayisi: number; tarih: string; deneme: number; uye: boolean;
      satinAldi: boolean;
    }>();

    for (const g of gecici || []) {
      const e = (g.email || "").toLowerCase().trim();
      if (!e) continue;
      if (!map.has(e)) {
        let urunSayisi = 0;
        let urunOzet = "";
        try {
          const arr = typeof g.urunler === "string" ? JSON.parse(g.urunler) : g.urunler;
          if (Array.isArray(arr)) {
            urunSayisi = arr.reduce((s: number, i: { quantity?: number }) => s + (Number(i.quantity) || 1), 0);
            urunOzet = arr.map((i: { quantity?: number; name?: string }) => `${Number(i.quantity) || 1}x ${i.name || "Ürün"}`).join(", ");
          }
        } catch { /* urunler parse edilemezse ozet bos kalir */ }
        map.set(e, {
          email: e,
          ad: `${g.ad || ""} ${g.soyad || ""}`.trim(),
          telefon: g.telefon || "",
          toplam: parseFloat(String(g.toplam)) || 0,
          urunOzet,
          urunSayisi,
          tarih: g.created_at,
          deneme: 1,
          uye: uyeEmails.has(e),
          satinAldi: siparisVerenler.has(e),
        });
      } else {
        map.get(e)!.deneme += 1;
      }
    }

    const sepetler = Array.from(map.values());
    return NextResponse.json(
      { sepetler, toplam: sepetler.length, denemeSayisi: gecici.length, kesildi },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "terk edilen sepetler alınamadı";
    console.error("[admin/terk-edilen] hata:", e);
    return NextResponse.json({ error: msg }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
