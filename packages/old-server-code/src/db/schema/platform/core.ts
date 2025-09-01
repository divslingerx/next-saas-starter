/**
 * Platform Core - Object Definitions and Records
 * Single source of truth for all business entities
 */

import { sql } from "drizzle-orm";
import {
  text,
  integer,
  varchar,
  boolean,
  timestamp,
  index,
  unique,
  jsonb,
} from "drizzle-orm/pg-core";
import { createTable } from "../../utils";
import { organization } from "../auth";

// ==========================================
// OBJECT DEFINITIONS
// ==========================================

/**
 * Platform object definitions - defines what types of objects exist
 * Examples: client, contact, deal, ticket, etc.
 */
export const objectDefinition = createTable("object_definition", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  
  // Identification
  objectTypeId: varchar("object_type_id", { length: 20 }).notNull().unique(), // "0-1", "0-2", etc.
  objectType: varchar("object_type", { length: 50 }).notNull().unique(), // "client", "contact", etc.
  
  // Display
  label: varchar("label", { length: 100 }).notNull(),
  pluralLabel: varchar("plural_label", { length: 100 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }),

  // Properties definition (JSONB for flexibility)
  properties: jsonb("properties").notNull().default({}),
  propertySchema: jsonb("property_schema"), // JSON schema for validation
  propertyOrder: jsonb("property_order").default([]),
  requiredProperties: jsonb("required_properties").default([]),
  searchableProperties: jsonb("searchable_properties").default([]),
  primaryDisplayProperty: varchar("primary_display_property", { length: 50 }).default("name"),

  // Behavior flags
  isSystemObject: boolean("is_system_object").default(false), // Can't be deleted
  isActive: boolean("is_active").default(true),
  allowCustomProperties: boolean("allow_custom_properties").default(true),

  // Metadata
  version: integer("version").default(1),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(() => new Date()),
});

// ==========================================
// RECORDS (Actual Data)
// ==========================================

/**
 * Records - actual instances of objects
 * This is where the data lives
 */
export const record = createTable(
  "record",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    
    // Object type reference
    objectDefinitionId: integer("object_definition_id")
      .notNull()
      .references(() => objectDefinition.id),
    
    // Organization isolation
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),

    // External reference (for integrations)
    externalId: varchar("external_id", { length: 100 }),

    // Properties stored as JSONB (sparse - only non-default values)
    properties: jsonb("properties").notNull().default({}),

    // Computed fields for performance
    displayName: text("display_name"), // Computed from primary display property
    searchVector: text("search_vector"), // For full-text search

    // Lifecycle
    isArchived: boolean("is_archived").default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(() => new Date()),
    createdById: text("created_by_id"),
    updatedById: text("updated_by_id"),
  },
  (table) => [
    // Unique constraint for external IDs within org/object type
    unique().on(table.organizationId, table.objectDefinitionId, table.externalId),
    
    // Performance indexes
    index("record_org_object_idx").on(table.organizationId, table.objectDefinitionId),
    index("record_external_idx").on(table.externalId),
    index("record_display_name_idx").on(table.displayName),
    
    // Partial index for active records only
    index("record_active_idx")
      .on(table.organizationId, table.objectDefinitionId)
      .where(sql`${table.isArchived} = false`),
    
    // GIN index for JSONB properties
    index("record_properties_gin_idx").using("gin", table.properties),
    
    // Smart composite indexes for common query patterns
    index("record_org_object_active_idx")
      .on(table.organizationId, table.objectDefinitionId, table.isArchived)
      .where(sql`${table.isArchived} = false`),
    
    // Multi-property GIN index for efficient property lookups
    index("record_common_properties_gin_idx")
      .using("gin", sql`(${table.properties} -> 'domain'), (${table.properties} -> 'email'), (${table.properties} -> 'name'), (${table.properties} -> 'lifecycle_stage')`),
    
    // Specialized indexes for high-frequency queries
    index("record_search_performance_idx").on(table.displayName, table.organizationId)
      .where(sql`${table.isArchived} = false AND ${table.displayName} IS NOT NULL`),
  ]
);

// ==========================================
// ORGANIZATION CUSTOMIZATIONS
// ==========================================

/**
 * Organization-specific customizations for object definitions
 * Allows orgs to add custom properties, hide fields, set defaults
 */
export const organizationObjectSchema = createTable(
  "organization_object_schema",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    
    objectDefinitionId: integer("object_definition_id")
      .notNull()
      .references(() => objectDefinition.id),

    // Organization-specific customizations
    customProperties: jsonb("custom_properties").default({}), // Additional properties
    hiddenProperties: jsonb("hidden_properties").default([]), // Properties to hide
    propertyDefaults: jsonb("property_defaults").default({}), // Override defaults
    
    // UI customizations
    customLayouts: jsonb("custom_layouts"), // Custom form/view layouts
    
    // Schema versioning for safe migrations
    schemaVersion: integer("schema_version").default(1),
    propertyMigrations: jsonb("property_migrations").default([]),
    lastMigrationAt: timestamp("last_migration_at", { withTimezone: true }),
    
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(() => new Date()),
  },
  (table) => [
    unique().on(table.organizationId, table.objectDefinitionId),
    index("org_schema_org_obj_idx").on(table.organizationId, table.objectDefinitionId),
  ]
);