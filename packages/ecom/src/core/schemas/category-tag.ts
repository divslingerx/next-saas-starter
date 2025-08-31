import { text, bigint, integer, timestamp, index, pgTableCreator } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Create table with prefix
export const createTable = pgTableCreator((name) => `agency-app_${name}`);

// Product categories table - hierarchical structure
export const productCategory = createTable("product_category", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  // Basic information
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  description: text("description"),
  
  // Hierarchy
  parentId: bigint("parent_id", { mode: "number" }),
  position: integer("position").default(0),
  
  // Visual
  imageUrl: text("image_url"),
  
  // SEO
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("product_category_slug_idx").on(table.slug),
  index("product_category_parent_id_idx").on(table.parentId),
  index("product_category_position_idx").on(table.position),
]);

// Junction table for products to categories
export const productToCategory = createTable("product_to_category", {
  productId: bigint("product_id", { mode: "number" }).notNull(),
  categoryId: bigint("category_id", { mode: "number" }).notNull(),
  position: integer("position").default(0),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("product_to_category_product_idx").on(table.productId),
  index("product_to_category_category_idx").on(table.categoryId),
]);

// Product tags table
export const productTag = createTable("product_tag", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  // Basic information
  name: text("name").unique().notNull(),
  slug: text("slug").unique().notNull(),
  
  // Visual
  color: text("color"), // Hex color for UI display
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("product_tag_slug_idx").on(table.slug),
  index("product_tag_name_idx").on(table.name),
]);

// Junction table for products to tags
export const productToTag = createTable("product_to_tag", {
  productId: bigint("product_id", { mode: "number" }).notNull(),
  tagId: bigint("tag_id", { mode: "number" }).notNull(),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("product_to_tag_product_idx").on(table.productId),
  index("product_to_tag_tag_idx").on(table.tagId),
]);

// Create Zod schemas for validation
export const insertProductCategorySchema = createInsertSchema(productCategory, {
  parentId: z.number().optional(),
  position: z.number().optional(),
});
export const selectProductCategorySchema = createSelectSchema(productCategory);

export const insertProductTagSchema = createInsertSchema(productTag, {
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
});
export const selectProductTagSchema = createSelectSchema(productTag);

// Type exports
export type ProductCategory = typeof productCategory.$inferSelect;
export type NewProductCategory = typeof productCategory.$inferInsert;
export type ProductTag = typeof productTag.$inferSelect;
export type NewProductTag = typeof productTag.$inferInsert;