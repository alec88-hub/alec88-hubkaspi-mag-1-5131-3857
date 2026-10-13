# Plan
Approved: web only, supplied luxury direction, CSV prices confirmed on 2026-10-12.
- [x] Inspect source: 6 CSV UTF-8 BOM semicolon; attributes sniffer needs constrained delimiters. 7 products, 64 variants, 52 media, 675 reviews, 14 color links.
- [x] Normalize and hash-verify source assets; keep private original review fields.
- [x] Drizzle/Turso tables, Better Auth closed admin, S3 uploads, initial seed.
- [x] Real storefront, catalog URL filters, product galleries and color-bound Kaspi.
- [x] Protected CRUD, review moderation, content/categories, preview/repeatable imports and export.
- [x] SSR metadata/sitemap/robots; responsive image assets.
- [x] Build, browser+server acceptance tests, report and delivery.

Verified API integration, browser public/mobile/admin, S3 upload, production HTTP/SEO and restart persistence. Remaining limitations documented explicitly in README and delivered report. No owner admin provisioned (email not supplied).
