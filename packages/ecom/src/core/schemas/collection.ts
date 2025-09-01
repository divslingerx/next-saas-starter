import {
  bigint,
  boolean,
  index,
  integer,
  pgTableCreator,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { createTable } from "../../utils";

// Collection table
export const collection = createTable(
  "collection",
  {
    id: bigint("id", { mode: "number" }).primaryKey(),

    // Basic information
    title: text("title").notNull(),
    handle: text("handle").unique().notNull(),
    description: text("description"),
    bodyHtml: text("body_html"),
    type: text("type"),

    // Visual
    imageUrl: text("image_url"),

    // Organization
    position: integer("position").default(0),
    sortOrder: text("sort_order"),
    templateSuffix: text("template_suffix"),
    disjunctive: boolean("disjunctive").default(false),

    // SEO
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),

    // Publishing
    publishedAt: timestamp("published_at"),
    publishedScope: text("published_scope").default("web"),

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("collection_handle_idx").on(table.handle),
    index("collection_published_at_idx").on(table.publishedAt),
    index("collection_position_idx").on(table.position),
  ],
);

// Create Zod schemas for validation
export const insertCollectionSchema = createInsertSchema(collection, {
  disjunctive: z.boolean().optional(),
});
export const selectCollectionSchema = createSelectSchema(collection);

// Type exports
export type Collection = typeof collection.$inferSelect;
export type NewCollection = typeof collection.$inferInsert;
