/**
 * Usage Tracking Schema
 * Tracks API usage, rate limits, and plan quotas
 */

import { pgTable, text, integer, timestamp, jsonb, boolean, index, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * Usage metrics table
 * Tracks usage per user/organization per period
 */
export const usageMetrics = pgTable("usage_metrics", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  organizationId: text("organization_id"),
  
  // Period tracking
  period: text("period").notNull(), // 'daily', 'monthly'
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  
  // Usage counts
  apiCalls: integer("api_calls").default(0).notNull(),
  domainsAnalyzed: integer("domains_analyzed").default(0).notNull(),
  lighthouseScans: integer("lighthouse_scans").default(0).notNull(),
  axeScans: integer("axe_scans").default(0).notNull(),
  dnsLookups: integer("dns_lookups").default(0).notNull(),
  emailsSent: integer("emails_sent").default(0).notNull(),
  storageUsedMb: integer("storage_used_mb").default(0).notNull(),
  
  // Plan limits (cached for performance)
  planName: text("plan_name").notNull(),
  apiCallLimit: integer("api_call_limit").notNull(),
  domainLimit: integer("domain_limit").notNull(),
  scanLimit: integer("scan_limit").notNull(),
  
  // Metadata
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userPeriodIdx: uniqueIndex("usage_metrics_user_period_idx").on(
    table.userId,
    table.period,
    table.periodStart
  ),
  orgPeriodIdx: index("usage_metrics_org_period_idx").on(
    table.organizationId,
    table.period,
    table.periodStart
  ),
  periodIdx: index("usage_metrics_period_idx").on(
    table.periodStart,
    table.periodEnd
  ),
}));

/**
 * Rate limit tracking
 * Tracks rate limit windows for burst protection
 */
export const rateLimits = pgTable("rate_limits", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(), // userId or IP
  identifierType: text("identifier_type").notNull(), // 'user', 'ip'
  
  // Window tracking
  windowStart: timestamp("window_start").notNull(),
  windowEnd: timestamp("window_end").notNull(),
  windowSize: integer("window_size").notNull(), // in seconds
  
  // Request counting
  requestCount: integer("request_count").default(0).notNull(),
  maxRequests: integer("max_requests").notNull(),
  
  // Blocking
  isBlocked: boolean("is_blocked").default(false).notNull(),
  blockedUntil: timestamp("blocked_until"),
  blockReason: text("block_reason"),
  
  // Metadata
  lastRequestAt: timestamp("last_request_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  identifierWindowIdx: uniqueIndex("rate_limits_identifier_window_idx").on(
    table.identifier,
    table.windowStart
  ),
  windowIdx: index("rate_limits_window_idx").on(
    table.windowStart,
    table.windowEnd
  ),
  blockedIdx: index("rate_limits_blocked_idx").on(
    table.isBlocked,
    table.blockedUntil
  ),
}));

/**
 * Usage events table
 * Detailed event log for auditing and analytics
 */
export const usageEvents = pgTable("usage_events", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  organizationId: text("organization_id"),
  
  // Event details
  eventType: text("event_type").notNull(), // 'api_call', 'domain_scan', etc.
  eventCategory: text("event_category").notNull(), // 'analysis', 'email', 'storage'
  eventName: text("event_name").notNull(),
  
  // Resource tracking
  resourceId: text("resource_id"),
  resourceType: text("resource_type"),
  
  // Metrics
  duration: integer("duration"), // in milliseconds
  cost: integer("cost"), // in credits or cents
  success: boolean("success").default(true).notNull(),
  errorMessage: text("error_message"),
  
  // Request details
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  endpoint: text("endpoint"),
  method: text("method"),
  statusCode: integer("status_code"),
  
  // Metadata
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("usage_events_user_idx").on(table.userId),
  orgIdx: index("usage_events_org_idx").on(table.organizationId),
  eventTypeIdx: index("usage_events_type_idx").on(table.eventType),
  createdAtIdx: index("usage_events_created_idx").on(table.createdAt),
  resourceIdx: index("usage_events_resource_idx").on(
    table.resourceId,
    table.resourceType
  ),
}));

/**
 * Quota alerts table
 * Tracks when users approach or exceed quotas
 */
export const quotaAlerts = pgTable("quota_alerts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  organizationId: text("organization_id"),
  
  // Alert details
  alertType: text("alert_type").notNull(), // 'warning', 'limit_reached', 'blocked'
  quotaType: text("quota_type").notNull(), // 'api_calls', 'domains', etc.
  
  // Thresholds
  currentUsage: integer("current_usage").notNull(),
  quotaLimit: integer("quota_limit").notNull(),
  percentageUsed: integer("percentage_used").notNull(),
  
  // Notification
  notified: boolean("notified").default(false).notNull(),
  notifiedAt: timestamp("notified_at"),
  acknowledgedAt: timestamp("acknowledged_at"),
  
  // Metadata
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userAlertIdx: index("quota_alerts_user_idx").on(
    table.userId,
    table.alertType,
    table.createdAt
  ),
  notifiedIdx: index("quota_alerts_notified_idx").on(
    table.notified,
    table.notifiedAt
  ),
}));

// Type exports
export type UsageMetrics = typeof usageMetrics.$inferSelect;
export type NewUsageMetrics = typeof usageMetrics.$inferInsert;
export type RateLimit = typeof rateLimits.$inferSelect;
export type NewRateLimit = typeof rateLimits.$inferInsert;
export type UsageEvent = typeof usageEvents.$inferSelect;
export type NewUsageEvent = typeof usageEvents.$inferInsert;
export type QuotaAlert = typeof quotaAlerts.$inferSelect;
export type NewQuotaAlert = typeof quotaAlerts.$inferInsert;