import { text, bigint, boolean, doublePrecision, timestamp, integer, index, pgTableCreator } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// Create table with prefix
export const createTable = pgTableCreator((name) => `agency-app_${name}`);

// Active cart table
export const cart = createTable("cart", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  // Session/User tracking
  sessionId: text("session_id"),
  customerId: bigint("customer_id", { mode: "number" }),
  email: text("email"),
  
  // Cart state
  token: text("token").unique(),
  status: text("status").default("active"), // active, merged, converted, expired
  currency: text("currency"),
  
  // Checkout information
  checkoutUrl: text("checkout_url"),
  completedAt: timestamp("completed_at"),
  
  // Metadata
  note: text("note"),
  attributes: text("attributes"), // JSON string for custom attributes
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
}, (table) => [
  index("cart_token_idx").on(table.token),
  index("cart_customer_id_idx").on(table.customerId),
  index("cart_session_id_idx").on(table.sessionId),
  index("cart_status_idx").on(table.status),
  index("cart_expires_at_idx").on(table.expiresAt),
]);

// Cart items
export const cartItem = createTable("cart_item", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  cartId: bigint("cart_id", { mode: "number" }).notNull(),
  
  // Product information
  productId: bigint("product_id", { mode: "number" }).notNull(),
  variantId: bigint("variant_id", { mode: "number" }).notNull(),
  
  // Quantities
  quantity: integer("quantity").notNull(),
  
  // Pricing at time of adding
  price: doublePrecision("price"),
  compareAtPrice: doublePrecision("compare_at_price"),
  
  // Custom properties
  customizations: text("customizations"), // JSON for custom text, etc.
  
  // Metadata
  addedAt: timestamp("added_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("cart_item_cart_id_idx").on(table.cartId),
  index("cart_item_product_variant_idx").on(table.productId, table.variantId),
]);

// Applied discounts to cart
export const cartDiscount = createTable("cart_discount", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  cartId: bigint("cart_id", { mode: "number" }).notNull(),
  
  discountCodeId: bigint("discount_code_id", { mode: "number" }),
  code: text("code"),
  type: text("type"), // percentage, fixed_amount, etc.
  value: doublePrecision("value"),
  
  appliedAt: timestamp("applied_at").defaultNow(),
}, (table) => [
  index("cart_discount_cart_id_idx").on(table.cartId),
]);

// Zod schemas
export const insertCartSchema = createInsertSchema(cart);
export const selectCartSchema = createSelectSchema(cart);

export const insertCartItemSchema = createInsertSchema(cartItem);
export const selectCartItemSchema = createSelectSchema(cartItem);

export const insertCartDiscountSchema = createInsertSchema(cartDiscount);
export const selectCartDiscountSchema = createSelectSchema(cartDiscount);

// Type exports
export type Cart = typeof cart.$inferSelect;
export type NewCart = typeof cart.$inferInsert;

export type CartItem = typeof cartItem.$inferSelect;
export type NewCartItem = typeof cartItem.$inferInsert;

export type CartDiscount = typeof cartDiscount.$inferSelect;
export type NewCartDiscount = typeof cartDiscount.$inferInsert;