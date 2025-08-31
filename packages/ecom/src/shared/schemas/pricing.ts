import { pgTableCreator, text, bigint, integer, boolean, timestamp, index, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const createTable = pgTableCreator((name) => `agency-app_${name}`);

/**
 * Normalized money/pricing table - stores amounts in multiple currencies
 * Replaces inline price fields throughout the system
 */
export const money = createTable(
  "money",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    
    // Core amount
    amount: text("amount").notNull(), // Store as string for precision
    currencyCode: text("currency_code").notNull(),
    
    // Optional presentment currency (customer's currency)
    presentmentAmount: text("presentment_amount"),
    presentmentCurrencyCode: text("presentment_currency_code"),
    
    // Exchange rate if converted
    exchangeRate: text("exchange_rate"),
    
    // Context
    priceType: text("price_type"), // 'base', 'sale', 'compare_at', 'cost'
    
    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    currencyIdx: index("money_currency_idx").on(table.currencyCode),
    typeIdx: index("money_type_idx").on(table.priceType),
  })
);

/**
 * Price set - groups multiple money records for comprehensive pricing
 * Used for products, orders, etc. that need multiple price representations
 */
export const priceSet = createTable(
  "price_set",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    
    // Base prices
    shopMoneyId: bigint("shop_money_id", { mode: "number" })
      .references(() => money.id, { onDelete: "cascade" }),
    presentmentMoneyId: bigint("presentment_money_id", { mode: "number" })
      .references(() => money.id, { onDelete: "cascade" }),
    
    // Additional price points
    compareAtMoneyId: bigint("compare_at_money_id", { mode: "number" })
      .references(() => money.id, { onDelete: "cascade" }),
    costMoneyId: bigint("cost_money_id", { mode: "number" })
      .references(() => money.id, { onDelete: "cascade" }),
    
    // Tax information
    taxIncluded: boolean("tax_included").default(false),
    taxAmount: text("tax_amount"),
    
    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
  }
);

/**
 * Price reference - links price sets to various entities
 */
export const priceReference = createTable(
  "price_reference",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    
    priceSetId: bigint("price_set_id", { mode: "number" })
      .notNull()
      .references(() => priceSet.id, { onDelete: "cascade" }),
    
    // Polymorphic reference
    entityType: text("entity_type").notNull(), // 'product_variant', 'order', 'line_item'
    entityId: bigint("entity_id", { mode: "number" }).notNull(),
    
    // Context
    priceContext: text("price_context"), // 'regular', 'sale', 'member', 'wholesale'
    
    // Valid date range
    validFrom: timestamp("valid_from"),
    validUntil: timestamp("valid_until"),
    
    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    entityIdx: index("price_ref_entity_idx").on(table.entityType, table.entityId),
    priceSetIdx: index("price_ref_price_set_idx").on(table.priceSetId),
    contextIdx: index("price_ref_context_idx").on(table.priceContext),
    validityIdx: index("price_ref_validity_idx").on(table.validFrom, table.validUntil),
  })
);

/**
 * Tax line - normalized tax information
 */
export const taxLine = createTable(
  "tax_line",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    
    // Tax details
    title: text("title").notNull(),
    rate: text("rate").notNull(), // Store as string for precision (e.g., "0.13")
    ratePercentage: text("rate_percentage"), // For display (e.g., "13%")
    
    // Amounts
    price: text("price").notNull(),
    priceSet: jsonb("price_set"), // Can store complex price set if needed
    
    // Source information
    source: text("source"), // 'shopify', 'avalara', 'manual'
    jurisdiction: text("jurisdiction"),
    
    // Reference to what's being taxed
    entityType: text("entity_type").notNull(), // 'order', 'line_item', 'shipping'
    entityId: bigint("entity_id", { mode: "number" }).notNull(),
    
    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    entityIdx: index("tax_line_entity_idx").on(table.entityType, table.entityId),
    sourceIdx: index("tax_line_source_idx").on(table.source),
  })
);

// Type exports
export type Money = typeof money.$inferSelect;
export type NewMoney = typeof money.$inferInsert;
export type PriceSet = typeof priceSet.$inferSelect;
export type NewPriceSet = typeof priceSet.$inferInsert;
export type PriceReference = typeof priceReference.$inferSelect;
export type NewPriceReference = typeof priceReference.$inferInsert;
export type TaxLine = typeof taxLine.$inferSelect;
export type NewTaxLine = typeof taxLine.$inferInsert;

// Schema exports
export const insertMoneySchema = createInsertSchema(money);
export const selectMoneySchema = createSelectSchema(money);
export const insertPriceSetSchema = createInsertSchema(priceSet);
export const selectPriceSetSchema = createSelectSchema(priceSet);
export const insertPriceReferenceSchema = createInsertSchema(priceReference);
export const selectPriceReferenceSchema = createSelectSchema(priceReference);
export const insertTaxLineSchema = createInsertSchema(taxLine);
export const selectTaxLineSchema = createSelectSchema(taxLine);