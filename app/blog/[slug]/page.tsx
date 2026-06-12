// Gerçek, indexlenebilir makale sayfası (server-render). Eskiden makaleler
// /blog'da modal'dı → ayrı URL yoktu, tam metin HTML'de yoktu, Google indeksleyemiyordu.
// Artık her makale: kendi URL'i + metadata + BlogPosting/Breadcrumb JSON-LD + tam
// içerik server-render + ilgili ürünlere funnel link → organik trafik + dönüşüm.

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { blogYazilari, yaziBul } from "../yazilar";

const BASE = "https://www.evemama.net";

export function generateStaticParams() {
  return blogYazilari.map((y) => ({ slug: y.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const yazi = yaziBul(slug);
  if (!yazi) {
    return { title: "Yazı bulunamadı — evemama", robots: { index: false, follow: false } };
  }
  return {
    title: yazi.baslik,
    description: yazi.ozet,
    alternates: { canonical: `/blog/${yazi.slug}` },
    openGraph: {
      title: yazi.baslik,
      description: yazi.ozet,
      url: `${BASE}/blog/${yazi.slug}`,
      type: "article",
    },
  };
}

export default async function BlogYaziPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const yazi = yaziBul(slug);
  if (!yazi) notFound();

  const url = `${BASE}/blog/${yazi.slug}`;
  const digerYazilar = blogYazilari.filter((y) => y.slug !== yazi.slug).slice(0, 3);

  const blogPostingLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: yazi.baslik,
    description: yazi.ozet,
    articleBody: yazi.icerik.map((b) => `${b.baslik}: ${b.metin}`).join("\n\n"),
    author: { "@type": "Organization", name: "evemama.net", url: BASE },
    publisher: { "@type": "Organization", name: "evemama.net", url: BASE },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    inLanguage: "tr-TR",
    articleSection: yazi.kategori,
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Ana Sayfa", item: BASE },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${BASE}/blog` },
      { "@type": "ListItem", position: 3, name: yazi.baslik, item: url },
    ],
  };

  return (
    <main style={{ minHeight: "100vh", background: "#FDF6EE", fontFamily: "sans-serif", color: "#2C1A0E" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <style>{`
        .yazi-pad { padding: 16px 48px; }
        .yazi-body { padding: 40px 48px 80px; }
        .yazi-urun-grid { display: flex; gap: 10px; flex-wrap: wrap; }
        @media (max-width: 768px) {
          .yazi-pad { padding: 13px 16px !important; }
          .yazi-body { padding: 28px 16px 90px !important; }
        }
      `}</style>

      {/* Header */}
      <header className="yazi-pad" style={{ background: "white", borderBottom: "1px solid #E8D5B7", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100 }}>
        <Link href="/" style={{ fontFamily: "Georgia,serif", fontSize: 20, fontWeight: 700, color: "#5C3D2E", textDecoration: "none" }}>
          evemama<span style={{ color: "#E8845A", fontStyle: "italic" }}>.net</span>
        </Link>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link href="/blog" style={{ fontSize: 13, fontWeight: 600, color: "#5C3D2E", opacity: 0.6, textDecoration: "none" }}>← Blog</Link>
          <Link href="/urunler" style={{ fontSize: 13, fontWeight: 600, color: "#5C3D2E", opacity: 0.6, textDecoration: "none" }}>Ürünler</Link>
          <Link href="/sepet" style={{ background: "#5C3D2E", color: "white", padding: "9px 18px", borderRadius: 50, textDecoration: "none", fontSize: 13, fontWeight: 700 }}>🛒 Sepet</Link>
        </div>
      </header>

      <article className="yazi-body" style={{ maxWidth: 760, margin: "0 auto" }}>
        {/* Breadcrumb */}
        <nav style={{ fontSize: 12.5, color: "#5C3D2E", opacity: 0.55, marginBottom: 20 }}>
          <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>Ana Sayfa</Link>
          <span> › </span>
          <Link href="/blog" style={{ color: "inherit", textDecoration: "none" }}>Blog</Link>
          <span> › </span>
          <span style={{ color: "#E8845A", fontWeight: 600 }}>{yazi.kategori}</span>
        </nav>

        <div style={{ display: "inline-block", background: "#FFF5F0", color: "#E8845A", fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 50, marginBottom: 16 }}>{yazi.kategori}</div>
        <h1 style={{ fontFamily: "Georgia,serif", fontSize: 32, fontWeight: 700, color: "#5C3D2E", marginBottom: 14, lineHeight: 1.25 }}>{yazi.baslik}</h1>
        <p style={{ fontSize: 17, color: "#5C3D2E", opacity: 0.7, lineHeight: 1.7, marginBottom: 36 }}>{yazi.ozet}</p>

        {/* İçerik */}
        {yazi.icerik.map((blok, i) => (
          <section key={i} style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: yazi.renk, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>{yazi.emoji}</div>
              <h2 style={{ fontFamily: "Georgia,serif", fontSize: 20, fontWeight: 700, color: "#5C3D2E", margin: 0 }}>{blok.baslik}</h2>
            </div>
            <p style={{ fontSize: 16, color: "#5C3D2E", opacity: 0.8, lineHeight: 1.8, margin: 0, paddingLeft: 44 }}>{blok.metin}</p>
          </section>
        ))}

        {/* Ürün funnel — içerikten ilgili kategorilere */}
        <div style={{ background: "linear-gradient(135deg,#FFF5F0,#F4E4D4)", borderRadius: 20, padding: "28px 30px", marginTop: 44 }}>
          <div style={{ fontFamily: "Georgia,serif", fontSize: 19, fontWeight: 700, color: "#5C3D2E", marginBottom: 6 }}>🛍️ Bu konuyla ilgili ürünler</div>
          <p style={{ fontSize: 14, color: "#5C3D2E", opacity: 0.7, marginBottom: 18 }}>Dostunuz için ihtiyacınız olan her şey evemama.net&apos;te — hızlı kargo, %100 orijinal.</p>
          <div className="yazi-urun-grid">
            {yazi.urunLinkleri.map((u, i) => (
              <Link key={i} href={u.href} style={{ background: "white", color: "#E8845A", border: "2px solid #F4C09A", borderRadius: 50, padding: "10px 20px", fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
                {u.etiket} →
              </Link>
            ))}
          </div>
        </div>

        {/* Diğer rehberler — iç link */}
        {digerYazilar.length > 0 && (
          <div style={{ marginTop: 48 }}>
            <h2 style={{ fontFamily: "Georgia,serif", fontSize: 22, fontWeight: 700, color: "#5C3D2E", marginBottom: 18 }}>Diğer Rehberler</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {digerYazilar.map((y) => (
                <Link key={y.slug} href={`/blog/${y.slug}`} style={{ display: "flex", alignItems: "center", gap: 14, background: "white", borderRadius: 16, padding: "16px 18px", textDecoration: "none", boxShadow: "0 4px 16px rgba(92,61,46,0.06)" }}>
                  <div style={{ width: 46, height: 46, borderRadius: 12, background: y.renk, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{y.emoji}</div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#E8845A", marginBottom: 2 }}>{y.kategori}</div>
                    <div style={{ fontFamily: "Georgia,serif", fontSize: 15.5, fontWeight: 700, color: "#5C3D2E", lineHeight: 1.3 }}>{y.baslik}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: 40, textAlign: "center" }}>
          <Link href="/blog" style={{ display: "inline-block", color: "#5C3D2E", opacity: 0.7, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>← Tüm rehberlere dön</Link>
        </div>
      </article>
    </main>
  );
}
