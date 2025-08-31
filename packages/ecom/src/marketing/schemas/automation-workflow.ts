import { text, bigint, boolean, timestamp, jsonb, integer, index, pgTableCreator } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// Create table with prefix
export const createTable = pgTableCreator((name) => `agency-app_${name}`);

// AUTOMATION & WORKFLOW ENGINE

// Workflow definitions
export const workflow = createTable("workflow", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  // Workflow details
  name: text("name"),
  description: text("description"),
  category: text("category"), // marketing, sales, operations, custom
  
  // What triggers it
  triggerType: text("trigger_type"), // object_created, object_updated, schedule, webhook, manual
  triggerObjectTypeId: bigint("trigger_object_type_id", { mode: "number" }),
  triggerConditions: jsonb("trigger_conditions"), // When to fire
  
  // Status
  status: text("status"), // active, paused, draft
  
  // Permissions
  ownerId: bigint("owner_id", { mode: "number" }),
  teamId: bigint("team_id", { mode: "number" }),
  
  // Execution settings
  maxExecutionsPerDay: integer("max_executions_per_day"),
  allowConcurrent: boolean("allow_concurrent").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Workflow actions/steps
export const workflowAction = createTable("workflow_action", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  workflowId: bigint("workflow_id", { mode: "number" }).notNull(),
  
  // Action details
  actionType: text("action_type"), // create_object, update_property, send_email, webhook, wait, branch
  actionName: text("action_name"),
  
  // Position in workflow
  stepNumber: integer("step_number"),
  parentActionId: bigint("parent_action_id", { mode: "number" }), // For branching
  
  // Configuration
  config: jsonb("config"), // Action-specific settings
  
  // Conditions
  conditions: jsonb("conditions"), // When to execute this action
  
  // Error handling
  onError: text("on_error"), // continue, stop, retry
  retryCount: integer("retry_count").default(0),
  retryDelay: integer("retry_delay"), // seconds
}, (table) => [
  index("workflow_action_workflow_idx").on(table.workflowId),
  index("workflow_action_parent_idx").on(table.parentActionId),
]);

// Workflow executions
export const workflowExecution = createTable("workflow_execution", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  workflowId: bigint("workflow_id", { mode: "number" }).notNull(),
  
  // Trigger
  triggerObjectId: bigint("trigger_object_id", { mode: "number" }),
  triggerData: jsonb("trigger_data"),
  
  // Status
  status: text("status"), // running, completed, failed, cancelled
  
  // Timing
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  
  // Results
  executionLog: jsonb("execution_log"), // Detailed log
  errorMessage: text("error_message"),
  
  // Context
  userId: bigint("user_id", { mode: "number" }), // Who triggered it
  context: jsonb("context"), // Variables available during execution
}, (table) => [
  index("workflow_execution_workflow_idx").on(table.workflowId),
  index("workflow_execution_status_idx").on(table.status),
  index("workflow_execution_started_idx").on(table.startedAt),
]);

// Action templates (reusable actions)
export const actionTemplate = createTable("action_template", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  // Template details
  name: text("name"),
  description: text("description"),
  category: text("category"),
  icon: text("icon"),
  
  // Action configuration
  actionType: text("action_type"),
  defaultConfig: jsonb("default_config"),
  configSchema: jsonb("config_schema"), // JSON Schema for validation
  
  // Permissions
  requiredPermissions: jsonb("required_permissions"),
  
  isSystem: boolean("is_system").default(false),
  isActive: boolean("is_active").default(true),
});

// Automation rules (simpler than workflows)
export const automationRule = createTable("automation_rule", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  // Rule details
  name: text("name"),
  description: text("description"),
  
  // When (trigger)
  triggerObjectTypeId: bigint("trigger_object_type_id", { mode: "number" }),
  triggerEvent: text("trigger_event"), // created, updated, deleted
  triggerConditions: jsonb("trigger_conditions"),
  
  // Then (action)
  actionType: text("action_type"), // Simple actions only
  actionConfig: jsonb("action_config"),
  
  // Status
  isActive: boolean("is_active").default(true),
  
  // Execution tracking
  lastExecutedAt: timestamp("last_executed_at"),
  executionCount: integer("execution_count").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Object scoring (for lead scoring, customer health, etc.)
export const scoringModel = createTable("scoring_model", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  // Model details
  name: text("name"),
  description: text("description"),
  objectTypeId: bigint("object_type_id", { mode: "number" }).notNull(),
  
  // Score property
  scorePropertyId: bigint("score_property_id", { mode: "number" }), // Where to store the score
  
  // Configuration
  scoreRange: jsonb("score_range"), // {min: 0, max: 100}
  updateFrequency: text("update_frequency"), // realtime, hourly, daily
  
  isActive: boolean("is_active").default(true),
});

// Scoring criteria
export const scoringCriteria = createTable("scoring_criteria", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  scoringModelId: bigint("scoring_model_id", { mode: "number" }).notNull(),
  
  // Criteria details
  name: text("name"),
  propertyId: bigint("property_id", { mode: "number" }),
  
  // Scoring logic
  operator: text("operator"), // equals, contains, greater_than, etc.
  value: jsonb("value"),
  points: integer("points"),
  
  // Advanced
  decayEnabled: boolean("decay_enabled").default(false), // Points decrease over time
  decayRate: integer("decay_rate"), // Points lost per day
  
  isActive: boolean("is_active").default(true),
}, (table) => [
  index("scoring_criteria_model_idx").on(table.scoringModelId),
]);

// Lifecycle stages (for CRM features)
export const lifecycleStage = createTable("lifecycle_stage", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  // Stage details
  name: text("name"), // "Lead", "MQL", "SQL", "Customer", "Evangelist"
  displayName: text("display_name"),
  objectTypeId: bigint("object_type_id", { mode: "number" }).notNull(),
  
  // Configuration
  order: integer("order"), // Display order
  color: text("color"),
  icon: text("icon"),
  
  // Automation
  entryConditions: jsonb("entry_conditions"), // Auto-move to this stage
  exitConditions: jsonb("exit_conditions"), // Auto-move from this stage
  
  // SLA
  targetDays: integer("target_days"), // Target time in stage
  
  isActive: boolean("is_active").default(true),
}, (table) => [
  index("lifecycle_stage_type_idx").on(table.objectTypeId),
]);

// Object lifecycle history
export const lifecycleHistory = createTable("lifecycle_history", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  objectId: bigint("object_id", { mode: "number" }).notNull(),
  fromStageId: bigint("from_stage_id", { mode: "number" }),
  toStageId: bigint("to_stage_id", { mode: "number" }),
  
  // Change details
  changedBy: bigint("changed_by", { mode: "number" }),
  changedAt: timestamp("changed_at").defaultNow(),
  reason: text("reason"),
  
  // Duration
  timeInPreviousStage: integer("time_in_previous_stage"), // seconds
}, (table) => [
  index("lifecycle_history_object_idx").on(table.objectId),
  index("lifecycle_history_changed_idx").on(table.changedAt),
]);

// Zod schemas
export const insertWorkflowSchema = createInsertSchema(workflow);
export const selectWorkflowSchema = createSelectSchema(workflow);

export const insertAutomationRuleSchema = createInsertSchema(automationRule);
export const selectAutomationRuleSchema = createSelectSchema(automationRule);

export const insertScoringModelSchema = createInsertSchema(scoringModel);
export const selectScoringModelSchema = createSelectSchema(scoringModel);

// Type exports
export type Workflow = typeof workflow.$inferSelect;
export type AutomationRule = typeof automationRule.$inferSelect;
export type ScoringModel = typeof scoringModel.$inferSelect;