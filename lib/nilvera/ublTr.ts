// UBL-TR 1.2 e-Arşiv / e-Fatura belge üreteci (evemama).
//
// GİB standardı; Nilvera (ve tüm entegratörler) bu formatı kabul eder.
// Entegratör mali mühürle imzalar — biz imzasız belgeyi üretiriz.
// Muhasebe programındaki test-edilmiş ublTr.ts'in evemama'ya uyarlaması:
// kuruş yerine TL; ürün fiyatları KDV-DAHİL → matrah + KDV ayrıştırılır.

export interface FaturaFirma {
  vkn: string;
  unvan: string;
  vergiDairesi: string;
  il: string;
  ilce: string;
  adres: string;
}
export interface FaturaAlici {
  ad: string;
  soyad: string;
  vknTckn: string | null; // B2C'de genelde yok → e-Arşiv'de 11111111111
  il: string;
  ilce: string;
  adres: string;
}
export interface FaturaKalem {
  ad: string;
  miktar: number;
  birimFiyatKdvDahil: number; // TL, KDV DAHİL
  kdvOrani: number; // ör. 20
}

/** TL'yi 2 ondalıklı UBL metnine çevirir. */
const tl = (n: number): string => (Math.round(n * 100) / 100).toFixed(2);

/** XML özel karakter kaçışı. */
function x(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

/** 11 hane = TCKN, aksi = VKN. */
function kimlikSemasi(no: string): string {
  return no.replace(/\D/g, "").length === 11 ? "TCKN" : "VKN";
}

/** Bir tarafın (satıcı/alıcı) Party XML'i. vergiDairesi yalnız satıcıda. */
function partyXml(
  no: string | null, unvan: string, vergiDairesi: string | null,
  adres: string, ilce: string, il: string,
  kisi?: { ad: string; soyad: string }
): string {
  const kimlik = no || "11111111111"; // e-Arşiv: alıcı kimliği yoksa GİB bunu kabul eder
  const sema = kimlikSemasi(kimlik);
  // UBL-TR şeması: schemeID="TCKN" (bireysel) ise cac:Person (Ad/Soyad) ZORUNLU.
  const personXml = sema === "TCKN" && kisi ? `
      <cac:Person>
        <cbc:FirstName>${x(kisi.ad) || "Müşteri"}</cbc:FirstName>
        <cbc:FamilyName>${x(kisi.soyad) || "-"}</cbc:FamilyName>
      </cac:Person>` : "";
  return `
      <cac:PartyIdentification>
        <cbc:ID schemeID="${sema}">${x(kimlik)}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName><cbc:Name>${x(unvan)}</cbc:Name></cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${x(adres) || "Belirtilmemiş"}</cbc:StreetName>
        <cbc:CitySubdivisionName>${x(ilce) || "Merkez"}</cbc:CitySubdivisionName>
        <cbc:CityName>${x(il) || "Belirtilmemiş"}</cbc:CityName>
        <cac:Country><cbc:Name>Türkiye</cbc:Name></cac:Country>
      </cac:PostalAddress>${vergiDairesi ? `
      <cac:PartyTaxScheme><cac:TaxScheme><cbc:Name>${x(vergiDairesi)}</cbc:Name></cac:TaxScheme></cac:PartyTaxScheme>` : ""}${personXml}`;
}

/** Bir kalemin KDV-dahil fiyatından matrah/KDV/hariç-birim hesaplar. */
function kalemHesap(k: FaturaKalem) {
  const bolen = 1 + k.kdvOrani / 100;
  const satirKdvDahil = k.birimFiyatKdvDahil * k.miktar;
  const matrah = satirKdvDahil / bolen;
  const kdv = satirKdvDahil - matrah;
  const birimHaric = k.birimFiyatKdvDahil / bolen;
  return { matrah, kdv, birimHaric };
}

/** KDV oranına göre belge düzeyi vergi alt toplamları. */
function vergiToplamXml(kalemler: FaturaKalem[]): { toplamKdv: number; xml: string } {
  const gruplar = new Map<number, { matrah: number; kdv: number }>();
  for (const k of kalemler) {
    const h = kalemHesap(k);
    const g = gruplar.get(k.kdvOrani) ?? { matrah: 0, kdv: 0 };
    g.matrah += h.matrah; g.kdv += h.kdv;
    gruplar.set(k.kdvOrani, g);
  }
  let toplamKdv = 0;
  const altlar: string[] = [];
  for (const [oran, g] of [...gruplar.entries()].sort((a, b) => a[0] - b[0])) {
    toplamKdv += g.kdv;
    altlar.push(`
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="TRY">${tl(g.matrah)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="TRY">${tl(g.kdv)}</cbc:TaxAmount>
      <cbc:Percent>${oran}</cbc:Percent>
      <cac:TaxCategory>
        <cac:TaxScheme><cbc:Name>KDV</cbc:Name><cbc:TaxTypeCode>0015</cbc:TaxTypeCode></cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>`);
  }
  return {
    toplamKdv,
    xml: `
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="TRY">${tl(toplamKdv)}</cbc:TaxAmount>${altlar.join("")}
  </cac:TaxTotal>`,
  };
}

/** Tek kalemin InvoiceLine XML'i. */
function satirXml(k: FaturaKalem, sira: number): string {
  const h = kalemHesap(k);
  return `
  <cac:InvoiceLine>
    <cbc:ID>${sira}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="C62">${k.miktar}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="TRY">${tl(h.matrah)}</cbc:LineExtensionAmount>
    <cac:TaxTotal>
      <cbc:TaxAmount currencyID="TRY">${tl(h.kdv)}</cbc:TaxAmount>
      <cac:TaxSubtotal>
        <cbc:TaxableAmount currencyID="TRY">${tl(h.matrah)}</cbc:TaxableAmount>
        <cbc:TaxAmount currencyID="TRY">${tl(h.kdv)}</cbc:TaxAmount>
        <cbc:Percent>${k.kdvOrani}</cbc:Percent>
        <cac:TaxCategory>
          <cac:TaxScheme><cbc:Name>KDV</cbc:Name><cbc:TaxTypeCode>0015</cbc:TaxTypeCode></cac:TaxScheme>
        </cac:TaxCategory>
      </cac:TaxSubtotal>
    </cac:TaxTotal>
    <cac:Item><cbc:Name>${x(k.ad)}</cbc:Name></cac:Item>
    <cac:Price><cbc:PriceAmount currencyID="TRY">${tl(h.birimHaric)}</cbc:PriceAmount></cac:Price>
  </cac:InvoiceLine>`;
}

/** Gönderici imza bloğu (UBL-TR zorunlu; gerçek mali mühür entegratörce eklenir). */
function signatureXml(firma: FaturaFirma): string {
  return `
  <cac:Signature>
    <cbc:ID schemeID="VKN_TCKN">${x(firma.vkn)}</cbc:ID>
    <cac:SignatoryParty>
      <cac:PartyIdentification><cbc:ID schemeID="${kimlikSemasi(firma.vkn)}">${x(firma.vkn)}</cbc:ID></cac:PartyIdentification>
      <cac:PostalAddress>
        <cbc:StreetName>${x(firma.adres) || "Belirtilmemiş"}</cbc:StreetName>
        <cbc:CitySubdivisionName>${x(firma.ilce) || "Merkez"}</cbc:CitySubdivisionName>
        <cbc:CityName>${x(firma.il) || "Belirtilmemiş"}</cbc:CityName>
        <cac:Country><cbc:Name>Türkiye</cbc:Name></cac:Country>
      </cac:PostalAddress>
    </cac:SignatoryParty>
    <cac:DigitalSignatureAttachment><cac:ExternalReference><cbc:URI>#Signature</cbc:URI></cac:ExternalReference></cac:DigitalSignatureAttachment>
  </cac:Signature>`;
}

/** GİB fatura no: 3 harf seri + 4 hane yıl + 9 hane sıra (16 karakter). */
export function gibFaturaNo(siparisId: number, tarih: string, tipi: "e_fatura" | "e_arsiv"): string {
  const seri = tipi === "e_arsiv" ? "EAR" : "EFT";
  const yil = (tarih || "").slice(0, 4) || String(new Date().getFullYear());
  return `${seri}${yil}${String(siparisId).padStart(9, "0")}`;
}

/**
 * Bir siparişten UBL-TR 1.2 belgesi üretir.
 * @param tarih "YYYY-MM-DD"
 */
export function faturaToUblTr(params: {
  firma: FaturaFirma;
  alici: FaturaAlici;
  kalemler: FaturaKalem[];
  faturaNo: string;
  uuid: string;
  tarih: string;
  saat: string;
  tipi: "e_fatura" | "e_arsiv";
}): string {
  const { firma, alici, kalemler, faturaNo, uuid, tarih, saat, tipi } = params;
  const profil = tipi === "e_arsiv" ? "EARSIVFATURA" : "TEMELFATURA";
  const vt = vergiToplamXml(kalemler);
  const araToplam = kalemler.reduce((t, k) => t + kalemHesap(k).matrah, 0);
  const genelToplam = araToplam + vt.toplamKdv;

  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>TR1.2</cbc:CustomizationID>
  <cbc:ProfileID>${profil}</cbc:ProfileID>
  <cbc:ID>${faturaNo}</cbc:ID>
  <cbc:CopyIndicator>false</cbc:CopyIndicator>
  <cbc:UUID>${uuid}</cbc:UUID>
  <cbc:IssueDate>${tarih}</cbc:IssueDate>
  <cbc:IssueTime>${saat}</cbc:IssueTime>
  <cbc:InvoiceTypeCode>SATIS</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>TRY</cbc:DocumentCurrencyCode>
  <cbc:LineCountNumeric>${kalemler.length}</cbc:LineCountNumeric>${tipi === "e_arsiv" ? `
  <cac:AdditionalDocumentReference>
    <cbc:ID>ELEKTRONIK</cbc:ID>
    <cbc:IssueDate>${tarih}</cbc:IssueDate>
    <cbc:DocumentTypeCode>SEND_TYPE</cbc:DocumentTypeCode>
  </cac:AdditionalDocumentReference>` : ""}${signatureXml(firma)}
  <cac:AccountingSupplierParty>
    <cac:Party>${partyXml(firma.vkn, firma.unvan, firma.vergiDairesi, firma.adres, firma.ilce, firma.il)}
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>${partyXml(alici.vknTckn, `${alici.ad} ${alici.soyad}`.trim(), null, alici.adres, alici.ilce, alici.il, { ad: alici.ad, soyad: alici.soyad })}
    </cac:Party>
  </cac:AccountingCustomerParty>${vt.xml}
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="TRY">${tl(araToplam)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="TRY">${tl(araToplam)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="TRY">${tl(genelToplam)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="TRY">${tl(genelToplam)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>${kalemler.map((k, i) => satirXml(k, i + 1)).join("")}
</Invoice>`;
}
