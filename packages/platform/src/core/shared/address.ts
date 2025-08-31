import { pgTableCreator, text, bigint, boolean, timestamp, jsonb, index, unique, uuid, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { organization } from "../identity/organization";

export const createTable = pgTableCreator((name) => `agency-app_${name}`);

/**
 * Unified address system - can be attached to any entity
 * Supports international addresses with flexible formatting
 */
export const address = createTable(
  "address",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    
    // Universal identifier
    uid: uuid("uid").defaultRandom().notNull().unique(),
    
    // Multi-tenant
    organizationId: bigint("organization_id", { mode: "number" })
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    
    // Polymorphic reference - what this address belongs to
    entityType: text("entity_type").notNull(), // 'person', 'organization', 'order', 'location'
    entityId: bigint("entity_id", { mode: "number" }).notNull(),
    
    // Address type and label
    type: text("type").notNull(), // 'billing', 'shipping', 'business', 'home', 'work', 'other'
    label: text("label"), // Custom label like "Headquarters", "Summer Home"
    
    // Recipient information (optional)
    attention: text("attention"), // Name of person/department
    careOf: text("care_of"), // c/o
    
    // Address components - flexible for international
    line1: text("line1").notNull(),
    line2: text("line2"),
    line3: text("line3"), // Some countries need 3 lines
    
    // Locality components
    city: text("city"),
    district: text("district"), // District/County/Region
    stateProvince: text("state_province"),
    stateProvinceCode: text("state_province_code"), // Standardized code
    postalCode: text("postal_code"),
    postalCodeExtension: text("postal_code_extension"), // +4 for US
    
    // Country
    country: text("country").notNull(),
    countryCode: text("country_code").notNull(), // ISO 3166-1 alpha-2
    
    // Building/location details
    building: text("building"),
    floor: text("floor"),
    apartment: text("apartment"),
    
    // Geocoding
    latitude: decimal("latitude", { precision: 10, scale: 8 }),
    longitude: decimal("longitude", { precision: 11, scale: 8 }),
    geohash: text("geohash"), // For proximity searches
    timezone: text("timezone"),
    
    // Formatted address (for display)
    formattedAddress: text("formatted_address"),
    formattedAddressHtml: text("formatted_address_html"), // With <br> tags
    
    // Validation and enrichment
    isValid: boolean("is_valid").default(false),
    validatedAt: timestamp("validated_at"),
    validationProvider: text("validation_provider"), // 'google', 'usps', 'manual'
    validationData: jsonb("validation_data"), // Provider-specific data
    validationErrors: jsonb("validation_errors"),
    
    // Delivery information
    isDeliverable: boolean("is_deliverable"),
    deliveryInstructions: text("delivery_instructions"),
    accessCode: text("access_code"), // Gate code, etc.
    
    // Usage flags
    isDefault: boolean("is_default").default(false),
    isPrimary: boolean("is_primary").default(false),
    isBilling: boolean("is_billing").default(false),
    isShipping: boolean("is_shipping").default(false),
    
    // Status
    status: text("status").default('active'), // 'active', 'inactive', 'undeliverable'
    
    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    lastUsedAt: timestamp("last_used_at"),
    verifiedAt: timestamp("verified_at"),
  },
  (table) => ({
    // Core indexes
    uidIdx: index("address_uid_idx").on(table.uid),
    orgIdx: index("address_org_idx").on(table.organizationId),
    
    // Entity reference
    entityIdx: index("address_entity_idx").on(table.entityType, table.entityId),
    
    // Type indexes
    typeIdx: index("address_type_idx").on(table.type),
    
    // Location indexes
    countryIdx: index("address_country_idx").on(table.countryCode),
    stateIdx: index("address_state_idx").on(table.stateProvinceCode),
    postalIdx: index("address_postal_idx").on(table.postalCode),
    
    // Geocoding indexes
    geoIdx: index("address_geo_idx").on(table.latitude, table.longitude),
    geohashIdx: index("address_geohash_idx").on(table.geohash),
    
    // Usage indexes
    defaultIdx: index("address_default_idx").on(table.isDefault)
      .where(sql`is_default = true`),
    statusIdx: index("address_status_idx").on(table.status),
  })
);

// Type exports
export type Address = typeof address.$inferSelect;
export type NewAddress = typeof address.$inferInsert;

// Validation schemas
export const insertAddressSchema = createInsertSchema(address, {
  entityType: z.enum(['person', 'organization', 'order', 'location', 'event']),
  type: z.enum(['billing', 'shipping', 'business', 'home', 'work', 'other']),
  line1: z.string().min(1).max(255),
  city: z.string().min(1).max(100).optional(),
  countryCode: z.string().length(2), // ISO 3166-1 alpha-2
  postalCode: z.string().max(20).optional(),
  status: z.enum(['active', 'inactive', 'undeliverable']).optional(),
});

export const selectAddressSchema = createSelectSchema(address);
export const updateAddressSchema = insertAddressSchema.partial();