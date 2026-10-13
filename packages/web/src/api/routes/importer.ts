import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import Papa from "papaparse";
import { unzipSync } from "fflate";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { admin } from "../middleware/auth";
import { db } from "../database";
import * as s from "../database/schema";
import { s3, bucket, readObject, saveObject, imageUrl } from "../lib/storage";
import { validKaspi } from "../lib/catalog";
const inputFile = z.object({
  key: z.string().startsWith("imports/"),
  filename: z.string(),
  mapping: z.record(z.string(), z.string()).optional(),
});
function json(v: any, def: any) {
  try {
    return typeof v === "string" ? JSON.parse(v) : v || def;
  } catch {
    return def;
  }
}
function safePath(n: string) {
  return (
    !n.startsWith("/") && !n.includes("\\") && !n.split("/").includes("..") && !n.includes("\0")
  );
}
async function previewFile(input: z.infer<typeof inputFile>) {
  const bytes = await readObject(input.key);
  if (bytes.length > 30 * 1024 * 1024)
    throw new ORPCError("BAD_REQUEST", { message: "Файл больше 30 МБ" });
  const errors: string[] = [];
  const warnings: string[] = [];
  const existing = await db.select().from(s.products);
  const known = new Map(existing.map((p) => [p.id, p.data]));
  const mediaRows = await db.select().from(s.media);
  const media = new Map(mediaRows.map((m) => [m.id, m.data]));
  let kind = "products",
    rows: any[] = [],
    columns: string[] = [],
    delimiter = "";
  if (input.filename.toLowerCase().endsWith(".zip")) {
    kind = "images";
    let size = 0;
    const files = unzipSync(bytes, {
      filter: (f) => {
        if (!safePath(f.name)) throw Error("Небезопасный путь ZIP");
        size += f.originalSize;
        if (size > 150 * 1024 * 1024 || f.originalSize > 15 * 1024 * 1024)
          throw Error("Превышен размер распакованного ZIP");
        return /\.(jpg|jpeg|png|webp)$/i.test(f.name) && !f.name.includes("__MACOSX");
      },
    });
    for (const [name, b] of Object.entries(files)) {
      const sharp = (await import("sharp")).default;
      try {
        const meta = await sharp(b, { limitInputPixels: 40_000_000 }).metadata();
        if (!meta.width) throw Error("Invalid");
        const filename = name.split("/").pop()!;
        const id = filename.split("_")[0];
        const originalKey = "catalog/" + id + "-" + crypto.randomUUID() + ".webp";
        const webp = await sharp(b)
          .resize({ width: 1200, withoutEnlargement: true })
          .webp({ quality: 86 })
          .toBuffer();
        await saveObject(originalKey, webp, "image/webp");
        rows.push({
          id,
          storageKey: originalKey,
          url: await imageUrl(originalKey),
          original: filename,
          alt: media.get(id)?.alt || filename,
          width: meta.width,
          height: meta.height,
          productIds: existing
            .filter((p) => p.data.images?.some((i: any) => i.id === id))
            .map((p) => p.id),
        });
        if (!media.has(id)) warnings.push(id + ": нет сопоставления — привяжите в галерее товара");
      } catch (e) {
        errors.push(name + ": " + String(e));
      }
    }
  } else if (input.filename.endsWith(".txt")) {
    kind = "links";
    const text = new TextDecoder("utf-8").decode(bytes);
    const alias: Record<string, string> = {
      чёрная: "Черный",
      белая: "Белый",
      фисташковая: "Фисташковый",
      "тёмно-синяя": "Темно-синий",
      "серо-голубая": "Серо-голубой",
      песочная: "Песочный",
      розовая: "Розовый",
    };
    for (const b of text.split(/\n(?=\d+\.)/)) {
      const id = b.match(/сайт ID (\d+), SKU ([^)]+)/);
      if (!id) continue;
      const product = existing.find((p) => p.data.woo_id === id[1] && p.sku === id[2]);
      if (!product) {
        errors.push("Не найден ID/SKU " + id[1]);
        continue;
      }
      const links = [...b.matchAll(/— ([^:]+): (https:\/\/\S+)/g)].map((m) => ({
        color: alias[m[1]] || m[1],
        url: m[2],
      }));
      for (const l of links) if (!validKaspi(l.url)) errors.push("Некорректный URL " + l.url);
      rows.push({ id: product.id, links });
    }
    if (!rows.length) errors.push("Не обнаружены блоки с ID, SKU и ссылками");
  } else {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes).replace(/^﻿/, "");
    const parsed = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: "greedy",
      delimitersToGuess: [";", ",", "\t", "|"],
    });
    columns = parsed.meta.fields || [];
    delimiter = parsed.meta.delimiter;
    parsed.errors.forEach((e) => errors.push("CSV " + e.message));
    let data = parsed.data.map((r) => {
      if (!input.mapping) return r;
      const result = { ...r };
      for (const [field, column] of Object.entries(input.mapping))
        if (column) result[field] = r[column];
      return result;
    });
    if (columns.includes("product_key")) kind = "reviews";
    else if (columns.includes("parent_key")) kind = "variants";
    else if (columns.includes("used_by")) kind = "manifest";
    else if (columns.includes("taxonomy")) kind = "attributes";
    else if (columns.includes("parent_slug")) kind = "categories";
    const seen = new Set<string>();
    for (const [i, r] of data.entries()) {
      let id = r.key || r.id;
      if (kind === "manifest") id = r.filename?.split("_")[0];
      if (!id) {
        errors.push("Строка " + (i + 2) + ": нет key / id");
        continue;
      }
      if (seen.has(id)) {
        warnings.push("Дубликат " + id + " пропущен");
        continue;
      }
      seen.add(id);
      if (kind === "products") {
        if (!r.name || !r.sku || !r.slug) {
          errors.push(id + ": обязательны name, sku, slug");
          continue;
        }
        const prev = known.get(id) || {};
        const ims = [r.featured_media_key, ...json(r.gallery_media_keys, [])]
          .filter(Boolean)
          .map((k) => media.get(k))
          .filter(Boolean);
        const price = r.price_regular ? Number(r.price_regular) : prev.price;
        rows.push({
          ...prev,
          id,
          woo_id: r.woo_id || prev.woo_id,
          sku: r.sku,
          name: r.name,
          slug: r.slug,
          brand: prev.brand || "",
          status: r.status === "publish" ? "published" : r.status || "draft",
          categories: json(r.categories, prev.categories || []),
          attributes: json(r.attributes, prev.attributes || []),
          images: ims.length ? ims : prev.images || [],
          links: json(r.kaspi_links, prev.links || []),
          variants: prev.variants || [],
          description: r.description || "",
          short_description: r.short_description || "",
          price,
          priceDate: prev.priceDate || "",
          featured: prev.featured || false,
          seoTitle: r.seoTitle || r.name,
          seoDescription: r.seoDescription || r.short_description || "",
          source: r,
        });
        if (!ims.length && !prev.images?.length) warnings.push(id + ": нет фотографий");
      } else if (kind === "reviews") {
        if (!known.has(r.product_key) || Number(r.rating) < 1 || Number(r.rating) > 5) {
          errors.push(id + ": неверная связь/оценка");
          continue;
        }
        rows.push({ ...r, id });
      } else if (kind === "variants") {
        if (!known.has(r.parent_key)) {
          errors.push(id + ": не найден parent_key");
          continue;
        }
        const a = json(r.attributes, {});
        rows.push({
          id,
          parentId: r.parent_key,
          sku: r.sku,
          color: a.pa_color?.name || "",
          size: a.pa_size?.name || "",
          price: r.price_regular ? Number(r.price_regular) : null,
          image: r.image_media_key,
          source: r,
        });
      } else if (kind === "categories") rows.push({ ...r, id, key: id });
      else rows.push({ ...r, id });
    }
  }
  const ids = rows.map((r) => r.id);
  let created = ids.filter((id) => !known.has(id)).length;
  if (kind !== "products") created = 0;
  const report = {
    kind,
    filename: input.filename,
    columns,
    delimiter,
    count: rows.length,
    created,
    updated: rows.length - created,
    errors,
    warnings,
    preview: rows
      .slice(0, 5)
      .map((r) => ({
        id: r.id,
        name: r.name || r.author || r.original || r.sku || r.taxonomy,
        product: r.product_key || r.parentId || r.productIds,
        links: r.links,
      })),
  };
  const planId = "plan-" + crypto.randomUUID();
  await db.insert(s.settings).values({ id: planId, data: { ownerKey: input.key, rows, report } });
  return { ...report, planId };
}
export const importer = {
  presign: admin
    .input(
      z.object({
        filename: z.string().max(200),
        size: z.number().max(30 * 1024 * 1024),
        contentType: z.string(),
      }),
    )
    .handler(async ({ input, context }) => {
      if (!/\.(csv|txt|zip|jpg|jpeg|png|webp)$/i.test(input.filename))
        throw new ORPCError("BAD_REQUEST", { message: "Недопустимый тип файла" });
      const key =
        "imports/" +
        context.user.id +
        "/" +
        crypto.randomUUID() +
        "-" +
        input.filename.replace(/[^a-z0-9_.-]/gi, "_");
      return {
        key,
        url: await getSignedUrl(
          s3,
          new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            ContentLength: input.size,
            ContentType: input.contentType,
          }),
          { expiresIn: 600 },
        ),
      };
    }),
  preview: admin.input(inputFile).handler(async ({ input, context }) => {
    if (!input.key.startsWith("imports/" + context.user.id + "/")) throw new ORPCError("FORBIDDEN");
    return previewFile(input);
  }),
  confirm: admin
    .input(z.object({ planId: z.string().startsWith("plan-") }))
    .handler(async ({ input, context }) => {
      const plan = (await db.select().from(s.settings).where(eq(s.settings.id, input.planId)))[0]
        ?.data;
      if (!plan || !plan.ownerKey.startsWith("imports/" + context.user.id + "/"))
        throw new ORPCError("NOT_FOUND");
      if (plan.report.errors.length)
        throw new ORPCError("BAD_REQUEST", { message: "Исправьте ошибки перед импортом" });
      if (plan.confirmed) return { ok: true, count: plan.report.count, repeated: true };
      await db.transaction(async (tx) => {
        for (const r of plan.rows) {
          switch (plan.report.kind) {
            case "products":
              for (const l of r.links || [])
                if (!validKaspi(l.url)) throw new ORPCError("BAD_REQUEST");
              await tx
                .insert(s.products)
                .values({ id: r.id, slug: r.slug, sku: r.sku, status: r.status, data: r })
                .onConflictDoUpdate({
                  target: s.products.id,
                  set: { slug: r.slug, sku: r.sku, status: r.status, data: r },
                });
              break;
            case "categories":
              await tx
                .insert(s.categories)
                .values({ id: r.id, slug: r.slug, data: r })
                .onConflictDoUpdate({ target: s.categories.id, set: { slug: r.slug, data: r } });
              break;
            case "reviews":
              await tx
                .insert(s.reviews)
                .values({ id: r.id, productId: r.product_key, hidden: false, data: r })
                .onConflictDoUpdate({
                  target: s.reviews.id,
                  set: { data: r, productId: r.product_key },
                });
              break;
            case "variants": {
              const p = (
                await tx.select().from(s.products).where(eq(s.products.id, r.parentId))
              )[0];
              const v = {
                ...r,
                kaspi_url: p.data.links?.find((l: any) => l.color === r.color)?.url || "",
              };
              const variants = [...(p.data.variants || []).filter((v: any) => v.id !== r.id), v];
              await tx
                .update(s.products)
                .set({
                  data: {
                    ...p.data,
                    variants,
                    price: Math.min(
                      ...variants.map((v: any) => v.price).filter((v: any) => v !== null),
                    ),
                  },
                })
                .where(eq(s.products.id, p.id));
              break;
            }
            case "links": {
              const p = (await tx.select().from(s.products).where(eq(s.products.id, r.id)))[0];
              await tx
                .update(s.products)
                .set({
                  data: {
                    ...p.data,
                    links: r.links,
                    variants: (p.data.variants || []).map((v: any) => ({
                      ...v,
                      kaspi_url: r.links.find((l: any) => l.color === v.color)?.url || "",
                    })),
                  },
                })
                .where(eq(s.products.id, r.id));
              break;
            }
            case "images": {
              await tx
                .insert(s.media)
                .values({ id: r.id, data: r })
                .onConflictDoUpdate({ target: s.media.id, set: { data: r } });
              for (const id of r.productIds) {
                const p = (await tx.select().from(s.products).where(eq(s.products.id, id)))[0];
                await tx
                  .update(s.products)
                  .set({
                    data: {
                      ...p.data,
                      images: p.data.images.map((m: any) => (m.id === r.id ? r : m)),
                    },
                  })
                  .where(eq(s.products.id, id));
              }
              break;
            }
            default:
              await tx
                .insert(s.settings)
                .values({ id: "source-" + plan.report.kind + "-" + r.id, data: r })
                .onConflictDoUpdate({ target: s.settings.id, set: { data: r } });
          }
        }
        await tx
          .insert(s.imports)
          .values({ id: input.planId, date: new Date().toISOString(), data: plan.report });
        await tx
          .update(s.settings)
          .set({ data: { ...plan, confirmed: true } })
          .where(eq(s.settings.id, input.planId));
      });
      return { ok: true, count: plan.report.count };
    }),
  image: admin
    .input(z.object({ key: z.string().startsWith("imports/"), filename: z.string() }))
    .handler(async ({ input, context }) => {
      if (!input.key.startsWith("imports/" + context.user.id + "/"))
        throw new ORPCError("FORBIDDEN");
      const b = await readObject(input.key);
      if (b.length > 15 * 1024 * 1024) throw new ORPCError("BAD_REQUEST");
      const sharp = (await import("sharp")).default;
      const webp = await sharp(b, { limitInputPixels: 40_000_000 })
        .resize({ width: 1200, withoutEnlargement: true })
        .webp({ quality: 86 })
        .toBuffer();
      const id = "IMG-" + crypto.randomUUID();
      const storageKey = "catalog/" + id + ".webp";
      await saveObject(storageKey, webp, "image/webp");
      const m = {
        id,
        storageKey,
        url: await imageUrl(storageKey),
        original: input.filename,
        alt: input.filename,
      };
      await db.insert(s.media).values({ id, data: m });
      return m;
    }),
};
