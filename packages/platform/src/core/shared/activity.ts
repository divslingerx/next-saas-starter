import { pgTableCreator, text, bigint, boolean, timestamp, jsonb, index, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { organization } from "../identity/organization";
import { person } from "../identity/person";

export const createTable = pgTableCreator((name) => `agency-app_${name}`);

/**
 * Activity log - tracks all activities and events across the platform
 * This is the unified timeline/audit trail
 */
export const activity = createTable(
  "activity",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    
    // Universal identifier
    uid: uuid("uid").defaultRandom().notNull().unique(),
    
    // Multi-tenant
    organizationId: bigint("organization_id", { mode: "number" })
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    
    // Activity type and category
    type: text("type").notNull(), // 'created', 'updated', 'deleted', 'viewed', 'commented', etc.
    category: text("category").notNull(), // 'system', 'user', 'automation', 'integration'
    verb: text("verb"), // Human-readable verb: 'created', 'updated', 'sent', 'completed'
    
    // Activity description
    title: text("title"), // Short description
    description: text("description"), // Full description
    
    // Actor - who performed the activity
    actorType: text("actor_type"), // 'user', 'system', 'automation', 'integration', 'api'
    actorId: bigint("actor_id", { mode: "number" })
      .references(() => person.id, { onDelete: "set null" }),
    actorName: text("actor_name"), // Cached for display
    actorMetadata: jsonb("actor_metadata"), // Additional actor info
    
    // Subject - what the activity was performed on (polymorphic)
    subjectType: text("subject_type").notNull(), // 'person', 'deal', 'order', 'email', etc.
    subjectId: bigint("subject_id", { mode: "number" }).notNull(),
    subjectName: text("subject_name"), // Cached for display
    subjectMetadata: jsonb("subject_metadata"), // Snapshot of subject at time of activity
    
    // Related entity - optional secondary entity
    relatedType: text("related_type"), // 'person', 'organization', etc.
    relatedId: bigint("related_id", { mode: "number" }),
    relatedName: text("related_name"),
    relatedMetadata: jsonb("related_metadata"),
    
    // Changes tracking (for updates)
    changes: jsonb("changes"), // { field: { from: old, to: new } }
    changesSummary: text("changes_summary"), // Human-readable summary
    
    // Context
    context: jsonb("context"), // Additional context data
    source: text("source"), // 'web', 'api', 'mobile', 'automation', 'integration'
    sourceDetails: jsonb("source_details"),
    
    // Request information
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    sessionId: text("session_id"),
    requestId: text("request_id"), // For tracing
    
    // Importance and visibility
    importance: text("importance"), // 'low', 'medium', 'high', 'critical'
    isPublic: boolean("is_public").default(true), // Visible in activity feed
    isSystem: boolean("is_system").default(false), // System-generated activity
    
    // Tags for filtering
    tags: text("tags").array().default(sql`ARRAY[]::text[]`),
    
    // Error tracking (for failed activities)
    isError: boolean("is_error").default(false),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    errorDetails: jsonb("error_details"),
    
    // Timestamps
    occurredAt: timestamp("occurred_at").defaultNow().notNull(), // When it actually happened
    createdAt: timestamp("created_at").defaultNow().notNull(), // When it was logged
  },
  (table) => ({
    // Core indexes
    uidIdx: index("activity_uid_idx").on(table.uid),
    orgIdx: index("activity_org_idx").on(table.organizationId),
    
    // Type indexes
    typeIdx: index("activity_type_idx").on(table.type),
    categoryIdx: index("activity_category_idx").on(table.category),
    
    // Actor indexes
    actorIdx: index("activity_actor_idx").on(table.actorType, table.actorId),
    
    // Subject indexes
    subjectIdx: index("activity_subject_idx").on(table.subjectType, table.subjectId),
    
    // Related indexes
    relatedIdx: index("activity_related_idx").on(table.relatedType, table.relatedId),
    
    // Time indexes
    occurredAtIdx: index("activity_occurred_at_idx").on(table.occurredAt),
    
    // Source indexes
    sourceIdx: index("activity_source_idx").on(table.source),
    
    // Error indexes
    errorIdx: index("activity_error_idx").on(table.isError),
    
    // Importance
    importanceIdx: index("activity_importance_idx").on(table.importance),
  })
);

/**
 * Notes - user-generated notes that can be attached to any entity
 */
export const note = createTable(
  "note",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    
    // Universal identifier
    uid: uuid("uid").defaultRandom().notNull().unique(),
    
    // Multi-tenant
    organizationId: bigint("organization_id", { mode: "number" })
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    
    // Note content
    content: text("content").notNull(),
    contentHtml: text("content_html"), // Rich text HTML
    
    // What this note is attached to (polymorphic)
    entityType: text("entity_type").notNull(), // 'person', 'deal', 'order', etc.
    entityId: bigint("entity_id", { mode: "number" }).notNull(),
    
    // Note type
    type: text("type"), // 'general', 'call', 'meeting', 'followup'
    
    // Author
    authorId: bigint("author_id", { mode: "number" })
      .notNull()
      .references(() => person.id, { onDelete: "set null" }),
    authorName: text("author_name"), // Cached for display
    
    // Visibility
    isPrivate: boolean("is_private").default(false),
    isPinned: boolean("is_pinned").default(false),
    
    // Mentions
    mentionedPersonIds: bigint("mentioned_person_ids", { mode: "number" }).array(),
    
    // Tags
    tags: text("tags").array().default(sql`ARRAY[]::text[]`),
    
    // Attachments
    hasAttachments: boolean("has_attachments").default(false),
    attachments: jsonb("attachments"),
    
    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    // Core indexes
    uidIdx: index("note_uid_idx").on(table.uid),
    orgIdx: index("note_org_idx").on(table.organizationId),
    
    // Entity indexes
    entityIdx: index("note_entity_idx").on(table.entityType, table.entityId),
    
    // Author indexes
    authorIdx: index("note_author_idx").on(table.authorId),
    
    // Type indexes
    typeIdx: index("note_type_idx").on(table.type),
    
    // Visibility indexes
    privateIdx: index("note_private_idx").on(table.isPrivate),
    pinnedIdx: index("note_pinned_idx").on(table.isPinned),
  })
);

/**
 * Tasks - actionable items that can be assigned and tracked
 */
export const task = createTable(
  "task",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    
    // Universal identifier
    uid: uuid("uid").defaultRandom().notNull().unique(),
    
    // Multi-tenant
    organizationId: bigint("organization_id", { mode: "number" })
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    
    // Task details
    title: text("title").notNull(),
    description: text("description"),
    
    // Type and priority
    type: text("type"), // 'call', 'email', 'meeting', 'todo', 'followup'
    priority: text("priority"), // 'low', 'medium', 'high', 'urgent'
    
    // Status
    status: text("status").notNull().default('pending'), // 'pending', 'in_progress', 'completed', 'cancelled'
    
    // Assignment
    assignedToId: bigint("assigned_to_id", { mode: "number" })
      .references(() => person.id, { onDelete: "set null" }),
    assignedToName: text("assigned_to_name"), // Cached
    assignedById: bigint("assigned_by_id", { mode: "number" })
      .references(() => person.id, { onDelete: "set null" }),
    
    // Related entity (polymorphic)
    relatedType: text("related_type"), // 'person', 'deal', 'order', etc.
    relatedId: bigint("related_id", { mode: "number" }),
    relatedName: text("related_name"), // Cached
    
    // Dates
    dueDate: timestamp("due_date"),
    startDate: timestamp("start_date"),
    completedAt: timestamp("completed_at"),
    
    // Completion
    completedById: bigint("completed_by_id", { mode: "number" })
      .references(() => person.id, { onDelete: "set null" }),
    completionNotes: text("completion_notes"),
    
    // Recurrence
    isRecurring: boolean("is_recurring").default(false),
    recurrenceRule: text("recurrence_rule"), // RRULE format
    recurrenceEndDate: timestamp("recurrence_end_date"),
    
    // Reminders
    reminderDate: timestamp("reminder_date"),
    reminderSent: boolean("reminder_sent").default(false),
    
    // Tags
    tags: text("tags").array().default(sql`ARRAY[]::text[]`),
    
    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    // Core indexes
    uidIdx: index("task_uid_idx").on(table.uid),
    orgIdx: index("task_org_idx").on(table.organizationId),
    
    // Assignment indexes
    assignedToIdx: index("task_assigned_to_idx").on(table.assignedToId),
    
    // Related indexes
    relatedIdx: index("task_related_idx").on(table.relatedType, table.relatedId),
    
    // Status indexes
    statusIdx: index("task_status_idx").on(table.status),
    priorityIdx: index("task_priority_idx").on(table.priority),
    
    // Date indexes
    dueDateIdx: index("task_due_date_idx").on(table.dueDate),
    reminderIdx: index("task_reminder_idx").on(table.reminderDate),
  })
);

// Type exports
export type Activity = typeof activity.$inferSelect;
export type NewActivity = typeof activity.$inferInsert;
export type Note = typeof note.$inferSelect;
export type NewNote = typeof note.$inferInsert;
export type Task = typeof task.$inferSelect;
export type NewTask = typeof task.$inferInsert;

// Validation schemas
export const insertActivitySchema = createInsertSchema(activity, {
  type: z.string().min(1),
  category: z.enum(['system', 'user', 'automation', 'integration']),
  actorType: z.enum(['user', 'system', 'automation', 'integration', 'api']).optional(),
  source: z.enum(['web', 'api', 'mobile', 'automation', 'integration']).optional(),
  importance: z.enum(['low', 'medium', 'high', 'critical']).optional(),
});

export const selectActivitySchema = createSelectSchema(activity);

export const insertNoteSchema = createInsertSchema(note, {
  content: z.string().min(1),
  entityType: z.string().min(1),
  type: z.enum(['general', 'call', 'meeting', 'followup']).optional(),
});

export const selectNoteSchema = createSelectSchema(note);

export const insertTaskSchema = createInsertSchema(task, {
  title: z.string().min(1).max(255),
  type: z.enum(['call', 'email', 'meeting', 'todo', 'followup']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
});

export const selectTaskSchema = createSelectSchema(task);