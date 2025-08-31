import { pgTableCreator, text, bigint, boolean, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const createTable = pgTableCreator((name) => `agency-app_${name}`);

/**
 * Metafield - flexible key-value storage for any entity
 * Replaces individual metafield tables throughout the system
 */
export const metafield = createTable(
  "metafield",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    
    // Polymorphic reference
    entityType: text("entity_type").notNull(), // 'product', 'customer', 'order', etc.
    entityId: bigint("entity_id", { mode: "number" }).notNull(),
    
    // Metafield data
    namespace: text("namespace").notNull(),
    key: text("key").notNull(),
    value: jsonb("value").notNull(),
    valueType: text("value_type").notNull(), // 'string', 'integer', 'json', 'boolean'
    
    // Optional description
    description: text("description"),
    
    // Visibility
    isPublic: boolean("is_public").default(false),
    
    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    entityIdx: index("metafield_entity_idx").on(table.entityType, table.entityId),
    namespaceKeyIdx: index("metafield_namespace_key_idx").on(table.namespace, table.key),
    publicIdx: index("metafield_public_idx").on(table.isPublic),
  })
);

/**
 * Tag - flexible tagging system for any entity
 */
export const tag = createTable(
  "tag",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    
    // Tag information
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    
    // Optional grouping
    tagGroup: text("tag_group"),
    
    // Display
    color: text("color"),
    icon: text("icon"),
    
    // Metadata
    description: text("description"),
    isSystem: boolean("is_system").default(false), // System-generated vs user-created
    
    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    slugIdx: index("tag_slug_idx").on(table.slug),
    groupIdx: index("tag_group_idx").on(table.tagGroup),
    systemIdx: index("tag_system_idx").on(table.isSystem),
  })
);

/**
 * Tag assignment - links tags to entities
 */
export const tagAssignment = createTable(
  "tag_assignment",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    
    tagId: bigint("tag_id", { mode: "number" })
      .notNull()
      .references(() => tag.id, { onDelete: "cascade" }),
    
    // Polymorphic reference
    entityType: text("entity_type").notNull(), // 'product', 'customer', 'order', etc.
    entityId: bigint("entity_id", { mode: "number" }).notNull(),
    
    // Optional context
    context: text("context"), // Additional context for the tag assignment
    
    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    entityIdx: index("tag_assignment_entity_idx").on(table.entityType, table.entityId),
    tagIdx: index("tag_assignment_tag_idx").on(table.tagId),
    uniqueAssignment: index("tag_assignment_unique_idx").on(
      table.tagId, 
      table.entityType, 
      table.entityId
    ),
  })
);

/**
 * Note - comments/notes that can be attached to any entity
 */
export const note = createTable(
  "note",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    
    // Polymorphic reference
    entityType: text("entity_type").notNull(), // 'order', 'customer', 'product', etc.
    entityId: bigint("entity_id", { mode: "number" }).notNull(),
    
    // Note content
    content: text("content").notNull(),
    noteType: text("note_type"), // 'internal', 'customer', 'system'
    
    // Author information
    authorId: text("author_id"),
    authorName: text("author_name"),
    authorType: text("author_type"), // 'user', 'customer', 'system'
    
    // Visibility
    isPrivate: boolean("is_private").default(false),
    isPinned: boolean("is_pinned").default(false),
    
    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    entityIdx: index("note_entity_idx").on(table.entityType, table.entityId),
    authorIdx: index("note_author_idx").on(table.authorId),
    typeIdx: index("note_type_idx").on(table.noteType),
    pinnedIdx: index("note_pinned_idx").on(table.isPinned),
  })
);

/**
 * Activity log - tracks all activities/events for audit trail
 */
export const activityLog = createTable(
  "activity_log",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    
    // What happened
    action: text("action").notNull(), // 'created', 'updated', 'deleted', 'status_changed'
    actionType: text("action_type").notNull(), // More specific action type
    
    // Who did it
    actorId: text("actor_id"),
    actorName: text("actor_name"),
    actorType: text("actor_type"), // 'user', 'customer', 'system', 'api'
    
    // What was affected
    entityType: text("entity_type").notNull(),
    entityId: bigint("entity_id", { mode: "number" }).notNull(),
    
    // Change details
    changes: jsonb("changes"), // JSON object with before/after values
    metadata: jsonb("metadata"), // Additional context
    
    // Request information
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    sessionId: text("session_id"),
    
    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    entityIdx: index("activity_entity_idx").on(table.entityType, table.entityId),
    actorIdx: index("activity_actor_idx").on(table.actorId),
    actionIdx: index("activity_action_idx").on(table.action),
    createdAtIdx: index("activity_created_at_idx").on(table.createdAt),
  })
);

// Type exports
export type Metafield = typeof metafield.$inferSelect;
export type NewMetafield = typeof metafield.$inferInsert;
export type Tag = typeof tag.$inferSelect;
export type NewTag = typeof tag.$inferInsert;
export type TagAssignment = typeof tagAssignment.$inferSelect;
export type NewTagAssignment = typeof tagAssignment.$inferInsert;
export type Note = typeof note.$inferSelect;
export type NewNote = typeof note.$inferInsert;
export type ActivityLog = typeof activityLog.$inferSelect;
export type NewActivityLog = typeof activityLog.$inferInsert;

// Schema exports
export const insertMetafieldSchema = createInsertSchema(metafield);
export const selectMetafieldSchema = createSelectSchema(metafield);
export const insertTagSchema = createInsertSchema(tag);
export const selectTagSchema = createSelectSchema(tag);
export const insertTagAssignmentSchema = createInsertSchema(tagAssignment);
export const selectTagAssignmentSchema = createSelectSchema(tagAssignment);
export const insertNoteSchema = createInsertSchema(note);
export const selectNoteSchema = createSelectSchema(note);
export const insertActivityLogSchema = createInsertSchema(activityLog);
export const selectActivityLogSchema = createSelectSchema(activityLog);