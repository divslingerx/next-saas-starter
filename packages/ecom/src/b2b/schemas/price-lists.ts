import { text, bigint, boolean, doublePrecision, integer, timestamp, index, pgTableCreator } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Create table with prefix
export const createTable = pgTableCreator((name) => `agency-app_${name}`);

// Customer-specific price lists
// Using the more comprehensive version from discount-rules.ts
export const priceList = createTable("price_list", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  // Price list info
  name: text("name").notNull(), // "Wholesale Pricing", "Government Rates"
  code: text("code").unique().notNull(),
  description: text("description"),
  currency: text("currency").default("USD"),
  
  // Settings
  includesTax: boolean("includes_tax").default(false),
  active: boolean("active").default(true),
  priority: integer("priority").default(0), // When multiple lists apply
  
  // Validity
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("price_list_code_idx").on(table.code),
  index("price_list_active_idx").on(table.active),
]);

// Price list assignments to customers/groups
// Using the more comprehensive version from discount-rules.ts
export const priceListAssignment = createTable("price_list_assignment", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  priceListId: bigint("price_list_id", { mode: "number" }).notNull(),
  
  // Assignment to either company, customer group, or individual customer
  companyId: bigint("company_id", { mode: "number" }),
  customerGroupId: bigint("customer_group_id", { mode: "number" }),
  customerId: bigint("customer_id", { mode: "number" }),
  
  // Override priority
  priority: integer("priority").default(0),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("price_list_assignment_list_idx").on(table.priceListId),
  index("price_list_assignment_customer_idx").on(table.customerId),
  index("price_list_assignment_group_idx").on(table.customerGroupId),
  index("price_list_assignment_company_idx").on(table.companyId),
]);

// Price list items - Specific prices in a price list
// Using the more comprehensive version from discount-rules.ts
export const priceListItem = createTable("price_list_item", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  priceListId: bigint("price_list_id", { mode: "number" }).notNull(),
  
  // Product/variant
  productId: bigint("product_id", { mode: "number" }).notNull(),
  variantId: bigint("variant_id", { mode: "number" }),
  
  // Pricing
  price: doublePrecision("price").notNull(),
  compareAtPrice: doublePrecision("compare_at_price"),
  
  // Quantity breaks (optional) - combining both min/max from b2b-features
  minQuantity: integer("min_quantity").default(1),
  maxQuantity: integer("max_quantity"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("price_list_item_list_idx").on(table.priceListId),
  index("price_list_item_product_idx").on(table.productId),
  index("price_list_item_variant_idx").on(table.variantId),
]);

// Create Zod schemas for validation
export const insertPriceListSchema = createInsertSchema(priceList, {
  code: z.string().regex(/^[a-z0-9-]+$/, "Code must be lowercase with hyphens only"),
  currency: z.string().length(3),
});
export const selectPriceListSchema = createSelectSchema(priceList);

export const insertPriceListAssignmentSchema = createInsertSchema(priceListAssignment);
export const selectPriceListAssignmentSchema = createSelectSchema(priceListAssignment);

export const insertPriceListItemSchema = createInsertSchema(priceListItem, {
  price: z.number().positive(),
  compareAtPrice: z.number().positive().optional(),
  minQuantity: z.number().int().positive().optional(),
  maxQuantity: z.number().int().positive().optional(),
});
export const selectPriceListItemSchema = createSelectSchema(priceListItem);

// Type exports
export type PriceList = typeof priceList.$inferSelect;
export type NewPriceList = typeof priceList.$inferInsert;
export type PriceListAssignment = typeof priceListAssignment.$inferSelect;
export type NewPriceListAssignment = typeof priceListAssignment.$inferInsert;
export type PriceListItem = typeof priceListItem.$inferSelect;
export type NewPriceListItem = typeof priceListItem.$inferInsert;