/**
 * Platform Lists & Segments
 * Static and dynamic groupings of records
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
} from "drizzle-orm/pg-core";
import { pgEnum } from "drizzle-orm/pg-core";
import { createTable } from "../../utils";
import { organization } from "../auth";
import { record, objectDefinition } from "./core";

// ==========================================
// ENUMS
// ==========================================

export const listTypeEnum = pgEnum("list_type", [
  "static",   // Manual membership
  "dynamic",  // Query-based membership
  "smart",    // AI-powered segmentation
]);

// ==========================================
// LISTS
// ==========================================

/**
 * Lists for grouping records
 * Can be static (manual) or dynamic (query-based)
 */
export const list = createTable(
  "list",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    
    // Organization and object type
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    objectDefinitionId: integer("object_definition_id")
      .notNull()
      .references(() => objectDefinition.id),

    // Basic info
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    type: listTypeEnum("type").notNull().default("static"),

    // For dynamic/smart lists
    filterCriteria: jsonb("filter_criteria"), // Query definition
    refreshInterval: integer("refresh_interval"), // Minutes between refreshes
    lastRefreshedAt: timestamp("last_refreshed_at", { withTimezone: true }),

    // Stats (denormalized for performance)
    memberCount: integer("member_count").default(0),
    
    // Settings
    isPublic: boolean("is_public").default(false), // Visible to all org users
    isActive: boolean("is_active").default(true),
    
    // Metadata
    tags: jsonb("tags").default([]),
    color: varchar("color", { length: 7 }), // Hex color for UI
    icon: varchar("icon", { length: 50 }),
    
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(() => new Date()),
    createdById: text("created_by_id"),
    updatedById: text("updated_by_id"),
  },
  (table) => [
    // Unique name per org
    unique().on(table.organizationId, table.name),
    
    // Performance indexes
    index("list_org_object_idx").on(table.organizationId, table.objectDefinitionId),
    index("list_type_idx").on(table.type),
    index("list_public_idx").on(table.isPublic),
  ]
);

// ==========================================
// LIST MEMBERSHIP
// ==========================================

/**
 * Membership of records in lists
 * For static lists, this is the source of truth
 * For dynamic lists, this is a cache
 */
export const listMembership = createTable(
  "list_membership",
  {
    listId: integer("list_id")
      .notNull()
      .references(() => list.id, { onDelete: "cascade" }),
    recordId: integer("record_id")
      .notNull()
      .references(() => record.id, { onDelete: "cascade" }),

    // Membership metadata
    addedAt: timestamp("added_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    addedById: text("added_by_id"),
    
    // For dynamic lists
    matchScore: integer("match_score"), // Relevance score (0-100)
    matchedCriteria: jsonb("matched_criteria"), // Which criteria matched
    
    // Manual override
    isPinned: boolean("is_pinned").default(false), // Keep even if doesn't match criteria
    isExcluded: boolean("is_excluded").default(false), // Exclude even if matches criteria
  },
  (table) => [
    primaryKey({ columns: [table.listId, table.recordId] }),
    
    // Performance indexes
    index("list_member_record_idx").on(table.recordId),
    index("list_member_added_idx").on(table.addedAt),
  ]
);

// ==========================================
// SAVED FILTERS
// ==========================================

/**
 * Saved filter criteria for quick access
 * Can be converted to lists or used for quick filtering
 */
export const savedFilter = createTable(
  "saved_filter",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    objectDefinitionId: integer("object_definition_id")
      .notNull()
      .references(() => objectDefinition.id),

    // Filter info
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    filterCriteria: jsonb("filter_criteria").notNull(),
    
    // Sharing
    isPublic: boolean("is_public").default(false),
    isDefault: boolean("is_default").default(false), // Default filter for this object type
    
    // Usage tracking
    usageCount: integer("usage_count").default(0),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    createdById: text("created_by_id"),
  },
  (table) => [
    unique().on(table.organizationId, table.name),
    index("saved_filter_org_object_idx").on(table.organizationId, table.objectDefinitionId),
    index("saved_filter_public_idx").on(table.isPublic),
  ]
);

// ==========================================
// SEGMENTS (Advanced Lists)
// ==========================================

/**
 * Advanced segmentation with scoring and rules
 * Used for marketing, sales qualification, etc.
 */
export const segment = createTable(
  "segment",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    objectDefinitionId: integer("object_definition_id")
      .notNull()
      .references(() => objectDefinition.id),

    // Segment info
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    
    // Rules engine
    rules: jsonb("rules").notNull(), // Complex rule tree
    scoringModel: jsonb("scoring_model"), // How to calculate scores
    qualificationThreshold: integer("qualification_threshold").default(70), // Min score to qualify
    
    // Performance
    isCached: boolean("is_cached").default(true),
    cacheExpiryMinutes: integer("cache_expiry_minutes").default(60),
    lastCalculatedAt: timestamp("last_calculated_at", { withTimezone: true }),
    
    // Stats
    totalMembers: integer("total_members").default(0),
    averageScore: integer("average_score"),
    
    isActive: boolean("is_active").default(true),
    
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(() => new Date()),
  },
  (table) => [
    unique().on(table.organizationId, table.name),
    index("segment_org_object_idx").on(table.organizationId, table.objectDefinitionId),
    index("segment_active_idx").on(table.isActive),
  ]
);