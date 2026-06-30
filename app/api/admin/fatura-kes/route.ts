export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { firmaBilgisi, faturaGonderXml } from "../../../../lib/nilvera/client";
import { faturaToUblTr, gibFaturaNo, type FaturaKalem } from "../../../../lib/nilvera/ublTr";
import { randomUUID } from "crypto";

// e-Arşiv fatura kes (admin). Sipariş → UBL-TR e-Arşiv → Nilvera → UUID kaydet.
// Auth: Bearer ADMIN_SIFRE (diğer admin API'leriyle aynı). service_role gerekli
// (siparisler PII oku + güncelle). Belge tipi B2C → e-Arşiv.
const ADMIN_SIFRE = "evemama2025";
const KDV_ORANI = Number(process.env.NILVERA_KDV_ORANI || "20");

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
function yetkili(req: NextRequest) {
  return (req.headers.get("authorization") || "") === `Bearer ${ADMIN_SIFRE}`;
}
const noStore = { "Cache-Control": "no-store" };

export async function POST(req: NextRequest) {
  if (!yetkili(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: noStore });
  try {
    const { siparisId } = await req.json();
    if (!siparisId) return NextResponse.json({ error: "siparisId gerekli" }, { status: 400, headers: noStore });

    const sb = adminClient();
    const { data: sip, error: e1 } = await sb.from("siparisler").select("*").eq("id", siparisId).single();
    if (e1 || !sip) return NextResponse.json({ error: "sipariş bulunamadı" }, { status: 404, headers: noStore });

    // İdempotent: zaten kesildiyse tekrar gönderme (çift fatura riski).
    if (sip.fatura_uuid) {
      return NextResponse.json({ ok: true, zaten: true, uuid: sip.fatura_uuid, faturaNo: sip.fatura_no }, { headers: noStore });
    }

    // Kalemler — siparisler.urunler JSON: { name, price (KDV-DAHİL TL), quantity }
    let raw: unknown = sip.urunler;
    if (typeof raw === "string") { try { raw = JSON.parse(raw); } catch { raw = []; } }
    const items = (Array.isArray(raw) ? raw : []) as Array<Record<string, unknown>>;
    if (items.length === 0) {
      return NextResponse.json({ error: "siparişte ürün kalemi yok" }, { status: 400, headers: noStore });
    }

    // İndirim/kargo: kalem toplamı ödenen tutarla (sip.toplam) eşleşmezse birim
    // fiyatları orantılı ölçekle → fatura toplamı = ödenen tutar (yasal zorunluluk).
    const kalemToplam = items.reduce((t, i) => t + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0);
    const odenen = Number(sip.toplam) || kalemToplam;
    const olcek = kalemToplam > 0 ? odenen / kalemToplam : 1;

    const kalemler: FaturaKalem[] = items.map((i) => ({
      ad: String(i.name || "Ürün"),
      miktar: Number(i.quantity) || 1,
      birimFiyatKdvDahil: (Number(i.price) || 0) * olcek,
      kdvOrani: KDV_ORANI,
    }));

    const firma = await firmaBilgisi(); // satıcı = Nilvera hesabının firması (VKN key ile eşleşir)
    const alici = {
      ad: String(sip.ad || ""), soyad: String(sip.soyad || ""), vknTckn: null,
      il: String(sip.sehir || ""), ilce: "", adres: String(sip.adres || ""),
    };

    // Tarih: canlıda bugün. Test hesabı belirli tarih istiyorsa NILVERA_TEST_TARIH ile geç.
    const now = new Date();
    const p = (n: number) => String(n).padStart(2, "0");
    const bugun = `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
    const tarih = process.env.NILVERA_TEST_TARIH || bugun;
    const saat = `${p(now.getHours())}:${p(now.getMinutes())}:${p(now.getSeconds())}`;

    const faturaNo = gibFaturaNo(Number(sip.id), tarih, "e_arsiv");
    const uuid = randomUUID();
    const xml = faturaToUblTr({ firma, alici, kalemler, faturaNo, uuid, tarih, saat, tipi: "e_arsiv" });

    const sonuc = await faturaGonderXml(xml, null, true);
    const nihaiUuid = sonuc.uuid || uuid;

    await sb.from("siparisler").update({
      fatura_uuid: nihaiUuid,
      fatura_no: faturaNo,
      fatura_kesildi: true,
      fatura_kesim_tarihi: new Date().toISOString(),
    }).eq("id", siparisId);

    return NextResponse.json({ ok: true, uuid: nihaiUuid, faturaNo }, { headers: noStore });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "fatura kesilemedi" }, { status: 500, headers: noStore });
  }
}
