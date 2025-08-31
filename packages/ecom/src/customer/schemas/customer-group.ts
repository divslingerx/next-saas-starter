import { text, bigint, boolean, timestamp, jsonb, integer, index, pgTableCreator } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Create table with prefix
export const createTable = pgTableCreator((name) => `agency-app_${name}`);

// Customer groups/segments
export const customerGroup = createTable("customer_group", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  // Basic information
  name: text("name").notNull(),
  description: text("description"),
  code: text("code").unique(), // Internal identifier (e.g., "vip", "wholesale")
  
  // Group type
  type: text("type").notNull(), // manual, automatic, smart
  
  // Visual
  color: text("color"), // Hex color for UI display
  icon: text("icon"), // Icon identifier
  
  // Automatic group rules (for smart segments)
  rules: jsonb("rules").$type<GroupRule[]>().default([]),
  matchType: text("match_type").default("all"), // all, any
  
  // Settings
  active: boolean("active").default(true),
  priority: integer("priority").default(0), // For overlapping groups
  
  // Benefits/features
  discountPercentage: integer("discount_percentage"),
  freeShippingEnabled: boolean("free_shipping_enabled").default(false),
  taxExempt: boolean("tax_exempt").default(false),
  
  // Metadata
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  
  // Statistics (updated periodically)
  memberCount: integer("member_count").default(0),
  lastCalculatedAt: timestamp("last_calculated_at"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("customer_group_code_idx").on(table.code),
  index("customer_group_type_idx").on(table.type),
  index("customer_group_active_idx").on(table.active),
  index("customer_group_priority_idx").on(table.priority),
]);

// Customer group membership
export const customerGroupMember = createTable("customer_group_member", {
  customerId: bigint("customer_id", { mode: "number" }).notNull(),
  groupId: bigint("group_id", { mode: "number" }).notNull(),
  
  // Membership details
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"), // For time-limited memberships
  
  // Source
  addedBy: text("added_by").notNull(), // manual, automatic, import
  addedByUserId: bigint("added_by_user_id", { mode: "number" }),
  
  // Notes
  notes: text("notes"),
}, (table) => [
  index("customer_group_member_customer_idx").on(table.customerId),
  index("customer_group_member_group_idx").on(table.groupId),
  index("customer_group_member_expires_idx").on(table.expiresAt),
]);

// Customer tags (lightweight alternative to groups)
export const customerTag = createTable("customer_tag", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  // Tag information
  name: text("name").unique().notNull(),
  slug: text("slug").unique().notNull(),
  color: text("color"), // Hex color
  
  // Usage count
  usageCount: integer("usage_count").default(0),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("customer_tag_slug_idx").on(table.slug),
  index("customer_tag_name_idx").on(table.name),
]);

// Junction table for customer tags
export const customerToTag = createTable("customer_to_tag", {
  customerId: bigint("customer_id", { mode: "number" }).notNull(),
  tagId: bigint("tag_id", { mode: "number" }).notNull(),
  
  // Metadata
  addedAt: timestamp("added_at").defaultNow().notNull(),
  addedByUserId: bigint("added_by_user_id", { mode: "number" }),
}, (table) => [
  index("customer_to_tag_customer_idx").on(table.customerId),
  index("customer_to_tag_tag_idx").on(table.tagId),
]);

// Type definitions for group rules
interface GroupRule {
  field: string; // e.g., "total_spent", "order_count", "created_at"
  operator: string; // e.g., "greater_than", "equals", "contains"
  value: any; // The comparison value
}

// Create Zod schemas for validation
const groupRuleSchema = z.object({
  field: z.string(),
  operator: z.string(),
  value: z.any(),
});

export const insertCustomerGroupSchema = createInsertSchema(customerGroup, {
  type: z.enum(["manual", "automatic", "smart"]),
  matchType: z.enum(["all", "any"]).optional(),
  rules: z.array(groupRuleSchema).optional(),
  metadata: z.record(z.any()).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
});
export const selectCustomerGroupSchema = createSelectSchema(customerGroup);

export const insertCustomerGroupMemberSchema = createInsertSchema(customerGroupMember, {
  addedBy: z.enum(["manual", "automatic", "import"]),
});
export const selectCustomerGroupMemberSchema = createSelectSchema(customerGroupMember);

export const insertCustomerTagSchema = createInsertSchema(customerTag, {
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
});
export const selectCustomerTagSchema = createSelectSchema(customerTag);

// Type exports
export type CustomerGroup = typeof customerGroup.$inferSelect;
export type NewCustomerGroup = typeof customerGroup.$inferInsert;
export type CustomerGroupMember = typeof customerGroupMember.$inferSelect;
export type NewCustomerGroupMember = typeof customerGroupMember.$inferInsert;
export type CustomerTag = typeof customerTag.$inferSelect;
export type NewCustomerTag = typeof customerTag.$inferInsert;