export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Müşterinin sepet/ödemede girdiği kupon kodunu doğrular ve indirim tutarını
// döner (GÖSTERİM için). Gerçek indirim odeme/route.ts'te sunucuda yeniden
// doğrulanıp uygulanır — buradan dönen değere ödeme anında güvenilmez.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// Bir kuponun sepete uygulanabilirliğini ve indirim tutarını hesaplar.
// odeme/route.ts de AYNI mantığı kullanır (tek kaynak gibi davranması için
// kurallar burada net tutuldu).
export type KuponKaydi = {
  kod: string;
  aktif?: boolean;
  bitis_tarihi?: string | null;
  kullanim_limiti?: number | null;
  kullanim_sayisi?: number | null;
  min_sepet?: number | null;
  indirim_tipi?: string;
  indirim_degeri?: number | string | null;
};

export function kuponIndirimiHesapla(kupon: KuponKaydi | null, sepetTutari: number): { gecerli: boolean; indirim: number; mesaj?: string } {
  if (!kupon) return { gecerli: false, indirim: 0, mesaj: "Kupon bulunamadı." };
  if (kupon.aktif === false) return { gecerli: false, indirim: 0, mesaj: "Bu kupon artık geçerli değil." };
  if (kupon.bitis_tarihi && new Date(kupon.bitis_tarihi) < new Date()) {
    return { gecerli: false, indirim: 0, mesaj: "Bu kuponun süresi dolmuş." };
  }
  if (kupon.kullanim_limiti != null && (kupon.kullanim_sayisi || 0) >= kupon.kullanim_limiti) {
    return { gecerli: false, indirim: 0, mesaj: "Bu kupon kullanım limitine ulaşmış." };
  }
  const minSepet = Number(kupon.min_sepet) || 0;
  if (sepetTutari < minSepet) {
    return { gecerli: false, indirim: 0, mesaj: `Bu kupon için minimum ₺${minSepet.toLocaleString("tr-TR")} sepet tutarı gerekli.` };
  }
  const deger = Number(kupon.indirim_degeri) || 0;
  let indirim = kupon.indirim_tipi === "yuzde" ? (sepetTutari * deger) / 100 : deger;
  indirim = Math.min(indirim, sepetTutari); // indirim sepeti aşamaz
  indirim = Math.round(indirim * 100) / 100;
  return { gecerli: true, indirim };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const kod = typeof body.kod === "string" ? body.kod.trim().toUpperCase() : "";
    const sepetTutari = Number(body.sepetTutari) || 0;
    if (!kod) return NextResponse.json({ gecerli: false, mesaj: "Kupon kodu girin." }, { headers: { "Cache-Control": "no-store" } });

    const { data: kupon } = await supabase.from("kuponlar").select("*").eq("kod", kod).maybeSingle();
    const sonuc = kuponIndirimiHesapla(kupon, sepetTutari);

    return NextResponse.json(
      sonuc.gecerli
        ? { gecerli: true, kod, indirim: sonuc.indirim, indirim_tipi: kupon.indirim_tipi, indirim_degeri: Number(kupon.indirim_degeri) }
        : { gecerli: false, mesaj: sonuc.mesaj },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "kupon dogrulanamadi";
    return NextResponse.json({ gecerli: false, mesaj: msg }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
