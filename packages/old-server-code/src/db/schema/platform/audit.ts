/**
 * Platform Audit & History
 * Complete audit trail for compliance and debugging
 */

import { sql } from "drizzle-orm";
import {
  text,
  integer,
  varchar,
  timestamp,
  index,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";
import { pgEnum } from "drizzle-orm/pg-core";
import { createTable } from "../../utils";
import { organization } from "../auth";

// ==========================================
// ENUMS
// ==========================================

export const auditActionEnum = pgEnum("audit_action", [
  "create",
  "update",
  "delete",
  "archive",
  "restore",
  "merge",
  "import",
  "export",
  "bulk_update",
  "bulk_delete",
]);

export const auditEntityTypeEnum = pgEnum("audit_entity_type", [
  "record",
  "association",
  "list",
  "pipeline",
  "user",
  "organization",
  "integration",
  "automation",
]);

// ==========================================
// AUDIT LOG
// ==========================================

/**
 * Main audit log for all platform actions
 * Immutable record of what happened, when, and by whom
 */
export const auditLog = createTable(
  "audit_log",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    
    // Organization context
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    
    // What was affected
    entityType: auditEntityTypeEnum("entity_type").notNull(),
    entityId: integer("entity_id"),
    objectType: varchar("object_type", { length: 50 }), // For record entities
    
    // What happened
    action: auditActionEnum("action").notNull(),
    actionDetails: text("action_details"), // Human-readable description
    
    // Changes made
    changedFields: jsonb("changed_fields"), // List of fields that changed
    previousValues: jsonb("previous_values"), // Values before change
    newValues: jsonb("new_values"), // Values after change
    changeSet: jsonb("change_set"), // Full diff for complex changes
    
    // Who did it
    userId: text("user_id").notNull(),
    userEmail: text("user_email"),
    userName: text("user_name"),
    
    // Context
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    sessionId: text("session_id"),
    requestId: text("request_id"), // For tracing
    
    // Source
    source: varchar("source", { length: 50 }), // api, ui, import, automation, system
    sourceDetails: jsonb("source_details"), // Additional context
    
    // Performance
    duration: integer("duration"), // Milliseconds
    
    // When
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    // Indexes for common queries
    index("audit_org_entity_idx").on(table.organizationId, table.entityType, table.entityId),
    index("audit_user_idx").on(table.userId),
    index("audit_created_idx").on(table.createdAt),
    index("audit_action_idx").on(table.action),
    index("audit_object_type_idx").on(table.objectType),
    
    // Index for recent entries (removed partial index due to CURRENT_TIMESTAMP immutability)
    index("audit_recent_idx")
      .on(table.organizationId, table.createdAt),
  ]
);

// ==========================================
// PROPERTY HISTORY
// ==========================================

/**
 * Detailed history of property value changes
 * More granular than audit log for data recovery
 */
export const propertyHistory = createTable(
  "property_history",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    
    // Record reference
    recordId: integer("record_id").notNull(),
    objectType: varchar("object_type", { length: 50 }).notNull(),
    
    // Property that changed
    propertyName: varchar("property_name", { length: 100 }).notNull(),
    
    // Values
    previousValue: jsonb("previous_value"),
    newValue: jsonb("new_value"),
    
    // Change metadata
    changeType: varchar("change_type", { length: 20 }), // set, unset, append, remove
    changeReason: text("change_reason"),
    
    // Version tracking
    version: integer("version").notNull().default(1),
    
    // Who and when
    changedAt: timestamp("changed_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    changedById: text("changed_by_id").notNull(),
    
    // Source
    source: varchar("source", { length: 50 }),
    sourceId: text("source_id"), // Import ID, automation ID, etc.
  },
  (table) => [
    index("property_history_record_idx").on(table.recordId),
    index("property_history_property_idx").on(table.propertyName),
    index("property_history_changed_idx").on(table.changedAt),
    
    // Composite index for property timeline queries
    index("property_history_timeline_idx").on(
      table.recordId,
      table.propertyName,
      table.changedAt
    ),
  ]
);

// ==========================================
// BULK OPERATION LOG
// ==========================================

/**
 * Track bulk operations for auditing and rollback
 */
export const bulkOperationLog = createTable(
  "bulk_operation_log",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    
    // Operation details
    operationType: varchar("operation_type", { length: 50 }).notNull(), // import, export, bulk_update, bulk_delete
    operationName: text("operation_name"),
    operationConfig: jsonb("operation_config"), // Parameters used
    
    // Affected entities
    entityType: varchar("entity_type", { length: 50 }).notNull(),
    objectType: varchar("object_type", { length: 50 }),
    affectedIds: jsonb("affected_ids"), // Array of affected record IDs
    
    // Results
    totalRecords: integer("total_records").default(0),
    successCount: integer("success_count").default(0),
    failureCount: integer("failure_count").default(0),
    skipCount: integer("skip_count").default(0),
    
    // Detailed results
    successRecords: jsonb("success_records"), // IDs and details
    failureRecords: jsonb("failure_records"), // IDs and error messages
    
    // Rollback support
    isReversible: boolean("is_reversible").default(false),
    rollbackData: jsonb("rollback_data"), // Data needed to reverse operation
    wasRolledBack: boolean("was_rolled_back").default(false),
    rolledBackAt: timestamp("rolled_back_at", { withTimezone: true }),
    rolledBackById: text("rolled_back_by_id"),
    
    // Execution
    startedAt: timestamp("started_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    duration: integer("duration"), // Milliseconds
    
    // Who initiated it
    initiatedById: text("initiated_by_id").notNull(),
    
    // Error handling
    errorMessage: text("error_message"),
    errorDetails: jsonb("error_details"),
  },
  (table) => [
    index("bulk_op_org_idx").on(table.organizationId),
    index("bulk_op_type_idx").on(table.operationType),
    index("bulk_op_started_idx").on(table.startedAt),
    index("bulk_op_reversible_idx").on(table.isReversible),
  ]
);

// ==========================================
// DATA EXPORT LOG
// ==========================================

/**
 * Track data exports for security and compliance
 */
export const dataExportLog = createTable(
  "data_export_log",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    
    // Export details
    exportType: varchar("export_type", { length: 50 }).notNull(), // full, partial, backup
    format: varchar("format", { length: 20 }).notNull(), // csv, json, excel, sql
    
    // What was exported
    objectTypes: jsonb("object_types"), // Array of object types
    filterCriteria: jsonb("filter_criteria"), // Filters applied
    recordCount: integer("record_count").default(0),
    
    // File info
    fileName: text("file_name"),
    fileSize: integer("file_size"), // Bytes
    fileHash: text("file_hash"), // SHA256 for verification
    
    // Security
    isEncrypted: boolean("is_encrypted").default(false),
    encryptionMethod: varchar("encryption_method", { length: 50 }),
    
    // Access
    downloadUrl: text("download_url"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    downloadCount: integer("download_count").default(0),
    lastDownloadedAt: timestamp("last_downloaded_at", { withTimezone: true }),
    
    // Compliance
    purpose: text("purpose"), // Why was this exported
    approvedById: text("approved_by_id"),
    
    // Who and when
    exportedAt: timestamp("exported_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    exportedById: text("exported_by_id").notNull(),
    
    // Cleanup
    wasDeleted: boolean("was_deleted").default(false),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("export_log_org_idx").on(table.organizationId),
    index("export_log_exported_idx").on(table.exportedAt),
    index("export_log_expires_idx").on(table.expiresAt),
  ]
);

// ==========================================
// ACCESS LOG
// ==========================================

/**
 * Track access to sensitive data
 * For compliance with GDPR, HIPAA, etc.
 */
export const accessLog = createTable(
  "access_log",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    
    // What was accessed
    resourceType: varchar("resource_type", { length: 50 }).notNull(),
    resourceId: integer("resource_id"),
    resourceName: text("resource_name"),
    
    // Access details
    accessType: varchar("access_type", { length: 20 }).notNull(), // view, edit, download, share
    accessLevel: varchar("access_level", { length: 20 }), // full, partial, metadata_only
    
    // Data accessed
    fieldsAccessed: jsonb("fields_accessed"), // Which fields were viewed/modified
    recordsAccessed: integer("records_accessed").default(1),
    
    // Who accessed
    userId: text("user_id").notNull(),
    userRole: varchar("user_role", { length: 50 }),
    
    // Context
    ipAddress: varchar("ip_address", { length: 45 }),
    location: jsonb("location"), // Geo data if available
    deviceInfo: jsonb("device_info"),
    
    // Result
    wasSuccessful: boolean("was_successful").default(true),
    errorMessage: text("error_message"),
    
    // When
    accessedAt: timestamp("accessed_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    index("access_log_org_resource_idx").on(
      table.organizationId,
      table.resourceType,
      table.resourceId
    ),
    index("access_log_user_idx").on(table.userId),
    index("access_log_accessed_idx").on(table.accessedAt),
  ]
);