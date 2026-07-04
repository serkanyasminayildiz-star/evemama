// Mama Asistanı — AI destekli mama önerisi (sunucu çekirdeği).
//
// Akış: stoktaki ürünler (tür filtreli) kompakt liste halinde Claude'a verilir;
// model müşterinin derdine göre EN UYGUN 3 ürünü id+gerekçeyle STRICT JSON döner.
// İş kuralı: eşit uygunlukta ⭐ (öncelikli=stoklu/rekabetçi) ürün tercih edilir.
// Sağlık iddiası abartılmaz; ciddi durumda veterinere yönlendirme notu döner.
//
// Model: claude-haiku-4-5 (hızlı/ekonomik). DERS (verivo model-emekliliği vakası):
// model adı SABİT + try/catch'siz bırakılırsa emeklilikte opak "bağlantı hatası"
// olur → burada hata mesajı sunucu loguna AYNEN yazılır, istemciye dostça mesaj gider.
import { createClient } from "@supabase/supabase-js";

const CLAUDE_MODEL = "claude-haiku-4-5";

export type AsistanGirdi = {
  tur: "kedi" | "kopek";
  mesaj: string;          // serbest metin: problem/ihtiyaç
  yas?: string;           // yavru | yetiskin | yasli (opsiyonel)
  cins?: string;          // opsiyonel
};

export type AsistanUrun = {
  id: number;
  ad: string;
  slug: string;
  fiyat: number;
  indirimli_fiyat: number | null;
  stok: number;
  resim_url: string | null;
  oncelikli: boolean | null;
};

export type AsistanSonuc = {
  oneriler: Array<{ urun: AsistanUrun; neden: string }>;
  not: string | null; // örn. veteriner uyarısı
};

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

// Türkçe-duyarsız içerir (İ/ı sorunu için locale lower).
function iceriyor(kaynak: string, aranan: string): boolean {
  return kaynak.toLocaleLowerCase("tr-TR").includes(aranan);
}

/** Stoktaki ürünlerden tür'e uyan adayları çeker (kategori adı/slug veya ürün adına göre). */
export async function adaylariGetir(tur: "kedi" | "kopek"): Promise<AsistanUrun[]> {
  const { data, error } = await sb()
    .from("urunler")
    .select("id, ad, slug, fiyat, indirimli_fiyat, stok, resim_url, oncelikli, kategoriler(ad, slug)")
    .eq("aktif", true)
    .gt("stok", 0);
  if (error) throw new Error("ürünler okunamadı: " + error.message);
  const anahtar = tur === "kedi" ? "kedi" : "köpek";
  const slugAnahtar = tur === "kedi" ? "kedi" : "kopek";
  return ((data || []) as unknown as Array<AsistanUrun & { kategoriler: { ad: string; slug: string } | null }>)
    .filter(u => {
      const kat = u.kategoriler;
      return (
        iceriyor(u.ad, anahtar) ||
        (kat ? iceriyor(kat.ad, anahtar) || kat.slug.includes(slugAnahtar) : false)
      );
    })
    .map(u => ({ id: u.id, ad: u.ad, slug: u.slug, fiyat: u.fiyat, indirimli_fiyat: u.indirimli_fiyat, stok: u.stok, resim_url: u.resim_url, oncelikli: u.oncelikli }));
}

/** Claude'dan öneri alır; STRICT JSON bekler, toleranslı parse eder. */
export async function oneriUret(girdi: AsistanGirdi): Promise<AsistanSonuc> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY env tanımlı değil.");

  const adaylar = await adaylariGetir(girdi.tur);
  if (adaylar.length === 0) return { oneriler: [], not: "Şu anda bu kategoride stokta ürün yok." };

  // Kompakt aday listesi — ürün adları (cins/yaş/problem hattı) asıl sinyali taşır.
  const liste = adaylar.map(u => `${u.id}|${u.ad}${u.oncelikli ? "|⭐" : ""}`).join("\n");
  const profil = [
    `Tür: ${girdi.tur === "kedi" ? "Kedi" : "Köpek"}`,
    girdi.yas ? `Yaş grubu: ${girdi.yas}` : null,
    girdi.cins ? `Cins: ${girdi.cins}` : null,
    `İhtiyaç/problem: ${girdi.mesaj}`,
  ].filter(Boolean).join("\n");

  const system = `Sen evemama.net'in (evcil hayvan maması mağazası) mama danışmanısın. Görevin: müşterinin evcil hayvanının ihtiyacına göre AŞAĞIDAKİ ÜRÜN LİSTESİNDEN en uygun ürünleri seçmek.

KURALLAR:
- YALNIZ listede verilen id'leri kullan; listede olmayan ürün ÖNERME, ürün uydurma.
- En uygun 3 ürünü seç (gerçekten uygun daha azsa daha az seç; hiç uygun yoksa boş dizi).
- MARKA ÖNCELİĞİ: Bu ihtiyaca uygun Royal Canin ürünü VARSA önerilerde Royal Canin'e öncelik ver ve ilk sıralara koy (stok istikrarı en yüksek marka). Royal Canin'de uygun ürün yoksa diğer markalardan öner. Ancak uygunluktan asla ödün verme — ihtiyaca uymayan bir Royal Canin, uyan başka markadan iyi değildir.
- Uygunluk eşitse ⭐ işaretli ürünü tercih et.
- Her öneri için 1-2 cümle samimi, NET Türkçe gerekçe yaz (ürünün hangi özelliği bu derde iyi gelir). Tıbbi tedavi vaadi verme, abartma.
- Belirti ciddi bir sağlık sorununa işaret ediyorsa (sürekli kusma, kan, ağrı, ani kilo kaybı vb.) "not" alanına kısa bir "veterinere danışın" uyarısı yaz; değilse not null olsun.
- SADECE şu şekilde geçerli JSON döndür, başka hiçbir metin yazma:
{"oneriler":[{"id":123,"neden":"..."}],"not":"..." veya null}`;

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 700,
      system,
      messages: [{ role: "user", content: `MÜŞTERİ PROFİLİ:\n${profil}\n\nÜRÜN LİSTESİ (id|ad|⭐=öne çıkan):\n${liste}` }],
    }),
  });
  if (!r.ok) {
    const govde = await r.text().catch(() => "");
    throw new Error(`Claude API ${r.status} — ${govde.slice(0, 300)}`);
  }
  const yanit = (await r.json()) as { content?: Array<{ type: string; text?: string }> };
  const metin = (yanit.content || []).filter(c => c.type === "text").map(c => c.text || "").join("");

  // Toleranslı parse: düz JSON değilse ilk {...} bloğunu dene.
  let veri: { oneriler?: Array<{ id: number; neden: string }>; not?: string | null };
  try {
    veri = JSON.parse(metin);
  } catch {
    const m = metin.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("Claude yanıtı JSON değil: " + metin.slice(0, 200));
    veri = JSON.parse(m[0]);
  }

  const idMap = new Map(adaylar.map(u => [u.id, u]));
  const oneriler = (veri.oneriler || [])
    .map(o => ({ urun: idMap.get(Number(o.id)), neden: String(o.neden || "") }))
    .filter((o): o is { urun: AsistanUrun; neden: string } => !!o.urun)
    .slice(0, 3);

  return { oneriler, not: veri.not || null };
}
