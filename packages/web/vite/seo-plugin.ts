import type { Plugin } from "vite";
export default function seoPlugin(): Plugin {
  return {
    name: "catalog-seo",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url || "/", `http://${req.headers.host}`);
        if (url.pathname !== "/robots.txt" && url.pathname !== "/sitemap.xml") return next();
        try {
          const m = await server.ssrLoadModule("/src/api/lib/seo.tsx");
          const r = await m.seoEndpoint(url.pathname, process.env.WEBSITE_URL || url.origin);
          res.setHeader("Content-Type", r.type + "; charset=utf-8");
          res.end(r.body);
        } catch {
          res.statusCode = 500;
          res.end("SEO endpoint error");
        }
      });
    },
    transformIndexHtml: {
      order: "pre",
      async handler(html, ctx) {
        if (!ctx.server) return html;
        const m = await ctx.server.ssrLoadModule("/src/api/lib/seo.tsx");
        const seo = await m.seoPage(
          ctx.originalUrl || "/",
          process.env.WEBSITE_URL || "http://localhost:4200",
        );
        return m.applySeo(html, seo);
      },
    },
  };
}
