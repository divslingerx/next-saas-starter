/**
 * Platform Pipelines & Stages
 * Workflow management for deals, tickets, and other processes
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
  primaryKey,
  decimal,
  check,
} from "drizzle-orm/pg-core";
import { createTable } from "../../utils";
import { organization } from "../auth";
import { record, objectDefinition } from "./core";

// ==========================================
// PIPELINES
// ==========================================

/**
 * Pipelines define workflows for objects
 * Each pipeline has multiple stages that records move through
 */
export const pipeline = createTable(
  "pipeline",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    
    // Organization and object type
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    objectDefinitionId: integer("object_definition_id")
      .notNull()
      .references(() => objectDefinition.id),

    // Pipeline info
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    
    // Stages definition (stored as JSONB for flexibility)
    stages: jsonb("stages").notNull().default([]),
    /* Stage structure:
    {
      id: string,
      name: string,
      order: number,
      color: string,
      probability: number, // For deals: win probability
      metadata: object,
      automations: array, // Actions to trigger on stage entry
    }
    */
    
    // Settings
    isDefault: boolean("is_default").default(false), // Default for new records
    allowSkipStages: boolean("allow_skip_stages").default(true),
    requireStageComments: boolean("require_stage_comments").default(false),
    
    // Automation
    automationRules: jsonb("automation_rules"), // Stage transition automations
    
    // Display
    displayMode: varchar("display_mode", { length: 20 }).default("kanban"), // kanban, list, timeline
    color: varchar("color", { length: 7 }), // Hex color
    icon: varchar("icon", { length: 50 }),
    
    // Stats (denormalized)
    recordCount: integer("record_count").default(0),
    
    isActive: boolean("is_active").default(true),
    
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(() => new Date()),
    createdById: text("created_by_id"),
  },
  (table) => [
    unique().on(table.organizationId, table.name),
    index("pipeline_org_object_idx").on(table.organizationId, table.objectDefinitionId),
    index("pipeline_default_idx").on(table.isDefault),
  ]
);

// ==========================================
// RECORD STAGES
// ==========================================

/**
 * Current stage of records in pipelines
 * A record can be in different stages in different pipelines
 */
export const recordStage = createTable(
  "record_stage",
  {
    recordId: integer("record_id")
      .notNull()
      .references(() => record.id, { onDelete: "cascade" }),
    pipelineId: integer("pipeline_id")
      .notNull()
      .references(() => pipeline.id),

    // Current stage
    stageId: varchar("stage_id", { length: 50 }).notNull(),
    stageName: varchar("stage_name", { length: 100 }), // Denormalized for performance
    
    // Stage metadata
    enteredAt: timestamp("entered_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    timeInStage: integer("time_in_stage"), // Minutes
    
    // For deals and opportunities
    amount: decimal("amount", { precision: 15, scale: 2 }),
    probability: integer("probability"), // Win probability (0-100)
    expectedCloseDate: timestamp("expected_close_date", { withTimezone: true }),
    
    // Notes and context
    stageNotes: text("stage_notes"),
    blockers: jsonb("blockers"), // What's preventing progress
    
    // Tracking
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(() => new Date()),
    updatedById: text("updated_by_id"),
  },
  (table) => [
    primaryKey({ columns: [table.recordId, table.pipelineId] }),
    
    // Business logic constraints
    check("chk_valid_stage_data", sql`${table.stageId} IS NOT NULL AND ${table.stageName} IS NOT NULL`),
    check("chk_positive_amount", sql`${table.amount} IS NULL OR ${table.amount} >= 0`),
    check("chk_valid_probability", sql`${table.probability} IS NULL OR (${table.probability} >= 0 AND ${table.probability} <= 100)`),
    check("chk_positive_time_in_stage", sql`${table.timeInStage} IS NULL OR ${table.timeInStage} >= 0`),
    
    // High-performance pipeline indexes
    index("record_stage_active_pipeline_idx")
      .on(table.pipelineId, table.stageId, table.recordId)
      .where(sql`${table.timeInStage} IS NOT NULL`),
    
    // Covering index for pipeline analytics
    index("record_stage_metrics_idx")
      .on(table.pipelineId, table.enteredAt, table.amount, table.probability),
    
    // Index for time-based pipeline queries
    index("record_stage_timeline_idx").on(table.recordId, table.enteredAt, table.pipelineId),
  ]
);

// ==========================================
// STAGE HISTORY
// ==========================================

/**
 * Historical record of stage transitions
 * Used for analytics and process optimization
 */
export const stageHistory = createTable(
  "stage_history",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    
    recordId: integer("record_id")
      .notNull()
      .references(() => record.id, { onDelete: "cascade" }),
    pipelineId: integer("pipeline_id")
      .notNull()
      .references(() => pipeline.id),
    
    // Stage transition
    fromStageId: varchar("from_stage_id", { length: 50 }),
    toStageId: varchar("to_stage_id", { length: 50 }).notNull(),
    
    // Timing
    transitionedAt: timestamp("transitioned_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    timeInPreviousStage: integer("time_in_previous_stage"), // Minutes
    
    // Context
    transitionReason: varchar("transition_reason", { length: 100 }),
    transitionNotes: text("transition_notes"),
    automationTriggered: boolean("automation_triggered").default(false),
    
    // Deal-specific
    amountAtTransition: decimal("amount_at_transition", { precision: 15, scale: 2 }),
    probabilityAtTransition: integer("probability_at_transition"),
    
    // Who made the change
    transitionedById: text("transitioned_by_id"),
  },
  (table) => [
    index("stage_history_record_idx").on(table.recordId),
    index("stage_history_pipeline_idx").on(table.pipelineId),
    index("stage_history_transitioned_idx").on(table.transitionedAt),
  ]
);

// ==========================================
// PIPELINE METRICS
// ==========================================

/**
 * Aggregated metrics for pipeline performance
 * Updated periodically for dashboard views
 */
export const pipelineMetrics = createTable(
  "pipeline_metrics",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    
    pipelineId: integer("pipeline_id")
      .notNull()
      .references(() => pipeline.id, { onDelete: "cascade" }),
    
    // Time period
    periodType: varchar("period_type", { length: 20 }).notNull(), // daily, weekly, monthly
    periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
    periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
    
    // Volume metrics
    recordsEntered: integer("records_entered").default(0),
    recordsExited: integer("records_exited").default(0),
    recordsWon: integer("records_won").default(0),
    recordsLost: integer("records_lost").default(0),
    
    // Value metrics (for deals)
    totalValue: decimal("total_value", { precision: 15, scale: 2 }),
    wonValue: decimal("won_value", { precision: 15, scale: 2 }),
    lostValue: decimal("lost_value", { precision: 15, scale: 2 }),
    
    // Efficiency metrics
    averageTimeToClose: integer("average_time_to_close"), // Days
    averageTimeInPipeline: integer("average_time_in_pipeline"), // Days
    conversionRate: decimal("conversion_rate", { precision: 5, scale: 2 }), // Percentage
    
    // Stage metrics (JSONB for flexibility)
    stageMetrics: jsonb("stage_metrics"),
    /* Structure:
    {
      [stageId]: {
        entered: number,
        exited: number,
        averageTime: number, // Minutes
        conversionRate: number // To next stage
      }
    }
    */
    
    calculatedAt: timestamp("calculated_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    unique().on(table.pipelineId, table.periodType, table.periodStart),
    index("pipeline_metrics_pipeline_idx").on(table.pipelineId),
    index("pipeline_metrics_period_idx").on(table.periodStart, table.periodEnd),
  ]
);

// ==========================================
// STAGE AUTOMATIONS
// ==========================================

/**
 * Automation rules for stage transitions
 * Triggers actions when records enter/exit stages
 */
export const stageAutomation = createTable(
  "stage_automation",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    
    pipelineId: integer("pipeline_id")
      .notNull()
      .references(() => pipeline.id, { onDelete: "cascade" }),
    
    // Trigger
    triggerType: varchar("trigger_type", { length: 50 }).notNull(), // enter_stage, exit_stage, time_in_stage
    triggerStageId: varchar("trigger_stage_id", { length: 50 }),
    triggerConditions: jsonb("trigger_conditions"), // Additional conditions
    
    // Action
    actionType: varchar("action_type", { length: 50 }).notNull(), // create_task, send_email, update_property, etc.
    actionConfig: jsonb("action_config").notNull(), // Action-specific configuration
    
    // Settings
    isActive: boolean("is_active").default(true),
    runOnce: boolean("run_once").default(false), // Only run once per record
    delay: integer("delay"), // Delay in minutes before executing
    
    // Execution tracking
    executionCount: integer("execution_count").default(0),
    lastExecutedAt: timestamp("last_executed_at", { withTimezone: true }),
    
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    createdById: text("created_by_id"),
  },
  (table) => [
    index("stage_automation_pipeline_idx").on(table.pipelineId),
    index("stage_automation_trigger_idx").on(table.triggerType, table.triggerStageId),
    index("stage_automation_active_idx").on(table.isActive),
  ]
);