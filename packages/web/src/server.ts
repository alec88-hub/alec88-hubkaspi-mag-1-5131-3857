import app from "./api";
import { seoPage, seoEndpoint, applySeo } from "./api/lib/seo";
const port = Number(process.env.PORT || 4200);
const dir = new URL("../dist/", import.meta.url).pathname;
Bun.serve({
  port,
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api")) return app.fetch(request);
    const origin = process.env.WEBSITE_URL || url.origin;
    try {
      const endpoint = await seoEndpoint(url.pathname, origin);
      if (endpoint)
        return new Response(endpoint.body, {
          headers: { "Content-Type": endpoint.type + "; charset=utf-8" },
        });
      let path;
      try {
        path = decodeURIComponent(url.pathname);
      } catch {
        return new Response("Invalid URL", { status: 400 });
      }
      if (path.split("/").includes("..") || path.includes("\\"))
        return new Response("Forbidden", { status: 403 });
      if (path !== "/") {
        const f = Bun.file(dir + path.slice(1));
        if (await f.exists())
          return new Response(f, { headers: { "Cache-Control": "public, max-age=3600" } });
      }
      const seo = await seoPage(url.pathname + url.search, origin);
      if (seo.redirect) return Response.redirect(origin + seo.redirect, 301);
      const html = await Bun.file(dir + "index.html").text();
      return new Response(applySeo(html, seo), {
        status: seo.status,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "X-Content-Type-Options": "nosniff",
          "Referrer-Policy": "strict-origin-when-cross-origin",
        },
      });
    } catch (e) {
      console.error(e);
      return new Response('<h1>Не удалось открыть страницу</h1><a href="/">На главную</a>', {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
  },
});
console.log("SSR catalog server listening", port);
