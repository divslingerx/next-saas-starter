import { text, bigint, boolean, timestamp, jsonb, integer, index, pgTableCreator } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Create table with prefix
export const createTable = pgTableCreator((name) => `agency-app_${name}`);

// Configuration table - stores all system and store settings
export const configuration = createTable("configuration", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  // Configuration organization
  namespace: text("namespace").notNull(), // 'store', 'tax', 'shipping', 'email', 'features'
  key: text("key").notNull(),
  
  // Value storage
  value: jsonb("value").$type<any>(), // JSON value for flexibility
  valueType: text("value_type").notNull().default("string"), // string, number, boolean, json
  
  // Security
  encrypted: boolean("encrypted").default(false), // For sensitive values like API keys
  
  // Metadata
  label: text("label"), // Human-readable name
  description: text("description"), // Help text
  defaultValue: jsonb("default_value").$type<any>(),
  
  // Validation
  validation: jsonb("validation").$type<ConfigValidation>(), // Validation rules
  
  // UI hints
  uiSchema: jsonb("ui_schema").$type<ConfigUISchema>(), // How to render in admin
  sortOrder: integer("sort_order").default(0),
  
  // Access control
  isPublic: boolean("is_public").default(false), // Can be exposed to frontend
  isReadonly: boolean("is_readonly").default(false), // System settings
  requiredPermission: text("required_permission"), // Permission needed to modify
  
  // Audit
  updatedBy: bigint("updated_by", { mode: "number" }),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("configuration_namespace_idx").on(table.namespace),
  index("configuration_key_idx").on(table.key),
  index("configuration_namespace_key_idx").on(table.namespace, table.key).unique(),
  index("configuration_public_idx").on(table.isPublic),
]);

// Feature flags table - simplified feature toggle system
export const featureFlag = createTable("feature_flag", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  // Flag identification
  key: text("key").unique().notNull(), // 'b2b-checkout', 'new-cart-ui', etc.
  name: text("name").notNull(), // Human-readable name
  description: text("description"),
  
  // Status
  enabled: boolean("enabled").default(false),
  enabledForPercentage: integer("enabled_for_percentage").default(0), // 0-100 for gradual rollout
  
  // Targeting
  enabledForUsers: jsonb("enabled_for_users").$type<string[]>().default([]), // Specific user IDs
  enabledForGroups: jsonb("enabled_for_groups").$type<string[]>().default([]), // Customer groups
  conditions: jsonb("conditions").$type<FeatureCondition[]>().default([]), // Advanced targeting
  
  // Metadata
  tags: jsonb("tags").$type<string[]>().default([]),
  expiresAt: timestamp("expires_at"), // Auto-disable after date
  
  // Audit
  createdBy: bigint("created_by", { mode: "number" }),
  updatedBy: bigint("updated_by", { mode: "number" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("feature_flag_key_idx").on(table.key),
  index("feature_flag_enabled_idx").on(table.enabled),
  index("feature_flag_expires_idx").on(table.expiresAt),
]);

// Configuration change log - audit trail
export const configurationLog = createTable("configuration_log", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  // What changed
  namespace: text("namespace").notNull(),
  key: text("key").notNull(),
  
  // Change details
  previousValue: jsonb("previous_value").$type<any>(),
  newValue: jsonb("new_value").$type<any>(),
  action: text("action").notNull(), // 'create', 'update', 'delete'
  
  // Who changed it
  userId: bigint("user_id", { mode: "number" }),
  userEmail: text("user_email"),
  
  // Context
  reason: text("reason"), // Why the change was made
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  
  // Timestamp
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("configuration_log_namespace_key_idx").on(table.namespace, table.key),
  index("configuration_log_created_idx").on(table.createdAt),
  index("configuration_log_user_idx").on(table.userId),
]);

// Type definitions
interface ConfigValidation {
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
  enum?: any[];
  customValidator?: string; // Function name to call
}

interface ConfigUISchema {
  component?: 'input' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'json' | 'custom';
  placeholder?: string;
  helpText?: string;
  options?: Array<{ label: string; value: any }>;
  rows?: number; // For textarea
  customComponent?: string; // For custom UI components
}

interface FeatureCondition {
  type: 'date_range' | 'user_attribute' | 'custom';
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
  field?: string;
  value?: any;
}

// Create Zod schemas for validation
export const insertConfigurationSchema = createInsertSchema(configuration, {
  namespace: z.string().min(1),
  key: z.string().min(1),
  valueType: z.enum(["string", "number", "boolean", "json"]),
  value: z.any(),
  validation: z.object({
    type: z.enum(['string', 'number', 'boolean', 'array', 'object']).optional(),
    required: z.boolean().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
    enum: z.array(z.any()).optional(),
    customValidator: z.string().optional(),
  }).optional(),
  uiSchema: z.object({
    component: z.enum(['input', 'textarea', 'select', 'checkbox', 'radio', 'json', 'custom']).optional(),
    placeholder: z.string().optional(),
    helpText: z.string().optional(),
    options: z.array(z.object({
      label: z.string(),
      value: z.any(),
    })).optional(),
    rows: z.number().optional(),
    customComponent: z.string().optional(),
  }).optional(),
});
export const selectConfigurationSchema = createSelectSchema(configuration);

export const insertFeatureFlagSchema = createInsertSchema(featureFlag, {
  key: z.string().regex(/^[a-z0-9-]+$/, "Key must be lowercase with hyphens only"),
  enabledForPercentage: z.number().min(0).max(100).optional(),
  enabledForUsers: z.array(z.string()).optional(),
  enabledForGroups: z.array(z.string()).optional(),
  conditions: z.array(z.object({
    type: z.enum(['date_range', 'user_attribute', 'custom']),
    operator: z.enum(['equals', 'contains', 'greater_than', 'less_than']),
    field: z.string().optional(),
    value: z.any().optional(),
  })).optional(),
  tags: z.array(z.string()).optional(),
});
export const selectFeatureFlagSchema = createSelectSchema(featureFlag);

export const insertConfigurationLogSchema = createInsertSchema(configurationLog, {
  action: z.enum(['create', 'update', 'delete']),
});
export const selectConfigurationLogSchema = createSelectSchema(configurationLog);

// Type exports
export type Configuration = typeof configuration.$inferSelect;
export type NewConfiguration = typeof configuration.$inferInsert;
export type FeatureFlag = typeof featureFlag.$inferSelect;
export type NewFeatureFlag = typeof featureFlag.$inferInsert;
export type ConfigurationLog = typeof configurationLog.$inferSelect;
export type NewConfigurationLog = typeof configurationLog.$inferInsert;