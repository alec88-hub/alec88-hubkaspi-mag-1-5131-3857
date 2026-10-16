# INFINIE SP

Managed Bun / Vite / React / Hono / oRPC / Drizzle application. Web catalog only; no cart, payment or checkout. Purchases go to supplied color-specific Kaspi URLs.

## Reference landing restyle

The supplied `ref1` landing now guides the whole storefront and admin: bone/sand backgrounds, Instrument Serif / Georgia headings, Work Sans / system body text, red pill actions, original eagle logo, reference photos and Russian copy voice. Cyrillic uses the intended Georgia/system fallbacks. Home, catalog, category, product, favorites, information, login and admin screens share these styles. Product facts and imported reviews remain source-based; reference tracking scripts, invented reviews and unsupported guarantees were not copied.

Original reference assets are retained in `packages/web/public/reference/`. Previous home styles and database settings are backed up privately in `data/reference-backup/`. The catalog remains 7 products, 64 variants, 52 original product images, 675 reviews and 14 color-specific Kaspi links.

After restyling, lint/build, 41 API integration assertions, storefront gallery/color/menu checks and real admin edit/upload tests passed. An additional 24 page/viewport checks at 1440, 768 and 390px found no horizontal overflow, broken images or JavaScript errors; results are in `data/reference-test-results.json`.

## Run

```sh
bun install
bun run dev                       # development, assigned port from __ports.cjs
bun run build                     # typecheck + production assets
bun run start                     # PM2, SSR production entrypoint src/server.ts
```

The current preview uses the production SSR server on the website port in `__ports.cjs`. `.env` at root contains provisioned Turso, Tigris, auth and platform settings. Never commit it. `.env.example` lists keys without values. Set `WEBSITE_URL` to the real public HTTPS URL before publishing; set auth trusted origins in `packages/web/src/api/auth.ts` if an additional domain is used. Publish and custom domain are controlled by Runable UI.

## First administrator

No default password, public sign-up or first-user escalation. Run:

```sh
bun --env-file=.env scripts/create-admin.ts YOUR_EMAIL
```

This allowlists the exact email for managed Google login at `/admin`. For initial email/password access, securely set `ADMIN_PASSWORD` in the root `.env` **temporarily**, then run the same command. Remove `ADMIN_PASSWORD` afterward. Do not send secrets in chat or commit them. Passwords are hashed with Better Auth. The allowlist is checked by the API for every protected procedure. The Google broker flow is wired, but needs verification with the owner's real account after allowlisting; email/password login was browser-tested.

## Data / migrations

Relational Turso SQLite database, managed by Drizzle. Tables: catalog_products, catalog_categories, catalog_reviews, catalog_media, catalog_settings, catalog_imports, catalog_redirects, catalog_admins, and Better Auth tables. Product attributes, media references and variants are stored in structured JSON columns. Public and admin use the same database. Product slug/SKU and imported keys are unique. Reviews include private original source fields; public procedures expose only author, text, date and rating.

```sh
bun run db:generate
bun run db:migrate                # new database
bun run db:push                   # development only
python scripts/normalize.py       # local source normalization; attachment paths in script
bun --env-file=.env scripts/seed.ts # initial seed, on-conflict-do-nothing
```

Initial CSV files are retained privately in `data/source/`; normalized snapshot is `data/catalog.json`; import diagnostics in `data/import-report.json`. CSVs are UTF-8 BOM with semicolon separators. All 52 original images retain filenames in `packages/web/public/images/`, with 600px and 1200px WebP variants. The home hero uses the supplied reference `hero-white.jpg`; product galleries retain their original catalog photos. Originals and WebP copies are also stored under `catalog/` in Tigris. Browser image uploads go directly to S3 via scoped presigned PUT, are decoded with sharp, and use durable object keys. Public API refreshes signed GET URLs.

## Admin workflow

- Products: search, create, edit, publish/draft/hide, featured flag, SEO, category assignments, color-specific Kaspi URLs, gallery and main image.
- Delete means hide, retaining original data.
- Categories: names, slug, parent, description, image field, ordering and SEO fields.
- Reviews: search, hide/unhide and fix product linkage.
- Content: main banner/texts, philosophy, contacts, privacy and purchase information.
- Import: upload CSV / ZIP / TXT, inspect preview and errors, map product CSV columns, confirm before database write. Stable keys update records, no delete-by-omission. Re-confirming the same plan does not repeat the write.
- CSV export includes names, SKU, slug, status, descriptions, categories, Kaspi links and SEO.
- ZIP has path traversal, expanded-size and image decode limits. Unknown media remains in library for manual assignment. Supported text link format is the supplied numbered ID/SKU/color format.

When importing a fresh catalog, use categories, images/manifest, products, variants, reviews and links in dependency order. For the supplied existing catalog, relationships already exist. Arbitrary unrelated ZIP filenames cannot be auto-linked and require manual library assignment. Preview counts for non-product imports report processed records rather than exact new/updated counts.

## Backups

```sh
# Run from packages/web
bun --env-file=../../.env scripts/backup.ts
bun --env-file=../../.env scripts/restore.ts ../../data/backup.json --confirm
```

Backups include catalog/source review data (private) and are written locally and to private Tigris `backups/`. They exclude auth accounts/sessions. Restore upserts by primary key and never deletes omitted records. Keep provider-managed database backups and enable a retention policy; automatic backup cadence is not configured.

## Tests

```sh
bun run lint
bun run build
python tests/browser.py
# from packages/web:
bun --env-file=../../.env scripts/integration.ts
bun --env-file=../../.env scripts/admin-browser.ts
```

Integration tests create temporary accounts/products, clean them up, verify admin roles, CRUD, URL rejection, real CSV and ZIP previews, repeat review import, SSR, sitemap and robots. Browser tests verify real email/password admin login, edit/save and direct browser S3 import. Run browser tests AFTER integration tests; integration temporarily publishes a test product. Chrome executable is `/usr/bin/google-chrome`. `data/test-results.json` records API assertions.

## SEO

Production `src/server.ts` renders crawlable React HTML for product/category/catalog pages, per-page metadata, canonical, Open Graph, Product/Organization/WebSite/Breadcrumb JSON-LD, sitemap/robots and 301 old-slug redirects. React replaces the server fallback after mount (not full React hydration). Unknown pages return 404 in production; Vite preview may return 200 for its fallback. Product offers and imported rating JSON-LD intentionally omitted pending eligibility verification. Dynamic metadata is generated from the live database. Search/filter pages canonicalize to base paths and are noindex. No store GA4/Metрика IDs enabled; platform default telemetry remains template-managed.

## Remaining limitations before public launch

- Assign real admin email; real-account Google flow not exercised.
- Fill real contact details and approve legal text; legal drafts are not legal advice.
- Locale structure is prepared with UTF-8/settings, but Kazakh translations and language switching are not implemented.
- Admin variant/attribute editing uses JSON editors rather than individual form rows.
- The supplied eagle logo is displayed sitewide. Arbitrary replacement logo upload/display, editable home category selection, category nesting visualization/order/image application and draft-specific preview are not fully implemented.
- Newness is not fabricated. Favorites work locally; recently viewed IDs are saved, but a recently viewed UI section is not displayed.
- CSV decoder supports UTF-8/BOM, common separators; legacy encodings require conversion to UTF-8. Advanced arbitrary review/variant column mapping is not implemented.
- Manifest and global attribute imports preserve source records; they do not fully rebuild relationships in an empty database. SKU/slug collision errors are enforced by DB but not all detected in preview. No dry-run diff view or rollback UI.
- No live Kaspi price/availability synchronization. Source prices confirmed 12.10.2026; final price and size are checked on Kaspi. URL syntax and exact source association checked; current external Kaspi reachability was not independently retested.
- Store analytics consent/GA4/Метрика, newsletter, Q&A and automated backup scheduling are not implemented. Platform telemetry remains in the managed template.
- No full security audit, load test, Core Web Vitals measurement, external Google rich-results validation or complete WCAG certification.
