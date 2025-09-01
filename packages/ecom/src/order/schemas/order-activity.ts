import { text, bigint, timestamp, jsonb, index, pgTableCreator, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Create table with prefix
export const createTable = pgTableCreator((name) => `agency-app_${name}`);

// Order activity log - tracks all changes and events for an order
export const orderActivityLog = createTable("order_activity_log", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  // Order reference
  orderId: bigint("order_id", { mode: "number" }).notNull(),
  
  // Actor information
  userId: bigint("user_id", { mode: "number" }), // Admin user who performed action
  customerId: bigint("customer_id", { mode: "number" }), // Customer who performed action
  actorType: text("actor_type").notNull(), // system, admin, customer, app
  actorName: text("actor_name"), // Display name of actor
  
  // Activity details
  action: text("action").notNull(), // created, status_changed, payment_captured, items_fulfilled, etc.
  category: text("category").notNull(), // order, payment, fulfillment, customer, inventory
  
  // Description for UI display
  title: text("title").notNull(), // "Order placed", "Payment captured", etc.
  description: text("description"), // Detailed description of what happened
  
  // Change tracking
  previousValue: jsonb("previous_value").$type<Record<string, any>>(),
  newValue: jsonb("new_value").$type<Record<string, any>>(),
  
  // Additional context
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  
  // IP and location tracking
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("order_activity_log_order_idx").on(table.orderId),
  index("order_activity_log_action_idx").on(table.action),
  index("order_activity_log_category_idx").on(table.category),
  index("order_activity_log_created_idx").on(table.createdAt),
  index("order_activity_log_actor_idx").on(table.actorType),
]);

// Order timeline event - customer-facing events
export const orderTimelineEvent = createTable("order_timeline_event", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  // Order reference
  orderId: bigint("order_id", { mode: "number" }).notNull(),
  
  // Event details
  type: text("type").notNull(), // order_placed, payment_received, shipped, delivered, etc.
  status: text("status"), // success, warning, error
  
  // Display information
  title: text("title").notNull(),
  description: text("description"),
  icon: text("icon"), // Icon identifier for UI
  
  // Visibility
  visibleToCustomer: boolean("visible_to_customer").default(true),
  
  // Related entities
  fulfillmentId: bigint("fulfillment_id", { mode: "number" }),
  refundId: bigint("refund_id", { mode: "number" }),
  
  // Metadata
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  
  // Timestamps
  occurredAt: timestamp("occurred_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("order_timeline_event_order_idx").on(table.orderId),
  index("order_timeline_event_type_idx").on(table.type),
  index("order_timeline_event_occurred_idx").on(table.occurredAt),
  index("order_timeline_event_visible_idx").on(table.visibleToCustomer),
]);

// Create Zod schemas for validation
export const insertOrderActivityLogSchema = createInsertSchema(orderActivityLog, {
  actorType: z.enum(["system", "admin", "customer", "app"]),
  previousValue: z.record(z.any()).optional(),
  newValue: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
});
export const selectOrderActivityLogSchema = createSelectSchema(orderActivityLog);

export const insertOrderTimelineEventSchema = createInsertSchema(orderTimelineEvent, {
  status: z.enum(["success", "warning", "error"]).optional(),
  metadata: z.record(z.any()).optional(),
});
export const selectOrderTimelineEventSchema = createSelectSchema(orderTimelineEvent);

// Type exports
export type OrderActivityLog = typeof orderActivityLog.$inferSelect;
export type NewOrderActivityLog = typeof orderActivityLog.$inferInsert;
export type OrderTimelineEvent = typeof orderTimelineEvent.$inferSelect;
export type NewOrderTimelineEvent = typeof orderTimelineEvent.$inferInsert;