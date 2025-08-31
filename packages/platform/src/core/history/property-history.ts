import { pgTableCreator, text, bigint, timestamp, jsonb, index, uuid, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { organization } from "../identity/organization";
import { person } from "../identity/person";
import { objectRecord } from "../objects/platform-objects";

export const createTable = pgTableCreator((name) => `agency-app_${name}`);

/**
 * Property History - tracks every change to every property on any record
 * Essential for workflows, audit trails, and time-based automation
 */
export const propertyHistory = createTable(
  "property_history",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    
    // Universal identifier
    uid: uuid("uid").defaultRandom().notNull().unique(),
    
    // Multi-tenant
    organizationId: bigint("organization_id", { mode: "number" })
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    
    // What changed
    recordId: bigint("record_id", { mode: "number" })
      .notNull()
      .references(() => objectRecord.id, { onDelete: "cascade" }),
    
    // The property that changed
    propertyName: text("property_name").notNull(),
    propertyLabel: text("property_label"), // Human-readable label at time of change
    propertyType: text("property_type"), // 'text', 'number', 'date', etc.
    
    // The change
    oldValue: jsonb("old_value"), // Previous value (null for first set)
    newValue: jsonb("new_value"), // New value (null for deletion)
    
    // Parsed values for common types (for easier querying)
    oldTextValue: text("old_text_value"), // Text representation
    newTextValue: text("new_text_value"),
    oldNumericValue: numeric("old_numeric_value"), // Numeric representation
    newNumericValue: numeric("new_numeric_value"),
    oldDateValue: timestamp("old_date_value"), // Date representation
    newDateValue: timestamp("new_date_value"),
    
    // Change metadata
    changeType: text("change_type").notNull(), // 'created', 'updated', 'deleted', 'bulk_update'
    changeSource: text("change_source").notNull(), // 'ui', 'api', 'workflow', 'import', 'sync'
    changeReason: text("change_reason"), // Optional explanation
    
    // Who made the change
    changedById: bigint("changed_by_id", { mode: "number" })
      .references(() => person.id, { onDelete: "set null" }),
    changedByName: text("changed_by_name"), // Cached for display
    changedByType: text("changed_by_type"), // 'user', 'system', 'workflow', 'integration'
    
    // Workflow context (if triggered by workflow)
    workflowId: text("workflow_id"),
    workflowName: text("workflow_name"),
    workflowExecutionId: text("workflow_execution_id"),
    workflowStepId: text("workflow_step_id"),
    
    // Batch context (for bulk operations)
    batchId: text("batch_id"), // Groups related changes
    batchOperation: text("batch_operation"), // 'import', 'bulk_edit', 'migration'
    
    // Additional context
    context: jsonb("context"), // Any additional context data
    
    // Request tracking
    requestId: text("request_id"), // For tracing
    sessionId: text("session_id"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    
    // Timestamps
    changedAt: timestamp("changed_at").defaultNow().notNull(),
    
    // For calculating time between changes
    previousChangeId: bigint("previous_change_id", { mode: "number" }), // Reference to previous change of same property
    timeElapsedSeconds: bigint("time_elapsed_seconds", { mode: "number" }), // Seconds since last change
  },
  (table) => ({
    // Core indexes
    uidIdx: index("prop_history_uid_idx").on(table.uid),
    recordIdx: index("prop_history_record_idx").on(table.recordId),
    
    // Property indexes
    propertyIdx: index("prop_history_property_idx").on(table.recordId, table.propertyName),
    propertyNameIdx: index("prop_history_property_name_idx").on(table.propertyName),
    
    // Change indexes
    changeTypeIdx: index("prop_history_change_type_idx").on(table.changeType),
    changeSourceIdx: index("prop_history_change_source_idx").on(table.changeSource),
    changedByIdx: index("prop_history_changed_by_idx").on(table.changedById),
    changedAtIdx: index("prop_history_changed_at_idx").on(table.changedAt),
    
    // Workflow indexes
    workflowIdx: index("prop_history_workflow_idx").on(table.workflowId),
    workflowExecutionIdx: index("prop_history_workflow_exec_idx").on(table.workflowExecutionId),
    
    // Batch indexes
    batchIdx: index("prop_history_batch_idx").on(table.batchId),
    
    // Organization index
    orgIdx: index("prop_history_org_idx").on(table.organizationId),
    
    // Composite index for finding latest changes
    latestChangeIdx: index("prop_history_latest_idx").on(
      table.recordId, 
      table.propertyName, 
      table.changedAt
    ),
  })
);

/**
 * Property History Summary - aggregated view of property changes
 * Useful for quick lookups and reporting
 */
export const propertyHistorySummary = createTable(
  "property_history_summary",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    
    organizationId: bigint("organization_id", { mode: "number" })
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    
    recordId: bigint("record_id", { mode: "number" })
      .notNull()
      .references(() => objectRecord.id, { onDelete: "cascade" }),
    
    propertyName: text("property_name").notNull(),
    
    // Current state
    currentValue: jsonb("current_value"),
    currentTextValue: text("current_text_value"),
    
    // Statistics
    totalChanges: bigint("total_changes", { mode: "number" }).notNull().default(0),
    
    // First change
    firstValue: jsonb("first_value"),
    firstChangedAt: timestamp("first_changed_at"),
    firstChangedById: bigint("first_changed_by_id", { mode: "number" }),
    
    // Last change
    lastValue: jsonb("last_value"),
    lastChangedAt: timestamp("last_changed_at"),
    lastChangedById: bigint("last_changed_by_id", { mode: "number" }),
    
    // Most frequent value
    mostFrequentValue: jsonb("most_frequent_value"),
    mostFrequentValueCount: bigint("most_frequent_value_count", { mode: "number" }),
    
    // Workflow statistics
    workflowChangeCount: bigint("workflow_change_count", { mode: "number" }).default(0),
    lastWorkflowChangeAt: timestamp("last_workflow_change_at"),
    
    // Update tracking
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    recordPropertyIdx: index("prop_summary_record_property_idx").on(
      table.recordId, 
      table.propertyName
    ),
    orgIdx: index("prop_summary_org_idx").on(table.organizationId),
    lastChangedIdx: index("prop_summary_last_changed_idx").on(table.lastChangedAt),
  })
);

/**
 * Workflow Property Triggers - defines which property changes trigger workflows
 */
export const workflowPropertyTrigger = createTable(
  "workflow_property_trigger",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    
    organizationId: bigint("organization_id", { mode: "number" })
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    
    // Trigger configuration
    name: text("name").notNull(),
    description: text("description"),
    isActive: boolean("is_active").default(true),
    
    // What to watch
    objectType: text("object_type"), // Optional: specific object type
    propertyName: text("property_name").notNull(),
    
    // Trigger conditions
    triggerOn: text("trigger_on").notNull(), // 'any_change', 'value_equals', 'value_contains', 'value_increases', 'value_decreases'
    triggerValue: jsonb("trigger_value"), // Value to compare against
    triggerOperator: text("trigger_operator"), // 'equals', 'not_equals', 'contains', 'greater_than', 'less_than'
    
    // Additional conditions
    conditions: jsonb("conditions"), // Array of additional conditions
    
    // Workflow to trigger
    workflowId: text("workflow_id").notNull(),
    workflowConfig: jsonb("workflow_config"), // Configuration to pass to workflow
    
    // Rate limiting
    cooldownSeconds: bigint("cooldown_seconds", { mode: "number" }), // Minimum time between triggers
    maxTriggersPerHour: bigint("max_triggers_per_hour", { mode: "number" }),
    maxTriggersPerDay: bigint("max_triggers_per_day", { mode: "number" }),
    
    // Statistics
    totalTriggers: bigint("total_triggers", { mode: "number" }).default(0),
    lastTriggeredAt: timestamp("last_triggered_at"),
    
    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdx: index("workflow_trigger_org_idx").on(table.organizationId),
    propertyIdx: index("workflow_trigger_property_idx").on(table.propertyName),
    objectTypeIdx: index("workflow_trigger_object_type_idx").on(table.objectType),
    activeIdx: index("workflow_trigger_active_idx").on(table.isActive),
    workflowIdx: index("workflow_trigger_workflow_idx").on(table.workflowId),
  })
);

// Type exports
export type PropertyHistory = typeof propertyHistory.$inferSelect;
export type NewPropertyHistory = typeof propertyHistory.$inferInsert;
export type PropertyHistorySummary = typeof propertyHistorySummary.$inferSelect;
export type NewPropertyHistorySummary = typeof propertyHistorySummary.$inferInsert;
export type WorkflowPropertyTrigger = typeof workflowPropertyTrigger.$inferSelect;
export type NewWorkflowPropertyTrigger = typeof workflowPropertyTrigger.$inferInsert;

// Validation schemas
export const insertPropertyHistorySchema = createInsertSchema(propertyHistory);
export const selectPropertyHistorySchema = createSelectSchema(propertyHistory);

export const insertPropertyHistorySummarySchema = createInsertSchema(propertyHistorySummary);
export const selectPropertyHistorySummarySchema = createSelectSchema(propertyHistorySummary);

export const insertWorkflowPropertyTriggerSchema = createInsertSchema(workflowPropertyTrigger);
export const selectWorkflowPropertyTriggerSchema = createSelectSchema(workflowPropertyTrigger);