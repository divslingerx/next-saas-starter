import { text, bigint, boolean, timestamp, jsonb, integer, index, unique, pgTableCreator } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Create table with prefix
export const createTable = pgTableCreator((name) => `agency-app_${name}`);

// CORE UNIFIED OBJECT MODEL

// Object types registry
export const objectType = createTable("object_type", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  // Type definition
  typeName: text("type_name").unique().notNull(), // "product", "customer", "order", "company"
  displayName: text("display_name"), // "Product", "Customer", "Order"
  pluralName: text("plural_name"), // "Products", "Customers", "Orders"
  
  // System or custom
  isSystem: boolean("is_system").default(false), // true for built-in types
  isActive: boolean("is_active").default(true),
  
  // Icon and UI
  icon: text("icon"), // "shopping-cart", "user", etc.
  color: text("color"), // "#FF5733"
  
  // Configuration
  config: jsonb("config"), // Type-specific settings
  
  // Features
  supportedFeatures: jsonb("supported_features"), // ["custom_properties", "automation", "workflow"]
  
  // API
  apiEndpoint: text("api_endpoint"), // "products", "customers"
  apiSchema: jsonb("api_schema"), // OpenAPI schema for this type
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Master object table - ALL objects have an entry here
export const object = createTable("object", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  // Universal object ID (like HubSpot's)
  objectId: text("object_id").unique().notNull(), // "PROD-123", "CUST-456", "ORD-789"
  
  // Type reference
  objectTypeId: bigint("object_type_id", { mode: "number" }).notNull(),
  
  // Core fields every object has
  name: text("name"), // Display name
  status: text("status"), // active, archived, deleted
  
  // Ownership and attribution
  ownerId: bigint("owner_id", { mode: "number" }), // User who owns this
  teamId: bigint("team_id", { mode: "number" }), // Team assignment
  
  // Source tracking
  source: text("source"), // api, import, manual, automation
  sourceId: text("source_id"), // External ID if imported
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
  
  // Search
  searchVector: text("search_vector"), // tsvector for full-text search
}, (table) => [
  index("object_type_idx").on(table.objectTypeId),
  index("object_status_idx").on(table.status),
  index("object_owner_idx").on(table.ownerId),
  index("object_created_idx").on(table.createdAt),
  index("object_search_idx").using("gin", table.searchVector),
]);

// Object relationships (like foreign keys but flexible)
export const objectRelationship = createTable("object_relationship", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  // Source and target
  sourceObjectId: bigint("source_object_id", { mode: "number" }).notNull(),
  targetObjectId: bigint("target_object_id", { mode: "number" }).notNull(),
  
  // Relationship type
  relationshipType: text("relationship_type"), // "belongs_to", "has_many", "references"
  relationshipName: text("relationship_name"), // "customer", "line_items", "company"
  
  // Metadata
  metadata: jsonb("metadata"), // Additional relationship data
  
  // Bidirectional
  inverseName: text("inverse_name"), // "orders" (if source is customer, target is order)
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("object_rel_source_idx").on(table.sourceObjectId),
  index("object_rel_target_idx").on(table.targetObjectId),
  index("object_rel_type_idx").on(table.relationshipType),
]);

// Custom properties definition
export const propertyDefinition = createTable("property_definition", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  // What it applies to
  objectTypeId: bigint("object_type_id", { mode: "number" }),
  appliesToAllTypes: boolean("applies_to_all_types").default(false),
  
  // Property details
  propertyName: text("property_name").notNull(), // "lead_score", "shirt_size"
  displayName: text("display_name"),
  description: text("description"),
  
  // Data type
  dataType: text("data_type"), // string, number, boolean, date, select, multiselect, reference
  
  // Validation
  isRequired: boolean("is_required").default(false),
  isUnique: boolean("is_unique").default(false),
  validationRules: jsonb("validation_rules"), // min, max, regex, etc.
  
  // UI configuration
  fieldType: text("field_type"), // text, textarea, select, checkbox, date_picker
  displayOrder: integer("display_order"),
  groupName: text("group_name"), // "Basic Info", "Custom Fields"
  
  // Options (for select fields)
  options: jsonb("options"), // [{value: "small", label: "Small"}, ...]
  
  // Reference (for reference fields)
  referencedObjectTypeId: bigint("referenced_object_type_id", { mode: "number" }),
  
  // System or custom
  isSystem: boolean("is_system").default(false),
  isActive: boolean("is_active").default(true),
  
  // Permissions
  readPermission: text("read_permission"),
  writePermission: text("write_permission"),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("property_def_type_idx").on(table.objectTypeId),
  index("property_def_name_idx").on(table.propertyName),
  unique("property_def_unique").on(table.objectTypeId, table.propertyName),
]);

// Custom property values
export const propertyValue = createTable("property_value", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  // What object this belongs to
  objectId: bigint("object_id", { mode: "number" }).notNull(),
  propertyDefinitionId: bigint("property_definition_id", { mode: "number" }).notNull(),
  
  // Values (use appropriate column based on data type)
  stringValue: text("string_value"),
  numberValue: bigint("number_value", { mode: "number" }),
  booleanValue: boolean("boolean_value"),
  dateValue: timestamp("date_value"),
  jsonValue: jsonb("json_value"), // For complex types
  
  // Reference value (for reference fields)
  referenceObjectId: bigint("reference_object_id", { mode: "number" }),
  
  // Metadata
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: bigint("updated_by", { mode: "number" }),
}, (table) => [
  index("property_value_object_idx").on(table.objectId),
  index("property_value_def_idx").on(table.propertyDefinitionId),
  unique("property_value_unique").on(table.objectId, table.propertyDefinitionId),
]);

// Activity/Event tracking (for timeline views)
export const objectActivity = createTable("object_activity", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  // What object this relates to
  objectId: bigint("object_id", { mode: "number" }).notNull(),
  
  // Activity details
  activityType: text("activity_type"), // "created", "updated", "status_changed", "email_sent"
  activityName: text("activity_name"), // "Order Placed", "Customer Contacted"
  
  // What changed
  changes: jsonb("changes"), // {field: {from: "old", to: "new"}}
  
  // Who/what triggered it
  userId: bigint("user_id", { mode: "number" }),
  automationId: bigint("automation_id", { mode: "number" }),
  apiClientId: text("api_client_id"),
  
  // Additional context
  metadata: jsonb("metadata"),
  
  // Related objects
  relatedObjectIds: jsonb("related_object_ids"), // Array of object IDs
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("object_activity_object_idx").on(table.objectId),
  index("object_activity_type_idx").on(table.activityType),
  index("object_activity_created_idx").on(table.createdAt),
]);

// Object lists (like saved searches/segments)
export const objectList = createTable("object_list", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  // List details
  name: text("name"),
  description: text("description"),
  objectTypeId: bigint("object_type_id", { mode: "number" }).notNull(),
  
  // List type
  listType: text("list_type"), // static, dynamic, smart
  
  // Filters (for dynamic lists)
  filters: jsonb("filters"), // Query definition
  
  // Ownership
  ownerId: bigint("owner_id", { mode: "number" }),
  isPublic: boolean("is_public").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Static list members
export const objectListMember = createTable("object_list_member", {
  listId: bigint("list_id", { mode: "number" }).notNull(),
  objectId: bigint("object_id", { mode: "number" }).notNull(),
  
  addedAt: timestamp("added_at").defaultNow(),
  addedBy: bigint("added_by", { mode: "number" }),
}, (table) => [
  index("object_list_member_list_idx").on(table.listId),
  index("object_list_member_object_idx").on(table.objectId),
  unique("object_list_member_unique").on(table.listId, table.objectId),
]);

// Zod schemas
export const insertObjectTypeSchema = createInsertSchema(objectType);
export const selectObjectTypeSchema = createSelectSchema(objectType);

export const insertObjectSchema = createInsertSchema(object);
export const selectObjectSchema = createSelectSchema(object);

export const insertPropertyDefinitionSchema = createInsertSchema(propertyDefinition);
export const selectPropertyDefinitionSchema = createSelectSchema(propertyDefinition);

export const insertPropertyValueSchema = createInsertSchema(propertyValue);
export const selectPropertyValueSchema = createSelectSchema(propertyValue);

// Type exports
export type ObjectType = typeof objectType.$inferSelect;
export type UnifiedObject = typeof object.$inferSelect;
export type PropertyDefinition = typeof propertyDefinition.$inferSelect;
export type PropertyValue = typeof propertyValue.$inferSelect;