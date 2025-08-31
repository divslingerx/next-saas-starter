import { text, bigint, boolean, timestamp, jsonb, index, pgTableCreator } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Create table with prefix
export const createTable = pgTableCreator((name) => `agency-app_${name}`);

// Product Visibility Rules - Controls who can see/buy products
export const productVisibilityRule = createTable("product_visibility_rule", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  // Rule identification
  name: text("name").notNull(),
  description: text("description"),
  
  // Rule type
  type: text("type").notNull(), // 'whitelist' or 'blacklist'
  scope: text("scope").notNull(), // 'product', 'collection', 'category', 'all'
  
  // What this rule applies to
  targetId: bigint("target_id", { mode: "number" }), // Product/Collection/Category ID
  targetType: text("target_type"), // 'product', 'collection', 'category'
  
  // Rule configuration
  active: boolean("active").default(true),
  priority: integer("priority").default(0), // Higher priority rules override lower
  
  // Date-based restrictions
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  
  // Metadata
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("product_visibility_rule_type_idx").on(table.type),
  index("product_visibility_rule_scope_idx").on(table.scope),
  index("product_visibility_rule_target_idx").on(table.targetType, table.targetId),
  index("product_visibility_rule_active_idx").on(table.active),
]);

// Links visibility rules to customer groups
export const visibilityRuleCustomerGroup = createTable("visibility_rule_customer_group", {
  ruleId: bigint("rule_id", { mode: "number" }).notNull(),
  customerGroupId: bigint("customer_group_id", { mode: "number" }).notNull(),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("visibility_rule_group_rule_idx").on(table.ruleId),
  index("visibility_rule_group_customer_idx").on(table.customerGroupId),
  index("visibility_rule_group_unique_idx").on(table.ruleId, table.customerGroupId).unique(),
]);

// Links visibility rules to specific customers
export const visibilityRuleCustomer = createTable("visibility_rule_customer", {
  ruleId: bigint("rule_id", { mode: "number" }).notNull(),
  customerId: bigint("customer_id", { mode: "number" }).notNull(),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("visibility_rule_customer_rule_idx").on(table.ruleId),
  index("visibility_rule_customer_customer_idx").on(table.customerId),
  index("visibility_rule_customer_unique_idx").on(table.ruleId, table.customerId).unique(),
]);

// Product-specific pricing for customers/groups
export const productPricing = createTable("product_pricing", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  // What product/variant
  productId: bigint("product_id", { mode: "number" }).notNull(),
  variantId: bigint("variant_id", { mode: "number" }), // Null = all variants
  
  // Who gets this price
  customerGroupId: bigint("customer_group_id", { mode: "number" }),
  customerId: bigint("customer_id", { mode: "number" }),
  
  // Pricing
  price: doublePrecision("price").notNull(),
  compareAtPrice: doublePrecision("compare_at_price"),
  
  // Quantity breaks
  minQuantity: integer("min_quantity").default(1),
  maxQuantity: integer("max_quantity"),
  
  // Currency (for multi-currency support)
  currency: text("currency").default("USD"),
  
  // Validity
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  active: boolean("active").default(true),
  
  // Priority (higher wins)
  priority: integer("priority").default(0),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("product_pricing_product_idx").on(table.productId),
  index("product_pricing_variant_idx").on(table.variantId),
  index("product_pricing_group_idx").on(table.customerGroupId),
  index("product_pricing_customer_idx").on(table.customerId),
  index("product_pricing_active_idx").on(table.active),
]);

// Catalog assignments - which catalogs a product appears in
export const catalog = createTable("catalog", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  // Catalog info
  name: text("name").notNull(),
  code: text("code").unique().notNull(),
  description: text("description"),
  
  // Settings
  isDefault: boolean("is_default").default(false), // Public catalog
  active: boolean("active").default(true),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("catalog_code_idx").on(table.code),
  index("catalog_active_idx").on(table.active),
]);

// Links catalogs to customer groups
export const catalogCustomerGroup = createTable("catalog_customer_group", {
  catalogId: bigint("catalog_id", { mode: "number" }).notNull(),
  customerGroupId: bigint("customer_group_id", { mode: "number" }).notNull(),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("catalog_group_catalog_idx").on(table.catalogId),
  index("catalog_group_customer_idx").on(table.customerGroupId),
  index("catalog_group_unique_idx").on(table.catalogId, table.customerGroupId).unique(),
]);

// Links products to catalogs
export const productCatalog = createTable("product_catalog", {
  productId: bigint("product_id", { mode: "number" }).notNull(),
  catalogId: bigint("catalog_id", { mode: "number" }).notNull(),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("product_catalog_product_idx").on(table.productId),
  index("product_catalog_catalog_idx").on(table.catalogId),
  index("product_catalog_unique_idx").on(table.productId, table.catalogId).unique(),
]);

// Import required types
import { doublePrecision, integer } from "drizzle-orm/pg-core";

// Create Zod schemas for validation
export const insertProductVisibilityRuleSchema = createInsertSchema(productVisibilityRule, {
  type: z.enum(['whitelist', 'blacklist']),
  scope: z.enum(['product', 'collection', 'category', 'all']),
  targetType: z.enum(['product', 'collection', 'category']).optional(),
  metadata: z.record(z.any()).optional(),
});
export const selectProductVisibilityRuleSchema = createSelectSchema(productVisibilityRule);

export const insertProductPricingSchema = createInsertSchema(productPricing, {
  currency: z.string().length(3),
  minQuantity: z.number().int().positive().optional(),
  maxQuantity: z.number().int().positive().optional(),
});
export const selectProductPricingSchema = createSelectSchema(productPricing);

export const insertCatalogSchema = createInsertSchema(catalog, {
  code: z.string().regex(/^[a-z0-9-]+$/, "Code must be lowercase with hyphens only"),
});
export const selectCatalogSchema = createSelectSchema(catalog);

// Type exports
export type ProductVisibilityRule = typeof productVisibilityRule.$inferSelect;
export type NewProductVisibilityRule = typeof productVisibilityRule.$inferInsert;
export type ProductPricing = typeof productPricing.$inferSelect;
export type NewProductPricing = typeof productPricing.$inferInsert;
export type Catalog = typeof catalog.$inferSelect;
export type NewCatalog = typeof catalog.$inferInsert;