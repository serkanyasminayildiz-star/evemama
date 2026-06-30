// Nilvera (REST/JSON) e-Arşiv/e-Fatura istemcisi.
//
// EDM'in SOAP'ının aksine Nilvera modern REST kullanır:
//  • Kimlik: Authorization: Bearer <API_KEY> (login/token adımı YOK)
//  • Ortam: test=apitest.nilvera.com, canlı=api.nilvera.com (AYRI key)
//  • Alt yollar: /einvoice (e-Fatura), /earchive (e-Arşiv), /general (mükellef)
//
// Muhasebe programındaki test-edilmiş entegrasyonun (nilveraClient.ts) port'u;
// API key + ortam env'den okunur (NILVERA_API_KEY, NILVERA_TEST_MODE). Yalnız
// SUNUCU tarafında çağrılır (API route) — key gizli.

import type { FaturaFirma } from "./ublTr";

const CANLI = "https://api.nilvera.com";
const TEST = "https://apitest.nilvera.com";

// Güvenli varsayılan: yalnız NILVERA_TEST_MODE açıkça "false" ise canlıya gider.
function base(): string {
  return process.env.NILVERA_TEST_MODE === "false" ? CANLI : TEST;
}

function authHeader(): Record<string, string> {
  const key = process.env.NILVERA_API_KEY;
  if (!key) throw new Error("NILVERA_API_KEY env tanımlı değil.");
  return { Authorization: `Bearer ${key}` };
}

async function hata(r: Response): Promise<Error> {
  const govde = await r.text().catch(() => "");
  return new Error(`Nilvera ${r.status} ${r.statusText}${govde ? " — " + govde.slice(0, 300) : ""}`);
}

export interface NilveraMukellef {
  vknTckn: string;
  unvan: string;
  alias: string; // e-Fatura posta kutusu etiketi
}

/** API anahtarı geçerli mi? 401/403 = geçersiz anahtar. */
export async function baglantiTest(): Promise<boolean> {
  const r = await fetch(`${base()}/general/GlobalCompany?PageSize=1&Page=1`, { headers: authHeader() });
  if (r.status === 401 || r.status === 403) throw new Error("Nilvera API anahtarı geçersiz veya yetkisiz.");
  if (!r.ok && r.status !== 404) throw await hata(r);
  return true;
}

/** Hesabın KENDİ firma bilgisi (faturanın satıcı tarafı). API key hangi kuruma
 *  bağlıysa onun VKN'ini döner → satıcı VKN her zaman key ile eşleşir (409 yok).
 *  Test'te "Test Kurum Bir", canlıda Verivo'nun gerçek bilgisi gelir. */
export async function firmaBilgisi(): Promise<FaturaFirma> {
  const r = await fetch(`${base()}/general/Company`, { headers: authHeader() });
  if (!r.ok) throw await hata(r);
  const c = (await r.json()) as Record<string, unknown>;
  return {
    vkn: (c.TaxNumber as string) || "",
    unvan: (c.Name as string) || "",
    vergiDairesi: (c.TaxOffice as string) || "",
    il: (c.City as string) || "",
    ilce: (c.District as string) || "",
    adres: (c.Address as string) || "",
  };
}

/** VKN/TCKN e-Fatura mükellefi mi? Kayıt varsa unvan+alias, yoksa null (→ e-Arşiv). */
export async function mukellefSorgula(vknTckn: string): Promise<NilveraMukellef | null> {
  const r = await fetch(
    `${base()}/general/GlobalCompany/Check/TaxNumber/${encodeURIComponent(vknTckn)}?globalUserType=Invoice`,
    { headers: authHeader() }
  );
  if (r.status === 404) return null;
  if (!r.ok) throw await hata(r);
  const veri = (await r.json()) as Array<Record<string, unknown>> | Record<string, unknown>;
  const kayit = (Array.isArray(veri) ? veri[0] : veri) as Record<string, unknown> | undefined;
  if (!kayit) return null;
  const aliases = kayit.Aliases as Array<{ Name?: string }> | undefined;
  return {
    vknTckn,
    unvan: (kayit.Title as string) || "",
    alias: (kayit.Name as string) || (kayit.Alias as string) || aliases?.[0]?.Name || "",
  };
}

/** UBL XML faturayı gönderir (multipart/form-data). e-Fatura'da alias = alıcı posta kutusu. */
export async function faturaGonderXml(
  ublXml: string,
  alias: string | null,
  earsiv: boolean
): Promise<{ uuid?: string; durum?: string }> {
  const fd = new FormData();
  fd.append("file", new Blob([ublXml], { type: "application/xml" }), "fatura.xml");
  const taban = earsiv ? "/earchive/Send/Xml" : "/einvoice/Send/Xml";
  const yol = !earsiv && alias ? `${taban}?Alias=${encodeURIComponent(alias)}` : taban;
  const r = await fetch(`${base()}${yol}`, { method: "POST", headers: authHeader(), body: fd });
  if (!r.ok) throw await hata(r);
  const ct = r.headers.get("content-type") ?? "";
  const yanit = (ct.includes("json")
    ? await r.json()
    : { UUID: (await r.text()).trim() }) as Record<string, unknown>;
  return {
    uuid: (yanit.UUID as string) || (yanit.uuid as string),
    durum: yanit.InvoiceNumber ? "gönderildi" : undefined,
  };
}

/** Giden faturanın güncel durumu (waiting/succeed/error). */
export async function durumSorgula(uuid: string): Promise<string> {
  const r = await fetch(`${base()}/einvoice/Sale/${encodeURIComponent(uuid)}/Status`, { headers: authHeader() });
  if (!r.ok) throw await hata(r);
  const yanit = (await r.json()) as Record<string, unknown>;
  const st = yanit.InvoiceStatus as Record<string, unknown> | undefined;
  return (st?.DetailDescription as string) || (st?.Code as string) || (yanit.StatusCode as string) || "bilinmiyor";
}

/** Kesilmiş e-Arşiv faturanın PDF'i. Nilvera `GET /earchive/Invoices/{uuid}/pdf`
 *  base64 string'i JSON gövdesinde döner (content-type application/json) → Buffer. */
export async function faturaPdfArsiv(uuid: string): Promise<Buffer> {
  const r = await fetch(`${base()}/earchive/Invoices/${encodeURIComponent(uuid)}/pdf`, { headers: authHeader() });
  if (!r.ok) throw await hata(r);
  const b64 = (await r.json()) as string; // bare JSON string: "JVBERi0..."
  return Buffer.from(b64, "base64");
}
