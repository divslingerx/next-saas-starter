import { text, bigint, boolean, doublePrecision, timestamp, index, pgTableCreator } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Create table with prefix
export const createTable = pgTableCreator((name) => `agency-app_${name}`);

// Shop table
export const shop = createTable("shop", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  // Basic information
  name: text("name"),
  email: text("email"),
  domain: text("domain"),
  myshopifyDomain: text("myshopify_domain"),
  customerEmail: text("customer_email"),
  shopOwner: text("shop_owner"),
  
  // Contact information
  phone: text("phone"),
  address1: text("address1"),
  address2: text("address2"),
  city: text("city"),
  province: text("province"),
  provinceCode: text("province_code"),
  country: text("country"),
  countryCode: text("country_code"),
  countryName: text("country_name"),
  zip: text("zip"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  
  // Currency and money formatting
  currency: text("currency"),
  enabledPresentmentCurrencies: text("enabled_presentment_currencies"),
  moneyFormat: text("money_format"),
  moneyWithCurrencyFormat: text("money_with_currency_format"),
  moneyInEmailsFormat: text("money_in_emails_format"),
  moneyWithCurrencyInEmailsFormat: text("money_with_currency_in_emails_format"),
  weightUnit: text("weight_unit"),
  
  // Timezone
  timezone: text("timezone"),
  ianaTimezone: text("iana_timezone"),
  primaryLocale: text("primary_locale"),
  
  // Plan information
  planName: text("plan_name"),
  planDisplayName: text("plan_display_name"),
  source: text("source"),
  
  // Features and settings
  passwordEnabled: boolean("password_enabled"),
  hasStorefront: boolean("has_storefront"),
  hasDiscounts: boolean("has_discounts"),
  hasGiftCards: boolean("has_gift_cards"),
  finances: boolean("finances"),
  taxesIncluded: boolean("taxes_included"),
  taxShipping: boolean("tax_shipping"),
  countyTaxes: boolean("county_taxes"),
  checkoutApiSupported: boolean("checkout_api_supported"),
  multiLocationEnabled: boolean("multi_location_enabled"),
  setupRequired: boolean("setup_required"),
  preLaunchEnabled: boolean("pre_launch_enabled"),
  requiresExtraPaymentsAgreement: boolean("requires_extra_payments_agreement"),
  
  // Payment eligibility
  eligibleForPayments: boolean("eligible_for_payments"),
  eligibleForCardReaderGiveaway: boolean("eligible_for_card_reader_giveaway"),
  
  // Google apps
  googleAppsLoginEnabled: boolean("google_apps_login_enabled"),
  googleAppsDomain: text("google_apps_domain"),
  
  // Primary location
  primaryLocationId: bigint("primary_location_id", { mode: "number" }),
  
  // Cookie consent
  cookieConsentLevel: text("cookie_consent_level"),
  visitorTrackingConsentPreference: text("visitor_tracking_consent_preference"),
  
  // Timestamps
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
}, (table) => [
  index("shop_domain_idx").on(table.domain),
  index("shop_myshopify_domain_idx").on(table.myshopifyDomain),
]);

// Create Zod schemas for validation
export const insertShopSchema = createInsertSchema(shop, {
  passwordEnabled: z.boolean().optional(),
  hasStorefront: z.boolean().optional(),
  hasDiscounts: z.boolean().optional(),
  hasGiftCards: z.boolean().optional(),
  finances: z.boolean().optional(),
  taxesIncluded: z.boolean().optional(),
  taxShipping: z.boolean().optional(),
  countyTaxes: z.boolean().optional(),
  checkoutApiSupported: z.boolean().optional(),
  multiLocationEnabled: z.boolean().optional(),
  setupRequired: z.boolean().optional(),
  preLaunchEnabled: z.boolean().optional(),
  requiresExtraPaymentsAgreement: z.boolean().optional(),
  eligibleForPayments: z.boolean().optional(),
  eligibleForCardReaderGiveaway: z.boolean().optional(),
  googleAppsLoginEnabled: z.boolean().optional(),
});
export const selectShopSchema = createSelectSchema(shop);

// Type exports
export type Shop = typeof shop.$inferSelect;
export type NewShop = typeof shop.$inferInsert;