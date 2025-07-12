import { text, bigint, boolean, doublePrecision, timestamp, integer, index, pgTableCreator } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Create table with prefix
export const createTable = pgTableCreator((name) => `agency-app_${name}`);

// Draft order table
export const draftOrder = createTable("draft_order", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  orderId: bigint("order_id", { mode: "number" }),
  customerId: bigint("customer_id", { mode: "number" }),
  
  // Basic information
  name: text("name"),
  email: text("email"),
  note: text("note"),
  currency: text("currency"),
  status: text("status"),
  
  // Invoice
  invoiceUrl: text("invoice_url"),
  invoiceSentAt: timestamp("invoice_sent_at"),
  
  // Applied discount
  appliedDiscountTitle: text("applied_discount_title"),
  appliedDiscountDescription: text("applied_discount_description"),
  appliedDiscountValue: text("applied_discount_value"),
  appliedDiscountValueType: text("applied_discount_value_type"),
  appliedDiscountAmount: doublePrecision("applied_discount_amount"),
  
  // Billing address
  billingAddressAddress1: text("billing_address_address1"),
  billingAddressAddress2: text("billing_address_address2"),
  billingAddressCity: text("billing_address_city"),
  billingAddressCompany: text("billing_address_company"),
  billingAddressCountry: text("billing_address_country"),
  billingAddressCountryCode: text("billing_address_country_code"),
  billingAddressFirstName: text("billing_address_first_name"),
  billingAddressLastName: text("billing_address_last_name"),
  billingAddressLatitude: doublePrecision("billing_address_latitude"),
  billingAddressLongitude: doublePrecision("billing_address_longitude"),
  billingAddressName: text("billing_address_name"),
  billingAddressPhone: text("billing_address_phone"),
  billingAddressProvince: text("billing_address_province"),
  billingAddressProvinceCode: text("billing_address_province_code"),
  billingAddressZip: text("billing_address_zip"),
  
  // Shipping address
  shippingAddressAddress1: text("shipping_address_address1"),
  shippingAddressAddress2: text("shipping_address_address2"),
  shippingAddressCity: text("shipping_address_city"),
  shippingAddressCompany: text("shipping_address_company"),
  shippingAddressCountry: text("shipping_address_country"),
  shippingAddressCountryCode: text("shipping_address_country_code"),
  shippingAddressFirstName: text("shipping_address_first_name"),
  shippingAddressLastName: text("shipping_address_last_name"),
  shippingAddressLatitude: doublePrecision("shipping_address_latitude"),
  shippingAddressLongitude: doublePrecision("shipping_address_longitude"),
  shippingAddressName: text("shipping_address_name"),
  shippingAddressPhone: text("shipping_address_phone"),
  shippingAddressProvince: text("shipping_address_province"),
  shippingAddressProvinceCode: text("shipping_address_province_code"),
  shippingAddressZip: text("shipping_address_zip"),
  
  // Shipping line
  shippingLineCarrier: bigint("shipping_line_carrier", { mode: "number" }),
  shippingLineCarrierIdentifier: text("shipping_line_carrier_identifier"),
  shippingLineCode: text("shipping_line_code"),
  shippingLineDeliveryCategory: text("shipping_line_delivery_category"),
  shippingLineDiscountAllocations: text("shipping_line_discount_allocations"),
  shippingLineDiscountedPrice: doublePrecision("shipping_line_discounted_price"),
  shippingLineHandle: text("shipping_line_handle"),
  shippingLinePhone: text("shipping_line_phone"),
  shippingLinePrice: doublePrecision("shipping_line_price"),
  shippingLineRequestedFulfillmentServiceId: text("shipping_line_requested_fulfillment_service_id"),
  shippingLineSource: text("shipping_line_source"),
  shippingLineTaxLines: text("shipping_line_tax_lines"),
  shippingLineTitle: text("shipping_line_title"),
  
  // Pricing
  subtotalPrice: doublePrecision("subtotal_price"),
  totalPrice: doublePrecision("total_price"),
  
  // Tax
  taxExempt: boolean("tax_exempt"),
  taxesIncluded: boolean("taxes_included"),
  taxLines: text("tax_lines"),
  
  // Timestamps
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
}, (table) => [
  index("draft_order_customer_id_idx").on(table.customerId),
  index("draft_order_order_id_idx").on(table.orderId),
  index("draft_order_status_idx").on(table.status),
]);

// Draft order line
export const draftOrderLine = createTable("draft_order_line", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  draftOrderId: bigint("draft_order_id", { mode: "number" }).notNull(),
  productId: bigint("product_id", { mode: "number" }),
  variantId: bigint("variant_id", { mode: "number" }),
  
  // Line details
  name: text("name"),
  title: text("title"),
  variantTitle: text("variant_title"),
  vendor: text("vendor"),
  sku: text("sku"),
  
  // Quantities and pricing
  quantity: integer("quantity"),
  price: doublePrecision("price"),
  grams: integer("grams"),
  
  // Applied discount
  appliedDiscountTitle: text("applied_discount_title"),
  appliedDiscountDescription: text("applied_discount_description"),
  appliedDiscountValue: doublePrecision("applied_discount_value"),
  appliedDiscountValueType: text("applied_discount_value_type"),
  appliedDiscountAmount: doublePrecision("applied_discount_amount"),
  
  // Flags
  custom: boolean("custom"),
  giftCard: boolean("gift_card"),
  requiresShipping: boolean("requires_shipping"),
  taxable: boolean("taxable"),
  
  // Other
  fulfillmentService: text("fulfillment_service"),
  taxLines: text("tax_lines"),
}, (table) => [
  index("draft_order_line_draft_order_id_idx").on(table.draftOrderId),
  index("draft_order_line_product_id_idx").on(table.productId),
]);

// Draft order line tax line
export const draftOrderLineTaxLine = createTable("draft_order_line_tax_line", {
  draftOrderId: bigint("draft_order_id", { mode: "number" }).notNull(),
  draftOrderLineId: bigint("draft_order_line_id", { mode: "number" }).notNull(),
  index: integer("index"),
  
  title: text("title"),
  price: doublePrecision("price"),
  rate: doublePrecision("rate"),
}, (table) => [
  index("draft_order_line_tax_line_order_id_idx").on(table.draftOrderId),
  index("draft_order_line_tax_line_line_id_idx").on(table.draftOrderLineId),
]);

// Draft order tag
export const draftOrderTag = createTable("draft_order_tag", {
  draftOrderId: bigint("draft_order_id", { mode: "number" }).notNull(),
  index: integer("index"),
  value: text("value").notNull(),
}, (table) => [
  index("draft_order_tag_draft_order_id_idx").on(table.draftOrderId),
  index("draft_order_tag_value_idx").on(table.value),
]);

// Create Zod schemas for validation
export const insertDraftOrderSchema = createInsertSchema(draftOrder, {
  taxExempt: z.boolean().optional(),
  taxesIncluded: z.boolean().optional(),
});
export const selectDraftOrderSchema = createSelectSchema(draftOrder);

export const insertDraftOrderLineSchema = createInsertSchema(draftOrderLine, {
  custom: z.boolean().optional(),
  giftCard: z.boolean().optional(),
  requiresShipping: z.boolean().optional(),
  taxable: z.boolean().optional(),
});
export const selectDraftOrderLineSchema = createSelectSchema(draftOrderLine);

export const insertDraftOrderLineTaxLineSchema = createInsertSchema(draftOrderLineTaxLine);
export const selectDraftOrderLineTaxLineSchema = createSelectSchema(draftOrderLineTaxLine);

export const insertDraftOrderTagSchema = createInsertSchema(draftOrderTag);
export const selectDraftOrderTagSchema = createSelectSchema(draftOrderTag);

// Type exports
export type DraftOrder = typeof draftOrder.$inferSelect;
export type NewDraftOrder = typeof draftOrder.$inferInsert;

export type DraftOrderLine = typeof draftOrderLine.$inferSelect;
export type NewDraftOrderLine = typeof draftOrderLine.$inferInsert;

export type DraftOrderLineTaxLine = typeof draftOrderLineTaxLine.$inferSelect;
export type NewDraftOrderLineTaxLine = typeof draftOrderLineTaxLine.$inferInsert;

export type DraftOrderTag = typeof draftOrderTag.$inferSelect;
export type NewDraftOrderTag = typeof draftOrderTag.$inferInsert;