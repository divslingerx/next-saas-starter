import { text, bigint, boolean, timestamp, index, pgTableCreator } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Create table with prefix
export const createTable = pgTableCreator((name) => `agency-app_${name}`);

// Collection table
export const collection = createTable("collection", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  // Basic information
  title: text("title"),
  handle: text("handle"),
  bodyHtml: text("body_html"),
  type: text("type"),
  
  // Settings
  sortOrder: text("sort_order"),
  templateSuffix: text("template_suffix"),
  disjunctive: boolean("disjunctive"),
  
  // Publishing
  publishedAt: timestamp("published_at"),
  publishedScope: text("published_scope"),
  
  // Timestamps
  updatedAt: timestamp("updated_at"),
}, (table) => [
  index("collection_handle_idx").on(table.handle),
  index("collection_published_at_idx").on(table.publishedAt),
]);

// Create Zod schemas for validation
export const insertCollectionSchema = createInsertSchema(collection, {
  disjunctive: z.boolean().optional(),
});
export const selectCollectionSchema = createSelectSchema(collection);

// Type exports
export type Collection = typeof collection.$inferSelect;
export type NewCollection = typeof collection.$inferInsert;