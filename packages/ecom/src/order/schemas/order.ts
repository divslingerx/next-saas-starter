import { text, bigint, boolean, doublePrecision, timestamp, integer, index, pgTableCreator } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Create table with prefix
export const createTable = pgTableCreator((name) => `agency-app_${name}`);

// Main order table
export const order = createTable("order", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  // Basic information
  name: text("name"),
  email: text("email"),
  token: text("token"),
  number: integer("number"),
  orderNumber: integer("order_number"),
  orderStatusUrl: text("order_status_url"),
  
  // Customer and location
  customerId: bigint("customer_id", { mode: "number" }),
  customerLocale: text("customer_locale"),
  locationId: bigint("location_id", { mode: "number" }),
  deviceId: text("device_id"),
  appId: bigint("app_id", { mode: "number" }),
  
  // Financial status
  financialStatus: text("financial_status"),
  fulfillmentStatus: text("fulfillment_status"),
  processingMethod: text("processing_method"),
  reference: text("reference"),
  
  // Currency
  currency: text("currency"),
  presentmentCurrency: text("presentment_currency"),
  
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
  
  // Browser and client details
  browserIp: text("browser_ip"),
  landingSite: text("landing_site"),
  landingSiteRef: text("landing_site_ref"),
  referringSite: text("referring_site"),
  sourceIdentifier: text("source_identifier"),
  sourceName: text("source_name"),
  sourceUrl: text("source_url"),
  
  // Client details
  clientDetailsAcceptLanguage: text("client_details_accept_language"),
  clientDetailsBrowserHeight: doublePrecision("client_details_browser_height"),
  clientDetailsBrowserIp: text("client_details_browser_ip"),
  clientDetailsBrowserWidth: doublePrecision("client_details_browser_width"),
  clientDetailsSessionHash: text("client_details_session_hash"),
  clientDetailsUserAgent: text("client_details_user_agent"),
  
  // Tokens
  cartToken: text("cart_token"),
  checkoutToken: text("checkout_token"),
  
  // Flags
  buyerAcceptsMarketing: boolean("buyer_accepts_marketing"),
  confirmed: boolean("confirmed"),
  test: boolean("test"),
  taxesIncluded: boolean("taxes_included"),
  
  // Notes and cancellation
  note: text("note"),
  cancelReason: text("cancel_reason"),
  
  // Pricing - Current
  currentSubtotalPrice: doublePrecision("current_subtotal_price"),
  currentTotalPrice: doublePrecision("current_total_price"),
  currentTotalDiscounts: doublePrecision("current_total_discounts"),
  currentTotalTax: doublePrecision("current_total_tax"),
  
  // Current price sets
  currentSubtotalPriceSetPresentmentMoneyAmount: doublePrecision("current_subtotal_price_set_presentment_money_amount"),
  currentSubtotalPriceSetPresentmentMoneyCurrencyCode: text("current_subtotal_price_set_presentment_money_currency_code"),
  currentSubtotalPriceSetShopMoneyAmount: doublePrecision("current_subtotal_price_set_shop_money_amount"),
  currentSubtotalPriceSetShopMoneyCurrencyCode: text("current_subtotal_price_set_shop_money_currency_code"),
  
  currentTotalPriceSetPresentmentMoneyAmount: doublePrecision("current_total_price_set_presentment_money_amount"),
  currentTotalPriceSetPresentmentMoneyCurrencyCode: text("current_total_price_set_presentment_money_currency_code"),
  currentTotalPriceSetShopMoneyAmount: doublePrecision("current_total_price_set_shop_money_amount"),
  currentTotalPriceSetShopMoneyCurrencyCode: text("current_total_price_set_shop_money_currency_code"),
  
  currentTotalDiscountsSetPresentmentMoneyAmount: doublePrecision("current_total_discounts_set_presentment_money_amount"),
  currentTotalDiscountsSetPresentmentMoneyCurrencyCode: text("current_total_discounts_set_presentment_money_currency_code"),
  currentTotalDiscountsSetShopMoneyAmount: doublePrecision("current_total_discounts_set_shop_money_amount"),
  currentTotalDiscountsSetShopMoneyCurrencyCode: text("current_total_discounts_set_shop_money_currency_code"),
  
  currentTotalTaxPresentmentMoneyAmount: doublePrecision("current_total_tax_presentment_money_amount"),
  currentTotalTaxPresentmentMoneyCurrencyCode: text("current_total_tax_presentment_money_currency_code"),
  currentTotalTaxShopMoneyAmount: doublePrecision("current_total_tax_shop_money_amount"),
  currentTotalTaxShopMoneyCurrencyCode: text("current_total_tax_shop_money_currency_code"),
  
  // Current duties
  currentTotalDutiesSetPresentmentMoneyAmount: doublePrecision("current_total_duties_set_presentment_money_amount"),
  currentTotalDutiesSetPresentmentMoneyCurrencyCode: text("current_total_duties_set_presentment_money_currency_code"),
  currentTotalDutiesSetShopMoneyAmount: doublePrecision("current_total_duties_set_shop_money_amount"),
  currentTotalDutiesSetShopMoneyCurrencyCode: text("current_total_duties_set_shop_money_currency_code"),
  
  // Original duties
  originalTotalDutiesSetPresentmentMoneyAmount: doublePrecision("original_total_duties_set_presentment_money_amount"),
  originalTotalDutiesSetPresentmentMoneyCurrencyCode: text("original_total_duties_set_presentment_money_currency_code"),
  originalTotalDutiesSetShopMoneyAmount: doublePrecision("original_total_duties_set_shop_money_amount"),
  originalTotalDutiesSetShopMoneyCurrencyCode: text("original_total_duties_set_shop_money_currency_code"),
  
  // Pricing - Totals
  subtotalPrice: doublePrecision("subtotal_price"),
  totalPrice: doublePrecision("total_price"),
  totalPriceUsd: doublePrecision("total_price_usd"),
  totalDiscounts: doublePrecision("total_discounts"),
  totalLineItemsPrice: doublePrecision("total_line_items_price"),
  totalTax: doublePrecision("total_tax"),
  totalTipReceived: doublePrecision("total_tip_received"),
  totalWeight: doublePrecision("total_weight"),
  
  // Total price sets
  subtotalPriceSetPresentmentMoneyAmount: doublePrecision("subtotal_price_set_presentment_money_amount"),
  subtotalPriceSetPresentmentMoneyCurrencyCode: text("subtotal_price_set_presentment_money_currency_code"),
  subtotalPriceSetShopMoneyAmount: doublePrecision("subtotal_price_set_shop_money_amount"),
  subtotalPriceSetShopMoneyCurrencyCode: text("subtotal_price_set_shop_money_currency_code"),
  
  totalPriceSetPresentmentMoneyAmount: doublePrecision("total_price_set_presentment_money_amount"),
  totalPriceSetPresentmentMoneyCurrencyCode: text("total_price_set_presentment_money_currency_code"),
  totalPriceSetShopMoneyAmount: doublePrecision("total_price_set_shop_money_amount"),
  totalPriceSetShopMoneyCurrencyCode: text("total_price_set_shop_money_currency_code"),
  
  totalDiscountsSetPresentmentMoneyAmount: doublePrecision("total_discounts_set_presentment_money_amount"),
  totalDiscountsSetPresentmentMoneyCurrencyCode: text("total_discounts_set_presentment_money_currency_code"),
  totalDiscountsSetShopMoneyAmount: doublePrecision("total_discounts_set_shop_money_amount"),
  totalDiscountsSetShopMoneyCurrencyCode: text("total_discounts_set_shop_money_currency_code"),
  
  totalLineItemsPriceSetPresentmentMoneyAmount: doublePrecision("total_line_items_price_set_presentment_money_amount"),
  totalLineItemsPriceSetPresentmentMoneyCurrencyCode: text("total_line_items_price_set_presentment_money_currency_code"),
  totalLineItemsPriceSetShopMoneyAmount: doublePrecision("total_line_items_price_set_shop_money_amount"),
  totalLineItemsPriceSetShopMoneyCurrencyCode: text("total_line_items_price_set_shop_money_currency_code"),
  
  totalTaxSetPresentmentMoneyAmount: doublePrecision("total_tax_set_presentment_money_amount"),
  totalTaxSetPresentmentMoneyCurrencyCode: text("total_tax_set_presentment_money_currency_code"),
  totalTaxSetShopMoneyAmount: doublePrecision("total_tax_set_shop_money_amount"),
  totalTaxSetShopMoneyCurrencyCode: text("total_tax_set_shop_money_currency_code"),
  
  totalShippingPriceSetPresentmentMoneyAmount: doublePrecision("total_shipping_price_set_presentment_money_amount"),
  totalShippingPriceSetPresentmentMoneyCurrencyCode: text("total_shipping_price_set_presentment_money_currency_code"),
  totalShippingPriceSetShopMoneyAmount: doublePrecision("total_shipping_price_set_shop_money_amount"),
  totalShippingPriceSetShopMoneyCurrencyCode: text("total_shipping_price_set_shop_money_currency_code"),
  
  // Conversion rate
  usdConversionRate: doublePrecision("usd_conversion_rate"),
  
  // Timestamps
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
  processedAt: timestamp("processed_at"),
  closedAt: timestamp("closed_at"),
  cancelledAt: timestamp("cancelled_at"),
}, (table) => [
  index("order_customer_id_idx").on(table.customerId),
  index("order_number_idx").on(table.orderNumber),
  index("order_email_idx").on(table.email),
  index("order_created_at_idx").on(table.createdAt),
  index("order_financial_status_idx").on(table.financialStatus),
  index("order_fulfillment_status_idx").on(table.fulfillmentStatus),
]);

// Order line items
export const orderLineItems = createTable("order_line_items", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  orderId: bigint("order_id", { mode: "number" }).notNull(),
  productId: bigint("product_id", { mode: "number" }),
  variantId: bigint("variant_id", { mode: "number" }),
  
  // Basic information
  name: text("name"),
  title: text("title"),
  variantTitle: text("variant_title"),
  sku: text("sku"),
  vendor: text("vendor"),
  index: integer("index"),
  
  // Quantities and fulfillment
  quantity: integer("quantity"),
  fulfillableQuantity: integer("fulfillable_quantity"),
  fulfillmentService: text("fulfillment_service"),
  fulfillmentStatus: text("fulfillment_status"),
  
  // Pricing
  price: doublePrecision("price"),
  totalDiscount: doublePrecision("total_discount"),
  
  // Price sets
  priceSetPresentmentMoneyAmount: doublePrecision("price_set_presentment_money_amount"),
  priceSetPresentmentMoneyCurrencyCode: text("price_set_presentment_money_currency_code"),
  priceSetShopMoneyAmount: doublePrecision("price_set_shop_money_amount"),
  priceSetShopMoneyCurrencyCode: text("price_set_shop_money_currency_code"),
  
  totalDiscountSetPresentmentMoneyAmount: doublePrecision("total_discount_set_presentment_money_amount"),
  totalDiscountSetPresentmentMoneyCurrencyCode: text("total_discount_set_presentment_money_currency_code"),
  totalDiscountSetShopMoneyAmount: doublePrecision("total_discount_set_shop_money_amount"),
  totalDiscountSetShopMoneyCurrencyCode: text("total_discount_set_shop_money_currency_code"),
  
  // Product details
  grams: integer("grams"),
  productExists: boolean("product_exists"),
  giftCard: boolean("gift_card"),
  requiresShipping: boolean("requires_shipping"),
  taxable: boolean("taxable"),
  variantInventoryManagement: text("variant_inventory_management"),
}, (table) => [
  index("order_line_items_order_id_idx").on(table.orderId),
  index("order_line_items_product_id_idx").on(table.productId),
  index("order_line_items_variant_id_idx").on(table.variantId),
]);

// Order shipping lines
export const orderShippingLines = createTable("order_shipping_lines", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  orderId: bigint("order_id", { mode: "number" }).notNull(),
  index: integer("index"),
  
  // Basic information
  title: text("title"),
  code: text("code"),
  source: text("source"),
  phone: text("phone"),
  
  // Carrier information
  carrierIdentifier: text("carrier_identifier"),
  requestedFulfillmentServiceId: text("requested_fulfillment_service_id"),
  deliveryCategory: text("delivery_category"),
  
  // Pricing
  price: doublePrecision("price"),
  discountedPrice: doublePrecision("discounted_price"),
  
  // Price sets
  priceSetPresentmentMoneyAmount: doublePrecision("price_set_presentment_money_amount"),
  priceSetPresentmentMoneyCurrencyCode: text("price_set_presentment_money_currency_code"),
  priceSetShopMoneyAmount: doublePrecision("price_set_shop_money_amount"),
  priceSetShopMoneyCurrencyCode: text("price_set_shop_money_currency_code"),
  
  discountedPriceSetPresentmentMoneyAmount: doublePrecision("discounted_price_set_presentment_money_amount"),
  discountedPriceSetPresentmentMoneyCurrencyCode: text("discounted_price_set_presentment_money_currency_code"),
  discountedPriceSetShopMoneyAmount: doublePrecision("discounted_price_set_shop_money_amount"),
  discountedPriceSetShopMoneyCurrencyCode: text("discounted_price_set_shop_money_currency_code"),
}, (table) => [
  index("order_shipping_lines_order_id_idx").on(table.orderId),
]);

// Order discount applications
export const orderDiscountApplications = createTable("order_discount_applications", {
  orderId: bigint("order_id", { mode: "number" }).notNull(),
  index: integer("index"),
  
  type: text("type"),
  title: text("title"),
  description: text("description"),
  code: text("code"),
  value: text("value"),
  valueType: text("value_type"),
  allocationMethod: text("allocation_method"),
  targetSelection: text("target_selection"),
  targetType: text("target_type"),
}, (table) => [
  index("order_discount_applications_order_id_idx").on(table.orderId),
]);

// Order tags
export const orderTag = createTable("order_tag", {
  orderId: bigint("order_id", { mode: "number" }).notNull(),
  index: integer("index"),
  value: text("value").notNull(),
}, (table) => [
  index("order_tag_order_id_idx").on(table.orderId),
  index("order_tag_value_idx").on(table.value),
]);

// Order note attributes
export const orderNoteAttributes = createTable("order_note_attributes", {
  orderId: bigint("order_id", { mode: "number" }).notNull(),
  name: text("name"),
  value: text("value"),
}, (table) => [
  index("order_note_attributes_order_id_idx").on(table.orderId),
]);

// Order metafields
export const orderMetafield = createTable("order_metafield", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  orderId: bigint("order_id", { mode: "number" }).notNull(),
  
  // Metafield data
  namespace: text("namespace"),
  key: text("key"),
  value: text("value"),
  type: text("type"),
  description: text("description"),
  
  // Definition fields
  definitionId: text("definition_id"),
  definitionKey: text("definition_key"),
  definitionName: text("definition_name"),
  definitionNamespace: text("definition_namespace"),
  definitionDescription: text("definition_description"),
  
  // Timestamps
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
}, (table) => [
  index("order_metafield_order_id_idx").on(table.orderId),
  index("order_metafield_namespace_key_idx").on(table.namespace, table.key),
]);

// Order risks
export const orderRisk = createTable("order_risk", {
  orderId: bigint("order_id", { mode: "number" }).notNull(),
  recommendation: text("recommendation"),
}, (table) => [
  index("order_risk_order_id_idx").on(table.orderId),
]);

// Order risk assessment
export const orderRiskAssessment = createTable("order_risk_assessment", {
  orderId: bigint("order_id", { mode: "number" }).notNull(),
  providerName: text("provider_name"),
  riskLevel: text("risk_level"),
}, (table) => [
  index("order_risk_assessment_order_id_idx").on(table.orderId),
]);

// Order risk assessment facts
export const orderRiskAssessmentFact = createTable("order_risk_assessment_fact", {
  orderId: bigint("order_id", { mode: "number" }).notNull(),
  assessmentProviderName: text("assessment_provider_name"),
  description: text("description"),
  sentiment: text("sentiment"),
  index: integer("index"),
}, (table) => [
  index("order_risk_assessment_fact_order_id_idx").on(table.orderId),
]);

// Order URL tags
export const orderUrlTags = createTable("order_url_tags", {
  orderId: bigint("order_id", { mode: "number" }).notNull(),
  index: integer("index"),
  key: text("key"),
  value: text("value"),
}, (table) => [
  index("order_url_tags_order_id_idx").on(table.orderId),
]);

// Line items discount allocations
export const lineItemsDiscountAllocations = createTable("line_items_discount_allocations", {
  orderId: bigint("order_id", { mode: "number" }).notNull(),
  orderLineId: bigint("order_line_id", { mode: "number" }),
  index: integer("index"),
  discountApplicationIndex: integer("discount_application_index"),
  
  amount: doublePrecision("amount"),
  
  // Amount sets
  amountSetPresentmentMoneyAmount: doublePrecision("amount_set_presentment_money_amount"),
  amountSetPresentmentMoneyCurrencyCode: text("amount_set_presentment_money_currency_code"),
  amountSetShopMoneyAmount: doublePrecision("amount_set_shop_money_amount"),
  amountSetShopMoneyCurrencyCode: text("amount_set_shop_money_currency_code"),
}, (table) => [
  index("line_items_discount_allocations_order_id_idx").on(table.orderId),
]);

// Line items tax lines
export const lineItemsTaxLines = createTable("line_items_tax_lines", {
  orderId: bigint("order_id", { mode: "number" }).notNull(),
  lineItemId: bigint("line_item_id", { mode: "number" }),
  index: integer("index"),
  
  title: text("title"),
  price: doublePrecision("price"),
  rate: doublePrecision("rate"),
  
  // Price sets
  priceSetPresentmentMoneyAmount: doublePrecision("price_set_presentment_money_amount"),
  priceSetPresentmentMoneyCurrencyCode: text("price_set_presentment_money_currency_code"),
  priceSetShopMoneyAmount: doublePrecision("price_set_shop_money_amount"),
  priceSetShopMoneyCurrencyCode: text("price_set_shop_money_currency_code"),
}, (table) => [
  index("line_items_tax_lines_order_id_idx").on(table.orderId),
]);

// Order shipping lines tax lines
export const orderShippingLinesTaxLines = createTable("order_shipping_lines_tax_lines", {
  orderId: bigint("order_id", { mode: "number" }).notNull(),
  orderShippingLineId: bigint("order_shipping_line_id", { mode: "number" }),
  index: integer("index"),
  
  title: text("title"),
  price: doublePrecision("price"),
  rate: doublePrecision("rate"),
}, (table) => [
  index("order_shipping_lines_tax_lines_order_id_idx").on(table.orderId),
]);

// Line item group
export const lineItemGroup = createTable("line_item_group", {
  id: text("id").primaryKey(),
  orderId: text("order_id"),
  lineItemId: text("line_item_id"),
  
  title: text("title"),
  variantId: text("variant_id"),
  variantSku: text("variant_sku"),
  quantity: integer("quantity"),
}, (table) => [
  index("line_item_group_order_id_idx").on(table.orderId),
]);

// Order agreement
export const orderAgreement = createTable("order_agreement", {
  id: text("id").primaryKey(),
  orderId: text("order_id"),
  
  appId: text("app_id"),
  appHandle: text("app_handle"),
  reason: text("reason"),
  happenedAt: timestamp("happened_at"),
}, (table) => [
  index("order_agreement_order_id_idx").on(table.orderId),
]);

// Order agreement sale
export const orderAgreementSale = createTable("order_agreement_sale", {
  id: text("id").primaryKey(),
  orderId: text("order_id"),
  orderAgreementId: text("order_agreement_id"),
  
  actionType: text("action_type"),
  lineType: text("line_type"),
  quantity: integer("quantity"),
  taxes: text("taxes"),
  
  // Total amounts
  totalAmountPresentmentMoneyAmount: text("total_amount_presentment_money_amount"),
  totalAmountPresentmentMoneyCurrencyCode: text("total_amount_presentment_money_currency_code"),
  totalAmountShopMoneyAmount: text("total_amount_shop_money_amount"),
  totalAmountShopMoneyCurrencyCode: text("total_amount_shop_money_currency_code"),
  
  // Discount amounts
  totalDiscountAmountAfterTaxesPresentmentMoneyAmount: text("total_discount_amount_after_taxes_presentment_money_amount"),
  totalDiscountAmountAfterTaxesPresentmentMoneyCurrencyCode: text("total_discount_amount_after_taxes_presentment_money_currency_code"),
  totalDiscountAmountAfterTaxesShopMoneyAmount: text("total_discount_amount_after_taxes_shop_money_amount"),
  totalDiscountAmountAfterTaxesShopMoneyCurrencyCode: text("total_discount_amount_after_taxes_shop_money_currency_code"),
  
  totalDiscountAmountBeforeTaxesPresentmentMoneyAmount: text("total_discount_amount_before_taxes_presentment_money_amount"),
  totalDiscountAmountBeforeTaxesPresentmentMoneyCurrencyCode: text("total_discount_amount_before_taxes_presentment_money_currency_code"),
  totalDiscountAmountBeforeTaxesShopMoneyAmount: text("total_discount_amount_before_taxes_shop_money_amount"),
  totalDiscountAmountBeforeTaxesShopMoneyCurrencyCode: text("total_discount_amount_before_taxes_shop_money_currency_code"),
  
  // Tax amounts
  totalTaxAmountPresentmentMoneyAmount: text("total_tax_amount_presentment_money_amount"),
  totalTaxAmountPresentmentMoneyCurrencyCode: text("total_tax_amount_presentment_money_currency_code"),
  totalTaxAmountShopMoneyAmount: text("total_tax_amount_shop_money_amount"),
  totalTaxAmountShopMoneyCurrencyCode: text("total_tax_amount_shop_money_currency_code"),
}, (table) => [
  index("order_agreement_sale_order_id_idx").on(table.orderId),
  index("order_agreement_sale_agreement_id_idx").on(table.orderAgreementId),
]);

// Create Zod schemas for validation
export const insertOrderSchema = createInsertSchema(order, {
  buyerAcceptsMarketing: z.boolean().optional(),
  confirmed: z.boolean().optional(),
  test: z.boolean().optional(),
  taxesIncluded: z.boolean().optional(),
});
export const selectOrderSchema = createSelectSchema(order);

export const insertOrderLineItemsSchema = createInsertSchema(orderLineItems, {
  productExists: z.boolean().optional(),
  giftCard: z.boolean().optional(),
  requiresShipping: z.boolean().optional(),
  taxable: z.boolean().optional(),
});
export const selectOrderLineItemsSchema = createSelectSchema(orderLineItems);

export const insertOrderShippingLinesSchema = createInsertSchema(orderShippingLines);
export const selectOrderShippingLinesSchema = createSelectSchema(orderShippingLines);

export const insertOrderDiscountApplicationsSchema = createInsertSchema(orderDiscountApplications);
export const selectOrderDiscountApplicationsSchema = createSelectSchema(orderDiscountApplications);

export const insertOrderTagSchema = createInsertSchema(orderTag);
export const selectOrderTagSchema = createSelectSchema(orderTag);

export const insertOrderMetafieldSchema = createInsertSchema(orderMetafield);
export const selectOrderMetafieldSchema = createSelectSchema(orderMetafield);

// Type exports
export type Order = typeof order.$inferSelect;
export type NewOrder = typeof order.$inferInsert;

export type OrderLineItems = typeof orderLineItems.$inferSelect;
export type NewOrderLineItems = typeof orderLineItems.$inferInsert;

export type OrderShippingLines = typeof orderShippingLines.$inferSelect;
export type NewOrderShippingLines = typeof orderShippingLines.$inferInsert;

export type OrderDiscountApplications = typeof orderDiscountApplications.$inferSelect;
export type NewOrderDiscountApplications = typeof orderDiscountApplications.$inferInsert;

export type OrderTag = typeof orderTag.$inferSelect;
export type NewOrderTag = typeof orderTag.$inferInsert;

export type OrderMetafield = typeof orderMetafield.$inferSelect;
export type NewOrderMetafield = typeof orderMetafield.$inferInsert;