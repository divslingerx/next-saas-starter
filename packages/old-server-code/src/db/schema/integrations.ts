/**
 * Integrations Schema
 * Tables for managing client properties and third-party integrations
 */

import {
  pgTable,
  text,
  integer,
  serial,
  timestamp,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Properties (websites, apps, stores belonging to a client)
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(), // Note: Will reference clients from core schema via relations
  name: text("name").notNull(),
  url: text("url"),
  type: text("type"), // 'website', 'app', 'ecommerce', etc.
  platform: text("platform"), // 'wordpress', 'shopify', 'custom', etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Supported integration types
export const integrationTypes = pgTable("integration_types", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(), // e.g. "hubspot", "wordpress", "google_analytics"
  name: text("name").notNull(),
  category: text("category"), // 'crm', 'cms', 'analytics', 'email', 'storage'
  requiresOAuth: boolean("requires_oauth").notNull().default(false),
  configSchema: jsonb("config_schema"), // JSON schema for validation
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Connections (per property, per integration)
export const connections = pgTable("connections", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id")
    .references(() => properties.id, { onDelete: "cascade" })
    .notNull(),
  integrationTypeId: integer("integration_type_id")
    .references(() => integrationTypes.id, { onDelete: "restrict" })
    .notNull(),
  name: text("name"), // Friendly name for this connection
  status: text("status").notNull().default("active"), // 'active', 'error', 'expired', 'paused'
  
  // OAuth tokens (encrypted in production)
  oauthAccessToken: text("oauth_access_token"),
  oauthRefreshToken: text("oauth_refresh_token"),
  oauthExpiresAt: timestamp("oauth_expires_at"),
  
  // Configuration specific to this connection
  config: jsonb("config"), // API keys, webhook URLs, etc.
  
  // Sync metadata
  lastSyncAt: timestamp("last_sync_at"),
  lastSyncStatus: text("last_sync_status"), // 'success', 'partial', 'failed'
  lastSyncError: text("last_sync_error"),
  syncFrequencyMinutes: integer("sync_frequency_minutes").default(60),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Integration sync logs
export const integrationSyncLogs = pgTable("integration_sync_logs", {
  id: serial("id").primaryKey(),
  connectionId: integer("connection_id")
    .references(() => connections.id, { onDelete: "cascade" })
    .notNull(),
  
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  
  status: text("status").notNull(), // 'in_progress', 'success', 'partial', 'failed'
  recordsProcessed: integer("records_processed").default(0),
  recordsFailed: integer("records_failed").default(0),
  
  errorMessage: text("error_message"),
  metadata: jsonb("metadata"), // Additional sync details
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==========================================
// Relations
// ==========================================

export const propertiesRelations = relations(properties, ({ many }) => ({
  connections: many(connections),
}));

export const integrationTypesRelations = relations(integrationTypes, ({ many }) => ({
  connections: many(connections),
}));

export const connectionsRelations = relations(connections, ({ one, many }) => ({
  property: one(properties, {
    fields: [connections.propertyId],
    references: [properties.id],
  }),
  integrationType: one(integrationTypes, {
    fields: [connections.integrationTypeId],
    references: [integrationTypes.id],
  }),
  syncLogs: many(integrationSyncLogs),
}));

export const integrationSyncLogsRelations = relations(
  integrationSyncLogs,
  ({ one }) => ({
    connection: one(connections, {
      fields: [integrationSyncLogs.connectionId],
      references: [connections.id],
    }),
  })
);

// ==========================================
// Type exports
// ==========================================

export type Property = typeof properties.$inferSelect;
export type NewProperty = typeof properties.$inferInsert;
export type IntegrationType = typeof integrationTypes.$inferSelect;
export type NewIntegrationType = typeof integrationTypes.$inferInsert;
export type Connection = typeof connections.$inferSelect;
export type NewConnection = typeof connections.$inferInsert;
export type IntegrationSyncLog = typeof integrationSyncLogs.$inferSelect;
export type NewIntegrationSyncLog = typeof integrationSyncLogs.$inferInsert;