// Admin yazma yardımcısı — /api/admin/yaz proxy'sine gider (service_role).
// DÖNÜŞ ŞEKLİ supabase-js ile AYNI ({ data, error }) → mevcut çağrı yerlerindeki
// `const { error } = await ...` / `if (error)` mantığı değişmeden çalışır.
const ADMIN_SIFRE = "evemama2025";

export type AdminYazSonuc = {
  data: Record<string, unknown>[] | null;
  error: { message: string } | null;
};

export async function adminYaz(
  tablo: "urunler" | "kategoriler" | "markalar" | "kuponlar" | "blog_sorular" | "site_ayarlari" | "abonelikler",
  islem: "select" | "insert" | "update" | "delete" | "upsert" | "delete_hepsi",
  ayrinti?: {
    veri?: Record<string, unknown> | Record<string, unknown>[];
    filtre?: Record<string, unknown>;
    onConflict?: string;
  },
): Promise<AdminYazSonuc> {
  try {
    const r = await fetch("/api/admin/yaz", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${ADMIN_SIFRE}` },
      body: JSON.stringify({ tablo, islem, ...ayrinti }),
    });
    const d = (await r.json()) as { ok?: boolean; data?: Record<string, unknown>[]; error?: string };
    if (!r.ok || !d.ok) return { data: null, error: { message: d.error || "işlem başarısız" } };
    return { data: d.data || [], error: null };
  } catch {
    return { data: null, error: { message: "sunucuya ulaşılamadı" } };
  }
}
