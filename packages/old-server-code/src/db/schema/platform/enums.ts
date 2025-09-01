/**
 * Platform Shared Enums
 * Centralized enum definitions used across platform modules
 */

import { pgEnum } from "drizzle-orm/pg-core";

// ==========================================
// PROPERTY TYPES
// ==========================================

export const propertyTypeEnum = pgEnum("property_type", [
  "string",
  "number",
  "boolean",
  "date",
  "datetime",
  "email",
  "phone",
  "url",
  "currency",
  "percentage",
  "duration",
  "enumeration",
  "multi_select",
  "reference",
  "file",
  "image",
  "json",
  "rich_text",
  "calculated",
]);

// ==========================================
// CARDINALITY TYPES
// ==========================================

export const cardinalityEnum = pgEnum("cardinality", [
  "one-to-one",
  "one-to-many",
  "many-to-one",
  "many-to-many",
]);

// ==========================================
// CASCADE ACTIONS
// ==========================================

export const cascadeActionEnum = pgEnum("cascade_action", [
  "none",
  "from",
  "to",
  "both",
]);

// ==========================================
// SOURCES
// ==========================================

export const dataSourceEnum = pgEnum("data_source", [
  "user",      // Manual entry
  "api",       // API call
  "import",    // Bulk import
  "sync",      // Integration sync
  "automation", // Automation rule
  "system",    // System generated
  "ai",        // AI enrichment
  "webhook",   // Webhook event
]);

// ==========================================
// VISIBILITY
// ==========================================

export const visibilityEnum = pgEnum("visibility", [
  "private",      // Only owner
  "team",         // Team members
  "organization", // All in org
  "public",       // Public access
]);

// ==========================================
// PRIORITY LEVELS
// ==========================================

export const priorityEnum = pgEnum("priority", [
  "lowest",
  "low",
  "medium",
  "high",
  "highest",
  "critical",
]);

// ==========================================
// STATUS TYPES
// ==========================================

export const statusEnum = pgEnum("status", [
  "draft",
  "pending",
  "active",
  "inactive",
  "archived",
  "deleted",
]);

// ==========================================
// COMPARISON OPERATORS
// ==========================================

export const comparisonOperatorEnum = pgEnum("comparison_operator", [
  "equals",
  "not_equals",
  "contains",
  "not_contains",
  "starts_with",
  "ends_with",
  "greater_than",
  "greater_than_or_equal",
  "less_than",
  "less_than_or_equal",
  "between",
  "in",
  "not_in",
  "is_null",
  "is_not_null",
  "is_true",
  "is_false",
]);

// ==========================================
// LOGICAL OPERATORS
// ==========================================

export const logicalOperatorEnum = pgEnum("logical_operator", [
  "and",
  "or",
  "not",
]);

// ==========================================
// TIME PERIODS
// ==========================================

export const timePeriodEnum = pgEnum("time_period", [
  "hourly",
  "daily",
  "weekly",
  "monthly",
  "quarterly",
  "yearly",
  "custom",
]);

// ==========================================
// WEBHOOK EVENTS
// ==========================================

export const webhookEventEnum = pgEnum("webhook_event", [
  "record.created",
  "record.updated",
  "record.deleted",
  "record.archived",
  "record.restored",
  "association.created",
  "association.deleted",
  "stage.entered",
  "stage.exited",
  "list.member_added",
  "list.member_removed",
]);

// ==========================================
// NOTIFICATION TYPES
// ==========================================

export const notificationTypeEnum = pgEnum("notification_type", [
  "email",
  "sms",
  "push",
  "in_app",
  "webhook",
  "slack",
  "teams",
]);