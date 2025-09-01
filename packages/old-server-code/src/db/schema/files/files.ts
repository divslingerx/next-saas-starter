// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { sql, relations } from "drizzle-orm";
import {
  index,
  integer,
  timestamp,
  varchar,
  text,
  boolean,
  json,
  unique,
} from "drizzle-orm/pg-core";
import { createTable } from "../../utils";
import {
  createInsertSchema,
  createSelectSchema,
} from "drizzle-zod";
import { organization, member } from "../auth";

/*************************************** FILES ***************************************/
export const files = createTable(
  "file",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    name: varchar("file_name", { length: 256 }).notNull(),
    key: varchar("key", { length: 256 }).notNull(),
    directoryId: integer("directory_id").references(() => directories.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    
    // Multi-tenancy
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    createdByMembershipId: text("created_by_membership_id")
      .references(() => member.id, { onDelete: "set null" }),
    
    // Version tracking
    currentVersionId: integer("current_version_id"),
    versionCount: integer("version_count").default(0).notNull(),
    
    // Content deduplication
    contentHash: varchar("content_hash", { length: 64 }),
    totalSize: integer("total_size").default(0).notNull(),
    
    // Soft delete - allows 30-day restoration period
    isRemoved: boolean("is_removed").default(false).notNull(),
    removedAt: timestamp("removed_at", { withTimezone: true }),
    removedByMembershipId: text("removed_by_membership_id")
      .references(() => member.id, { onDelete: "set null" }),
    // Computed field: removedAt + 30 days = eligible for hard delete
    hardDeleteEligibleAt: timestamp("hard_delete_eligible_at", { withTimezone: true }),
    
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("file_name_idx").on(table.name),
    index("file_organization_idx").on(table.organizationId),
    index("file_directory_organization_idx").on(table.directoryId, table.organizationId),
    index("file_is_removed_idx").on(table.isRemoved),
    index("file_content_hash_idx").on(table.contentHash),
    index("file_created_at_idx").on(table.createdAt),
    index("file_hard_delete_eligible_idx").on(table.hardDeleteEligibleAt),
    unique("file_unique_name_directory_org").on(table.name, table.directoryId, table.organizationId),
  ]
);

export const fileRelations = relations(files, ({ one, many }) => ({
  directory: one(directories, {
    fields: [files.directoryId],
    references: [directories.id],
  }),
  organization: one(organization, {
    fields: [files.organizationId],
    references: [organization.id],
  }),
  createdByMember: one(member, {
    fields: [files.createdByMembershipId],
    references: [member.id],
    relationName: "file_created_by",
  }),
  removedByMember: one(member, {
    fields: [files.removedByMembershipId],
    references: [member.id],
    relationName: "file_removed_by",
  }),
  currentVersion: one(fileVersion, {
    fields: [files.currentVersionId],
    references: [fileVersion.id],
    relationName: "file_current_version",
  }),
  versions: many(fileVersion, {
    relationName: "file_versions",
  }),
}));

export const fileInsertSchema = createInsertSchema(files).required({
  name: true,
  key: true,
  organizationId: true,
});

export const fileSelectSchema = createSelectSchema(files);

// Export types
export type FileDto = typeof files.$inferSelect;
export type FileInsertDto = typeof files.$inferInsert;

export const directories = createTable(
  "directory",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    name: varchar("directory_name", { length: 256 }).notNull(),
    
    // Multi-tenancy
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    createdByMembershipId: text("created_by_membership_id")
      .references(() => member.id, { onDelete: "set null" }),
    
    // Hierarchy
    parentId: integer("parent_id"),
    depth: integer("depth").default(0).notNull(),
    path: text("path"), // Materialized path for faster tree operations
    
    // Size tracking (computed, not manually maintained)
    size: integer("size").default(0).notNull(),
    fileCount: integer("file_count").default(0).notNull(),
    
    // Soft delete - allows 30-day restoration period
    isRemoved: boolean("is_removed").default(false).notNull(),
    removedAt: timestamp("removed_at", { withTimezone: true }),
    removedByMembershipId: text("removed_by_membership_id")
      .references(() => member.id, { onDelete: "set null" }),
    // Computed field: removedAt + 30 days = eligible for hard delete
    hardDeleteEligibleAt: timestamp("hard_delete_eligible_at", { withTimezone: true }),
    
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("directory_name_idx").on(table.name),
    index("directory_organization_idx").on(table.organizationId),
    index("directory_parent_organization_idx").on(table.parentId, table.organizationId),
    unique("directory_unique_name_parent_org").on(table.name, table.parentId, table.organizationId),
    index("directory_depth_idx").on(table.depth),
    index("directory_path_idx").on(table.path),
    index("directory_is_removed_idx").on(table.isRemoved),
    index("directory_hard_delete_eligible_idx").on(table.hardDeleteEligibleAt),
  ]
);

export const directoryRelations = relations(directories, ({ one, many }) => ({
  files: many(files),
  organization: one(organization, {
    fields: [directories.organizationId],
    references: [organization.id],
  }),
  createdByMember: one(member, {
    fields: [directories.createdByMembershipId],
    references: [member.id],
    relationName: "directory_created_by",
  }),
  removedByMember: one(member, {
    fields: [directories.removedByMembershipId],
    references: [member.id],
    relationName: "directory_removed_by",
  }),
  parent: one(directories, {
    fields: [directories.parentId],
    references: [directories.id],
    relationName: "directory_to_parent",
  }),
  children: many(directories, {
    relationName: "directory_to_parent",
  }),
}));

export const directoryInsertSchema = createInsertSchema(directories).required({
  name: true,
  organizationId: true,
});

export const directorySelectSchema = createSelectSchema(directories);

// Export types
export type DirectoryDto = typeof directories.$inferSelect;
export type DirectoryInsertDto = typeof directories.$inferInsert;

export const fileVersion = createTable(
  "file_version",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    
    // File reference
    fileId: integer("file_id")
      .references(() => files.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      })
      .notNull(),
    
    // Version info
    version: integer("version").notNull(),
    isLatest: boolean("is_latest").default(false).notNull(),
    
    // File details
    mimeType: varchar("mime_type", { length: 256 }).notNull(),
    size: integer("size").notNull(),
    contentHash: varchar("content_hash", { length: 64 }).notNull(),
    
    // Storage info
    storageKey: varchar("storage_key", { length: 512 }).notNull(),
    storageProvider: varchar("storage_provider", { length: 50 }).default("local").notNull(),
    
    // Multi-tenancy
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    createdByMembershipId: text("created_by_membership_id")
      .references(() => member.id, { onDelete: "set null" }),
    
    // Metadata
    metadata: json("metadata").default({}),
    
    // Cleanup tracking
    retentionPolicy: varchar("retention_policy", { length: 50 }).default("default"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("file_version_file_id_idx").on(table.fileId),
    index("file_version_organization_idx").on(table.organizationId),
    index("file_version_created_at_idx").on(table.createdAt),
    index("file_version_content_hash_idx").on(table.contentHash),
    index("file_version_is_latest_idx").on(table.isLatest),
    index("file_version_expires_at_idx").on(table.expiresAt),
    unique("file_version_unique_version_file").on(table.fileId, table.version),
    // Note: Partial unique constraint for latest versions handled at application level
  ]
);

export const fileVersionRelations = relations(fileVersion, ({ one }) => ({
  file: one(files, {
    fields: [fileVersion.fileId],
    references: [files.id],
    relationName: "file_versions",
  }),
  organization: one(organization, {
    fields: [fileVersion.organizationId],
    references: [organization.id],
  }),
  createdByMember: one(member, {
    fields: [fileVersion.createdByMembershipId],
    references: [member.id],
  }),
}));

export const fileVersionInsertSchema = createInsertSchema(fileVersion).required(
  {
    fileId: true,
    version: true,
    mimeType: true,
    size: true,
    contentHash: true,
    storageKey: true,
    organizationId: true,
  }
);

export const fileVersionSelectSchema = createSelectSchema(fileVersion);

// Export types
export type FileVersionDto = typeof fileVersion.$inferSelect;
export type FileVersionInsertDto = typeof fileVersion.$inferInsert;
