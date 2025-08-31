import { pgTableCreator, text, bigint, boolean, timestamp, jsonb, index, unique, uuid, integer } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { person } from "../identity/person";
import { organization } from "../identity/organization";

export const createTable = pgTableCreator((name) => `agency-app_${name}`);

/**
 * Object definitions - defines what types of flexible objects exist in the system
 * Examples: custom_entity, ticket, custom_product_request, etc.
 */
export const objectDefinition = createTable(
  "object_definition",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    
    // Organization that owns this definition (null for system definitions)
    organizationId: bigint("organization_id", { mode: "number" })
      .references(() => organization.id, { onDelete: "cascade" }),
    
    // Object type identification
    name: text("name").notNull(), // 'deal', 'ticket', 'custom_entity'
    singularName: text("singular_name").notNull(), // 'Deal', 'Ticket'
    pluralName: text("plural_name").notNull(), // 'Deals', 'Tickets'
    
    // Internal name (for API/code)
    internalName: text("internal_name").notNull().unique(), // 'deal', 'ticket', 'custom_entity'
    
    // Description
    description: text("description"),
    
    // Configuration
    isSystem: boolean("is_system").default(false), // System-defined vs custom
    isActive: boolean("is_active").default(true),
    isSearchable: boolean("is_searchable").default(true),
    
    // Schema definition (JSON Schema)
    schema: jsonb("schema").notNull().default('{}'), // JSON Schema for validation
    
    // Property definitions
    properties: jsonb("properties").notNull().default('{}'), // Property configurations
    requiredProperties: text("required_properties").array().default(sql`ARRAY[]::text[]`),
    
    // Display configuration
    icon: text("icon"), // Icon identifier
    color: text("color"), // Hex color
    
    // UI configuration
    displayProperty: text("display_property"), // Which property to use as display name
    secondaryDisplayProperties: text("secondary_display_properties").array(),
    searchableProperties: text("searchable_properties").array(),
    
    // Features
    features: jsonb("features").default('{}'), // { "versioning": true, "audit": true, "workflow": true }
    
    // Pipeline support (for deal-like objects)
    hasPipeline: boolean("has_pipeline").default(false),
    pipelineStages: jsonb("pipeline_stages"), // Stage definitions
    
    // Associations
    allowedAssociations: jsonb("allowed_associations"), // Which object types can be associated
    
    // Permissions
    permissions: jsonb("permissions").default('{}'), // Role-based permissions
    
    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ([
    index("obj_def_org_idx").on(table.organizationId),
    index("obj_def_name_idx").on(table.name),
    unique("obj_def_internal_name_idx").on(table.internalName),
    index("obj_def_system_idx").on(table.isSystem),
    index("obj_def_active_idx").on(table.isActive),
  ])
);

/**
 * Records - actual instances of any object type
 * This is where the flexible data lives
 */
export const record = createTable(
  "record",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    
    // Universal identifier
    uid: uuid("uid").defaultRandom().notNull().unique(),
    
    // Multi-tenant
    organizationId: bigint("organization_id", { mode: "number" })
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    
    // Object type
    objectDefinitionId: bigint("object_definition_id", { mode: "number" })
      .notNull()
      .references(() => objectDefinition.id, { onDelete: "restrict" }),
    
    // Link to person if this record is about/owned by a person
    personId: bigint("person_id", { mode: "number" })
      .references(() => person.id, { onDelete: "set null" }),
    
    // Link to organization if this record is about/owned by an organization
    relatedOrganizationId: bigint("related_organization_id", { mode: "number" })
      .references(() => organization.id, { onDelete: "set null" }),
    
    // Record number (auto-generated, like DEAL-001)
    recordNumber: text("record_number"),
    
    // Flexible properties (the actual data)
    properties: jsonb("properties").notNull().default('{}'),
    
    // Computed fields for performance
    displayName: text("display_name"), // Computed from properties based on object definition
    searchText: text("search_text"), // Full-text search field
    
    // Common fields that most records need
    status: text("status"), // Object-specific statuses
    stage: text("stage"), // For pipeline objects
    priority: text("priority"), // 'low', 'medium', 'high', 'urgent'
    
    // Ownership and assignment
    ownerId: bigint("owner_id", { mode: "number" })
      .references(() => person.id, { onDelete: "set null" }),
    teamId: bigint("team_id", { mode: "number" }),
    assignedToId: bigint("assigned_to_id", { mode: "number" })
      .references(() => person.id, { onDelete: "set null" }),
    
    // Important dates
    dueDate: timestamp("due_date"),
    completedAt: timestamp("completed_at"),
    lastActivityAt: timestamp("last_activity_at"),
    
    // Scoring
    score: integer("score"),
    confidence: integer("confidence"), // 0-100
    
    // Source tracking
    source: text("source"),
    sourceDetails: jsonb("source_details"),
    
    // Tags
    tags: text("tags").array().default(sql`ARRAY[]::text[]`),
    
    // Archival
    isArchived: boolean("is_archived").default(false),
    archivedAt: timestamp("archived_at"),
    archivedById: bigint("archived_by_id", { mode: "number" }),
    
    // Version tracking
    version: integer("version").default(1),
    versionHistory: jsonb("version_history"),
    
    // External references
    externalId: text("external_id"),
    externalSource: text("external_source"),
    
    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    createdById: bigint("created_by_id", { mode: "number" })
      .references(() => person.id, { onDelete: "set null" }),
    updatedById: bigint("updated_by_id", { mode: "number" })
      .references(() => person.id, { onDelete: "set null" }),
  },
  (table) => ([
    // Core indexes
    index("record_uid_idx").on(table.uid),
    index("record_org_object_idx").on(table.organizationId, table.objectDefinitionId),
    
    // Reference indexes
    index("record_person_idx").on(table.personId),
    index("record_related_org_idx").on(table.relatedOrganizationId),
    index("record_owner_idx").on(table.ownerId),
    
    // Number index
    index("record_number_idx").on(table.organizationId, table.recordNumber),
    
    // Status indexes
    index("record_status_idx").on(table.status),
    index("record_stage_idx").on(table.stage),
    index("record_priority_idx").on(table.priority),
    
    // Date indexes
    index("record_due_date_idx").on(table.dueDate),
    index("record_last_activity_idx").on(table.lastActivityAt),
    
    // Archive index
    index("record_archived_idx").on(table.isArchived),
    
    // JSONB index for properties
    index("record_properties_gin_idx").using("gin", table.properties),
    
    // Full-text search
    index("record_search_idx").on(table.searchText),
    
    // External reference
    index("record_external_idx").on(table.externalSource, table.externalId),
  ])
);

/**
 * Associations - relationships between any records or entities
 */
export const association = createTable(
  "association",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    
    organizationId: bigint("organization_id", { mode: "number" })
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    
    // From entity (can be record, person, or organization)
    fromEntityType: text("from_entity_type").notNull(), // 'record', 'person', 'organization'
    fromEntityId: bigint("from_entity_id", { mode: "number" }).notNull(),
    
    // To entity (can be record, person, or organization)
    toEntityType: text("to_entity_type").notNull(), // 'record', 'person', 'organization'
    toEntityId: bigint("to_entity_id", { mode: "number" }).notNull(),
    
    // Association type
    associationType: text("association_type").notNull(), // 'contact_to_company', 'deal_to_contact', etc.
    associationLabel: text("association_label"), // Human-readable label
    
    // Additional properties for the relationship
    properties: jsonb("properties").default('{}'),
    
    // Relationship strength/confidence
    strength: integer("strength"), // 0-100
    
    // Is this the primary association of this type?
    isPrimary: boolean("is_primary").default(false),
    
    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    createdById: bigint("created_by_id", { mode: "number" })
      .references(() => person.id, { onDelete: "set null" }),
  },
  (table) => ([
    index("assoc_org_idx").on(table.organizationId),
    index("assoc_from_idx").on(table.fromEntityType, table.fromEntityId),
    index("assoc_to_idx").on(table.toEntityType, table.toEntityId),
    index("assoc_type_idx").on(table.associationType),
    index("assoc_primary_idx").on(table.isPrimary),
    
    // Unique constraint to prevent duplicate associations
    unique("assoc_unique").on(
      table.organizationId,
      table.fromEntityType,
      table.fromEntityId,
      table.toEntityType,
      table.toEntityId,
      table.associationType
    ),
  ])
);

/**
 * Property definitions for custom fields
 */
export const propertyDefinition = createTable(
  "property_definition",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    
    organizationId: bigint("organization_id", { mode: "number" })
      .references(() => organization.id, { onDelete: "cascade" }),
    
    objectDefinitionId: bigint("object_definition_id", { mode: "number" })
      .references(() => objectDefinition.id, { onDelete: "cascade" }),
    
    // Property identification
    name: text("name").notNull(), // Internal name
    label: text("label").notNull(), // Display label
    description: text("description"),
    
    // Data type
    type: text("type").notNull(), // 'text', 'number', 'date', 'boolean', 'select', 'multiselect', 'reference'
    
    // Validation
    isRequired: boolean("is_required").default(false),
    isUnique: boolean("is_unique").default(false),
    isSearchable: boolean("is_searchable").default(true),
    
    // Configuration based on type
    config: jsonb("config").default('{}'), // Type-specific configuration
    
    // Options for select/multiselect
    options: jsonb("options"), // Array of { value, label, color }
    
    // Default value
    defaultValue: jsonb("default_value"),
    
    // Display
    displayOrder: integer("display_order"),
    groupName: text("group_name"), // For grouping in UI
    
    // Status
    isActive: boolean("is_active").default(true),
    
    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ([
    index("prop_def_org_object_idx").on(table.organizationId, table.objectDefinitionId),
    index("prop_def_name_idx").on(table.name),
    index("prop_def_type_idx").on(table.type),
    index("prop_def_active_idx").on(table.isActive),
  ])
);

// Type exports
export type ObjectDefinition = typeof objectDefinition.$inferSelect;
export type NewObjectDefinition = typeof objectDefinition.$inferInsert;
export type Record = typeof record.$inferSelect;
export type NewRecord = typeof record.$inferInsert;
export type Association = typeof association.$inferSelect;
export type NewAssociation = typeof association.$inferInsert;
export type PropertyDefinition = typeof propertyDefinition.$inferSelect;
export type NewPropertyDefinition = typeof propertyDefinition.$inferInsert;

// Validation schemas
export const insertObjectDefinitionSchema = createInsertSchema(objectDefinition);
export const selectObjectDefinitionSchema = createSelectSchema(objectDefinition);

export const insertRecordSchema = createInsertSchema(record);
export const selectRecordSchema = createSelectSchema(record);

export const insertAssociationSchema = createInsertSchema(association);
export const selectAssociationSchema = createSelectSchema(association);

export const insertPropertyDefinitionSchema = createInsertSchema(propertyDefinition);
export const selectPropertyDefinitionSchema = createSelectSchema(propertyDefinition);