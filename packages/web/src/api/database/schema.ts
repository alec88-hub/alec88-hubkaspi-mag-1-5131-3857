import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
export const products = sqliteTable("catalog_products", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  sku: text("sku").notNull().unique(),
  status: text("status").notNull().default("draft"),
  data: text("data", { mode: "json" }).$type<Record<string, any>>().notNull(),
});
export const categories = sqliteTable("catalog_categories", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  data: text("data", { mode: "json" }).$type<Record<string, any>>().notNull(),
});
export const reviews = sqliteTable("catalog_reviews", {
  id: text("id").primaryKey(),
  productId: text("product_id").notNull(),
  hidden: integer("hidden", { mode: "boolean" }).notNull().default(false),
  data: text("data", { mode: "json" }).$type<Record<string, any>>().notNull(),
});
export const media = sqliteTable("catalog_media", {
  id: text("id").primaryKey(),
  data: text("data", { mode: "json" }).$type<Record<string, any>>().notNull(),
});
export const settings = sqliteTable("catalog_settings", {
  id: text("id").primaryKey(),
  data: text("data", { mode: "json" }).$type<Record<string, any>>().notNull(),
});
export const imports = sqliteTable("catalog_imports", {
  id: text("id").primaryKey(),
  date: text("date").notNull(),
  data: text("data", { mode: "json" }).$type<Record<string, any>>().notNull(),
});
export const admins = sqliteTable("catalog_admins", { email: text("email").primaryKey() });
export const redirects = sqliteTable("catalog_redirects", {
  slug: text("slug").primaryKey(),
  target: text("target").notNull(),
});

export * from "./auth-schema";
