import { pgTableCreator, text, bigint, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const createTable = pgTableCreator((name) => `agency-app_${name}`);

/**
 * Normalized address table - can be referenced by any entity
 * Replaces inline address fields in orders, customers, etc.
 */
export const address = createTable(
  "address",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    
    // Address components
    firstName: text("first_name"),
    lastName: text("last_name"),
    company: text("company"),
    phone: text("phone"),
    
    address1: text("address1").notNull(),
    address2: text("address2"),
    city: text("city").notNull(),
    province: text("province"),
    provinceCode: text("province_code"),
    country: text("country").notNull(),
    countryCode: text("country_code").notNull(),
    zip: text("zip"),
    
    // Geocoding
    latitude: text("latitude"),
    longitude: text("longitude"),
    
    // Metadata
    isDefault: boolean("is_default").default(false),
    isValidated: boolean("is_validated").default(false),
    validatedAt: timestamp("validated_at"),
    
    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    countryCodeIdx: index("address_country_code_idx").on(table.countryCode),
    provinceCodeIdx: index("address_province_code_idx").on(table.provinceCode),
  })
);

// Address reference table - links addresses to various entities
export const addressReference = createTable(
  "address_reference",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    
    addressId: bigint("address_id", { mode: "number" })
      .notNull()
      .references(() => address.id, { onDelete: "cascade" }),
    
    // Polymorphic reference
    entityType: text("entity_type").notNull(), // 'customer', 'order', 'company', 'location'
    entityId: bigint("entity_id", { mode: "number" }).notNull(),
    
    // Address type for the entity
    addressType: text("address_type").notNull(), // 'billing', 'shipping', 'primary', 'secondary'
    
    // Metadata
    label: text("label"), // Custom label like "Home", "Office"
    isActive: boolean("is_active").default(true),
    
    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    entityIdx: index("address_ref_entity_idx").on(table.entityType, table.entityId),
    addressIdx: index("address_ref_address_idx").on(table.addressId),
    typeIdx: index("address_ref_type_idx").on(table.addressType),
  })
);

// Type exports
export type Address = typeof address.$inferSelect;
export type NewAddress = typeof address.$inferInsert;
export type AddressReference = typeof addressReference.$inferSelect;
export type NewAddressReference = typeof addressReference.$inferInsert;

// Schema exports
export const insertAddressSchema = createInsertSchema(address);
export const selectAddressSchema = createSelectSchema(address);
export const insertAddressReferenceSchema = createInsertSchema(addressReference);
export const selectAddressReferenceSchema = createSelectSchema(addressReference);