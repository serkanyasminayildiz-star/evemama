export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { kisiselKuponOlustur } from "../../../../lib/kuponUret";
import { createClient } from "@supabase/supabase-js";
import { sendKuponMaili } from "../../../../lib/email";

// Admin "Üyeler" sayfasından seçili üyelere, "Kuponlar"da oluşturulmuş bir
// kuponu hazır şablonla e-posta gönderir. Şifre Bearer ile doğrulanır
// (admin paneliyle aynı seviye). Üye e-postaları client'tan gelir ama kupon
// bilgisi SUNUCUDA kuponlar tablosundan okunur (manipülasyona kapalı).
const ADMIN_SIFRE = "evemama2025";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

type SeciliUye = { email: string; ad?: string };

export async function POST(req: NextRequest) {
  if ((req.headers.get("authorization") || "") !== `Bearer ${ADMIN_SIFRE}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const uyeler: SeciliUye[] = Array.isArray(body.uyeler)
    ? body.uyeler.filter((u: SeciliUye) => u && u.email)
    : [];
  const kod: string = typeof body.kod === "string" ? body.kod.trim().toUpperCase() : "";

  if (uyeler.length === 0) return NextResponse.json({ error: "En az bir üye seçin." }, { status: 400 });
  if (!kod) return NextResponse.json({ error: "Kupon seçin." }, { status: 400 });

  const sb = adminClient();

  // Kupon bilgisi SUNUCUDA okunur (client'tan gelen değere güvenilmez).
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
  for (const u of uyeler) {
    try {
      // KİŞİYE ÖZEL KOD: seçilen kupon artık ŞABLON'dur. Her alıcı için ona
      // bağlı, tek kullanımlık yeni bir kod üretilir — paylaşımlı kod
      // gönderilmez (kod sızınca herkes kullanabiliyordu).
      const kisisel = await kisiselKuponOlustur(sb, kupon, u.email);
      if (!kisisel) { failed += 1; continue; }
      const ok = await sendKuponMaili({
        email: u.email,
        ad: u.ad || "",
        kod: kisisel,
        indirimMetni,
        minSepetMetni,
        bitisMetni,
      });
      if (ok) sent += 1; else failed += 1;
    } catch (e) {
      console.error("[kupon-gonder] mail hatasi:", u.email, e);
      failed += 1;
    }
    // Resend rate limit (2/sn) — güvenli aralık
    await new Promise((r) => setTimeout(r, 550));
  }

  return NextResponse.json({ sent, failed, total: uyeler.length, kod: kupon.kod });
}
