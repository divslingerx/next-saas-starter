import { text, bigint, boolean, doublePrecision, timestamp, integer, index, pgTableCreator } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// Create table with prefix
export const createTable = pgTableCreator((name) => `agency-app_${name}`);

// Refund table
export const refund = createTable("refund", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  orderId: bigint("order_id", { mode: "number" }).notNull(),
  
  // Refund details
  status: text("status").notNull(), // pending, processed, failed, cancelled
  note: text("note"),
  reason: text("reason"), // customer_request, damaged, incorrect_item, etc.
  
  // User tracking
  processedByUserId: bigint("processed_by_user_id", { mode: "number" }),
  
  // Financial
  currency: text("currency"),
  
  // Amounts
  subtotalAmount: doublePrecision("subtotal_amount"),
  taxAmount: doublePrecision("tax_amount"),
  shippingAmount: doublePrecision("shipping_amount"),
  totalAmount: doublePrecision("total_amount"),
  
  // Restock
  restockType: text("restock_type"), // none, return, cancel
  
  // Gateway
  gatewayTransactionId: text("gateway_transaction_id"),
  gatewayResponse: text("gateway_response"), // JSON
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  processedAt: timestamp("processed_at"),
}, (table) => [
  index("refund_order_id_idx").on(table.orderId),
  index("refund_status_idx").on(table.status),
  index("refund_created_at_idx").on(table.createdAt),
]);

// Refund line items
export const refundLineItem = createTable("refund_line_item", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  refundId: bigint("refund_id", { mode: "number" }).notNull(),
  orderLineItemId: bigint("order_line_item_id", { mode: "number" }).notNull(),
  
  // Quantities
  quantity: integer("quantity").notNull(),
  
  // Restock
  restockType: text("restock_type"), // none, return, cancel
  locationId: bigint("location_id", { mode: "number" }),
  
  // Amounts
  subtotal: doublePrecision("subtotal"),
  totalTax: doublePrecision("total_tax"),
  
  // Line item state
  lineItemStatus: text("line_item_status"), // pending, processed, restocked
}, (table) => [
  index("refund_line_item_refund_id_idx").on(table.refundId),
  index("refund_line_item_order_line_id_idx").on(table.orderLineItemId),
]);

// Return request (RMA)
export const returnRequest = createTable("return_request", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  orderId: bigint("order_id", { mode: "number" }).notNull(),
  customerId: bigint("customer_id", { mode: "number" }).notNull(),
  
  // RMA details
  rmaNumber: text("rma_number").unique(),
  status: text("status"), // requested, approved, shipped, received, processed, rejected
  
  // Reason
  reason: text("reason"),
  customerNote: text("customer_note"),
  internalNote: text("internal_note"),
  
  // Shipping
  returnShippingMethod: text("return_shipping_method"),
  returnTrackingNumber: text("return_tracking_number"),
  returnShippingCarrier: text("return_shipping_carrier"),
  
  // Inspection
  inspectionNotes: text("inspection_notes"),
  inspectionPhotos: text("inspection_photos"), // JSON array of URLs
  
  // Resolution
  resolutionType: text("resolution_type"), // refund, exchange, store_credit
  resolutionAmount: doublePrecision("resolution_amount"),
  
  // Timestamps
  requestedAt: timestamp("requested_at").defaultNow(),
  approvedAt: timestamp("approved_at"),
  receivedAt: timestamp("received_at"),
  processedAt: timestamp("processed_at"),
}, (table) => [
  index("return_request_order_id_idx").on(table.orderId),
  index("return_request_customer_id_idx").on(table.customerId),
  index("return_request_rma_number_idx").on(table.rmaNumber),
  index("return_request_status_idx").on(table.status),
]);

// Return line items
export const returnLineItem = createTable("return_line_item", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  returnRequestId: bigint("return_request_id", { mode: "number" }).notNull(),
  orderLineItemId: bigint("order_line_item_id", { mode: "number" }).notNull(),
  
  // Quantities
  quantityRequested: integer("quantity_requested"),
  quantityReceived: integer("quantity_received"),
  quantityApproved: integer("quantity_approved"),
  
  // Condition
  returnCondition: text("return_condition"), // new, used, damaged
  conditionNotes: text("condition_notes"),
  
  // Resolution
  itemResolution: text("item_resolution"), // refund, exchange, reject
}, (table) => [
  index("return_line_item_request_id_idx").on(table.returnRequestId),
]);

// Zod schemas
export const insertRefundSchema = createInsertSchema(refund);
export const selectRefundSchema = createSelectSchema(refund);

export const insertRefundLineItemSchema = createInsertSchema(refundLineItem);
export const selectRefundLineItemSchema = createSelectSchema(refundLineItem);

export const insertReturnRequestSchema = createInsertSchema(returnRequest);
export const selectReturnRequestSchema = createSelectSchema(returnRequest);

export const insertReturnLineItemSchema = createInsertSchema(returnLineItem);
export const selectReturnLineItemSchema = createSelectSchema(returnLineItem);

// Type exports
export type Refund = typeof refund.$inferSelect;
export type NewRefund = typeof refund.$inferInsert;

export type RefundLineItem = typeof refundLineItem.$inferSelect;
export type NewRefundLineItem = typeof refundLineItem.$inferInsert;

export type ReturnRequest = typeof returnRequest.$inferSelect;
export type NewReturnRequest = typeof returnRequest.$inferInsert;

export type ReturnLineItem = typeof returnLineItem.$inferSelect;
export type NewReturnLineItem = typeof returnLineItem.$inferInsert;