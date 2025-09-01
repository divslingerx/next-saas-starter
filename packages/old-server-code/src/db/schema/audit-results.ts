/**
 * Unified Audit Results Schema
 * Single table for all site/domain analysis with versioning
 */

import {
  pgTable,
  text,
  integer,
  serial,
  timestamp,
  jsonb,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { record } from "./platform/core"; // Reference to platform records

// Enum for audit types
export const auditTypeEnum = pgEnum("audit_type", [
  "lighthouse",
  "axe",
  "wappalyzer", 
  "full_site",
  "security",
  "dns",
  "performance",
  "seo",
]);

// Enum for audit status
export const auditStatusEnum = pgEnum("audit_status", [
  "pending",
  "in_progress", 
  "complete",
  "failed",
  "partial",
]);

// Unified audit results table
export const auditResults = pgTable(
  "audit_results",
  {
    id: serial("id").primaryKey(),
    
    // Reference to domain platform object
    domainRecordId: integer("domain_record_id")
      .notNull()
      .references(() => record.id, { onDelete: "cascade" }),
    
    // Specific URL analyzed (could be homepage or any page)
    url: text("url").notNull(),
    
    // Audit metadata
    auditType: auditTypeEnum("audit_type").notNull(),
    version: integer("version").notNull().default(1), // Incremental version
    status: auditStatusEnum("status").notNull().default("pending"),
    
    // Results stored as structured JSON
    results: jsonb("results").notNull().default({}), // Full audit results
    summary: jsonb("summary").default({}), // Quick-access summary data
    score: integer("score"), // Overall score if applicable (0-100)
    
    // Timing
    startedAt: timestamp("started_at").notNull().defaultNow(),
    completedAt: timestamp("completed_at"),
    duration: integer("duration"), // Duration in milliseconds
    
    // Error tracking
    errorMessage: text("error_message"),
    errorDetails: jsonb("error_details"),
    retryCount: integer("retry_count").notNull().default(0),
    
    // Metadata
    triggeredBy: text("triggered_by"), // user, schedule, webhook, api
    metadata: jsonb("metadata").default({}), // Additional context
    
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    // Primary queries - domain + audit type
    index("audit_results_domain_type_idx").on(table.domainRecordId, table.auditType),
    index("audit_results_domain_version_idx").on(table.domainRecordId, table.version),
    
    // Status and timing queries
    index("audit_results_status_idx").on(table.status),
    index("audit_results_created_idx").on(table.createdAt),
    
    // URL queries for specific page analysis
    index("audit_results_url_idx").on(table.url),
    
    // Latest version queries
    index("audit_results_domain_type_version_idx").on(
      table.domainRecordId, 
      table.auditType, 
      table.version
    ),
    
    // Composite index for performance - domain, audit type, created_at desc
    index("audit_results_composite_idx").on(
      table.domainRecordId,
      table.auditType,
      table.createdAt.desc()
    ),
    
    // GIN index for JSON querying
    index("audit_results_results_gin_idx").using("gin", table.results),
    index("audit_results_summary_gin_idx").using("gin", table.summary),
  ]
);

// Processing queue for audits
export const auditQueue = pgTable(
  "audit_queue",
  {
    id: serial("id").primaryKey(),
    
    domainRecordId: integer("domain_record_id")
      .notNull()
      .references(() => record.id, { onDelete: "cascade" }),
    
    url: text("url").notNull(),
    auditType: auditTypeEnum("audit_type").notNull(),
    priority: integer("priority").notNull().default(0),
    status: text("status").notNull().default("queued"), // queued, processing, completed, failed
    
    scheduledFor: timestamp("scheduled_for"),
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(3),
    
    lastAttemptAt: timestamp("last_attempt_at"),
    nextRetryAt: timestamp("next_retry_at"),
    
    config: jsonb("config").default({}), // Audit-specific configuration
    metadata: jsonb("metadata").default({}),
    
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("audit_queue_domain_idx").on(table.domainRecordId),
    index("audit_queue_status_idx").on(table.status),
    index("audit_queue_scheduled_idx").on(table.scheduledFor),
    index("audit_queue_priority_idx").on(table.priority),
    index("audit_queue_next_retry_idx").on(table.nextRetryAt),
  ]
);

// Relations
export const auditResultsRelations = relations(auditResults, ({ one }) => ({
  domainRecord: one(record, {
    fields: [auditResults.domainRecordId],
    references: [record.id],
  }),
}));

export const auditQueueRelations = relations(auditQueue, ({ one }) => ({
  domainRecord: one(record, {
    fields: [auditQueue.domainRecordId],
    references: [record.id],
  }),
}));

// Type exports
export type AuditResult = typeof auditResults.$inferSelect;
export type NewAuditResult = typeof auditResults.$inferInsert;
export type AuditQueueItem = typeof auditQueue.$inferSelect;
export type NewAuditQueueItem = typeof auditQueue.$inferInsert;