import { text, bigint, boolean, doublePrecision, timestamp, integer, jsonb, index, pgTableCreator } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Create table with prefix
export const createTable = pgTableCreator((name) => `agency-app_${name}`);

// Checkout session table - manages multi-step checkout flow
export const checkoutSession = createTable("checkout_session", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  // Cart reference
  cartId: bigint("cart_id", { mode: "number" }).notNull().unique(),
  
  // Customer information
  customerId: bigint("customer_id", { mode: "number" }),
  email: text("email").notNull(),
  phone: text("phone"),
  
  // Checkout progress
  currentStep: text("current_step").default("customer_info"), // customer_info, shipping_address, shipping_method, payment, review
  completedSteps: jsonb("completed_steps").$type<string[]>().default([]),
  
  // Addresses
  shippingAddressId: bigint("shipping_address_id", { mode: "number" }),
  billingAddressId: bigint("billing_address_id", { mode: "number" }),
  billingSameAsShipping: boolean("billing_same_as_shipping").default(true),
  
  // Shipping
  shippingMethodId: bigint("shipping_method_id", { mode: "number" }),
  shippingRate: doublePrecision("shipping_rate"),
  
  // Payment
  paymentMethodType: text("payment_method_type"), // card, paypal, etc.
  paymentIntentId: text("payment_intent_id"), // Stripe payment intent
  paymentStatus: text("payment_status"), // pending, processing, completed, failed
  
  // Pricing summary
  subtotal: doublePrecision("subtotal"),
  taxTotal: doublePrecision("tax_total"),
  shippingTotal: doublePrecision("shipping_total"),
  discountTotal: doublePrecision("discount_total"),
  total: doublePrecision("total"),
  
  // Discount codes
  discountCodes: jsonb("discount_codes").$type<string[]>().default([]),
  
  // Marketing
  acceptsMarketing: boolean("accepts_marketing").default(false),
  
  // Session management
  token: text("token").unique().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  completedAt: timestamp("completed_at"),
  abandonedAt: timestamp("abandoned_at"),
  
  // Order reference (after successful checkout)
  orderId: bigint("order_id", { mode: "number" }),
  
  // Metadata
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("checkout_session_token_idx").on(table.token),
  index("checkout_session_cart_id_idx").on(table.cartId),
  index("checkout_session_customer_id_idx").on(table.customerId),
  index("checkout_session_email_idx").on(table.email),
  index("checkout_session_expires_at_idx").on(table.expiresAt),
  index("checkout_session_payment_intent_idx").on(table.paymentIntentId),
]);

// Checkout session events - for tracking user actions
export const checkoutSessionEvent = createTable("checkout_session_event", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  checkoutSessionId: bigint("checkout_session_id", { mode: "number" }).notNull(),
  
  // Event details
  eventType: text("event_type").notNull(), // step_completed, payment_attempted, error, etc.
  eventData: jsonb("event_data").$type<Record<string, any>>().default({}),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("checkout_session_event_session_idx").on(table.checkoutSessionId),
  index("checkout_session_event_type_idx").on(table.eventType),
  index("checkout_session_event_created_idx").on(table.createdAt),
]);

// Create Zod schemas for validation
export const insertCheckoutSessionSchema = createInsertSchema(checkoutSession, {
  email: z.string().email(),
  phone: z.string().optional(),
  completedSteps: z.array(z.string()).optional(),
  discountCodes: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});
export const selectCheckoutSessionSchema = createSelectSchema(checkoutSession);

export const insertCheckoutSessionEventSchema = createInsertSchema(checkoutSessionEvent, {
  eventData: z.record(z.any()).optional(),
});
export const selectCheckoutSessionEventSchema = createSelectSchema(checkoutSessionEvent);

// Type exports
export type CheckoutSession = typeof checkoutSession.$inferSelect;
export type NewCheckoutSession = typeof checkoutSession.$inferInsert;
export type CheckoutSessionEvent = typeof checkoutSessionEvent.$inferSelect;
export type NewCheckoutSessionEvent = typeof checkoutSessionEvent.$inferInsert;