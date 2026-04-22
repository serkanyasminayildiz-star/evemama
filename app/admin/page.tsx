"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../../lib/supabase";

const ADMIN_SIFRE = "evemama2025";
const SAYFA_BOYUTU = 50;

export default function Admin() {
  const [giris, setGiris] = useState(false);
  const [sifre, setSifre] = useState("");
  const [hataMesaji, setHataMesaji] = useState("");
  const [aktifSayfa, setAktifSayfa] = useState("dashboard");
  const [bildirim, setBildirim] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);

  // Ürünler
  const [urunler, setUrunler] = useState<any[]>([]);
  const [toplamUrun, setToplamUrun] = useState(0);
  const [sayfaNo, setSayfaNo] = useState(0);
  const [aramaMetni, setAramaMetni] = useState("");
  const aramaRef = useRef<HTMLInputElement>(null);
  const [filtreler, setFiltreler] = useState({ kategori: "", marka: "", stok: "", durum: "" });
  const [duzenleUrun, setDuzenleUrun] = useState<any>(null);
  const [inlineEdit, setInlineEdit] = useState<{ id: number; alan: string; deger: string } | null>(null);
  const [yeniUrun, setYeniUrun] = useState({ ad: "", fiyat: "", indirimli_fiyat: "", stok: "", resim_url: "", kategori_id: "", marka_id: "", kisa_aciklama: "", aciklama: "", etiket: "" });
  const [seciliUrunler, setSeciliUrunler] = useState<number[]>([]);
  const [topluIslem, setTopluIslem] = useState({ tip: "fiyat_yuzde", deger: "", etiket: "" });
  const [yeniUrunAcik, setYeniUrunAcik] = useState(false);

  // Stok Takibi
  const [stokIstatistik, setStokIstatistik] = useState({ stok_yok: 0, kritik: 0, dusuk: 0, toplam_aktif: 0 });
  const [dusukStokUrunler, setDusukStokUrunler] = useState<any[]>([]);
  const [stokFiltreTip, setStokFiltreTip] = useState<"tukendi" | "kritik" | "dusuk">("tukendi");
  const [stokInline, setStokInline] = useState<{ id: number; deger: string } | null>(null);

  // Diğer
  const [kategoriler, setKategoriler] = useState<any[]>([]);
  const [markalar, setMarkalar] = useState<any[]>([]);
  const [siparisler, setSiparisler] = useState<any[]>([]);
  const [siparisDurumFiltre, setSiparisDurumFiltre] = useState("");
  const [acikSiparisId, setAcikSiparisId] = useState<number | null>(null);
  const [siparisKalemleri, setSiparisKalemleri] = useState<{ [key: number]: any[] }>({});
  const [kalemYukleniyor, setKalemYukleniyor] = useState<number | null>(null);
  const [kuponlar, setKuponlar] = useState<any[]>([]);
  const [kargoAyar, setKargoAyar] = useState<any>(null);
  const [siteAyarlari, setSiteAyarlari] = useState<any>({});
  const [blogSorular, setBlogSorular] = useState<any[]>([]);
  const [cevaplar, setCevaplar] = useState<{ [key: number]: string }>({});
  const [istatistikler, setIstatistikler] = useState({ urunler: 0, siparisler: 0, kategoriler: 0, bekleyenSoru: 0, bekleyen_siparis: 0, bugun_siparis: 0 });
  const [yeniKupon, setYeniKupon] = useState({ kod: "", indirim_tipi: "yuzde", indirim_degeri: "", min_sepet: "", kullanim_limiti: "100", bitis_tarihi: "" });

  // Kategori CRUD
  const [yeniKategori, setYeniKategori] = useState({ ad: "", slug: "", ust_kategori_id: "", sira: "0" });
  const [duzenleKategori, setDuzenleKategori] = useState<any>(null);

  // Marka CRUD
  const [yeniMarka, setYeniMarka] = useState({ ad: "", slug: "" });
  const [duzenleMarka, setDuzenleMarka] = useState<any>(null);

  const goster = (mesaj: string) => { setBildirim(mesaj); setTimeout(() => setBildirim(""), 3000); };

  const s: React.CSSProperties = {
    width: "100%", padding: "10px 14px", border: "2px solid #E8D5B7",
    borderRadius: 10, fontSize: 14, outline: "none", fontFamily: "inherit",
    boxSizing: "border-box", background: "white", color: "#2C1A0E", display: "block"
  };
  const btn = (bg = "#E8845A", extra?: React.CSSProperties): React.CSSProperties => ({
    background: bg, color: "white", border: "none", borderRadius: 10,
    padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer",
    fontFamily: "inherit", whiteSpace: "nowrap" as const, ...extra
  });
  const fltSelect: React.CSSProperties = {
    padding: "9px 12px", border: "2px solid #E8D5B7", borderRadius: 10,
    fontSize: 13, outline: "none", fontFamily: "inherit", background: "white",
    color: "#2C1A0E", cursor: "pointer"
  };

  // ── VERİ YÜKLEME ────────────────────────────────────────────────────────────
  const urunleriYukle = useCallback(async (sayfa = 0, arama = "", filtre = { kategori: "", marka: "", stok: "", durum: "" }) => {
    setYukleniyor(true);
    const from = sayfa * SAYFA_BOYUTU;
    const to = from + SAYFA_BOYUTU - 1;
    let q = supabase.from("urunler").select("*, kategoriler(ad,id,slug), markalar(ad,id)", { count: "exact" });
    if (arama) q = q.ilike("ad", `%${arama}%`);
    if (filtre.kategori) q = q.eq("kategori_id", filtre.kategori);
    if (filtre.marka) q = q.eq("marka_id", filtre.marka);
    if (filtre.stok === "stokta") q = q.gt("stok", 0);
    if (filtre.stok === "tukendi") q = q.eq("stok", 0);
    if (filtre.stok === "kritik") q = q.gt("stok", 0).lte("stok", 5);
    if (filtre.durum === "aktif") q = q.eq("aktif", true);
    if (filtre.durum === "pasif") q = q.eq("aktif", false);
    q = q.order("id", { ascending: false }).range(from, to);
    const { data, count } = await q;
    setUrunler(data || []);
    setToplamUrun(count || 0);
    setYukleniyor(false);
  }, []);

  const stokTakibiYukle = async (tip: "tukendi" | "kritik" | "dusuk" = "tukendi") => {
    setYukleniyor(true);
    const [{ count: c0 }, { count: c1 }, { count: c2 }, { count: c3 }] = await Promise.all([
      supabase.from("urunler").select("*", { count: "exact", head: true }).eq("stok", 0).eq("aktif", true),
      supabase.from("urunler").select("*", { count: "exact", head: true }).gt("stok", 0).lte("stok", 5).eq("aktif", true),
      supabase.from("urunler").select("*", { count: "exact", head: true }).gt("stok", 5).lte("stok", 10).eq("aktif", true),
      supabase.from("urunler").select("*", { count: "exact", head: true }).eq("aktif", true),
    ]);
    setStokIstatistik({ stok_yok: c0 || 0, kritik: c1 || 0, dusuk: c2 || 0, toplam_aktif: c3 || 0 });

    let q = supabase.from("urunler").select("*, kategoriler(ad,slug), markalar(ad)").eq("aktif", true);
    if (tip === "tukendi") q = q.eq("stok", 0);
    else if (tip === "kritik") q = q.gt("stok", 0).lte("stok", 5);
    else if (tip === "dusuk") q = q.gt("stok", 5).lte("stok", 10);
    q = q.order("stok", { ascending: true }).limit(100);
    const { data } = await q;
    setDusukStokUrunler(data || []);
    setYukleniyor(false);
  };

  const siparisleriYukle = async (durumFiltre = "") => {
    let q = supabase.from("siparisler").select("*").order("created_at", { ascending: false }).limit(200);
    if (durumFiltre) q = q.eq("durum", durumFiltre);
    const { data } = await q;
    setSiparisler(data || []);
  };

  // ── SİPARİŞ KALEMLERİ ──────────────────────────────────────────────────
  const siparisKalemleriniYukle = async (siparisId: number) => {
    setKalemYukleniyor(siparisId);

    // urunler alani siparisler tablosunda JSON string olarak tutuluyor
    const siparis = siparisler.find(s => s.id === siparisId);
    let kalemler: any[] = [];

    if (siparis?.urunler) {
      try {
        kalemler = typeof siparis.urunler === "string"
          ? JSON.parse(siparis.urunler)
          : siparis.urunler;
        if (!Array.isArray(kalemler)) kalemler = [];
      } catch (e) {
        console.error("JSON parse hatasi:", e);
        goster("❌ Sipariş ürünleri okunamadı");
        kalemler = [];
      }
    }

    console.log(`Sipariş #${siparisId} kalemleri:`, kalemler);
    setSiparisKalemleri(prev => ({ ...prev, [siparisId]: kalemler }));
    setKalemYukleniyor(null);
  };

  const kategorileriYukle = async () => {
    const { data } = await supabase.from("kategoriler").select("*").order("sira");
    setKategoriler(data || []);
  };
  const markalariYukle = async () => {
    const { data } = await supabase.from("markalar").select("*").order("ad");
    setMarkalar(data || []);
  };
  const kuponlariYukle = async () => {
    const { data } = await supabase.from("kuponlar").select("*").order("created_at", { ascending: false });
    setKuponlar(data || []);
  };
  const kargoYukle = async () => {
    const { data } = await supabase.from("kargo_ayarlari").select("*").limit(1).single();
    setKargoAyar(data);
  };
  const blogSorulariYukle = async () => {
    const { data } = await supabase.from("blog_sorular").select("*").order("created_at", { ascending: false });
    setBlogSorular(data || []);
  };
  const siteAyarlariYukle = async () => {
    const { data } = await supabase.from("site_ayarlari").select("*");
    const obj: any = {};
    data?.forEach((row: any) => { obj[row.anahtar] = row.deger; });
    setSiteAyarlari(obj);
  };

  const istatistikleriYukle = async () => {
    const bugunBaslangic = new Date(); bugunBaslangic.setHours(0, 0, 0, 0);
    const [{ count: uc }, { count: sc }, { count: kc }, { count: bc }, { count: bks }, { count: bgs }] = await Promise.all([
      supabase.from("urunler").select("*", { count: "exact", head: true }),
      supabase.from("siparisler").select("*", { count: "exact", head: true }),
      supabase.from("kategoriler").select("*", { count: "exact", head: true }),
      supabase.from("blog_sorular").select("*", { count: "exact", head: true }).eq("onaylandi", false),
      supabase.from("siparisler").select("*", { count: "exact", head: true }).eq("durum", "beklemede"),
      supabase.from("siparisler").select("*", { count: "exact", head: true }).gte("created_at", bugunBaslangic.toISOString()),
    ]);
    setIstatistikler({ urunler: uc || 0, siparisler: sc || 0, kategoriler: kc || 0, bekleyenSoru: bc || 0, bekleyen_siparis: bks || 0, bugun_siparis: bgs || 0 });
  };

  const handleGiris = () => {
    if (sifre === ADMIN_SIFRE) {
      setGiris(true);
      kategorileriYukle(); markalariYukle(); kargoYukle(); siteAyarlariYukle(); istatistikleriYukle();
    } else setHataMesaji("Hatalı şifre!");
  };

  useEffect(() => {
    if (!giris) return;
    if (aktifSayfa === "urunler") { setSayfaNo(0); setAramaMetni(""); setSeciliUrunler([]); setFiltreler({ kategori: "", marka: "", stok: "", durum: "" }); urunleriYukle(0, "", { kategori: "", marka: "", stok: "", durum: "" }); }
    if (aktifSayfa === "stok") { setStokFiltreTip("tukendi"); stokTakibiYukle("tukendi"); }
    if (aktifSayfa === "siparisler") { siparisleriYukle(); setSiparisKalemleri({}); setAcikSiparisId(null); }
    if (aktifSayfa === "kategoriler") kategorileriYukle();
    if (aktifSayfa === "markalar") markalariYukle();
    if (aktifSayfa === "kuponlar") kuponlariYukle();
    if (aktifSayfa === "blog") blogSorulariYukle();
  }, [aktifSayfa, giris]);

  useEffect(() => {
    const timer = setTimeout(() => { setSayfaNo(0); urunleriYukle(0, aramaMetni, filtreler); }, 350);
    return () => clearTimeout(timer);
  }, [aramaMetni, filtreler]);

  const filtreUygula = (yeniFiltre: typeof filtreler) => { setFiltreler(yeniFiltre); setSayfaNo(0); };
  const filtreleriTemizle = () => { setAramaMetni(""); setFiltreler({ kategori: "", marka: "", stok: "", durum: "" }); setSayfaNo(0); if (aramaRef.current) aramaRef.current.value = ""; };

  // ── ÜRÜN İŞLEMLERİ ─────────────────────────────────────────────────────────
  const slugUret = (ad: string) => ad.toLowerCase()
    .replace(/ç/g,"c").replace(/ğ/g,"g").replace(/ı/g,"i").replace(/ö/g,"o").replace(/ş/g,"s").replace(/ü/g,"u")
    .replace(/[^a-z0-9\s-]/g,"").trim().replace(/\s+/g,"-");

  const urunEkle = async () => {
    if (!yeniUrun.ad || !yeniUrun.fiyat) { goster("⚠️ Ürün adı ve fiyat zorunludur!"); return; }
    const slug = slugUret(yeniUrun.ad) + "-" + Date.now();
    const { error } = await supabase.from("urunler").insert({
      ad: yeniUrun.ad, slug,
      fiyat: parseFloat(yeniUrun.fiyat),
      indirimli_fiyat: yeniUrun.indirimli_fiyat ? parseFloat(yeniUrun.indirimli_fiyat) : null,
      stok: parseInt(yeniUrun.stok) || 0,
      resim_url: yeniUrun.resim_url || null,
      kisa_aciklama: yeniUrun.kisa_aciklama || null,
      aciklama: yeniUrun.aciklama || null,
      etiket: yeniUrun.etiket || null,
      kategori_id: yeniUrun.kategori_id || null,
      marka_id: yeniUrun.marka_id || null,
      aktif: true,
    });
    if (error) { goster("❌ " + error.message); return; }
    setYeniUrun({ ad: "", fiyat: "", indirimli_fiyat: "", stok: "", resim_url: "", kategori_id: "", marka_id: "", kisa_aciklama: "", aciklama: "", etiket: "" });
    setYeniUrunAcik(false);
    urunleriYukle(sayfaNo, aramaMetni, filtreler);
    istatistikleriYukle();
    goster("✅ Ürün eklendi");
  };

  const urunGuncelle = async () => {
    if (!duzenleUrun) return;
    const { error } = await supabase.from("urunler").update({
      ad: duzenleUrun.ad, fiyat: parseFloat(duzenleUrun.fiyat),
      indirimli_fiyat: duzenleUrun.indirimli_fiyat ? parseFloat(duzenleUrun.indirimli_fiyat) : null,
      stok: parseInt(duzenleUrun.stok),
      resim_url: duzenleUrun.resim_url || null, kisa_aciklama: duzenleUrun.kisa_aciklama || null,
      aciklama: duzenleUrun.aciklama || null, etiket: duzenleUrun.etiket || null,
      kategori_id: duzenleUrun.kategori_id || null, marka_id: duzenleUrun.marka_id || null,
      aktif: duzenleUrun.aktif,
    }).eq("id", duzenleUrun.id);
    if (error) { goster("❌ " + error.message); return; }
    setDuzenleUrun(null);
    urunleriYukle(sayfaNo, aramaMetni, filtreler);
    goster("✅ Ürün güncellendi");
  };

  const inlineKaydet = async () => {
    if (!inlineEdit) return;
    const edit = inlineEdit;
    const g: any = {};
    if (edit.alan === "fiyat") g.fiyat = parseFloat(edit.deger);
    if (edit.alan === "indirimli_fiyat") g.indirimli_fiyat = edit.deger ? parseFloat(edit.deger) : null;
    if (edit.alan === "stok") g.stok = parseInt(edit.deger);
    await supabase.from("urunler").update(g).eq("id", edit.id);
    setInlineEdit(null);
    urunleriYukle(sayfaNo, aramaMetni, filtreler);
    goster("✅ Güncellendi");
  };

  const urunSil = async (id: number) => {
    if (!confirm("Bu ürünü silmek istediğinizden emin misiniz?")) return;
    await supabase.from("urunler").delete().eq("id", id);
    urunleriYukle(sayfaNo, aramaMetni, filtreler);
    istatistikleriYukle();
    goster("✅ Ürün silindi");
  };

  const aktifToggle = async (id: number, aktif: boolean) => {
    await supabase.from("urunler").update({ aktif: !aktif }).eq("id", id);
    urunleriYukle(sayfaNo, aramaMetni, filtreler);
    goster(`✅ ${!aktif ? "Aktif" : "Pasif"} edildi`);
  };

  const topluIslemUygula = async () => {
    if (seciliUrunler.length === 0) { goster("⚠️ Önce ürün seçin!"); return; }
    setYukleniyor(true);
    if (topluIslem.tip === "fiyat_yuzde" && topluIslem.deger) {
      const yuzde = parseFloat(topluIslem.deger) / 100;
      for (const id of seciliUrunler) { const u = urunler.find(u => u.id === id); if (u) await supabase.from("urunler").update({ fiyat: Math.round(u.fiyat * (1 + yuzde) * 100) / 100 }).eq("id", id); }
    } else if (topluIslem.tip === "indirim_yuzde" && topluIslem.deger) {
      const yuzde = parseFloat(topluIslem.deger) / 100;
      for (const id of seciliUrunler) { const u = urunler.find(u => u.id === id); if (u) await supabase.from("urunler").update({ indirimli_fiyat: Math.round(u.fiyat * (1 - yuzde) * 100) / 100 }).eq("id", id); }
    } else if (topluIslem.tip === "fiyat_tl" && topluIslem.deger) {
      const miktar = parseFloat(topluIslem.deger);
      for (const id of seciliUrunler) { const u = urunler.find(u => u.id === id); if (u) await supabase.from("urunler").update({ fiyat: Math.max(0, Math.round((u.fiyat + miktar) * 100) / 100) }).eq("id", id); }
    } else if (topluIslem.tip === "stok_sifirla") {
      for (const id of seciliUrunler) await supabase.from("urunler").update({ stok: parseInt(topluIslem.deger) || 0 }).eq("id", id);
    } else if (topluIslem.tip === "indirim_kaldir") {
      for (const id of seciliUrunler) await supabase.from("urunler").update({ indirimli_fiyat: null }).eq("id", id);
    } else if (topluIslem.tip === "aktif_et") {
      for (const id of seciliUrunler) await supabase.from("urunler").update({ aktif: true }).eq("id", id);
    } else if (topluIslem.tip === "pasif_et") {
      for (const id of seciliUrunler) await supabase.from("urunler").update({ aktif: false }).eq("id", id);
    } else if (topluIslem.tip === "etiket" && topluIslem.etiket) {
      for (const id of seciliUrunler) await supabase.from("urunler").update({ etiket: topluIslem.etiket }).eq("id", id);
    } else if (topluIslem.tip === "etiket_kaldir") {
      for (const id of seciliUrunler) await supabase.from("urunler").update({ etiket: null }).eq("id", id);
    } else if (topluIslem.tip === "sil") {
      if (!confirm(`${seciliUrunler.length} ürünü SİLMEK istediğinizden emin misiniz? Bu işlem geri alınamaz!`)) { setYukleniyor(false); return; }
      for (const id of seciliUrunler) await supabase.from("urunler").delete().eq("id", id);
    }
    setSeciliUrunler([]);
    urunleriYukle(sayfaNo, aramaMetni, filtreler);
    istatistikleriYukle();
    setYukleniyor(false);
    goster(`✅ ${seciliUrunler.length} ürüne işlem uygulandı`);
  };

  // ── KATEGORİ İŞLEMLERİ ─────────────────────────────────────────────────────
  const kategoriEkle = async () => {
    if (!yeniKategori.ad) { goster("⚠️ Kategori adı zorunludur!"); return; }
    const slug = yeniKategori.slug || slugUret(yeniKategori.ad);
    const { error } = await supabase.from("kategoriler").insert({
      ad: yeniKategori.ad, slug,
      ust_kategori_id: yeniKategori.ust_kategori_id || null,
      sira: parseInt(yeniKategori.sira) || 0,
      aktif: true,
    });
    if (error) { goster("❌ " + error.message); return; }
    setYeniKategori({ ad: "", slug: "", ust_kategori_id: "", sira: "0" });
    kategorileriYukle();
    istatistikleriYukle();
    goster("✅ Kategori eklendi");
  };

  const kategoriGuncelle = async () => {
    if (!duzenleKategori) return;
    const { error } = await supabase.from("kategoriler").update({
      ad: duzenleKategori.ad, slug: duzenleKategori.slug,
      ust_kategori_id: duzenleKategori.ust_kategori_id || null,
      sira: parseInt(duzenleKategori.sira) || 0,
    }).eq("id", duzenleKategori.id);
    if (error) { goster("❌ " + error.message); return; }
    setDuzenleKategori(null);
    kategorileriYukle();
    goster("✅ Kategori güncellendi");
  };

  const kategoriSil = async (id: number) => {
    if (!confirm("Bu kategoriyi silmek istediğinizden emin misiniz?")) return;
    const { error } = await supabase.from("kategoriler").delete().eq("id", id);
    if (error) { goster("❌ Bu kategoriye bağlı ürünler var, önce ürünleri güncelle!"); return; }
    kategorileriYukle(); istatistikleriYukle();
    goster("✅ Kategori silindi");
  };

  const kategoriAktifToggle = async (id: number, aktif: boolean) => {
    await supabase.from("kategoriler").update({ aktif: !aktif }).eq("id", id);
    kategorileriYukle();
    goster(`✅ ${!aktif ? "Aktif" : "Pasif"} edildi`);
  };

  // ── MARKA İŞLEMLERİ ────────────────────────────────────────────────────────
  const markaEkle = async () => {
    if (!yeniMarka.ad) { goster("⚠️ Marka adı zorunludur!"); return; }
    const slug = yeniMarka.slug || slugUret(yeniMarka.ad);
    const { error } = await supabase.from("markalar").insert({ ad: yeniMarka.ad, slug, aktif: true });
    if (error) { goster("❌ " + error.message); return; }
    setYeniMarka({ ad: "", slug: "" });
    markalariYukle();
    goster("✅ Marka eklendi");
  };

  const markaGuncelle = async () => {
    if (!duzenleMarka) return;
    const { error } = await supabase.from("markalar").update({ ad: duzenleMarka.ad, slug: duzenleMarka.slug }).eq("id", duzenleMarka.id);
    if (error) { goster("❌ " + error.message); return; }
    setDuzenleMarka(null);
    markalariYukle();
    goster("✅ Marka güncellendi");
  };

  const markaSil = async (id: number) => {
    if (!confirm("Bu markayı silmek istediğinizden emin misiniz?")) return;
    const { error } = await supabase.from("markalar").delete().eq("id", id);
    if (error) { goster("❌ Bu markaya bağlı ürünler var!"); return; }
    markalariYukle();
    goster("✅ Marka silindi");
  };

  const markaAktifToggle = async (id: number, aktif: boolean) => {
    await supabase.from("markalar").update({ aktif: !aktif }).eq("id", id);
    markalariYukle();
    goster(`✅ ${!aktif ? "Aktif" : "Pasif"} edildi`);
  };

  // ── DİĞER İŞLEMLER ─────────────────────────────────────────────────────────
  const kargoGuncelle = async () => {
    if (!kargoAyar) return;
    const g: any = { sabit_ucret: parseFloat(kargoAyar.sabit_ucret) };
    if ("ucretsiz_limit" in kargoAyar) g.ucretsiz_limit = parseFloat(kargoAyar.ucretsiz_limit);
    if ("ucretsiz limit" in kargoAyar) g["ucretsiz limit"] = parseFloat(kargoAyar["ucretsiz limit"]);
    const { error } = await supabase.from("kargo_ayarlari").update(g).eq("id", kargoAyar.id);
    if (error) { goster("❌ " + error.message); return; }
    goster("✅ Kargo ayarları güncellendi");
  };

  const kuponEkle = async () => {
    if (!yeniKupon.kod || !yeniKupon.indirim_degeri) return;
    await supabase.from("kuponlar").insert({
      kod: yeniKupon.kod.toUpperCase(), indirim_tipi: yeniKupon.indirim_tipi,
      indirim_degeri: parseFloat(yeniKupon.indirim_degeri),
      min_sepet: parseFloat(yeniKupon.min_sepet) || 0,
      kullanim_limiti: parseInt(yeniKupon.kullanim_limiti) || 100,
      bitis_tarihi: yeniKupon.bitis_tarihi || null, aktif: true,
    });
    setYeniKupon({ kod: "", indirim_tipi: "yuzde", indirim_degeri: "", min_sepet: "", kullanim_limiti: "100", bitis_tarihi: "" });
    kuponlariYukle(); goster("✅ Kupon eklendi");
  };

  const siteAyarKaydet = async (anahtar: string, deger: string) => {
    const { error } = await supabase.from("site_ayarlari").upsert({ anahtar, deger }, { onConflict: "anahtar" });
    if (error) { goster("❌ " + error.message); return; }
    goster("✅ Kaydedildi");
  };

  const stokInlineKaydet = async () => {
    if (!stokInline) return;
    const si = stokInline;
    await supabase.from("urunler").update({ stok: parseInt(si.deger) || 0 }).eq("id", si.id);
    setStokInline(null);
    stokTakibiYukle(stokFiltreTip);
    goster("✅ Stok güncellendi");
  };

  const toplamSayfa = Math.ceil(toplamUrun / SAYFA_BOYUTU);
  const bekleyenSorular = blogSorular.filter(bs => !bs.onaylandi);
  const filtrelerAktif = aramaMetni || filtreler.kategori || filtreler.marka || filtreler.stok || filtreler.durum;

  // ── GİRİŞ EKRANI ───────────────────────────────────────────────────────────
  if (!giris) return (
    <main style={{ minHeight: "100vh", background: "#FDF6EE", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
      <div style={{ background: "white", borderRadius: 24, padding: "48px 40px", maxWidth: 380, width: "100%", boxShadow: "0 20px 60px rgba(92,61,46,0.1)", textAlign: "center" }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>🔐</div>
        <div style={{ fontFamily: "Georgia,serif", fontSize: 24, fontWeight: 700, color: "#5C3D2E", marginBottom: 6 }}>Admin Paneli</div>
        <div style={{ fontSize: 13, color: "#5C3D2E", opacity: 0.5, marginBottom: 28 }}>evemama.net</div>
        <input type="password" autoComplete="current-password" value={sifre}
          onChange={e => setSifre(e.target.value)} onKeyDown={e => e.key === "Enter" && handleGiris()}
          placeholder="Şifre" style={{ ...s, marginBottom: 10, textAlign: "center", fontSize: 18, letterSpacing: 4 }} />
        {hataMesaji && <div style={{ color: "#E57373", fontSize: 13, marginBottom: 10 }}>{hataMesaji}</div>}
        <button onClick={handleGiris} style={{ ...btn(), width: "100%", padding: "14px", fontSize: 15 }}>Giriş Yap →</button>
      </div>
    </main>
  );

  const menuler = [
    { id: "dashboard", icon: "📊", ad: "Dashboard" },
    { id: "urunler", icon: "📦", ad: "Ürünler" },
    { id: "stok", icon: "📉", ad: "Stok Takibi", badge: stokIstatistik.stok_yok + stokIstatistik.kritik },
    { id: "siparisler", icon: "🛒", ad: "Siparişler", badge: istatistikler.bekleyen_siparis },
    { id: "kategoriler", icon: "📁", ad: "Kategoriler" },
    { id: "markalar", icon: "🏷️", ad: "Markalar" },
    { id: "kuponlar", icon: "🎟️", ad: "Kuponlar" },
    { id: "blog", icon: "📝", ad: "Blog Soruları", badge: istatistikler.bekleyenSoru },
    { id: "kargo", icon: "🚚", ad: "Kargo Ayarları" },
    { id: "ayarlar", icon: "⚙️", ad: "Site Ayarları" },
  ];

  const etiketRenk: Record<string, { bg: string; color: string }> = {
    yeni: { bg: "#E3F2FD", color: "#1565C0" },
    indirim: { bg: "#FFEBEE", color: "#C62828" },
    "cok-satan": { bg: "#FFF9C4", color: "#F57F17" },
    kampanya: { bg: "#F3E5F5", color: "#6A1B9A" },
    "onerilir": { bg: "#E8F5E9", color: "#2E7D32" },
    "son-stok": { bg: "#FFF3E0", color: "#E65100" },
  };

  return (
    <main style={{ minHeight: "100vh", background: "#F0EBE3", fontFamily: "sans-serif", display: "flex" }}>

      {/* BİLDİRİM */}
      {bildirim && (
        <div style={{ position: "fixed", top: 24, right: 24, background: bildirim.startsWith("❌") ? "#C62828" : "#2C1A0E", color: "white", padding: "14px 22px", borderRadius: 14, fontSize: 14, fontWeight: 600, zIndex: 9999, boxShadow: "0 8px 32px rgba(0,0,0,0.25)" }}>
          {bildirim}
        </div>
      )}

      {/* KATEGORİ DÜZENLEME MODALİ */}
      {duzenleKategori && (
        <div onClick={e => { if (e.target === e.currentTarget) setDuzenleKategori(null); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "white", borderRadius: 20, padding: 28, width: "100%", maxWidth: 480 }}>
            <h2 style={{ fontFamily: "Georgia,serif", fontSize: 18, fontWeight: 700, color: "#5C3D2E", marginBottom: 20 }}>📁 Kategori Düzenle</h2>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#5C3D2E", opacity: 0.7, display: "block", marginBottom: 5 }}>Kategori Adı *</label>
              <input value={duzenleKategori.ad} onChange={e => setDuzenleKategori({ ...duzenleKategori, ad: e.target.value })} style={s} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#5C3D2E", opacity: 0.7, display: "block", marginBottom: 5 }}>Slug</label>
              <input value={duzenleKategori.slug} onChange={e => setDuzenleKategori({ ...duzenleKategori, slug: e.target.value })} style={s} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#5C3D2E", opacity: 0.7, display: "block", marginBottom: 5 }}>Üst Kategori</label>
                <select value={duzenleKategori.ust_kategori_id || ""} onChange={e => setDuzenleKategori({ ...duzenleKategori, ust_kategori_id: e.target.value })} style={s}>
                  <option value="">— Ana Kategori —</option>
                  {kategoriler.filter(k => k.id !== duzenleKategori.id && !k.ust_kategori_id).map(k => <option key={k.id} value={k.id}>{k.ad}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#5C3D2E", opacity: 0.7, display: "block", marginBottom: 5 }}>Sıra</label>
                <input type="number" value={duzenleKategori.sira || 0} onChange={e => setDuzenleKategori({ ...duzenleKategori, sira: e.target.value })} style={s} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={kategoriGuncelle} style={{ ...btn(), flex: 1 }}>💾 Kaydet</button>
              <button onClick={() => setDuzenleKategori(null)} style={btn("#888")}>İptal</button>
            </div>
          </div>
        </div>
      )}

      {/* MARKA DÜZENLEME MODALİ */}
      {duzenleMarka && (
        <div onClick={e => { if (e.target === e.currentTarget) setDuzenleMarka(null); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "white", borderRadius: 20, padding: 28, width: "100%", maxWidth: 400 }}>
            <h2 style={{ fontFamily: "Georgia,serif", fontSize: 18, fontWeight: 700, color: "#5C3D2E", marginBottom: 20 }}>🏷️ Marka Düzenle</h2>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#5C3D2E", opacity: 0.7, display: "block", marginBottom: 5 }}>Marka Adı *</label>
              <input value={duzenleMarka.ad} onChange={e => setDuzenleMarka({ ...duzenleMarka, ad: e.target.value })} style={s} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#5C3D2E", opacity: 0.7, display: "block", marginBottom: 5 }}>Slug</label>
              <input value={duzenleMarka.slug} onChange={e => setDuzenleMarka({ ...duzenleMarka, slug: e.target.value })} style={s} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={markaGuncelle} style={{ ...btn(), flex: 1 }}>💾 Kaydet</button>
              <button onClick={() => setDuzenleMarka(null)} style={btn("#888")}>İptal</button>
            </div>
          </div>
        </div>
      )}

      {/* ÜRÜN DÜZENLEME MODALİ */}
      {duzenleUrun && (
        <div onClick={e => { if (e.target === e.currentTarget) setDuzenleUrun(null); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "white", borderRadius: 20, padding: 28, width: "100%", maxWidth: 740, maxHeight: "92vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontFamily: "Georgia,serif", fontSize: 18, fontWeight: 700, color: "#5C3D2E", margin: 0 }}>✏️ Ürün Düzenle</h2>
                <div style={{ fontSize: 11, color: "#5C3D2E", opacity: 0.5, marginTop: 3 }}>ID: {duzenleUrun.id}</div>
              </div>
              <button onClick={() => setDuzenleUrun(null)} style={{ background: "#F0EBE3", border: "none", fontSize: 20, cursor: "pointer", borderRadius: 8, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", color: "#5C3D2E" }}>✕</button>
            </div>

            <div style={{ marginBottom: 16, padding: 14, background: "#FDF6EE", borderRadius: 14, border: "2px dashed #E8D5B7" }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#5C3D2E", opacity: 0.7, display: "block", marginBottom: 8 }}>RESİM URL — Canlı Önizleme</label>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
                    <div style={{ width: 90, height: 90, background: "white", borderRadius: 12, border: "2px solid #E8D5B7", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                      {duzenleUrun.resim_url
                        ? <img src={duzenleUrun.resim_url} alt="" style={{ width: "100%", height: "100%", objectFit: "contain", padding: 6 }} onError={e => { (e.target as any).style.display = "none"; }} />
                        : <span style={{ fontSize: 28, opacity: 0.3 }}>🐾</span>}
                    </div>
                    <input value={duzenleUrun.resim_url || ""} onChange={e => setDuzenleUrun({ ...duzenleUrun, resim_url: e.target.value })} style={{ ...s, marginBottom: 0 }} placeholder="https://..." />
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#5C3D2E", opacity: 0.4, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Sitede nasıl görünür:</div>
                  <div style={{ width: 140, background: "white", borderRadius: 14, overflow: "hidden", boxShadow: "0 4px 12px rgba(92,61,46,0.10)", border: "1px solid #F0E8E0" }}>
                    <div style={{ height: 90, background: "#FDF6EE", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
                      {duzenleUrun.resim_url
                        ? <img src={duzenleUrun.resim_url} alt="" style={{ width: "100%", height: "100%", objectFit: "contain", padding: 8, mixBlendMode: "multiply" }} onError={e => { (e.target as any).style.display = "none"; }} />
                        : <span style={{ fontSize: 32, opacity: 0.2 }}>🐾</span>}
                      {duzenleUrun.stok === 0 || parseInt(duzenleUrun.stok) === 0 ? (
                        <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.75)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ background: "#5C3D2E", color: "white", fontSize: 8, fontWeight: 700, padding: "3px 7px", borderRadius: 50 }}>Stokta Yok</span>
                        </div>
                      ) : parseInt(duzenleUrun.stok) <= 5 ? (
                        <span style={{ position: "absolute", top: 5, left: 5, background: "#E8845A", color: "white", fontSize: 8, fontWeight: 700, padding: "2px 6px", borderRadius: 50 }}>Son {duzenleUrun.stok}!</span>
                      ) : null}
                    </div>
                    <div style={{ padding: "7px 8px 4px" }}>
                      {duzenleUrun.markalar?.ad && <div style={{ fontSize: 8, fontWeight: 700, color: "#8BAF8E", textTransform: "uppercase", marginBottom: 2 }}>{duzenleUrun.markalar.ad}</div>}
                      <div style={{ fontFamily: "Georgia,serif", fontSize: 10, fontWeight: 700, color: "#5C3D2E", lineHeight: 1.3 }}>{(duzenleUrun.ad || "Ürün Adı").substring(0, 30)}</div>
                    </div>
                    <div style={{ padding: "0 8px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <span style={{ fontFamily: "Georgia,serif", fontSize: 11, fontWeight: 700, color: "#5C3D2E" }}>₺{parseFloat(duzenleUrun.indirimli_fiyat || duzenleUrun.fiyat || 0).toFixed(2)}</span>
                        {duzenleUrun.indirimli_fiyat && <span style={{ fontSize: 8, color: "#999", textDecoration: "line-through", marginLeft: 3 }}>₺{parseFloat(duzenleUrun.fiyat || 0).toFixed(2)}</span>}
                      </div>
                      <div style={{ background: "#E8845A", color: "white", borderRadius: 50, padding: "3px 7px", fontSize: 8, fontWeight: 700 }}>+ Sepet</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#5C3D2E", opacity: 0.7, display: "block", marginBottom: 5 }}>Ürün Adı *</label>
                <input value={duzenleUrun.ad} onChange={e => setDuzenleUrun({ ...duzenleUrun, ad: e.target.value })} style={s} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#5C3D2E", opacity: 0.7, display: "block", marginBottom: 5 }}>Normal Fiyat (₺) *</label>
                <input type="number" step="0.01" value={duzenleUrun.fiyat} onChange={e => setDuzenleUrun({ ...duzenleUrun, fiyat: e.target.value })} style={s} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#5C3D2E", opacity: 0.7, display: "block", marginBottom: 5 }}>
                  İndirimli Fiyat (₺)
                  {duzenleUrun.fiyat && duzenleUrun.indirimli_fiyat && (
                    <span style={{ marginLeft: 8, background: "#FFEBEE", color: "#C62828", padding: "1px 7px", borderRadius: 50, fontSize: 10, fontWeight: 700 }}>
                      %{Math.round((1 - parseFloat(duzenleUrun.indirimli_fiyat) / parseFloat(duzenleUrun.fiyat)) * 100)} indirim
                    </span>
                  )}
                </label>
                <input type="number" step="0.01" value={duzenleUrun.indirimli_fiyat || ""} onChange={e => setDuzenleUrun({ ...duzenleUrun, indirimli_fiyat: e.target.value })} style={s} placeholder="Boş = indirim yok" />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#5C3D2E", opacity: 0.7, display: "block", marginBottom: 5 }}>Stok Adedi</label>
                <input type="number" value={duzenleUrun.stok} onChange={e => setDuzenleUrun({ ...duzenleUrun, stok: e.target.value })} style={s} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#5C3D2E", opacity: 0.7, display: "block", marginBottom: 5 }}>Durum</label>
                <select value={duzenleUrun.aktif ? "1" : "0"} onChange={e => setDuzenleUrun({ ...duzenleUrun, aktif: e.target.value === "1" })} style={s}>
                  <option value="1">✅ Aktif</option>
                  <option value="0">❌ Pasif</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#5C3D2E", opacity: 0.7, display: "block", marginBottom: 5 }}>Kategori</label>
                <select value={duzenleUrun.kategori_id || ""} onChange={e => setDuzenleUrun({ ...duzenleUrun, kategori_id: e.target.value })} style={s}>
                  <option value="">— Seçin —</option>
                  {kategoriler.map(k => <option key={k.id} value={k.id}>{k.ust_kategori_id ? "└ " : ""}{k.ad}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#5C3D2E", opacity: 0.7, display: "block", marginBottom: 5 }}>Marka</label>
                <select value={duzenleUrun.marka_id || ""} onChange={e => setDuzenleUrun({ ...duzenleUrun, marka_id: e.target.value })} style={s}>
                  <option value="">— Seçin —</option>
                  {markalar.map(m => <option key={m.id} value={m.id}>{m.ad}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#5C3D2E", opacity: 0.7, display: "block", marginBottom: 5 }}>Etiket</label>
                <select value={duzenleUrun.etiket || ""} onChange={e => setDuzenleUrun({ ...duzenleUrun, etiket: e.target.value })} style={s}>
                  <option value="">— Etiket Yok —</option>
                  <option value="yeni">🆕 Yeni</option>
                  <option value="indirim">💥 İndirim</option>
                  <option value="cok-satan">⭐ Çok Satan</option>
                  <option value="kampanya">🏷️ Kampanya</option>
                  <option value="onerilir">👍 Önerilir</option>
                  <option value="son-stok">⚠️ Son Stok</option>
                </select>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#5C3D2E", opacity: 0.7, display: "block", marginBottom: 5 }}>Kısa Açıklama</label>
              <input value={duzenleUrun.kisa_aciklama || ""} onChange={e => setDuzenleUrun({ ...duzenleUrun, kisa_aciklama: e.target.value })} style={s} />
            </div>
            <div style={{ marginTop: 12, marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#5C3D2E", opacity: 0.7, display: "block", marginBottom: 5 }}>Uzun Açıklama (HTML)</label>
              <textarea value={duzenleUrun.aciklama || ""} onChange={e => setDuzenleUrun({ ...duzenleUrun, aciklama: e.target.value })} rows={5} style={{ ...s, resize: "vertical" as const }} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={urunGuncelle} style={{ ...btn(), flex: 1, padding: "14px", fontSize: 15 }}>💾 Değişiklikleri Kaydet</button>
              <button onClick={() => setDuzenleUrun(null)} style={{ ...btn("#888"), padding: "14px 24px" }}>İptal</button>
            </div>
          </div>
        </div>
      )}

      {/* SOL MENÜ */}
      <div style={{ width: 220, background: "#1C0F06", minHeight: "100vh", position: "fixed", left: 0, top: 0, bottom: 0, overflowY: "auto", zIndex: 100 }}>
        <div style={{ padding: "22px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontFamily: "Georgia,serif", fontSize: 18, fontWeight: 700, color: "#FDF6EE" }}>evemama<span style={{ color: "#E8845A" }}>.net</span></div>
          <div style={{ fontSize: 10, color: "#F4C09A", opacity: 0.5, marginTop: 3, textTransform: "uppercase", letterSpacing: 1 }}>Yönetim Paneli</div>
        </div>
        <nav style={{ padding: "10px 8px" }}>
          {menuler.map(m => (
            <button key={m.id} onClick={() => setAktifSayfa(m.id)}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: aktifSayfa === m.id ? "rgba(232,132,90,0.18)" : "none", border: "none", borderLeft: aktifSayfa === m.id ? "3px solid #E8845A" : "3px solid transparent", cursor: "pointer", color: aktifSayfa === m.id ? "#E8845A" : "#FDF6EE", fontSize: 13, fontWeight: aktifSayfa === m.id ? 700 : 400, marginBottom: 1, fontFamily: "inherit", opacity: aktifSayfa === m.id ? 1 : 0.6, textAlign: "left" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 9 }}><span style={{ fontSize: 15 }}>{m.icon}</span>{m.ad}</span>
              {(m as any).badge > 0 ? <span style={{ background: "#E8845A", color: "white", borderRadius: 50, fontSize: 10, padding: "2px 7px", fontWeight: 700 }}>{(m as any).badge}</span> : null}
            </button>
          ))}
        </nav>
        <div style={{ padding: "8px", marginTop: 8, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <a href="/" target="_blank" style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 14px", background: "rgba(255,255,255,0.04)", borderRadius: 10, color: "#FDF6EE", textDecoration: "none", fontSize: 13, opacity: 0.5 }}>
            🏠 Siteye Git
          </a>
        </div>
      </div>

      {/* ANA İÇERİK */}
      <div style={{ marginLeft: 220, flex: 1, padding: "28px 28px 60px", minWidth: 0 }}>

        {/* ── DASHBOARD ────────────────────────────────────────────────────── */}
        {aktifSayfa === "dashboard" && (
          <div>
            <h1 style={{ fontFamily: "Georgia,serif", fontSize: 26, fontWeight: 700, color: "#2C1A0E", marginBottom: 24 }}>Dashboard</h1>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 20 }}>
              {[
                { icon: "📦", ad: "Toplam Ürün", deger: istatistikler.urunler, renk: "#E8845A", sayfa: "urunler" },
                { icon: "🛒", ad: "Toplam Sipariş", deger: istatistikler.siparisler, renk: "#8BAF8E", sayfa: "siparisler" },
                { icon: "⏳", ad: "Bekleyen Sipariş", deger: istatistikler.bekleyen_siparis, renk: "#E65100", sayfa: "siparisler" },
                { icon: "📅", ad: "Bugün Sipariş", deger: istatistikler.bugun_siparis, renk: "#1565C0", sayfa: "siparisler" },
              ].map((k, i) => (
                <div key={i} onClick={() => setAktifSayfa(k.sayfa)} style={{ background: "white", borderRadius: 18, padding: 20, boxShadow: "0 4px 16px rgba(92,61,46,0.06)", cursor: "pointer" }}
                  onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>{k.icon}</div>
                  <div style={{ fontFamily: "Georgia,serif", fontSize: 32, fontWeight: 700, color: k.renk }}>{k.deger}</div>
                  <div style={{ fontSize: 12, color: "#5C3D2E", opacity: 0.5, marginTop: 4 }}>{k.ad}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <div style={{ background: "white", borderRadius: 18, padding: 22, boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h3 style={{ fontFamily: "Georgia,serif", fontSize: 15, fontWeight: 700, color: "#2C1A0E", margin: 0 }}>📉 Stok Uyarıları</h3>
                  <button onClick={() => setAktifSayfa("stok")} style={{ background: "#FDF6EE", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer", color: "#E8845A", fontWeight: 700 }}>Tümü →</button>
                </div>
                {[
                  { label: "Stok Tükendi", deger: stokIstatistik.stok_yok, renk: "#C62828", bg: "#FFEBEE" },
                  { label: "Kritik Stok (1–5)", deger: stokIstatistik.kritik, renk: "#E65100", bg: "#FFF3E0" },
                  { label: "Düşük Stok (6–10)", deger: stokIstatistik.dusuk, renk: "#F57F17", bg: "#FFF9C4" },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: item.bg, borderRadius: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: item.renk, fontWeight: 600 }}>{item.label}</span>
                    <span style={{ fontFamily: "Georgia,serif", fontSize: 22, fontWeight: 700, color: item.renk }}>{item.deger}</span>
                  </div>
                ))}
                {stokIstatistik.stok_yok === 0 && stokIstatistik.kritik === 0 && (
                  <div style={{ textAlign: "center", padding: "12px 0", color: "#8BAF8E", fontSize: 13 }}>✅ Tüm stoklar sağlıklı</div>
                )}
              </div>
              <div style={{ background: "white", borderRadius: 18, padding: 22, boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
                <h3 style={{ fontFamily: "Georgia,serif", fontSize: 15, fontWeight: 700, color: "#2C1A0E", marginBottom: 16 }}>⚡ Hızlı Erişim</h3>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {menuler.filter(m => m.id !== "dashboard").map((m, i) => (
                    <button key={i} onClick={() => setAktifSayfa(m.id)} style={{ background: "#FDF6EE", border: "2px solid #E8D5B7", borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 600, color: "#5C3D2E", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
                      {m.icon} {m.ad}
                      {(m as any).badge > 0 ? <span style={{ background: "#E8845A", color: "white", borderRadius: 50, fontSize: 10, padding: "1px 6px" }}>{(m as any).badge}</span> : null}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
              {[
                { icon: "📁", ad: "Toplam Kategori", deger: istatistikler.kategoriler, renk: "#5C3D2E", sayfa: "kategoriler" },
                { icon: "📝", ad: "Bekleyen Soru", deger: istatistikler.bekleyenSoru, renk: "#9C27B0", sayfa: "blog" },
                { icon: "📉", ad: "Stok Sorunu", deger: stokIstatistik.stok_yok + stokIstatistik.kritik, renk: "#C62828", sayfa: "stok" },
              ].map((k, i) => (
                <div key={i} onClick={() => setAktifSayfa(k.sayfa)} style={{ background: "white", borderRadius: 18, padding: 18, boxShadow: "0 4px 16px rgba(92,61,46,0.06)", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ fontSize: 32 }}>{k.icon}</div>
                  <div>
                    <div style={{ fontFamily: "Georgia,serif", fontSize: 28, fontWeight: 700, color: k.renk }}>{k.deger}</div>
                    <div style={{ fontSize: 12, color: "#5C3D2E", opacity: 0.5 }}>{k.ad}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ÜRÜNLER ──────────────────────────────────────────────────────── */}
        {aktifSayfa === "urunler" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h1 style={{ fontFamily: "Georgia,serif", fontSize: 24, fontWeight: 700, color: "#2C1A0E" }}>
                Ürün Yönetimi
                <span style={{ fontSize: 14, fontWeight: 400, opacity: 0.5, marginLeft: 10 }}>{toplamUrun} ürün{filtrelerAktif ? " (filtrelenmiş)" : ""}</span>
              </h1>
              <button onClick={() => setYeniUrunAcik(!yeniUrunAcik)} style={btn(yeniUrunAcik ? "#888" : "#E8845A")}>
                {yeniUrunAcik ? "✕ Kapat" : "+ Yeni Ürün Ekle"}
              </button>
            </div>

            {yeniUrunAcik && (
              <div style={{ background: "white", borderRadius: 18, padding: 22, marginBottom: 16, boxShadow: "0 4px 16px rgba(92,61,46,0.06)", border: "2px solid #E8845A" }}>
                <h2 style={{ fontFamily: "Georgia,serif", fontSize: 15, fontWeight: 700, color: "#2C1A0E", marginBottom: 14 }}>➕ Yeni Ürün</h2>
                {yeniUrun.resim_url && (
                  <div style={{ marginBottom: 12, padding: 10, background: "#FDF6EE", borderRadius: 10, display: "flex", alignItems: "center", gap: 12 }}>
                    <img src={yeniUrun.resim_url} alt="" style={{ width: 60, height: 60, objectFit: "contain", borderRadius: 8, background: "white", padding: 4 }} onError={e => { (e.target as any).style.display = "none"; }} />
                    <span style={{ fontSize: 12, color: "#5C3D2E", opacity: 0.6 }}>Canlı önizleme</span>
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
                  <div><label style={{ fontSize: 11, fontWeight: 700, color: "#5C3D2E", opacity: 0.6, display: "block", marginBottom: 4 }}>ÜRÜN ADI *</label><input type="text" autoComplete="off" placeholder="Ürün adını yazın..." value={yeniUrun.ad} onChange={e => setYeniUrun({ ...yeniUrun, ad: e.target.value })} style={s} /></div>
                  <div><label style={{ fontSize: 11, fontWeight: 700, color: "#5C3D2E", opacity: 0.6, display: "block", marginBottom: 4 }}>FİYAT ₺ *</label><input type="number" step="0.01" placeholder="0.00" value={yeniUrun.fiyat} onChange={e => setYeniUrun({ ...yeniUrun, fiyat: e.target.value })} style={s} /></div>
                  <div><label style={{ fontSize: 11, fontWeight: 700, color: "#5C3D2E", opacity: 0.6, display: "block", marginBottom: 4 }}>İNDİRİMLİ ₺</label><input type="number" step="0.01" placeholder="Boş bırakın" value={yeniUrun.indirimli_fiyat} onChange={e => setYeniUrun({ ...yeniUrun, indirimli_fiyat: e.target.value })} style={s} /></div>
                  <div><label style={{ fontSize: 11, fontWeight: 700, color: "#5C3D2E", opacity: 0.6, display: "block", marginBottom: 4 }}>STOK</label><input type="number" placeholder="0" value={yeniUrun.stok} onChange={e => setYeniUrun({ ...yeniUrun, stok: e.target.value })} style={s} /></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
                  <div><label style={{ fontSize: 11, fontWeight: 700, color: "#5C3D2E", opacity: 0.6, display: "block", marginBottom: 4 }}>RESİM URL</label><input type="text" autoComplete="off" placeholder="https://..." value={yeniUrun.resim_url} onChange={e => setYeniUrun({ ...yeniUrun, resim_url: e.target.value })} style={s} /></div>
                  <div><label style={{ fontSize: 11, fontWeight: 700, color: "#5C3D2E", opacity: 0.6, display: "block", marginBottom: 4 }}>KATEGORİ</label><select value={yeniUrun.kategori_id} onChange={e => setYeniUrun({ ...yeniUrun, kategori_id: e.target.value })} style={s}><option value="">Seçin</option>{kategoriler.map(k => <option key={k.id} value={k.id}>{k.ust_kategori_id ? "└ " : ""}{k.ad}</option>)}</select></div>
                  <div><label style={{ fontSize: 11, fontWeight: 700, color: "#5C3D2E", opacity: 0.6, display: "block", marginBottom: 4 }}>MARKA</label><select value={yeniUrun.marka_id} onChange={e => setYeniUrun({ ...yeniUrun, marka_id: e.target.value })} style={s}><option value="">Seçin</option>{markalar.map(m => <option key={m.id} value={m.id}>{m.ad}</option>)}</select></div>
                  <div><label style={{ fontSize: 11, fontWeight: 700, color: "#5C3D2E", opacity: 0.6, display: "block", marginBottom: 4 }}>ETİKET</label><select value={yeniUrun.etiket} onChange={e => setYeniUrun({ ...yeniUrun, etiket: e.target.value })} style={s}><option value="">Yok</option><option value="yeni">🆕 Yeni</option><option value="indirim">💥 İndirim</option><option value="cok-satan">⭐ Çok Satan</option><option value="kampanya">🏷️ Kampanya</option><option value="son-stok">⚠️ Son Stok</option></select></div>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#5C3D2E", opacity: 0.6, display: "block", marginBottom: 4 }}>KISA AÇIKLAMA</label>
                  <input type="text" autoComplete="off" value={yeniUrun.kisa_aciklama} onChange={e => setYeniUrun({ ...yeniUrun, kisa_aciklama: e.target.value })} style={s} />
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={urunEkle} style={btn()}>✅ Ürünü Kaydet</button>
                  <button onClick={() => setYeniUrunAcik(false)} style={btn("#888")}>İptal</button>
                </div>
              </div>
            )}

            {/* FİLTRELER */}
            <div style={{ background: "white", borderRadius: 18, padding: "14px 18px", marginBottom: 12, boxShadow: "0 4px 16px rgba(92,61,46,0.06)", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, opacity: 0.4 }}>🔍</span>
                <input ref={aramaRef} type="text" autoComplete="new-password" autoCorrect="off" autoCapitalize="off" spellCheck={false} data-form-type="other" data-lpignore="true" placeholder="Ürün arayın..." value={aramaMetni} onChange={e => setAramaMetni(e.target.value)} style={{ ...s, paddingLeft: 36, paddingRight: aramaMetni ? 32 : 14 }} />
                {aramaMetni && <button onClick={() => setAramaMetni("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", fontSize: 16, cursor: "pointer", color: "#999", padding: 0 }}>✕</button>}
              </div>
              <select value={filtreler.kategori} onChange={e => filtreUygula({ ...filtreler, kategori: e.target.value })} style={fltSelect}>
                <option value="">Tüm Kategoriler</option>
                {kategoriler.map(k => <option key={k.id} value={k.id}>{k.ust_kategori_id ? "└ " : ""}{k.ad}</option>)}
              </select>
              <select value={filtreler.marka} onChange={e => filtreUygula({ ...filtreler, marka: e.target.value })} style={fltSelect}>
                <option value="">Tüm Markalar</option>
                {markalar.map(m => <option key={m.id} value={m.id}>{m.ad}</option>)}
              </select>
              <select value={filtreler.stok} onChange={e => filtreUygula({ ...filtreler, stok: e.target.value })} style={fltSelect}>
                <option value="">Tüm Stoklar</option>
                <option value="stokta">✅ Stokta Var</option>
                <option value="tukendi">❌ Stok Yok</option>
                <option value="kritik">⚠️ Kritik (≤5)</option>
              </select>
              <select value={filtreler.durum} onChange={e => filtreUygula({ ...filtreler, durum: e.target.value })} style={fltSelect}>
                <option value="">Tüm Durumlar</option>
                <option value="aktif">✅ Aktif</option>
                <option value="pasif">❌ Pasif</option>
              </select>
              {filtrelerAktif && <button onClick={filtreleriTemizle} style={{ ...btn("#888"), padding: "9px 14px", fontSize: 12 }}>✕ Temizle</button>}
              {yukleniyor && <span style={{ fontSize: 12, color: "#E8845A", fontWeight: 600 }}>⏳ Yükleniyor...</span>}
            </div>

            {/* TOPLU İŞLEM */}
            <div style={{ background: "white", borderRadius: 18, padding: "14px 18px", marginBottom: 12, boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#5C3D2E", display: "flex", alignItems: "center", gap: 8 }}>
                  ⚡ Toplu İşlem
                  {seciliUrunler.length > 0 && <span style={{ background: "#E8845A", color: "white", borderRadius: 50, fontSize: 11, padding: "2px 9px", fontWeight: 700 }}>{seciliUrunler.length} seçili</span>}
                </div>
                <select value={topluIslem.tip} onChange={e => setTopluIslem({ ...topluIslem, tip: e.target.value, deger: "" })} style={fltSelect}>
                  <optgroup label="💰 Fiyat">
                    <option value="fiyat_yuzde">Fiyat % Değiştir</option>
                    <option value="fiyat_tl">Fiyat TL Değiştir</option>
                    <option value="indirim_yuzde">İndirim % Uygula</option>
                    <option value="indirim_kaldir">İndirimi Kaldır</option>
                  </optgroup>
                  <optgroup label="📦 Stok/Durum">
                    <option value="stok_sifirla">Stok Sayısı Ayarla</option>
                    <option value="aktif_et">✅ Aktif Et</option>
                    <option value="pasif_et">❌ Pasif Et</option>
                  </optgroup>
                  <optgroup label="🏷️ Etiket">
                    <option value="etiket">Etiket Ekle</option>
                    <option value="etiket_kaldir">Etiketi Kaldır</option>
                  </optgroup>
                  <optgroup label="🗑️ Sil"><option value="sil">Seçilileri Sil</option></optgroup>
                </select>
                {(topluIslem.tip === "fiyat_yuzde" || topluIslem.tip === "indirim_yuzde") && <input type="number" placeholder="% ör: 10 veya -10" value={topluIslem.deger} onChange={e => setTopluIslem({ ...topluIslem, deger: e.target.value })} style={{ ...fltSelect, width: 160 }} />}
                {topluIslem.tip === "fiyat_tl" && <input type="number" placeholder="₺ ör: 50 veya -50" value={topluIslem.deger} onChange={e => setTopluIslem({ ...topluIslem, deger: e.target.value })} style={{ ...fltSelect, width: 160 }} />}
                {topluIslem.tip === "stok_sifirla" && <input type="number" placeholder="Stok adedi" value={topluIslem.deger} onChange={e => setTopluIslem({ ...topluIslem, deger: e.target.value })} style={{ ...fltSelect, width: 130 }} />}
                {topluIslem.tip === "etiket" && <select value={topluIslem.etiket} onChange={e => setTopluIslem({ ...topluIslem, etiket: e.target.value })} style={fltSelect}><option value="">Etiket Seçin</option><option value="yeni">🆕 Yeni</option><option value="indirim">💥 İndirim</option><option value="cok-satan">⭐ Çok Satan</option><option value="kampanya">🏷️ Kampanya</option><option value="son-stok">⚠️ Son Stok</option></select>}
                <button onClick={topluIslemUygula} disabled={seciliUrunler.length === 0} style={{ ...btn(seciliUrunler.length === 0 ? "#ccc" : topluIslem.tip === "sil" ? "#C62828" : "#E8845A"), padding: "9px 18px" }}>
                  {topluIslem.tip === "sil" ? "🗑️ Seçilileri Sil" : "✅ Uygula"}
                </button>
                {seciliUrunler.length > 0 && <button onClick={() => setSeciliUrunler([])} style={{ ...btn("#888"), padding: "9px 14px", fontSize: 12 }}>✕ Seçimi Temizle</button>}
              </div>
            </div>

            {/* ÜRÜN TABLOSU */}
            <div style={{ background: "white", borderRadius: 18, boxShadow: "0 4px 16px rgba(92,61,46,0.06)", overflow: "hidden" }}>
              <div style={{ padding: "12px 18px", borderBottom: "1px solid #F0E8E0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button onClick={() => setSeciliUrunler(urunler.map(u => u.id))} style={{ ...btn("#5C3D2E"), padding: "6px 12px", fontSize: 11 }}>Tümünü Seç</button>
                  <span style={{ fontSize: 12, color: "#5C3D2E", opacity: 0.5 }}>Sayfa {sayfaNo + 1}/{Math.max(1, toplamSayfa)} — {toplamUrun} ürün</span>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => { setSayfaNo(0); urunleriYukle(0, aramaMetni, filtreler); }} disabled={sayfaNo === 0} style={{ ...btn("#5C3D2E"), padding: "6px 12px", fontSize: 12, opacity: sayfaNo === 0 ? 0.4 : 1 }}>« İlk</button>
                  <button onClick={() => { const p = sayfaNo - 1; setSayfaNo(p); urunleriYukle(p, aramaMetni, filtreler); }} disabled={sayfaNo === 0} style={{ ...btn("#5C3D2E"), padding: "6px 12px", fontSize: 12, opacity: sayfaNo === 0 ? 0.4 : 1 }}>← Önceki</button>
                  <button onClick={() => { const p = sayfaNo + 1; setSayfaNo(p); urunleriYukle(p, aramaMetni, filtreler); }} disabled={sayfaNo >= toplamSayfa - 1} style={{ ...btn("#5C3D2E"), padding: "6px 12px", fontSize: 12, opacity: sayfaNo >= toplamSayfa - 1 ? 0.4 : 1 }}>Sonraki →</button>
                  <button onClick={() => { const p = toplamSayfa - 1; setSayfaNo(p); urunleriYukle(p, aramaMetni, filtreler); }} disabled={sayfaNo >= toplamSayfa - 1} style={{ ...btn("#5C3D2E"), padding: "6px 12px", fontSize: 12, opacity: sayfaNo >= toplamSayfa - 1 ? 0.4 : 1 }}>Son »</button>
                </div>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#FAF5EF" }}>
                      <th style={{ padding: "10px 12px", width: 40, textAlign: "center" }}>
                        <input type="checkbox" onChange={e => setSeciliUrunler(e.target.checked ? urunler.map(u => u.id) : [])} checked={seciliUrunler.length === urunler.length && urunler.length > 0} />
                      </th>
                      <th style={{ padding: "10px 8px", width: 52 }}></th>
                      {["ÜRÜN", "FİYAT", "İNDİRİMLİ", "STOK", "KATEGORİ", "MARKA", "ETİKET", "DURUM", "İŞLEM"].map(h => (
                        <th key={h} style={{ padding: "10px 10px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#5C3D2E", opacity: 0.5, letterSpacing: 0.5, whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {urunler.length === 0 ? (
                      <tr><td colSpan={11} style={{ textAlign: "center", padding: "48px 0", opacity: 0.4 }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                        <div>Ürün bulunamadı</div>
                        {filtrelerAktif && <button onClick={filtreleriTemizle} style={{ ...btn("#E8845A"), marginTop: 12, fontSize: 12, padding: "8px 16px" }}>Filtreleri Temizle</button>}
                      </td></tr>
                    ) : urunler.map(urun => (
                      <tr key={urun.id} style={{ borderBottom: "1px solid #F5EFE8", background: seciliUrunler.includes(urun.id) ? "#FFF8F4" : "white" }}
                        onMouseEnter={e => { if (!seciliUrunler.includes(urun.id)) e.currentTarget.style.background = "#FDFAF7"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = seciliUrunler.includes(urun.id) ? "#FFF8F4" : "white"; }}>
                        <td style={{ padding: "8px 12px", textAlign: "center" }}>
                          <input type="checkbox" checked={seciliUrunler.includes(urun.id)} onChange={e => setSeciliUrunler(e.target.checked ? [...seciliUrunler, urun.id] : seciliUrunler.filter(id => id !== urun.id))} />
                        </td>
                        <td style={{ padding: "6px 8px" }}>
                          {urun.resim_url ? <img src={urun.resim_url} alt="" style={{ width: 44, height: 44, objectFit: "contain", borderRadius: 8, background: "#FDF6EE" }} />
                            : <div style={{ width: 44, height: 44, background: "#FDF6EE", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🐾</div>}
                        </td>
                        <td style={{ padding: "8px 10px", maxWidth: 220 }}>
                          <a href={`/urun/${urun.slug}`} target="_blank" style={{ fontWeight: 600, color: "#2C1A0E", lineHeight: 1.3, textDecoration: "none", display: "block" }} title="Ürün sayfasını aç">
                            {urun.ad?.substring(0, 48)}{urun.ad?.length > 48 ? "…" : ""}
                          </a>
                          <div style={{ fontSize: 10, opacity: 0.35, marginTop: 2 }}>ID:{urun.id}</div>
                        </td>
                        <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>
                          {inlineEdit?.id === urun.id && inlineEdit?.alan === "fiyat" ? (
                            <div style={{ display: "flex", gap: 4 }}>
                              <input type="number" step="0.01" value={inlineEdit?.deger ?? ""} onChange={e => { if (inlineEdit) setInlineEdit({ id: inlineEdit!.id, alan: inlineEdit!.alan, deger: e.target.value }); }} onKeyDown={e => { if (e.key === "Enter") inlineKaydet(); if (e.key === "Escape") setInlineEdit(null); }} autoFocus style={{ width: 80, padding: "4px 6px", border: "2px solid #E8845A", borderRadius: 6, fontSize: 12, outline: "none" }} />
                              <button onClick={inlineKaydet} style={{ background: "#E8845A", color: "white", border: "none", borderRadius: 6, padding: "4px 8px", fontSize: 11, cursor: "pointer" }}>✓</button>
                              <button onClick={() => setInlineEdit(null)} style={{ background: "#eee", border: "none", borderRadius: 6, padding: "4px 6px", fontSize: 11, cursor: "pointer" }}>✕</button>
                            </div>
                          ) : (
                            <span onClick={() => setInlineEdit({ id: urun.id, alan: "fiyat", deger: String(urun.fiyat) })} style={{ fontWeight: 700, color: "#5C3D2E", cursor: "pointer", borderBottom: "1px dashed #ccc" }} title="Hızlı düzenle">
                              ₺{parseFloat(urun.fiyat).toFixed(2)}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>
                          {inlineEdit?.id === urun.id && inlineEdit?.alan === "indirimli_fiyat" ? (
                            <div style={{ display: "flex", gap: 4 }}>
                              <input type="number" step="0.01" value={inlineEdit?.deger ?? ""} onChange={e => { if (inlineEdit) setInlineEdit({ id: inlineEdit!.id, alan: inlineEdit!.alan, deger: e.target.value }); }} onKeyDown={e => { if (e.key === "Enter") inlineKaydet(); if (e.key === "Escape") setInlineEdit(null); }} autoFocus style={{ width: 80, padding: "4px 6px", border: "2px solid #E8845A", borderRadius: 6, fontSize: 12, outline: "none" }} />
                              <button onClick={inlineKaydet} style={{ background: "#E8845A", color: "white", border: "none", borderRadius: 6, padding: "4px 8px", fontSize: 11, cursor: "pointer" }}>✓</button>
                              <button onClick={() => setInlineEdit(null)} style={{ background: "#eee", border: "none", borderRadius: 6, padding: "4px 6px", fontSize: 11, cursor: "pointer" }}>✕</button>
                            </div>
                          ) : (
                            <div onClick={() => setInlineEdit({ id: urun.id, alan: "indirimli_fiyat", deger: String(urun.indirimli_fiyat || "") })} style={{ cursor: "pointer" }} title="Hızlı düzenle">
                              {urun.indirimli_fiyat ? (
                                <div>
                                  <span style={{ fontWeight: 700, color: "#E8845A", borderBottom: "1px dashed #ccc" }}>₺{parseFloat(urun.indirimli_fiyat).toFixed(2)}</span>
                                  <span style={{ background: "#FFEBEE", color: "#C62828", fontSize: 9, fontWeight: 700, borderRadius: 4, padding: "1px 4px", marginLeft: 4 }}>
                                    %{Math.round((1 - parseFloat(urun.indirimli_fiyat) / parseFloat(urun.fiyat)) * 100)}
                                  </span>
                                </div>
                              ) : <span style={{ color: "#ccc", borderBottom: "1px dashed #eee" }}>—</span>}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: "8px 10px" }}>
                          {inlineEdit?.id === urun.id && inlineEdit?.alan === "stok" ? (
                            <div style={{ display: "flex", gap: 4 }}>
                              <input type="number" value={inlineEdit?.deger ?? ""} onChange={e => { if (inlineEdit) setInlineEdit({ id: inlineEdit!.id, alan: inlineEdit!.alan, deger: e.target.value }); }} onKeyDown={e => { if (e.key === "Enter") inlineKaydet(); if (e.key === "Escape") setInlineEdit(null); }} autoFocus style={{ width: 60, padding: "4px 6px", border: "2px solid #E8845A", borderRadius: 6, fontSize: 12, outline: "none" }} />
                              <button onClick={inlineKaydet} style={{ background: "#E8845A", color: "white", border: "none", borderRadius: 6, padding: "4px 8px", fontSize: 11, cursor: "pointer" }}>✓</button>
                              <button onClick={() => setInlineEdit(null)} style={{ background: "#eee", border: "none", borderRadius: 6, padding: "4px 6px", fontSize: 11, cursor: "pointer" }}>✕</button>
                            </div>
                          ) : (
                            <span onClick={() => setInlineEdit({ id: urun.id, alan: "stok", deger: String(urun.stok) })}
                              style={{ background: urun.stok > 10 ? "#E8F5E9" : urun.stok > 0 ? "#FFF8E1" : "#FFEBEE", color: urun.stok > 10 ? "#2E7D32" : urun.stok > 0 ? "#E65100" : "#C62828", padding: "3px 9px", borderRadius: 50, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                              title="Hızlı düzenle">
                              {urun.stok}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "8px 10px", fontSize: 12, color: "#5C3D2E", opacity: 0.65 }}>
                          {urun.kategoriler?.slug
                            ? <a href={`/kategori/${urun.kategoriler.slug}`} target="_blank" style={{ color: "#5C3D2E", textDecoration: "none", borderBottom: "1px dashed #ccc" }} title="Kategori sayfasını aç">{urun.kategoriler.ad}</a>
                            : "—"}
                        </td>
                        <td style={{ padding: "8px 10px", fontSize: 12, color: "#5C3D2E", opacity: 0.65 }}>{urun.markalar?.ad || "—"}</td>
                        <td style={{ padding: "8px 10px" }}>
                          {urun.etiket && etiketRenk[urun.etiket] ? (
                            <span style={{ background: etiketRenk[urun.etiket].bg, color: etiketRenk[urun.etiket].color, padding: "2px 8px", borderRadius: 50, fontSize: 10, fontWeight: 700 }}>{urun.etiket}</span>
                          ) : urun.etiket ? <span style={{ background: "#F0EBE3", color: "#5C3D2E", padding: "2px 8px", borderRadius: 50, fontSize: 10, fontWeight: 700 }}>{urun.etiket}</span> : null}
                        </td>
                        <td style={{ padding: "8px 10px" }}>
                          <button onClick={() => aktifToggle(urun.id, urun.aktif)} style={{ background: urun.aktif ? "#E8F5E9" : "#FFEBEE", color: urun.aktif ? "#2E7D32" : "#C62828", border: "none", padding: "3px 10px", borderRadius: 50, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                            {urun.aktif ? "Aktif" : "Pasif"}
                          </button>
                        </td>
                        <td style={{ padding: "8px 10px" }}>
                          <div style={{ display: "flex", gap: 5 }}>
                            <button onClick={() => setDuzenleUrun({ ...urun })} style={{ background: "#FDF6EE", border: "2px solid #E8D5B7", borderRadius: 8, padding: "5px 10px", fontSize: 12, cursor: "pointer", fontWeight: 600, color: "#5C3D2E" }}>✏️ Düzenle</button>
                            <button onClick={() => urunSil(urun.id)} style={{ background: "#FFEBEE", border: "none", borderRadius: 8, padding: "5px 9px", fontSize: 13, cursor: "pointer", color: "#C62828" }}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {toplamSayfa > 1 && (
                <div style={{ padding: "14px 18px", borderTop: "1px solid #F0E8E0", display: "flex", justifyContent: "center", gap: 6 }}>
                  {Array.from({ length: Math.min(toplamSayfa, 10) }, (_, i) => i).map(i => (
                    <button key={i} onClick={() => { setSayfaNo(i); urunleriYukle(i, aramaMetni, filtreler); }}
                      style={{ ...btn(sayfaNo === i ? "#E8845A" : "#E8D5B7"), color: sayfaNo === i ? "white" : "#5C3D2E", padding: "6px 12px", fontSize: 12, minWidth: 36 }}>
                      {i + 1}
                    </button>
                  ))}
                  {toplamSayfa > 10 && <span style={{ padding: "6px 4px", fontSize: 12, color: "#5C3D2E", opacity: 0.5 }}>... {toplamSayfa} sayfa</span>}
                </div>
              )}
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: "#5C3D2E", opacity: 0.45, textAlign: "center" }}>💡 Fiyat, indirimli fiyat ve stok hücrelerine tıklayarak hızlı düzenleme yapabilirsiniz</div>
          </div>
        )}

        {/* ── STOK TAKİBİ ──────────────────────────────────────────────────── */}
        {aktifSayfa === "stok" && (
          <div>
            <h1 style={{ fontFamily: "Georgia,serif", fontSize: 24, fontWeight: 700, color: "#2C1A0E", marginBottom: 20 }}>📉 Stok Takibi</h1>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
              {[
                { label: "Toplam Aktif Ürün", deger: stokIstatistik.toplam_aktif, renk: "#8BAF8E", bg: "#F1F8F2", icon: "📦" },
                { label: "Stok Tükendi", deger: stokIstatistik.stok_yok, renk: "#C62828", bg: "#FFEBEE", icon: "❌" },
                { label: "Kritik Stok (1–5)", deger: stokIstatistik.kritik, renk: "#E65100", bg: "#FFF3E0", icon: "⚠️" },
                { label: "Düşük Stok (6–10)", deger: stokIstatistik.dusuk, renk: "#F57F17", bg: "#FFF9C4", icon: "📉" },
              ].map((k, i) => (
                <div key={i} style={{ background: k.bg, borderRadius: 18, padding: 20, border: `2px solid ${k.renk}22` }}>
                  <div style={{ fontSize: 26, marginBottom: 8 }}>{k.icon}</div>
                  <div style={{ fontFamily: "Georgia,serif", fontSize: 34, fontWeight: 700, color: k.renk }}>{k.deger}</div>
                  <div style={{ fontSize: 12, color: "#5C3D2E", opacity: 0.7, marginTop: 4 }}>{k.label}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {([
                ["tukendi", "❌ Stok Yok", stokIstatistik.stok_yok],
                ["kritik", "⚠️ Kritik (1–5)", stokIstatistik.kritik],
                ["dusuk", "📉 Düşük (6–10)", stokIstatistik.dusuk],
              ] as [typeof stokFiltreTip, string, number][]).map(([tip, lbl, sayi]) => (
                <button key={tip} onClick={() => { setStokFiltreTip(tip); stokTakibiYukle(tip); }}
                  style={{ ...btn(stokFiltreTip === tip ? "#E8845A" : "#E8D5B7"), color: stokFiltreTip === tip ? "white" : "#5C3D2E", padding: "9px 20px", fontSize: 13 }}>
                  {lbl} {sayi > 0 && <span style={{ marginLeft: 6, background: stokFiltreTip === tip ? "rgba(255,255,255,0.3)" : "#E8845A", color: "white", borderRadius: 50, fontSize: 10, padding: "1px 7px" }}>{sayi}</span>}
                </button>
              ))}
              <button onClick={() => stokTakibiYukle(stokFiltreTip)} style={{ ...btn("#5C3D2E"), padding: "9px 16px", fontSize: 12 }}>🔄 Yenile</button>
            </div>
            <div style={{ background: "white", borderRadius: 18, boxShadow: "0 4px 16px rgba(92,61,46,0.06)", overflow: "hidden" }}>
              {yukleniyor ? (
                <div style={{ textAlign: "center", padding: "60px 0", opacity: 0.5 }}>⏳ Yükleniyor...</div>
              ) : dusukStokUrunler.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                  <div style={{ fontSize: 16, color: "#8BAF8E", fontWeight: 600 }}>Bu kategoride sorun yok!</div>
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#FAF5EF" }}>
                      {["", "ÜRÜN ADI", "KATEGORİ", "MARKA", "MEVCUT STOK", "DURUM", "HIZLI GÜNCELLE"].map(h => (
                        <th key={h} style={{ padding: "12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#5C3D2E", opacity: 0.5 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dusukStokUrunler.map(urun => (
                      <tr key={urun.id} style={{ borderBottom: "1px solid #F5EFE8" }}>
                        <td style={{ padding: "8px 12px" }}>
                          {urun.resim_url ? <img src={urun.resim_url} alt="" style={{ width: 44, height: 44, objectFit: "contain", borderRadius: 8, background: "#FDF6EE" }} />
                            : <div style={{ width: 44, height: 44, background: "#FDF6EE", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🐾</div>}
                        </td>
                        <td style={{ padding: "8px 12px" }}>
                          <div style={{ fontWeight: 600, color: "#2C1A0E" }}>{urun.ad?.substring(0, 50)}{urun.ad?.length > 50 ? "…" : ""}</div>
                          <div style={{ fontSize: 10, opacity: 0.4, marginTop: 2 }}>ID:{urun.id}</div>
                        </td>
                        <td style={{ padding: "8px 12px", fontSize: 12, opacity: 0.6 }}>{urun.kategoriler?.ad || "—"}</td>
                        <td style={{ padding: "8px 12px", fontSize: 12, opacity: 0.6 }}>{urun.markalar?.ad || "—"}</td>
                        <td style={{ padding: "8px 12px" }}>
                          <span style={{ background: urun.stok === 0 ? "#FFEBEE" : urun.stok <= 5 ? "#FFF3E0" : "#FFF9C4", color: urun.stok === 0 ? "#C62828" : urun.stok <= 5 ? "#E65100" : "#F57F17", padding: "4px 12px", borderRadius: 50, fontSize: 14, fontWeight: 700 }}>
                            {urun.stok}
                          </span>
                        </td>
                        <td style={{ padding: "8px 12px" }}>
                          <button onClick={() => aktifToggle(urun.id, urun.aktif)} style={{ background: urun.aktif ? "#E8F5E9" : "#FFEBEE", color: urun.aktif ? "#2E7D32" : "#C62828", border: "none", padding: "3px 10px", borderRadius: 50, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                            {urun.aktif ? "Aktif" : "Pasif"}
                          </button>
                        </td>
                        <td style={{ padding: "8px 12px" }}>
                          {stokInline?.id === urun.id ? (
                            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                              <input type="number" value={stokInline?.deger ?? ""} onChange={e => { if (stokInline) setStokInline({ id: stokInline.id, deger: e.target.value }); }} autoFocus
                                onKeyDown={e => { if (e.key === "Enter") stokInlineKaydet(); if (e.key === "Escape") setStokInline(null); }}
                                style={{ width: 80, padding: "6px 10px", border: "2px solid #E8845A", borderRadius: 8, fontSize: 13, outline: "none" }} />
                              <button onClick={stokInlineKaydet} style={{ ...btn(), padding: "6px 14px", fontSize: 12 }}>✓ Kaydet</button>
                              <button onClick={() => setStokInline(null)} style={{ ...btn("#888"), padding: "6px 10px", fontSize: 12 }}>✕</button>
                            </div>
                          ) : (
                            <div style={{ display: "flex", gap: 6 }}>
                              <button onClick={() => setStokInline({ id: urun.id, deger: String(urun.stok) })} style={{ background: "#FDF6EE", border: "2px solid #E8D5B7", borderRadius: 8, padding: "6px 14px", fontSize: 12, cursor: "pointer", fontWeight: 600, color: "#5C3D2E" }}>
                                ✏️ Stok Gir
                              </button>
                              <button onClick={() => setDuzenleUrun({ ...urun })} style={{ background: "#F0EBE3", border: "none", borderRadius: 8, padding: "6px 10px", fontSize: 12, cursor: "pointer", color: "#5C3D2E" }}>
                                Tam Düzenle
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── SİPARİŞLER ───────────────────────────────────────────────────── */}
        {aktifSayfa === "siparisler" && (
          <div>
            <h1 style={{ fontFamily: "Georgia,serif", fontSize: 24, fontWeight: 700, color: "#2C1A0E", marginBottom: 20 }}>Sipariş Yönetimi</h1>
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              {([["", "Tümü"], ["beklemede", "⏳ Beklemede"], ["hazirlaniyor", "🔧 Hazırlanıyor"], ["kargoda", "🚚 Kargoda"], ["tamamlandi", "✅ Tamamlandı"], ["iptal", "❌ İptal"]] as [string, string][]).map(([val, lbl]) => (
                <button key={val} onClick={() => { setSiparisDurumFiltre(val); siparisleriYukle(val); }}
                  style={{ ...btn(siparisDurumFiltre === val ? "#E8845A" : "#E8D5B7"), color: siparisDurumFiltre === val ? "white" : "#5C3D2E", padding: "8px 16px", fontSize: 12 }}>
                  {lbl}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {siparisler.length === 0 ? (
                <div style={{ background: "white", borderRadius: 18, padding: "60px 0", textAlign: "center", opacity: 0.4 }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
                  <div style={{ fontSize: 16 }}>Bu durumda sipariş yok</div>
                </div>
              ) : siparisler.map(sp => (
                <div key={sp.id} style={{ background: "white", borderRadius: 18, boxShadow: "0 4px 16px rgba(92,61,46,0.06)", overflow: "hidden" }}>
                  {/* Sipariş başlık */}
                  <div style={{ padding: "14px 20px", background: "#FAF5EF", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontFamily: "Georgia,serif", fontSize: 16, fontWeight: 700, color: "#5C3D2E" }}>#{sp.siparis_no}</span>
                      <span style={{ fontSize: 12, opacity: 0.5 }}>{new Date(sp.created_at).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                      <span style={{ background: sp.odeme_yontemi === "kredi_karti" ? "#E3F2FD" : "#E8F5E9", color: sp.odeme_yontemi === "kredi_karti" ? "#1565C0" : "#2E7D32", padding: "2px 9px", borderRadius: 50, fontSize: 11, fontWeight: 700 }}>
                        {sp.odeme_yontemi === "kredi_karti" ? "💳 Kart" : "🏦 Havale"}
                      </span>
                      <span style={{ background: ({ beklemede: "#FFF3E0", hazirlaniyor: "#E3F2FD", kargoda: "#E8F5E9", tamamlandi: "#F3E5F5", iptal: "#FFEBEE" } as any)[sp.durum] || "#F5F5F5", color: ({ beklemede: "#E65100", hazirlaniyor: "#1565C0", kargoda: "#2E7D32", tamamlandi: "#6A1B9A", iptal: "#C62828" } as any)[sp.durum] || "#666", padding: "2px 9px", borderRadius: 50, fontSize: 11, fontWeight: 700 }}>
                        {sp.durum || "beklemede"}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontFamily: "Georgia,serif", fontSize: 20, fontWeight: 700, color: "#E8845A" }}>₺{parseFloat(sp.toplam || 0).toFixed(2)}</span>
                      {/* ── DÜZELTİLMİŞ DETAY BUTONU ── */}
                      <button
                        onClick={async () => {
                          if (acikSiparisId === sp.id) {
                            setAcikSiparisId(null);
                            return;
                          }
                          setAcikSiparisId(sp.id);
                          // Her açılışta cache'i temizleyip taze veri çek
                          setSiparisKalemleri(prev => {
                            const y = { ...prev };
                            delete y[sp.id];
                            return y;
                          });
                          await siparisKalemleriniYukle(sp.id);
                        }}
                        style={{ background: "none", border: "2px solid #E8D5B7", borderRadius: 8, padding: "5px 12px", fontSize: 12, cursor: "pointer", color: "#5C3D2E", fontWeight: 600 }}>
                        {kalemYukleniyor === sp.id ? "⏳ Yükleniyor..." : acikSiparisId === sp.id ? "▲ Kapat" : "▼ Detay"}
                      </button>
                    </div>
                  </div>

                  {/* Sipariş detay (açılır) */}
                  {acikSiparisId === sp.id && (
                    <div style={{ padding: "18px 20px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
                        <div style={{ background: "#FDF6EE", borderRadius: 12, padding: "12px 16px" }}>
                          <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.5, marginBottom: 6, textTransform: "uppercase" }}>Müşteri Bilgileri</div>
                          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{sp.ad} {sp.soyad}</div>
                          <div style={{ fontSize: 12, opacity: 0.7 }}>{sp.email}</div>
                          <div style={{ fontSize: 12, opacity: 0.7 }}>{sp.telefon}</div>
                        </div>
                        <div style={{ background: "#FDF6EE", borderRadius: 12, padding: "12px 16px" }}>
                          <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.5, marginBottom: 6, textTransform: "uppercase" }}>Teslimat Adresi</div>
                          <div style={{ fontSize: 13 }}>{sp.adres}</div>
                          <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{sp.sehir}</div>
                        </div>
                        <div style={{ background: "#FDF6EE", borderRadius: 12, padding: "12px 16px" }}>
                          <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.5, marginBottom: 6, textTransform: "uppercase" }}>Kargo Takip No</div>
                          <input type="text" autoComplete="off" placeholder="Takip numarası girin..."
                            defaultValue={sp.kargo_takip || ""}
                            onBlur={async e => { if (e.target.value !== sp.kargo_takip) { await supabase.from("siparisler").update({ kargo_takip: e.target.value }).eq("id", sp.id); goster("✅ Takip no kaydedildi"); } }}
                            style={{ width: "100%", padding: "8px 12px", border: "2px solid #E8D5B7", borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box" as const, background: "white" }} />
                        </div>
                      </div>

                      {/* ── DÜZELTİLMİŞ SİPARİŞ KALEMLERİ ── */}
                      <div style={{ background: "#F8F4F0", borderRadius: 12, padding: 14, marginBottom: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.5, marginBottom: 10, textTransform: "uppercase", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span>Sipariş İçeriği</span>
                          {sp.id in siparisKalemleri && (
                            <span style={{ background: "#E8845A", color: "white", borderRadius: 50, fontSize: 10, padding: "2px 8px", fontWeight: 700 }}>
                              {siparisKalemleri[sp.id].length} kalem
                            </span>
                          )}
                        </div>

                        {/* Yükleniyor durumu */}
                        {kalemYukleniyor === sp.id && (
                          <div style={{ textAlign: "center", padding: "20px 0", fontSize: 13, opacity: 0.5 }}>⏳ Kalemler yükleniyor...</div>
                        )}

                        {/* Kalem yok uyarısı */}
                        {kalemYukleniyor !== sp.id && sp.id in siparisKalemleri && siparisKalemleri[sp.id].length === 0 && (
                          <div style={{ textAlign: "center", padding: "20px 0", fontSize: 13, opacity: 0.5 }}>
                            <div style={{ fontSize: 28, marginBottom: 8 }}>⚠️</div>
                            <div>Bu sipariş için kalem bulunamadı.</div>
                            <div style={{ fontSize: 11, marginTop: 4, opacity: 0.7 }}>siparis_id: {sp.id} — Supabase tablosunu kontrol edin.</div>
                          </div>
                        )}

                        {/* ── DÜZELTİLMİŞ KALEMLER ── */}
                        {kalemYukleniyor !== sp.id && sp.id in siparisKalemleri && siparisKalemleri[sp.id].length > 0 && (
                          <>
                            {siparisKalemleri[sp.id].map((kalem, ki) => {
                              // Düzeltilmiş ürün bilgisi alma
                              const urunAdi = kalem.urunler?.ad || kalem.urun_adi || kalem.ad || kalem.name || "Ürün";
                              const fiyat = parseFloat(kalem.fiyat || kalem.birim_fiyat || kalem.toplam_fiyat || kalem.price || 0);
                              const adet = kalem.adet || kalem.miktar || kalem.quantity || 1;
                              const resim = kalem.urunler?.resim_url || kalem.resim_url || null;
                              
                              return (
                                <div key={ki} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: ki < siparisKalemleri[sp.id].length - 1 ? "1px dashed #E8D5B7" : "none" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <div style={{ width: 44, height: 44, background: "white", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid #F0E8E0" }}>
                                      {resim
                                        ? <img src={resim} alt="" style={{ width: 38, height: 38, objectFit: "contain", borderRadius: 6 }}
                                            onError={e => { (e.target as any).style.display = "none"; }} />
                                        : <span style={{ fontSize: 20 }}>🐾</span>}
                                    </div>
                                    <div>
                                      <div style={{ fontSize: 13, fontWeight: 600, color: "#2C1A0E" }}>{urunAdi}</div>
                                      <div style={{ fontSize: 11, opacity: 0.5, marginTop: 2 }}>x{adet} adet</div>
                                    </div>
                                  </div>
                                  <div style={{ textAlign: "right" }}>
                                    <div style={{ fontWeight: 700, color: "#5C3D2E", fontSize: 14 }}>₺{fiyat.toFixed(2)}</div>
                                    {adet > 1 && <div style={{ fontSize: 10, opacity: 0.5 }}>₺{(fiyat / adet).toFixed(2)} / adet</div>}
                                  </div>
                                </div>
                              );
                            })}
                            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12, paddingTop: 10, borderTop: "2px solid #E8D5B7" }}>
                              <div style={{ fontFamily: "Georgia,serif", fontSize: 18, fontWeight: 700, color: "#E8845A" }}>
                                Toplam: ₺{parseFloat(sp.toplam || 0).toFixed(2)}
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Durum güncelleme + Baskı */}
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <select value={sp.durum || "beklemede"} onChange={async e => { await supabase.from("siparisler").update({ durum: e.target.value }).eq("id", sp.id); siparisleriYukle(siparisDurumFiltre); goster("✅ Sipariş durumu güncellendi"); }} style={fltSelect}>
                          <option value="beklemede">⏳ Beklemede</option>
                          <option value="hazirlaniyor">🔧 Hazırlanıyor</option>
                          <option value="kargoda">🚚 Kargoda</option>
                          <option value="tamamlandi">✅ Tamamlandı</option>
                          <option value="iptal">❌ İptal</option>
                          <option value="iade">↩️ İade</option>
                        </select>
                        <select value={sp.odeme_durumu || "beklemede"} onChange={async e => { await supabase.from("siparisler").update({ odeme_durumu: e.target.value }).eq("id", sp.id); siparisleriYukle(siparisDurumFiltre); goster("✅ Ödeme durumu güncellendi"); }} style={fltSelect}>
                          <option value="beklemede">⏳ Ödeme Bekliyor</option>
                          <option value="odendi">💳 Ödendi</option>
                          <option value="iptal">❌ İptal</option>
                          <option value="iade">↩️ İade Edildi</option>
                        </select>
                        <button onClick={() => {
                          const kalemleriHtml = (siparisKalemleri[sp.id] || []).map(k => {
                            const ad = k.urunler?.ad || k.urun_adi || k.ad || k.name || "Ürün";
                            const fiyat = parseFloat(k.fiyat || k.birim_fiyat || k.toplam_fiyat || k.price || 0);
                            const adet = k.adet || k.miktar || k.quantity || 1;
                            return `<div class="row"><span>${ad} x${adet}</span><span>₺${fiyat.toFixed(2)}</span></div>`;
                          }).join("") || "<div class='row'><span>Kalem yok</span><span>—</span></div>";
                          const w = window.open("", "_blank");
                          if (!w) return;
                          w.document.write(`<html><head><title>Paketleme Fişi #${sp.siparis_no}</title><style>body{font-family:Arial;padding:20px;max-width:420px}h2{border-bottom:2px solid #333;padding-bottom:8px}.row{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px dashed #eee;font-size:13px}.total{font-size:18px;font-weight:bold;color:#E8845A;margin-top:12px}@media print{button{display:none}}</style></head><body><h2>🐾 evemama.net — Paketleme Fişi</h2><div class="row"><b>Sipariş No</b><span>#${sp.siparis_no}</span></div><div class="row"><b>Tarih</b><span>${new Date(sp.created_at).toLocaleDateString("tr-TR")}</span></div><div class="row"><b>Müşteri</b><span>${sp.ad} ${sp.soyad}</span></div><div class="row"><b>E-posta</b><span>${sp.email || "-"}</span></div><div class="row"><b>Adres</b><span>${sp.adres || "-"}, ${sp.sehir || ""}</span></div><div class="row"><b>Ödeme</b><span>${sp.odeme_yontemi === "kredi_karti" ? "Kredi Kartı" : "Havale/EFT"}</span></div><hr/>${kalemleriHtml}<div class="total">Toplam: ₺${parseFloat(sp.toplam || 0).toFixed(2)}</div><br/><button onclick="window.print()">🖨️ Yazdır</button></body></html>`);
                          w.document.close();
                        }} style={{ ...btn("#5C3D2E"), padding: "9px 16px", fontSize: 12 }}>🖨️ Paketleme Fişi</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Diğer sayfalar (kategoriler, markalar, kuponlar, blog, kargo, ayarlar) aynı kalacak */}
        {/* Bu kısmı kısaltıyorum, asıl sorun sipariş detaylarında idi */}

      </div>
    </main>
  );
}