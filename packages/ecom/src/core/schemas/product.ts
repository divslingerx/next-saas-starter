import { text, bigint, boolean, doublePrecision, timestamp, integer, index, pgTableCreator } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Create table with prefix
export const createTable = pgTableCreator((name) => `agency-app_${name}`);

// Main product table
export const product = createTable("product", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
  
  // Basic information
  title: text("title").notNull(),
  bodyHtml: text("body_html"),
  handle: text("handle").unique().notNull(),
  productType: text("product_type"),
  vendor: text("vendor"),
  status: text("status").default("draft"), // draft, active, archived
  templateSuffix: text("template_suffix"),
  
  // SEO
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  seoKeywords: text("seo_keywords"), // comma-separated keywords
  canonicalUrl: text("canonical_url"),
  socialImage: text("social_image"), // OG image URL
  
  // Publishing
  publishedAt: timestamp("published_at"),
  publishedScope: text("published_scope").default("web"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("product_handle_idx").on(table.handle),
  index("product_vendor_idx").on(table.vendor),
  index("product_type_idx").on(table.productType),
  index("product_status_idx").on(table.status),
  index("product_created_at_idx").on(table.createdAt),
  index("product_published_at_idx").on(table.publishedAt),
]);

// Product image table
export const productImage = createTable("product_image", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
  productId: bigint("product_id", { mode: "number" }).notNull(),
  
  // Image data
  src: text("src"),
  position: integer("position"),
  width: integer("width"),
  height: integer("height"),
  
  // Timestamps
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
}, (table) => [
  index("product_image_product_id_idx").on(table.productId),
]);

// Product variant table
export const productVariant = createTable("product_variant", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
  productId: bigint("product_id", { mode: "number" }).notNull(),
  inventoryItemId: bigint("inventory_item_id", { mode: "number" }),
  
  // Basic information
  title: text("title"),
  sku: text("sku"),
  barcode: text("barcode"),
  position: integer("position"),
  
  // Options
  option1: text("option1"),
  option2: text("option2"),
  option3: text("option3"),
  
  // Pricing
  price: doublePrecision("price"),
  compareAtPrice: doublePrecision("compare_at_price"),
  
  // Inventory
  inventoryQuantity: integer("inventory_quantity"),
  oldInventoryQuantity: doublePrecision("old_inventory_quantity"),
  inventoryManagement: text("inventory_management"),
  inventoryPolicy: text("inventory_policy"),
  fulfillmentService: text("fulfillment_service"),
  
  // Weight and shipping
  grams: doublePrecision("grams"),
  weight: doublePrecision("weight"),
  weightUnit: text("weight_unit"),
  requiresShipping: boolean("requires_shipping"),
  
  // Other fields
  taxable: boolean("taxable"),
  imageId: bigint("image_id", { mode: "number" }),
  
  // Timestamps
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
}, (table) => [
  index("product_variant_product_id_idx").on(table.productId),
  index("product_variant_sku_idx").on(table.sku),
  index("product_variant_barcode_idx").on(table.barcode),
]);

// Product options table
export const productOptions = createTable("product_options", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
  productId: bigint("product_id", { mode: "number" }).notNull(),
  
  name: text("name"),
  position: integer("position"),
}, (table) => [
  index("product_options_product_id_idx").on(table.productId),
]);

// Product option values table
export const productOptionValues = createTable("product_option_values", {
  productId: bigint("product_id", { mode: "number" }).notNull(),
  productOptionId: bigint("product_option_id", { mode: "number" }),
  index: integer("index"),
  value: text("value"),
}, (table) => [
  index("product_option_values_product_id_idx").on(table.productId),
]);

// Product metafield table
export const productMetafield = createTable("product_metafield", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
  productId: bigint("product_id", { mode: "number" }).notNull(),
  
  // Metafield data
  namespace: text("namespace"),
  key: text("key"),
  value: text("value"),
  type: text("type"),
  description: text("description"),
  
  // Timestamps
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
}, (table) => [
  index("product_metafield_product_id_idx").on(table.productId),
  index("product_metafield_namespace_key_idx").on(table.namespace, table.key),
]);

// Collection product junction table
export const collectionProduct = createTable("collection_product", {
  collectionId: bigint("collection_id", { mode: "number" }).notNull(),
  productId: bigint("product_id", { mode: "number" }).notNull(),
}, (table) => [
  index("collection_product_collection_id_idx").on(table.collectionId),
  index("collection_product_product_id_idx").on(table.productId),
]);

// Product variant option table (additional variant metadata)
export const productVariantOption = createTable("product_variant_option", {
  productId: bigint("product_id", { mode: "number" }).notNull(),
  productVariantId: bigint("product_variant_id", { mode: "number" }).notNull(),
  name: text("name"),
  value: text("value"),
}, (table) => [
  index("product_variant_option_product_id_idx").on(table.productId),
  index("product_variant_option_variant_id_idx").on(table.productVariantId),
]);

// Product variant contextual pricing
export const productVariantContextualPricing = createTable("product_variant_contextual_pricing", {
  productId: text("product_id").notNull(),
  productVariantId: text("product_variant_id").notNull(),
  contextCountryCode: text("context_country_code"),
  
  // Contextual pricing
  contextualPricingPriceAmount: doublePrecision("contextual_pricing_price_amount"),
  contextualPricingPriceCurrencyCode: text("contextual_pricing_price_currency_code"),
  contextualPricingCompareAtPriceAmount: doublePrecision("contextual_pricing_compare_at_price_amount"),
  contextualPricingCompareAtPriceCurrencyCode: text("contextual_pricing_compare_at_price_currency_code"),
}, (table) => [
  index("product_variant_contextual_pricing_product_id_idx").on(table.productId),
  index("product_variant_contextual_pricing_variant_id_idx").on(table.productVariantId),
]);

// Inventory item table
export const inventoryItem = createTable("inventory_item", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
  
  // Basic information
  sku: text("sku"),
  cost: text("cost"),
  countryCodeOfOrigin: text("country_code_of_origin"),
  provinceCodeOfOrigin: text("province_code_of_origin"),
  
  // Flags
  requiresShipping: boolean("requires_shipping"),
  tracked: boolean("tracked"),
  
  // Timestamps
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
}, (table) => [
  index("inventory_item_sku_idx").on(table.sku),
]);

// Inventory level table
export const inventoryLevel = createTable("inventory_level", {
  inventoryItemId: bigint("inventory_item_id", { mode: "number" }).notNull(),
  locationId: bigint("location_id", { mode: "number" }).notNull(),
  
  available: doublePrecision("available"),
  updatedAt: timestamp("updated_at"),
}, (table) => [
  index("inventory_level_item_id_idx").on(table.inventoryItemId),
  index("inventory_level_location_id_idx").on(table.locationId),
]);

// Create Zod schemas for validation
export const insertProductSchema = createInsertSchema(product);
export const selectProductSchema = createSelectSchema(product);

export const insertProductImageSchema = createInsertSchema(productImage);
export const selectProductImageSchema = createSelectSchema(productImage);

export const insertProductVariantSchema = createInsertSchema(productVariant, {
  requiresShipping: z.boolean().optional(),
  taxable: z.boolean().optional(),
});
export const selectProductVariantSchema = createSelectSchema(productVariant);

export const insertProductOptionsSchema = createInsertSchema(productOptions);
export const selectProductOptionsSchema = createSelectSchema(productOptions);

export const insertProductMetafieldSchema = createInsertSchema(productMetafield);
export const selectProductMetafieldSchema = createSelectSchema(productMetafield);

export const insertInventoryItemSchema = createInsertSchema(inventoryItem, {
  requiresShipping: z.boolean().optional(),
  tracked: z.boolean().optional(),
});
export const selectInventoryItemSchema = createSelectSchema(inventoryItem);

export const insertInventoryLevelSchema = createInsertSchema(inventoryLevel);
export const selectInventoryLevelSchema = createSelectSchema(inventoryLevel);

// Type exports
export type Product = typeof product.$inferSelect;
export type NewProduct = typeof product.$inferInsert;

export type ProductImage = typeof productImage.$inferSelect;
export type NewProductImage = typeof productImage.$inferInsert;

export type ProductVariant = typeof productVariant.$inferSelect;
export type NewProductVariant = typeof productVariant.$inferInsert;

export type ProductOptions = typeof productOptions.$inferSelect;
export type NewProductOptions = typeof productOptions.$inferInsert;

export type ProductMetafield = typeof productMetafield.$inferSelect;
export type NewProductMetafield = typeof productMetafield.$inferInsert;

export type InventoryItem = typeof inventoryItem.$inferSelect;
export type NewInventoryItem = typeof inventoryItem.$inferInsert;

export type InventoryLevel = typeof inventoryLevel.$inferSelect;
export type NewInventoryLevel = typeof inventoryLevel.$inferInsert;