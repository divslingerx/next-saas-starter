import { text, bigint, boolean, doublePrecision, timestamp, index, pgTableCreator } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Create table with prefix
export const createTable = pgTableCreator((name) => `agency-app_${name}`);

// Price rule table
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
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
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
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
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
export const insertPriceRuleSchema = createInsertSchema(priceRule, {
  oncePerCustomer: z.boolean().optional(),
});
export const selectPriceRuleSchema = createSelectSchema(priceRule);

export const insertDiscountCodeSchema = createInsertSchema(discountCode);
export const selectDiscountCodeSchema = createSelectSchema(discountCode);

export const insertEntitledCollectionSchema = createInsertSchema(entitledCollection);
export const selectEntitledCollectionSchema = createSelectSchema(entitledCollection);

// Type exports
export type PriceRule = typeof priceRule.$inferSelect;
export type NewPriceRule = typeof priceRule.$inferInsert;

export type DiscountCode = typeof discountCode.$inferSelect;
export type NewDiscountCode = typeof discountCode.$inferInsert;

export type EntitledCollection = typeof entitledCollection.$inferSelect;
export type NewEntitledCollection = typeof entitledCollection.$inferInsert;