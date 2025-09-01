/**
 * Platform Associations - Relationships between records
 * Clean implementation inspired by HubSpot's association model
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
  check,
} from "drizzle-orm/pg-core";
import { createTable } from "../../utils";
import { organization } from "../auth";
import { record } from "./core";

// ==========================================
// ASSOCIATION TYPES
// ==========================================

/**
 * Association type definitions
 * Defines what types of relationships can exist between objects
 */
export const associationType = createTable(
  "association_type",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    
    // HubSpot-style numeric ID for compatibility and performance
    typeId: integer("type_id").notNull().unique(),

    // Object types that can be associated
    fromObjectTypeId: varchar("from_object_type_id", { length: 20 }).notNull(), // e.g., "0-1" for client
    toObjectTypeId: varchar("to_object_type_id", { length: 20 }).notNull(), // e.g., "0-2" for contact

    // Naming and labels
    name: varchar("name", { length: 100 }).notNull(), // Internal name: "client_to_contact"
    label: varchar("label", { length: 100 }).notNull(), // Display: "has contact"
    inverseLabel: varchar("inverse_label", { length: 100 }), // Reverse: "belongs to"

    // Cardinality constraints
    cardinality: varchar("cardinality", { length: 20 })
      .notNull()
      .default("many-to-many"), // one-to-one, one-to-many, many-to-one, many-to-many
    fromMin: integer("from_min").default(0), // Minimum associations from source
    fromMax: integer("from_max"), // Maximum (null = unlimited)
    toMin: integer("to_min").default(0), // Minimum associations to target
    toMax: integer("to_max"), // Maximum (null = unlimited)

    // Behavior
    cascadeDelete: varchar("cascade_delete", { length: 20 }), // "from", "to", "both", "none"
    isRequired: boolean("is_required").default(false),
    isDirectional: boolean("is_directional").default(false), // If true, only goes one way

    // Categorization
    category: varchar("category", { length: 50 }), // "standard", "primary", "child_parent", etc.
    isSystemType: boolean("is_system_type").default(false), // Platform-defined, can't be deleted
    isActive: boolean("is_active").default(true),

    // Validation rules
    validationRules: jsonb("validation_rules"), // Custom validation logic

    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(() => new Date()),
  },
  (table) => [
    // Unique constraint for association names between object pairs
    unique().on(table.fromObjectTypeId, table.toObjectTypeId, table.name),
    
    // Business logic constraints
    check("chk_from_cardinality_limits", sql`${table.fromMax} IS NULL OR ${table.fromMax} >= ${table.fromMin}`),
    check("chk_to_cardinality_limits", sql`${table.toMax} IS NULL OR ${table.toMax} >= ${table.toMin}`),
    check("chk_positive_cardinality", sql`${table.fromMin} >= 0 AND ${table.toMin} >= 0`),
    
    // Performance indexes
    index("assoc_type_from_to_idx").on(table.fromObjectTypeId, table.toObjectTypeId),
    index("assoc_type_category_idx").on(table.category),
  ]
);

// ==========================================
// ASSOCIATIONS (Actual Relationships)
// ==========================================

/**
 * Actual associations between records
 * This is where the relationships are stored
 */
export const association = createTable(
  "association",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    
    // Association type reference
    typeId: integer("type_id")
      .notNull()
      .references(() => associationType.id),
    
    // The records being associated
    fromRecordId: integer("from_record_id")
      .notNull()
      .references(() => record.id, { onDelete: "cascade" }),
    toRecordId: integer("to_record_id")
      .notNull()
      .references(() => record.id, { onDelete: "cascade" }),
    
    // Organization isolation
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),

    // Optional metadata for the association
    properties: jsonb("properties"), // e.g., role, strength, notes
    
    // Dates for time-based associations
    startDate: timestamp("start_date", { withTimezone: true }),
    endDate: timestamp("end_date", { withTimezone: true }),
    
    // Tracking
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    createdById: text("created_by_id"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(() => new Date()),
    updatedById: text("updated_by_id"),
  },
  (table) => [
    // Prevent duplicate associations of the same type
    unique().on(table.typeId, table.fromRecordId, table.toRecordId),
    
    // Optimized composite indexes for association queries
    index("assoc_org_from_type_idx").on(table.organizationId, table.fromRecordId, table.typeId),
    index("assoc_org_to_type_idx").on(table.organizationId, table.toRecordId, table.typeId),
    
    // Covering index for association lookups (includes commonly needed data)
    index("assoc_lookup_covering_idx").on(table.fromRecordId, table.toRecordId, table.typeId, table.properties),
    
    // Partial index for active associations (simplified)
    index("assoc_active_time_idx")
      .on(table.startDate, table.endDate, table.organizationId)
      .where(sql`${table.endDate} IS NULL`),
  ]
);

// ==========================================
// ASSOCIATION LABELS (Custom Labels)
// ==========================================

/**
 * Custom association labels per organization
 * Allows orgs to create custom relationship types
 */
export const organizationAssociationLabel = createTable(
  "organization_association_label",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    
    baseTypeId: integer("base_type_id")
      .notNull()
      .references(() => associationType.id),
    
    // Custom labels
    customLabel: varchar("custom_label", { length: 100 }).notNull(),
    customInverseLabel: varchar("custom_inverse_label", { length: 100 }),
    
    // Custom type ID for this org
    customTypeId: integer("custom_type_id").notNull(),
    
    isActive: boolean("is_active").default(true),
    
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    unique().on(table.organizationId, table.customTypeId),
    index("org_assoc_label_org_idx").on(table.organizationId),
  ]
);