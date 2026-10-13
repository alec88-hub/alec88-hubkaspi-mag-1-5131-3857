import { eq, and } from "drizzle-orm";
import { imageUrl } from "./storage";
import { db } from "../database";
import * as s from "../database/schema";
export function validKaspi(url: string) {
  try {
    const u = new URL(url);
    return (
      u.protocol === "https:" &&
      u.hostname === "kaspi.kz" &&
      /^\/shop\/p\/[a-z0-9-]+-\d+\/?$/i.test(u.pathname) &&
      !u.search &&
      !u.hash
    );
  } catch {
    return false;
  }
}
export function publicProduct(p: Record<string, any>) {
  const { source: _source, ...rest } = p;
  return {
    ...rest,
    images: (p.images || []).map(({ source: _source, ...i }: any) => i),
    variants: (p.variants || []).map(({ source: _source, ...v }: any) => ({
      ...v,
      kaspi_url: validKaspi(v.kaspi_url) ? v.kaspi_url : "",
    })),
    links: (p.links || []).filter((l: any) => validKaspi(l.url)),
  };
}
export async function getCatalog() {
  const [ps, cs, rs, st] = await Promise.all([
    db.select().from(s.products).where(eq(s.products.status, "published")),
    db.select().from(s.categories),
    db.select().from(s.reviews).where(eq(s.reviews.hidden, false)),
    db.select().from(s.settings).where(eq(s.settings.id, "store")),
  ]);
  const urls = new Map<string, string>();
  await Promise.all(
    ps.flatMap((p) =>
      (p.data.images || [])
        .filter((m: any) => m.storageKey)
        .map(async (m: any) => urls.set(m.storageKey, await imageUrl(m.storageKey))),
    ),
  );
  return {
    products: ps.map((p) => {
      const r = rs.filter((r) => r.productId === p.id);
      const rating = r.length
        ? r.reduce((sum, v) => sum + Number(v.data.rating || 0), 0) / r.length
        : null;
      return publicProduct({
        ...p.data,
        images: (p.data.images || []).map((m: any) => ({
          ...m,
          url: m.storageKey ? urls.get(m.storageKey) : m.url,
        })),
        status: p.status,
        reviewCount: r.length,
        rating: rating ? Math.round(rating * 100) / 100 : null,
      });
    }),
    categories: cs.map((c) => c.data),
    settings: st[0]?.data || {},
  };
}
export async function productReviews(id: string, page = 1) {
  const rs = await db
    .select()
    .from(s.reviews)
    .where(and(eq(s.reviews.productId, id), eq(s.reviews.hidden, false)));
  const text = rs
    .filter((r) => r.data.text?.trim())
    .sort((a, b) => b.data.date.localeCompare(a.data.date));
  return {
    total: rs.length,
    textCount: text.length,
    items: text
      .slice((page - 1) * 6, page * 6)
      .map((r) => ({
        id: r.id,
        author: r.data.author,
        date: r.data.date,
        rating: r.data.rating,
        text: r.data.text,
        source: "Kaspi · импортированные отзывы",
      })),
  };
}
