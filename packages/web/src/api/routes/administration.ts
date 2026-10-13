import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import { admin } from "../middleware/auth";
import { db } from "../database";
import * as s from "../database/schema";
import { validKaspi } from "../lib/catalog";
const obj = z.record(z.string(), z.any());
const productInput = z.object({id:z.string().min(1),name:z.string().min(1),sku:z.string().min(1),slug:z.string().regex(/^[a-z0-9-]+$/),status:z.enum(["published","draft","hidden"]),categories:z.array(z.string()),images:z.array(z.object({id:z.string(),url:z.string().refine(v=>v.startsWith("/images/")||v.startsWith("https://"))}).passthrough()),links:z.array(z.object({color:z.string().min(1),url:z.string()})),attributes:z.array(z.object({name:z.string(),values:z.array(z.object({name:z.string()}).passthrough())}).passthrough()),variants:z.array(z.object({id:z.string(),color:z.string(),size:z.string(),price:z.number().nonnegative().nullable()}).passthrough()),price:z.number().nonnegative().nullable(),featured:z.boolean()}).passthrough();
export const administration = {
  session: admin.handler(({ context }) => ({ email: context.user.email })),
  dashboard: admin.handler(async () => ({
    products: (await db.select().from(s.products)).map((p) => ({ ...p.data, status: p.status })),
    categories: (await db.select().from(s.categories)).map((c) => c.data),
    reviews: (await db.select().from(s.reviews)).map((r) => ({
      id: r.id,
      productId: r.productId,
      hidden: r.hidden,
      ...r.data,
      kaspi_order_number: undefined,
    })),
    media: (await db.select().from(s.media)).map((m) => m.data),
    settings: (await db.select().from(s.settings))[0]?.data || {},
    imports: await db.select().from(s.imports),
  })),
  saveProduct: admin.input(productInput).handler(async ({ input }) => {
    if (!input.id || !input.name?.trim() || !input.sku?.trim() || !/^[a-z0-9-]+$/.test(input.slug))
      throw new ORPCError("BAD_REQUEST", {
        message: "Укажите название, артикул и slug (латиница, цифры, дефис)",
      });
    if (!["published", "draft", "hidden"].includes(input.status))
      throw new ORPCError("BAD_REQUEST");
    for (const l of input.links || [])
      if (l.url && !validKaspi(l.url))
        throw new ORPCError("BAD_REQUEST", { message: "Некорректная ссылка Kaspi: " + l.color });
    const old = (await db.select().from(s.products).where(eq(s.products.id, input.id)))[0];
    if (old && old.slug !== input.slug)
      await db
        .insert(s.redirects)
        .values({ slug: old.slug, target: input.slug })
        .onConflictDoUpdate({ target: s.redirects.slug, set: { target: input.slug } });
    input.variants = (input.variants || []).map((v: any) => ({
      ...v,
      kaspi_url: (input.links || []).find((l: any) => l.color === v.color)?.url || "",
    }));
    await db
      .insert(s.products)
      .values({ id: input.id, sku: input.sku, slug: input.slug, status: input.status, data: input })
      .onConflictDoUpdate({
        target: s.products.id,
        set: { sku: input.sku, slug: input.slug, status: input.status, data: input },
      });
    return { ok: true };
  }),
  deleteProduct: admin.input(z.object({ id: z.string() })).handler(async ({ input }) => {
    await db.update(s.products).set({ status: "hidden" }).where(eq(s.products.id, input.id));
    return { ok: true };
  }),
  saveCategory: admin.input(obj).handler(async ({ input }) => {
    if (!input.name?.trim() || !/^[a-z0-9-]+$/.test(input.slug) || input.parent_slug === input.slug)
      throw new ORPCError("BAD_REQUEST", { message: "Некорректное название, slug или родитель" });
    const id = input.key || crypto.randomUUID();
    await db
      .insert(s.categories)
      .values({ id, slug: input.slug, data: { ...input, key: id } })
      .onConflictDoUpdate({
        target: s.categories.id,
        set: { slug: input.slug, data: { ...input, key: id } },
      });
    return { ok: true };
  }),
  saveSettings: admin.input(obj).handler(async ({ input }) => {
    await db
      .insert(s.settings)
      .values({ id: "store", data: input })
      .onConflictDoUpdate({ target: s.settings.id, set: { data: input } });
    return { ok: true };
  }),
  moderate: admin
    .input(z.object({ id: z.string(), hidden: z.boolean(), productId: z.string() }))
    .handler(async ({ input }) => {
      const p = await db.select().from(s.products).where(eq(s.products.id, input.productId));
      if (!p.length) throw new ORPCError("BAD_REQUEST");
      await db
        .update(s.reviews)
        .set({ hidden: input.hidden, productId: input.productId })
        .where(eq(s.reviews.id, input.id));
      return { ok: true };
    }),
  export: admin.handler(async () => {
    const ps = await db.select().from(s.products);
    const rows = [
      [
        "key",
        "sku",
        "name",
        "slug",
        "status",
        "description",
        "categories",
        "kaspi_links",
        "seoTitle",
        "seoDescription",
      ],
      ...ps.map((p) => [
        p.id,
        p.sku,
        p.data.name,
        p.slug,
        p.status,
        p.data.description,
        JSON.stringify(p.data.categories),
        JSON.stringify(p.data.links),
        p.data.seoTitle,
        p.data.seoDescription,
      ]),
    ];
    return {
      filename: "infinie-products.csv",
      text:
        "﻿" +
        rows
          .map((r) => r.map((v) => '"' + String(v ?? "").replaceAll('"', '""') + '"').join(";"))
          .join("\r\n"),
    };
  }),
};
