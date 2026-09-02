export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { kisiselKuponOlustur } from "../../../../lib/kuponUret";
import { createClient } from "@supabase/supabase-js";
import { sendHatirlatmaMaili } from "../../../../lib/email";

// Terk edilen sepet sahiplerine, seçili bir kuponla "sepetini tamamla"
// hatırlatma maili gönderir. Kupon bilgisi SUNUCUDA kuponlar tablosundan
// okunur. Misafirler de kullanabilsin diye admin üyelik şartsız kupon seçer.
const ADMIN_SIFRE = "evemama2025";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

type SeciliSepet = { email: string; ad?: string; urunOzet?: string };

export async function POST(req: NextRequest) {
  if ((req.headers.get("authorization") || "") !== `Bearer ${ADMIN_SIFRE}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const sepetler: SeciliSepet[] = Array.isArray(body.sepetler)
    ? body.sepetler.filter((s: SeciliSepet) => s && s.email)
    : [];
  const kod: string = typeof body.kod === "string" ? body.kod.trim().toUpperCase() : "";

  if (sepetler.length === 0) return NextResponse.json({ error: "En az bir sepet seçin." }, { status: 400 });
  if (!kod) return NextResponse.json({ error: "Kupon seçin." }, { status: 400 });

  const sb = adminClient();
  const { data: kupon, error: kErr } = await sb.from("kuponlar").select("*").eq("kod", kod).single();
  if (kErr || !kupon) return NextResponse.json({ error: "Kupon bulunamadı." }, { status: 404 });
  if (kupon.aktif === false) return NextResponse.json({ error: "Seçilen kupon pasif." }, { status: 400 });

  const indirimMetni = kupon.indirim_tipi === "yuzde"
    ? `%${kupon.indirim_degeri} indirim`
    : `₺${kupon.indirim_degeri} indirim`;
  const minSepetMetni = kupon.min_sepet
    ? `Min. ₺${Number(kupon.min_sepet).toLocaleString("tr-TR")} sepet tutarı`
    : undefined;
  // Kişisel kuponlar 30 gün geçerli üretilir; metin de onu yansıtsın.
  const bitisMetni = `Son kullanım: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("tr-TR")}`;

  let sent = 0, failed = 0;
  for (const s of sepetler) {
    try {
      // KİŞİYE ÖZEL KOD — seçilen kupon şablondur, her alıcıya kendi kodu.
      const kisisel = await kisiselKuponOlustur(sb, kupon, s.email);
      if (!kisisel) { failed += 1; continue; }
      const ok = await sendHatirlatmaMaili({
        email: s.email,
        ad: s.ad || "",
        urunOzet: s.urunOzet || "",
        kod: kisisel,
        indirimMetni,
        minSepetMetni,
        bitisMetni,
      });
      if (ok) sent += 1; else failed += 1;
    } catch (e) {
      console.error("[sepet-hatirlat] mail hatasi:", s.email, e);
      failed += 1;
    }
    await new Promise((r) => setTimeout(r, 550)); // Resend rate limit
  }

  return NextResponse.json({ sent, failed, total: sepetler.length, kod: kupon.kod });
}
