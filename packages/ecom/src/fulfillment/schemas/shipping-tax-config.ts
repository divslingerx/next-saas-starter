import { text, bigint, boolean, doublePrecision, integer, timestamp, index, pgTableCreator } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// Create table with prefix
export const createTable = pgTableCreator((name) => `agency-app_${name}`);

// SHIPPING CONFIGURATION

// Shipping zones (geographic areas)
export const shippingZone = createTable("shipping_zone", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  name: text("name"), // "North America", "Europe", "Local Delivery"
  active: boolean("active").default(true),
  
  // Priority for overlapping zones
  priority: integer("priority").default(0),
});

// Countries/regions in shipping zones
export const shippingZoneLocation = createTable("shipping_zone_location", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  shippingZoneId: bigint("shipping_zone_id", { mode: "number" }).notNull(),
  
  // Location matching
  countryCode: text("country_code"),
  provinceCode: text("province_code"),
  postalCodeRange: text("postal_code_range"), // "10001-10099" or "M*" for wildcards
  
  // Type
  locationType: text("location_type"), // country, province, postal_code
}, (table) => [
  index("shipping_zone_location_zone_idx").on(table.shippingZoneId),
  index("shipping_zone_location_country_idx").on(table.countryCode),
]);

// Shipping methods available in zones
export const shippingMethod = createTable("shipping_method", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  shippingZoneId: bigint("shipping_zone_id", { mode: "number" }).notNull(),
  
  // Method details
  name: text("name"), // "Standard Shipping", "Express"
  carrier: text("carrier"), // "USPS", "FedEx", "Custom"
  serviceCode: text("service_code"), // Carrier-specific codes
  
  // Availability
  active: boolean("active").default(true),
  
  // Constraints
  minOrderAmount: doublePrecision("min_order_amount"),
  maxOrderAmount: doublePrecision("max_order_amount"),
  minWeight: doublePrecision("min_weight"),
  maxWeight: doublePrecision("max_weight"),
  
  // Delivery promises
  minDeliveryDays: integer("min_delivery_days"),
  maxDeliveryDays: integer("max_delivery_days"),
  cutoffTime: text("cutoff_time"), // "14:00" for same-day processing
  
  // Position in checkout
  sortOrder: integer("sort_order"),
});

// Shipping rates for methods
export const shippingRate = createTable("shipping_rate", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  shippingMethodId: bigint("shipping_method_id", { mode: "number" }).notNull(),
  
  // Rate type
  rateType: text("rate_type"), // flat, weight_based, price_based, calculated
  
  // Conditions (for tiered rates)
  minValue: doublePrecision("min_value"), // weight or price
  maxValue: doublePrecision("max_value"),
  
  // Rate
  price: doublePrecision("price"),
  
  // For calculated rates
  basePrice: doublePrecision("base_price"),
  pricePerUnit: doublePrecision("price_per_unit"), // per kg, per $100
}, (table) => [
  index("shipping_rate_method_idx").on(table.shippingMethodId),
]);

// TAX CONFIGURATION

// Tax zones (geographic areas for tax)
export const taxZone = createTable("tax_zone", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  name: text("name"), // "California", "EU VAT", "Canada GST"
  active: boolean("active").default(true),
});

// Locations in tax zones
export const taxZoneLocation = createTable("tax_zone_location", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  taxZoneId: bigint("tax_zone_id", { mode: "number" }).notNull(),
  
  countryCode: text("country_code"),
  provinceCode: text("province_code"),
  postalCodeRange: text("postal_code_range"),
  
  locationType: text("location_type"), // country, province, postal_code
}, (table) => [
  index("tax_zone_location_zone_idx").on(table.taxZoneId),
]);

// Tax rates
export const taxRate = createTable("tax_rate", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  taxZoneId: bigint("tax_zone_id", { mode: "number" }).notNull(),
  
  // Tax details
  name: text("name"), // "CA Sales Tax", "VAT"
  code: text("code"), // "CA_SALES", "EU_VAT"
  rate: doublePrecision("rate"), // 0.0875 for 8.75%
  
  // Tax type
  taxType: text("tax_type"), // sales, vat, gst, custom
  
  // What it applies to
  appliesToShipping: boolean("applies_to_shipping").default(false),
  appliesToDigitalGoods: boolean("applies_to_digital_goods").default(true),
  
  // Compound tax (tax on tax)
  isCompound: boolean("is_compound").default(false),
  priority: integer("priority").default(0), // Order for compound taxes
  
  active: boolean("active").default(true),
});

// Product tax overrides
export const productTaxOverride = createTable("product_tax_override", {
  productId: bigint("product_id", { mode: "number" }).notNull(),
  taxZoneId: bigint("tax_zone_id", { mode: "number" }).notNull(),
  
  // Override options
  taxExempt: boolean("tax_exempt").default(false),
  taxRateId: bigint("tax_rate_id", { mode: "number" }), // Use specific rate
  customRate: doublePrecision("custom_rate"), // Or custom rate
}, (table) => [
  index("product_tax_override_product_idx").on(table.productId),
  index("product_tax_override_zone_idx").on(table.taxZoneId),
]);

// Customer tax exemptions
export const customerTaxExemption = createTable("customer_tax_exemption", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  customerId: bigint("customer_id", { mode: "number" }).notNull(),
  
  // Exemption details
  exemptionType: text("exemption_type"), // reseller, non_profit, government
  exemptionNumber: text("exemption_number"),
  
  // Validity
  validFrom: timestamp("valid_from"),
  validUntil: timestamp("valid_until"),
  
  // Scope
  appliesToAllZones: boolean("applies_to_all_zones").default(false),
  specificZoneIds: text("specific_zone_ids"), // JSON array
}, (table) => [
  index("customer_tax_exemption_customer_idx").on(table.customerId),
]);

// Calculated tax cache (for performance)
export const taxCalculationCache = createTable("tax_calculation_cache", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  // Cache key components
  zoneId: bigint("zone_id", { mode: "number" }),
  productId: bigint("product_id", { mode: "number" }),
  customerId: bigint("customer_id", { mode: "number" }),
  amount: doublePrecision("amount"),
  
  // Calculated values
  taxAmount: doublePrecision("tax_amount"),
  taxRateApplied: doublePrecision("tax_rate_applied"),
  taxBreakdown: text("tax_breakdown"), // JSON of all taxes applied
  
  // Cache management
  calculatedAt: timestamp("calculated_at"),
  expiresAt: timestamp("expires_at"),
}, (table) => [
  index("tax_cache_lookup_idx").on(table.zoneId, table.productId, table.customerId),
  index("tax_cache_expires_idx").on(table.expiresAt),
]);

// Zod schemas
export const insertShippingZoneSchema = createInsertSchema(shippingZone);
export const selectShippingZoneSchema = createSelectSchema(shippingZone);

export const insertShippingMethodSchema = createInsertSchema(shippingMethod);
export const selectShippingMethodSchema = createSelectSchema(shippingMethod);

export const insertShippingRateSchema = createInsertSchema(shippingRate);
export const selectShippingRateSchema = createSelectSchema(shippingRate);

export const insertTaxZoneSchema = createInsertSchema(taxZone);
export const selectTaxZoneSchema = createSelectSchema(taxZone);

export const insertTaxRateSchema = createInsertSchema(taxRate);
export const selectTaxRateSchema = createSelectSchema(taxRate);

// Type exports
export type ShippingZone = typeof shippingZone.$inferSelect;
export type ShippingMethod = typeof shippingMethod.$inferSelect;
export type ShippingRate = typeof shippingRate.$inferSelect;
export type TaxZone = typeof taxZone.$inferSelect;
export type TaxRate = typeof taxRate.$inferSelect;