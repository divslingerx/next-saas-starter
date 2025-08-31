import { text, bigint, boolean, doublePrecision, integer, timestamp, jsonb, index, pgTableCreator } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Create table with prefix
export const createTable = pgTableCreator((name) => `agency-app_${name}`);

// Customer Discount Rules - Simple percentage/fixed discounts per customer
export const customerDiscount = createTable("customer_discount", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  // Who gets the discount
  customerId: bigint("customer_id", { mode: "number" }),
  customerGroupId: bigint("customer_group_id", { mode: "number" }),
  companyId: bigint("company_id", { mode: "number" }), // Added company support
  
  // Discount details
  name: text("name").notNull(), // "VIP 15% Discount", "Partner Pricing"
  code: text("code"), // Internal reference code
  
  // Discount type and amount
  type: text("type").notNull(), // 'percentage' or 'fixed'
  value: doublePrecision("value").notNull(), // 15 for 15% or 10.00 for $10 off
  
  // What it applies to
  appliesTo: text("applies_to").notNull().default("order"), // 'order', 'products', 'shipping'
  
  // Conditions
  minimumAmount: doublePrecision("minimum_amount"), // Minimum order value
  minimumQuantity: integer("minimum_quantity"), // Minimum items
  
  // Stacking rules
  stackable: boolean("stackable").default(false), // Can combine with other discounts
  priority: integer("priority").default(0), // Higher priority applies first
  
  // Validity
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  active: boolean("active").default(true),
  
  // Usage limits
  usageLimit: integer("usage_limit"), // Total times it can be used
  usageCount: integer("usage_count").default(0), // Times used so far
  
  // Metadata
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("customer_discount_customer_idx").on(table.customerId),
  index("customer_discount_group_idx").on(table.customerGroupId),
  index("customer_discount_company_idx").on(table.companyId),
  index("customer_discount_active_idx").on(table.active),
  index("customer_discount_code_idx").on(table.code),
]);

// Volume/Quantity Discount Tiers
// Consolidating with the more comprehensive version from discount-rules.ts
export const volumeDiscountTier = createTable("volume_discount_tier", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  // Who gets these tiers
  customerId: bigint("customer_id", { mode: "number" }),
  customerGroupId: bigint("customer_group_id", { mode: "number" }),
  companyId: bigint("company_id", { mode: "number" }), // Added company support
  productId: bigint("product_id", { mode: "number" }), // Specific product or null for all
  categoryId: bigint("category_id", { mode: "number" }), // Specific category or null
  
  // Tier details
  name: text("name").notNull(), // "Bronze Tier", "10+ units"
  minQuantity: integer("min_quantity").notNull(),
  maxQuantity: integer("max_quantity"),
  
  // Discount
  discountType: text("discount_type").notNull(), // 'percentage' or 'fixed'
  discountValue: doublePrecision("discount_value").notNull(),
  
  // Settings
  active: boolean("active").default(true),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("volume_tier_customer_idx").on(table.customerId),
  index("volume_tier_group_idx").on(table.customerGroupId),
  index("volume_tier_company_idx").on(table.companyId),
  index("volume_tier_product_idx").on(table.productId),
  index("volume_tier_category_idx").on(table.categoryId),
  index("volume_tier_quantity_idx").on(table.minQuantity),
]);

// Volume/Quantity discounts - parent table for volume discount configuration
// From b2b-features.ts, works with volumeDiscountTier
export const volumeDiscount = createTable("volume_discount", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  name: text("name").notNull(),
  
  // What it applies to
  appliesToAllProducts: boolean("applies_to_all_products").default(false),
  productIds: text("product_ids"), // JSON array
  collectionIds: text("collection_ids"), // JSON array
  
  // Discount tiers
  discountType: text("discount_type"), // percentage, fixed_amount
  
  active: boolean("active").default(true),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Price rule table - from price-rule.ts (Shopify-style discount rules)
export const priceRule = createTable("price_rule", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  // Basic information
  title: text("title"),
  value: text("value"),
  valueType: text("value_type"),
  
  // Targeting
  targetType: text("target_type"),
  targetSelection: text("target_selection"),
  allocationMethod: text("allocation_method"),
  customerSelection: text("customer_selection"),
  
  // Limits
  allocationLimit: bigint("allocation_limit", { mode: "number" }),
  usageLimit: bigint("usage_limit", { mode: "number" }),
  oncePerCustomer: boolean("once_per_customer"),
  
  // Prerequisites
  prerequisiteSubtotalRange: doublePrecision("prerequisite_subtotal_range"),
  prerequisiteShippingPriceRange: doublePrecision("prerequisite_shipping_price_range"),
  prerequisiteQuantityRange: bigint("prerequisite_quantity_range", { mode: "number" }),
  prerequisiteToEntitlementPurchasePrerequisiteAmount: doublePrecision("prerequisite_to_entitlement_purchase_prerequisite_amount"),
  
  // Quantity ratio
  quantityRatioEntitledQuantity: bigint("quantity_ratio_entitled_quantity", { mode: "number" }),
  quantityRatioPrerequisiteQuantity: bigint("quantity_ratio_prerequisite_quantity", { mode: "number" }),
  
  // Dates
  startsAt: timestamp("starts_at"),
  endsAt: timestamp("ends_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("price_rule_starts_at_idx").on(table.startsAt),
  index("price_rule_ends_at_idx").on(table.endsAt),
]);

// Discount code table
export const discountCode = createTable("discount_code", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  priceRuleId: bigint("price_rule_id", { mode: "number" }).notNull(),
  
  // Code information
  code: text("code"),
  title: text("title"),
  summary: text("summary"),
  status: text("status"),
  
  // Usage
  usageCount: bigint("usage_count", { mode: "number" }),
  asyncUsageCount: bigint("async_usage_count", { mode: "number" }),
  usageLimit: integer("usage_limit"),
  
  // Dates
  startsAt: timestamp("starts_at"),
  endsAt: timestamp("ends_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("discount_code_price_rule_id_idx").on(table.priceRuleId),
  index("discount_code_code_idx").on(table.code),
  index("discount_code_status_idx").on(table.status),
]);

// Entitled collection (collections eligible for the price rule)
export const entitledCollection = createTable("entitled_collection", {
  priceRuleId: bigint("price_rule_id", { mode: "number" }).notNull(),
  collectionId: bigint("collection_id", { mode: "number" }).notNull(),
}, (table) => [
  index("entitled_collection_price_rule_id_idx").on(table.priceRuleId),
  index("entitled_collection_collection_id_idx").on(table.collectionId),
]);

// Create Zod schemas for validation
export const insertCustomerDiscountSchema = createInsertSchema(customerDiscount, {
  type: z.enum(['percentage', 'fixed']),
  appliesTo: z.enum(['order', 'products', 'shipping']),
  value: z.number().positive(),
  metadata: z.record(z.any()).optional(),
});
export const selectCustomerDiscountSchema = createSelectSchema(customerDiscount);

export const insertVolumeDiscountTierSchema = createInsertSchema(volumeDiscountTier, {
  discountType: z.enum(['percentage', 'fixed']),
  minQuantity: z.number().int().positive(),
  maxQuantity: z.number().int().positive().optional(),
  discountValue: z.number().positive(),
});
export const selectVolumeDiscountTierSchema = createSelectSchema(volumeDiscountTier);

export const insertVolumeDiscountSchema = createInsertSchema(volumeDiscount);
export const selectVolumeDiscountSchema = createSelectSchema(volumeDiscount);

export const insertPriceRuleSchema = createInsertSchema(priceRule, {
  oncePerCustomer: z.boolean().optional(),
});
export const selectPriceRuleSchema = createSelectSchema(priceRule);

export const insertDiscountCodeSchema = createInsertSchema(discountCode);
export const selectDiscountCodeSchema = createSelectSchema(discountCode);

export const insertEntitledCollectionSchema = createInsertSchema(entitledCollection);
export const selectEntitledCollectionSchema = createSelectSchema(entitledCollection);

// Type exports
export type CustomerDiscount = typeof customerDiscount.$inferSelect;
export type NewCustomerDiscount = typeof customerDiscount.$inferInsert;
export type VolumeDiscountTier = typeof volumeDiscountTier.$inferSelect;
export type NewVolumeDiscountTier = typeof volumeDiscountTier.$inferInsert;
export type VolumeDiscount = typeof volumeDiscount.$inferSelect;
export type NewVolumeDiscount = typeof volumeDiscount.$inferInsert;
export type PriceRule = typeof priceRule.$inferSelect;
export type NewPriceRule = typeof priceRule.$inferInsert;
export type DiscountCode = typeof discountCode.$inferSelect;
export type NewDiscountCode = typeof discountCode.$inferInsert;
export type EntitledCollection = typeof entitledCollection.$inferSelect;
export type NewEntitledCollection = typeof entitledCollection.$inferInsert;