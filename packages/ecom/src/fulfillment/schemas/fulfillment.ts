import { text, bigint, boolean, doublePrecision, timestamp, integer, index, pgTableCreator } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Create table with prefix
export const createTable = pgTableCreator((name) => `agency-app_${name}`);

// Fulfillment table
export const fulfillment = createTable("fulfillment", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  orderId: bigint("order_id", { mode: "number" }).notNull(),
  locationId: bigint("location_id", { mode: "number" }),
  
  // Basic information
  name: text("name"),
  service: text("service"),
  status: text("status"),
  shipmentStatus: text("shipment_status"),
  
  // Tracking
  trackingCompany: text("tracking_company"),
  trackingNumbers: text("tracking_numbers"),
  trackingUrls: text("tracking_urls"),
  receiptAuthorization: text("receipt_authorization"),
  
  // Timestamps
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
}, (table) => [
  index("fulfillment_order_id_idx").on(table.orderId),
  index("fulfillment_status_idx").on(table.status),
]);

// Fulfillment event table
export const fulfillmentEvent = createTable("fulfillment_event", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  orderId: bigint("order_id", { mode: "number" }).notNull(),
  fulfillmentId: bigint("fulfillment_id", { mode: "number" }).notNull(),
  shopId: bigint("shop_id", { mode: "number" }),
  
  // Event details
  status: text("status"),
  message: text("message"),
  
  // Location
  address1: text("address1"),
  city: text("city"),
  province: text("province"),
  country: text("country"),
  zip: text("zip"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  
  // App information
  appId: text("app_id"),
  appName: text("app_name"),
  
  // Timestamps
  happenedAt: timestamp("happened_at"),
  estimatedDeliveryAt: timestamp("estimated_delivery_at"),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
  fulfillmentCreatedAt: timestamp("fulfillment_created_at"),
  fulfillmentUpdatedAt: timestamp("fulfillment_updated_at"),
}, (table) => [
  index("fulfillment_event_order_id_idx").on(table.orderId),
  index("fulfillment_event_fulfillment_id_idx").on(table.fulfillmentId),
]);

// Fulfillment order table
export const fulfillmentOrder = createTable("fulfillment_order", {
  id: text("id").primaryKey(),
  orderId: text("order_id"),
  shopId: text("shop_id"),
  
  // Order details
  orderName: text("order_name"),
  orderProcessedAt: timestamp("order_processed_at"),
  channelId: text("channel_id"),
  
  // Status
  status: text("status"),
  requestStatus: text("request_status"),
  
  // Assigned location
  assignedLocationLocationId: text("assigned_location_location_id"),
  assignedLocationName: text("assigned_location_name"),
  assignedLocationAddress1: text("assigned_location_address_1"),
  assignedLocationAddress2: text("assigned_location_address_2"),
  assignedLocationCity: text("assigned_location_city"),
  assignedLocationProvince: text("assigned_location_province"),
  assignedLocationCountryCode: text("assigned_location_country_code"),
  assignedLocationZip: text("assigned_location_zip"),
  assignedLocationPhone: text("assigned_location_phone"),
  
  // App information
  orderAppId: text("order_app_id"),
  orderAppName: text("order_app_name"),
  
  // Dates
  fulfillAt: timestamp("fulfill_at"),
  fulfillBy: timestamp("fulfill_by"),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
}, (table) => [
  index("fulfillment_order_order_id_idx").on(table.orderId),
  index("fulfillment_order_status_idx").on(table.status),
]);

// Fulfillment order line
export const fulfillmentOrderLine = createTable("fulfillment_order_line", {
  orderId: bigint("order_id", { mode: "number" }).notNull(),
  fulfillmentId: bigint("fulfillment_id", { mode: "number" }),
  orderLineId: bigint("order_line_id", { mode: "number" }),
  productId: bigint("product_id", { mode: "number" }),
  variantId: bigint("variant_id", { mode: "number" }),
  
  // Line details
  name: text("name"),
  title: text("title"),
  variantTitle: text("variant_title"),
  sku: text("sku"),
  vendor: text("vendor"),
  properties: text("properties"),
  
  // Quantities and pricing
  quantity: doublePrecision("quantity"),
  fulfillableQuantity: doublePrecision("fulfillable_quantity"),
  price: doublePrecision("price"),
  grams: integer("grams"),
  
  // Flags
  giftCard: boolean("gift_card"),
  requiresShipping: boolean("requires_shipping"),
  taxable: boolean("taxable"),
  
  // Service
  fulfillmentService: text("fulfillment_service"),
}, (table) => [
  index("fulfillment_order_line_order_id_idx").on(table.orderId),
  index("fulfillment_order_line_product_id_idx").on(table.productId),
]);

// Create Zod schemas for validation
export const insertFulfillmentSchema = createInsertSchema(fulfillment);
export const selectFulfillmentSchema = createSelectSchema(fulfillment);

export const insertFulfillmentEventSchema = createInsertSchema(fulfillmentEvent);
export const selectFulfillmentEventSchema = createSelectSchema(fulfillmentEvent);

export const insertFulfillmentOrderSchema = createInsertSchema(fulfillmentOrder);
export const selectFulfillmentOrderSchema = createSelectSchema(fulfillmentOrder);

export const insertFulfillmentOrderLineSchema = createInsertSchema(fulfillmentOrderLine, {
  giftCard: z.boolean().optional(),
  requiresShipping: z.boolean().optional(),
  taxable: z.boolean().optional(),
});
export const selectFulfillmentOrderLineSchema = createSelectSchema(fulfillmentOrderLine);

// Type exports
export type Fulfillment = typeof fulfillment.$inferSelect;
export type NewFulfillment = typeof fulfillment.$inferInsert;

export type FulfillmentEvent = typeof fulfillmentEvent.$inferSelect;
export type NewFulfillmentEvent = typeof fulfillmentEvent.$inferInsert;

export type FulfillmentOrder = typeof fulfillmentOrder.$inferSelect;
export type NewFulfillmentOrder = typeof fulfillmentOrder.$inferInsert;

export type FulfillmentOrderLine = typeof fulfillmentOrderLine.$inferSelect;
export type NewFulfillmentOrderLine = typeof fulfillmentOrderLine.$inferInsert;