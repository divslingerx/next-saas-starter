import { text, bigint, boolean, doublePrecision, timestamp, integer, index, pgTableCreator } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Create table with prefix
export const createTable = pgTableCreator((name) => `agency-app_${name}`);

// Main customer table
export const customer = createTable("customer", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  // Basic information
  email: text("email"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: text("phone"),
  note: text("note"),
  state: text("state"),
  currency: text("currency"),
  
  // Marketing consent
  acceptsMarketing: boolean("accepts_marketing"),
  acceptsMarketingUpdatedAt: timestamp("accepts_marketing_updated_at"),
  marketingOptInLevel: text("marketing_opt_in_level"),
  
  // Email marketing consent
  emailMarketingConsentOptInLevel: text("email_marketing_consent_opt_in_level"),
  emailMarketingConsentState: text("email_marketing_consent_state"),
  emailMarketingConsentUpdatedAt: timestamp("email_marketing_consent_updated_at"),
  
  // SMS marketing consent
  smsMarketingConsentCollectedFrom: text("sms_marketing_consent_collected_from"),
  smsMarketingConsentOptInLevel: text("sms_marketing_consent_opt_in_level"),
  smsMarketingConsentState: text("sms_marketing_consent_state"),
  smsMarketingConsentUpdatedAt: timestamp("sms_marketing_consent_updated_at"),
  
  // Order statistics
  orderCount: bigint("order_count", { mode: "number" }),
  totalSpent: doublePrecision("total_spent"),
  
  // Additional fields
  multipassIdentifier: text("multipass_identifier"),
  taxExempt: boolean("tax_exempt"),
  verifiedEmail: boolean("verified_email"),
  
  // Timestamps
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
}, (table) => [
  index("customer_email_idx").on(table.email),
  index("customer_created_at_idx").on(table.createdAt),
]);

// Customer address table
export const customerAddress = createTable("customer_address", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  customerId: bigint("customer_id", { mode: "number" }).notNull(),
  
  // Address details
  address1: text("address1"),
  address2: text("address2"),
  city: text("city"),
  company: text("company"),
  country: text("country"),
  countryCode: text("country_code"),
  province: text("province"),
  provinceCode: text("province_code"),
  zip: text("zip"),
  phone: text("phone"),
  
  // Name fields
  firstName: text("first_name"),
  lastName: text("last_name"),
  name: text("name"),
  
  // Flags
  isDefault: boolean("is_default"),
}, (table) => [
  index("customer_address_customer_id_idx").on(table.customerId),
]);

// Customer metafield table
export const customerMetafield = createTable("customer_metafield", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  customerId: bigint("customer_id", { mode: "number" }).notNull(),
  
  // Metafield data
  namespace: text("namespace"),
  key: text("key"),
  value: text("value"),
  type: text("type"),
  description: text("description"),
  
  // Timestamps
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
}, (table) => [
  index("customer_metafield_customer_id_idx").on(table.customerId),
  index("customer_metafield_namespace_key_idx").on(table.namespace, table.key),
]);

// Customer tag table (many-to-many relationship)
export const customerTag = createTable("customer_tag", {
  customerId: bigint("customer_id", { mode: "number" }).notNull(),
  index: integer("index"),
  value: text("value").notNull(),
}, (table) => [
  index("customer_tag_customer_id_idx").on(table.customerId),
  index("customer_tag_value_idx").on(table.value),
]);

// Create Zod schemas for validation
export const insertCustomerSchema = createInsertSchema(customer, {
  email: z.string().email().optional(),
  acceptsMarketing: z.boolean().optional(),
  taxExempt: z.boolean().optional(),
  verifiedEmail: z.boolean().optional(),
});

export const selectCustomerSchema = createSelectSchema(customer);

export const insertCustomerAddressSchema = createInsertSchema(customerAddress, {
  isDefault: z.boolean().optional(),
});

export const selectCustomerAddressSchema = createSelectSchema(customerAddress);

export const insertCustomerMetafieldSchema = createInsertSchema(customerMetafield);
export const selectCustomerMetafieldSchema = createSelectSchema(customerMetafield);

export const insertCustomerTagSchema = createInsertSchema(customerTag);
export const selectCustomerTagSchema = createSelectSchema(customerTag);

// Type exports
export type Customer = typeof customer.$inferSelect;
export type NewCustomer = typeof customer.$inferInsert;

export type CustomerAddress = typeof customerAddress.$inferSelect;
export type NewCustomerAddress = typeof customerAddress.$inferInsert;

export type CustomerMetafield = typeof customerMetafield.$inferSelect;
export type NewCustomerMetafield = typeof customerMetafield.$inferInsert;

export type CustomerTag = typeof customerTag.$inferSelect;
export type NewCustomerTag = typeof customerTag.$inferInsert;