import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { eq } from "drizzle-orm";
import { db } from "../database";
import { redirects } from "../database/schema";
import { getCatalog } from "./catalog";
const esc = (s: string) =>
  s
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
export async function seoPage(path: string, origin: string) {
  const { products, categories, settings } = await getCatalog();
  const pathname = path.split("?")[0];
  const p = products.find((p: any) => pathname === "/product/" + p.slug);
  const c = categories.find((c: any) => pathname === "/category/" + c.slug);
  const productPath = pathname.startsWith("/product/");
  if (productPath && !p) {
    const r = (
      await db
        .select()
        .from(redirects)
        .where(eq(redirects.slug, pathname.split("/").pop()!))
    )[0];
    if (r) return { status: 301, redirect: "/product/" + r.target, head: "", body: "" };
  }
  const known =
    ["/", "/catalog", "/about", "/terms", "/privacy", "/contacts", "/favorites", "/admin"].includes(
      pathname,
    ) ||
    p ||
    c;
  const status = known ? 200 : 404;
  const title =
    p?.seoTitle ||
    c?.seoTitle ||
    (c
      ? c.name + " | INFINIE SP"
      : pathname === "/catalog"
        ? "Коллекция | INFINIE SP"
        : pathname === "/about"
          ? "О бренде | INFINIE SP"
          : pathname === "/terms"
            ? "Покупка на Kaspi | INFINIE SP"
            : pathname === "/privacy"
              ? "Конфиденциальность | INFINIE SP"
              : pathname === "/contacts"
                ? "Контакты | INFINIE SP"
                : status === 404
                  ? "Страница не найдена | INFINIE SP"
                  : settings.defaultSeoTitle || "INFINIE SP — базовый гардероб с характером");
  const description =
    p?.seoDescription ||
    c?.seoDescription ||
    settings.defaultSeoDescription ||
    "Базовая коллекция INFINIE SP: свободные силуэты, натуральный хлопок, фотографии, характеристики и покупка на Kaspi.";
  const canonical = origin + pathname;
  const graph: any[] = [
    { "@type": "Organization", name: settings.name || "INFINIE SP", url: origin },
    { "@type": "WebSite", name: settings.name || "INFINIE SP", url: origin },
  ];
  if (p)
    graph.push(
      {
        "@type": "Product",
        name: p.name,
        sku: p.sku,
        description: p.short_description,
        image: p.images.map((m: any) => (m.url.startsWith("/") ? origin + m.url : m.url)),
        brand: { "@type": "Brand", name: p.brand },
        url: canonical,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Главная", item: origin },
          { "@type": "ListItem", position: 2, name: "Коллекция", item: origin + "/catalog" },
          { "@type": "ListItem", position: 3, name: p.name, item: canonical },
        ],
      },
    );
  // No Offer or imported aggregate rating: this site does not transact and external review eligibility needs separate validation.
  const head = `<title>${esc(title)}</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${esc(canonical)}"><meta name="robots" content="${pathname === "/admin" || pathname === "/favorites" || path.includes("?") || status === 404 ? "noindex,follow" : "index,follow"}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${esc(canonical)}"><meta property="og:type" content="${p ? "product" : "website"}"><meta property="og:image" content="${esc(origin + (p?.images?.[0]?.url || "/images/M001.webp"))}"><meta name="twitter:card" content="summary_large_image"><script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replaceAll("<", "\\u003c")}</script>`;
  const list = c ? products.filter((p: any) => p.categories.includes(c.slug)) : products;
  const body = renderToStaticMarkup(
    <div style={{ padding: "40px", fontFamily: "Georgia,serif", background: "#f8f7f3" }}>
      <nav>
        <a href="/">INFINIE SP</a> · <a href="/catalog">Коллекция</a> ·{" "}
        <a href="/about">О бренде</a>
      </nav>
      <main>
        <h1>
          {status === 404
            ? "Страница не найдена"
            : p?.name ||
              c?.name ||
              (pathname === "/"
                ? "Простота. Вне времени."
                : pathname === "/about"
                  ? "О бренде INFINIE SP"
                  : "Коллекция INFINIE SP")}
        </h1>
        {p ? (
          <>
            <img
              src={p.images[0]?.url}
              alt={p.images[0]?.alt || p.name}
              style={{ maxWidth: "400px" }}
            />
            <p>{p.description}</p>
            <dl>
              {p.attributes.map((a: any) => (
                <React.Fragment key={a.name}>
                  <dt>{a.name}</dt>
                  <dd>{a.values.map((v: any) => v.name).join(", ")}</dd>
                </React.Fragment>
              ))}
            </dl>
            <p>Цена от {p.price} ₸ · подтверждена 12.10.2026</p>
            {p.links.map((l: any) => (
              <p key={l.color}>
                <a href={l.url} target="_blank" rel="noopener noreferrer">
                  Купить на Kaspi — {l.color}
                </a>
              </p>
            ))}
          </>
        ) : pathname === "/about" ? (
          <p>{settings.about}</p>
        ) : pathname === "/privacy" ? (
          <p>{settings.privacy}</p>
        ) : pathname === "/terms" ? (
          <p>{settings.terms}</p>
        ) : pathname === "/contacts" ? (
          <p>{settings.contact || "Контакты пока не опубликованы"}</p>
        ) : pathname === "/admin" ? (
          <p>Защищённая административная панель</p>
        ) : status === 404 ? (
          <a href="/catalog">Вернуться в каталог</a>
        ) : (
          <>
            <p>{c?.description || description}</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "20px" }}>
              {list.map((p: any) => (
                <article key={p.id}>
                  <a href={"/product/" + p.slug}>
                    <img src={p.images[0]?.thumb || p.images[0]?.url} alt={p.name} width="200" />
                    <h2>{p.name}</h2>
                  </a>
                  <p>{p.short_description}</p>
                </article>
              ))}
            </div>
          </>
        )}
      </main>
    </div>,
  );
  return { status, head, body };
}
export function applySeo(html: string, seo: { head: string; body: string }) {
  return html
    .replace(/<title>[\s\S]*?<\/title>/, "")
    .replace(/<meta name="description"[^>]*>/g, "")
    .replace("</head>", seo.head + "</head>")
    .replace('<div id="root"></div>', '<div id="root">' + seo.body + "</div>")
    .replace('<html lang="en">', '<html lang="ru">');
}
export async function seoEndpoint(path: string, origin: string) {
  if (path === "/robots.txt")
    return {
      type: "text/plain",
      body: `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nDisallow: /favorites\nSitemap: ${origin}/sitemap.xml\n`,
    };
  if (path === "/sitemap.xml") {
    const { products, categories } = await getCatalog();
    const paths = [
      "/",
      "/catalog",
      "/about",
      "/terms",
      "/privacy",
      "/contacts",
      ...products.map((p: any) => "/product/" + p.slug),
      ...categories
        .filter((c: any) => products.some((p: any) => p.categories.includes(c.slug)))
        .map((c: any) => "/category/" + c.slug),
    ];
    return {
      type: "application/xml",
      body:
        '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
        paths.map((p) => "<url><loc>" + esc(origin + p) + "</loc></url>").join("") +
        "</urlset>",
    };
  }
  return null;
}
