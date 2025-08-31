import { text, bigint, boolean, doublePrecision, timestamp, integer, foreignKey, primaryKey, pgTableCreator } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Create table with prefix
export const createTable = pgTableCreator((name) => `agency-app_${name}`);

// Main abandoned checkout table
export const abandonedCheckout = createTable("abandoned_checkout", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  // URLs and tokens
  abandonedCheckoutUrl: text("abandoned_checkout_url"),
  cartToken: text("cart_token"),
  
  // Customer information
  customerId: bigint("customer_id", { mode: "number" }),
  customerEmail: text("customer_email"),
  customerFirstName: text("customer_first_name"),
  customerLastName: text("customer_last_name"),
  customerLocale: text("customer_locale"),
  email: text("email"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: text("phone"),
  
  // Marketing consent
  buyerAcceptsMarketing: boolean("buyer_accepts_marketing"),
  customerAcceptsMarketing: boolean("customer_accepts_marketing"),
  customerEmailMarketingConsentMarketingOptInLevel: text("customer_email_marketing_consent_marketing_opt_in_level"),
  customerEmailMarketingConsentMarketingState: text("customer_email_marketing_consent_marketing_state"),
  customerEmailMarketingConsentUpdatedAt: timestamp("customer_email_marketing_consent_updated_at"),
  
  // Billing address fields
  billingAddressAddress1: text("billing_address_address1"),
  billingAddressAddress2: text("billing_address_address2"),
  billingAddressCity: text("billing_address_city"),
  billingAddressCompany: text("billing_address_company"),
  billingAddressCountry: text("billing_address_country"),
  billingAddressCountryCode: text("billing_address_country_code"),
  billingAddressDefault: boolean("billing_address_default"),
  billingAddressFirstName: text("billing_address_first_name"),
  billingAddressId: text("billing_address_id"),
  billingAddressLastName: text("billing_address_last_name"),
  billingAddressLatitude: doublePrecision("billing_address_latitude"),
  billingAddressLongitude: doublePrecision("billing_address_longitude"),
  billingAddressName: text("billing_address_name"),
  billingAddressPhone: text("billing_address_phone"),
  billingAddressProvince: text("billing_address_province"),
  billingAddressProvinceCode: text("billing_address_province_code"),
  billingAddressZip: text("billing_address_zip"),
  
  // Shipping address fields
  shippingAddressAddress1: text("shipping_address_address1"),
  shippingAddressAddress2: text("shipping_address_address2"),
  shippingAddressCity: text("shipping_address_city"),
  shippingAddressCompany: text("shipping_address_company"),
  shippingAddressCountry: text("shipping_address_country"),
  shippingAddressCountryCode: text("shipping_address_country_code"),
  shippingAddressDefault: boolean("shipping_address_default"),
  shippingAddressFirstName: text("shipping_address_first_name"),
  shippingAddressId: text("shipping_address_id"),
  shippingAddressLastName: text("shipping_address_last_name"),
  shippingAddressLatitude: doublePrecision("shipping_address_latitude"),
  shippingAddressLongitude: doublePrecision("shipping_address_longitude"),
  shippingAddressName: text("shipping_address_name"),
  shippingAddressPhone: text("shipping_address_phone"),
  shippingAddressProvince: text("shipping_address_province"),
  shippingAddressProvinceCode: text("shipping_address_province_code"),
  shippingAddressZip: text("shipping_address_zip"),
  
  // Checkout details
  name: text("name"),
  note: text("note"),
  currency: text("currency"),
  presentmentCurrency: text("presentment_currency"),
  discountCodes: text("discount_codes"),
  
  // Timestamps
  closedAt: timestamp("closed_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
  
  // Pricing fields
  subtotalPrice: doublePrecision("subtotal_price"),
  totalPrice: doublePrecision("total_price"),
  totalDiscounts: doublePrecision("total_discounts"),
  totalLineItemsPrice: doublePrecision("total_line_items_price"),
  totalTax: doublePrecision("total_tax"),
  totalDuties: doublePrecision("total_duties"),
  totalWeight: bigint("total_weight", { mode: "number" }),
  taxesIncluded: boolean("taxes_included"),
  
  // Price sets
  subtotalPriceSetPresentmentMoneyAmount: doublePrecision("subtotal_price_set_presentment_money_amount"),
  subtotalPriceSetPresentmentMoneyCurrencyCode: text("subtotal_price_set_presentment_money_currency_code"),
  subtotalPriceSetShopMoneyAmount: doublePrecision("subtotal_price_set_shop_money_amount"),
  subtotalPriceSetShopMoneyCurrencyCode: text("subtotal_price_set_shop_money_currency_code"),
  
  totalPriceSetPresentmentMoneyAmount: doublePrecision("total_price_set_presentment_money_amount"),
  totalPriceSetPresentmentMoneyCurrencyCode: text("total_price_set_presentment_money_currency_code"),
  totalPriceSetShopMoneyAmount: doublePrecision("total_price_set_shop_money_amount"),
  totalPriceSetShopMoneyCurrencyCode: text("total_price_set_shop_money_currency_code"),
  
  totalDiscountSetPresentmentMoneyAmount: doublePrecision("total_discount_set_presentment_money_amount"),
  totalDiscountSetPresentmentMoneyCurrencyCode: text("total_discount_set_presentment_money_currency_code"),
  totalDiscountSetShopMoneyAmount: doublePrecision("total_discount_set_shop_money_amount"),
  totalDiscountSetShopMoneyCurrencyCode: text("total_discount_set_shop_money_currency_code"),
  
  totalLineItemsPriceSetPresentmentMoneyAmount: doublePrecision("total_line_items_price_set_presentment_money_amount"),
  totalLineItemsPriceSetPresentmentMoneyCurrencyCode: text("total_line_items_price_set_presentment_money_currency_code"),
  totalLineItemsPriceSetShopMoneyAmount: doublePrecision("total_line_items_price_set_shop_money_amount"),
  totalLineItemsPriceSetShopMoneyCurrencyCode: text("total_line_items_price_set_shop_money_currency_code"),
  
  totalTaxSetPresentmentMoneyAmount: doublePrecision("total_tax_set_presentment_money_amount"),
  totalTaxSetPresentmentMoneyCurrencyCode: text("total_tax_set_presentment_money_currency_code"),
  totalTaxSetShopMoneyAmount: doublePrecision("total_tax_set_shop_money_amount"),
  totalTaxSetShopMoneyCurrencyCode: text("total_tax_set_shop_money_currency_code"),
  
  totalDutiesSetPresentmentMoneyAmount: doublePrecision("total_duties_set_presentment_money_amount"),
  totalDutiesSetPresentmentMoneyCurrencyCode: text("total_duties_set_presentment_money_currency_code"),
  totalDutiesSetShopMoneyAmount: doublePrecision("total_duties_set_shop_money_amount"),
  totalDutiesSetShopMoneyCurrencyCode: text("total_duties_set_shop_money_currency_code"),
  
  // Source information
  deviceId: text("device_id"),
  landingSite: text("landing_site"),
  referringSite: text("referring_site"),
  source: text("source"),
  sourceIdentifier: text("source_identifier"),
  sourceName: text("source_name"),
  sourceUrl: text("source_url"),
  
  // User ID
  userId: bigint("user_id", { mode: "number" }),
}, (table) => ({
  // Note: customer_id is a foreign key but we don't define the relation here
  // as the customer table hasn't been created yet
}));

// Abandoned checkout line items
export const abandonedCheckoutLine = createTable("abandoned_checkout_line", {
  id: text("id").primaryKey(),
  checkoutId: bigint("checkout_id", { mode: "number" }),
  
  // Product information
  productId: bigint("product_id", { mode: "number" }),
  variantId: bigint("variant_id", { mode: "number" }),
  productTitle: text("product_title"),
  productType: text("product_type"),
  productIsGiftCard: boolean("product_is_gift_card"),
  variantTitle: text("variant_title"),
  title: text("title"),
  presentmentTitle: text("presentment_title"),
  sku: text("sku"),
  
  // Pricing
  price: doublePrecision("price"),
  linePrice: doublePrecision("line_price"),
  compareAtPrice: doublePrecision("compare_at_price"),
  quantity: integer("quantity"),
  giftCard: boolean("gift_card"),
  
  // Price ranges
  compareAtPriceRangeMaxVariantCompareAtPriceAmount: doublePrecision("compare_at_price_range_max_variant_compare_at_price_amount"),
  compareAtPriceRangeMaxVariantCompareAtPriceCurrencyCode: text("compare_at_price_range_max_variant_compare_at_price_currency_code"),
  compareAtPriceRangeMinVariantCompareAtPriceAmount: doublePrecision("compare_at_price_range_min_variant_compare_at_price_amount"),
  compareAtPriceRangeMinVariantCompareAtPriceCurrencyCode: text("compare_at_price_range_min_variant_compare_at_price_currency_code"),
  
  // Discounted price sets
  discountedTotalPriceSetPresentmentMoneyAmount: doublePrecision("discounted_total_price_set_presentment_money_amount"),
  discountedTotalPriceSetPresentmentMoneyCurrencyCode: text("discounted_total_price_set_presentment_money_currency_code"),
  discountedTotalPriceSetShopMoneyAmount: doublePrecision("discounted_total_price_set_shop_money_amount"),
  discountedTotalPriceSetShopMoneyCurrencyCode: text("discounted_total_price_set_shop_money_currency_code"),
  
  // Original price sets
  originalTotalPriceSetPresentmentMoneyAmount: doublePrecision("original_total_price_set_presentment_money_amount"),
  originalTotalPriceSetPresentmentMoneyCurrencyCode: text("original_total_price_set_presentment_money_currency_code"),
  originalTotalPriceSetShopMoneyAmount: doublePrecision("original_total_price_set_shop_money_amount"),
  originalTotalPriceSetShopMoneyCurrencyCode: text("original_total_price_set_shop_money_currency_code"),
  
  originalUnitPriceSetPresentmentMoneyAmount: doublePrecision("original_unit_price_set_presentment_money_amount"),
  originalUnitPriceSetPresentmentMoneyCurrencyCode: text("original_unit_price_set_presentment_money_currency_code"),
  originalUnitPriceSetShopMoneyAmount: doublePrecision("original_unit_price_set_shop_money_amount"),
  originalUnitPriceSetShopMoneyCurrencyCode: text("original_unit_price_set_shop_money_currency_code"),
});

// Create Zod schemas for validation
export const insertAbandonedCheckoutSchema = createInsertSchema(abandonedCheckout);
export const selectAbandonedCheckoutSchema = createSelectSchema(abandonedCheckout);

export const insertAbandonedCheckoutLineSchema = createInsertSchema(abandonedCheckoutLine);
export const selectAbandonedCheckoutLineSchema = createSelectSchema(abandonedCheckoutLine);

// Type exports
export type AbandonedCheckout = typeof abandonedCheckout.$inferSelect;
export type NewAbandonedCheckout = typeof abandonedCheckout.$inferInsert;

export type AbandonedCheckoutLine = typeof abandonedCheckoutLine.$inferSelect;
export type NewAbandonedCheckoutLine = typeof abandonedCheckoutLine.$inferInsert;