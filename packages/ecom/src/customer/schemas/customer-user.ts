import { text, bigint, boolean, timestamp, jsonb, index, pgTableCreator } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Create table with prefix
export const createTable = pgTableCreator((name) => `agency-app_${name}`);

// Customer Users - Links Better Auth users to B2B customer accounts
export const customerUser = createTable("customer_user", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  // References
  customerId: bigint("customer_id", { mode: "number" }).notNull(), // B2B company customer
  userId: text("user_id").notNull(), // Better Auth user ID
  
  // User role within the company
  role: text("role").notNull().default("buyer"), // admin, buyer, viewer, approver
  
  // Permissions within company context
  permissions: jsonb("permissions").$type<string[]>().default([]),
  
  // Status
  status: text("status").notNull().default("active"), // active, invited, suspended
  invitedBy: bigint("invited_by", { mode: "number" }), // Who invited this user
  invitedAt: timestamp("invited_at"),
  acceptedAt: timestamp("accepted_at"),
  
  // Metadata
  title: text("title"), // Job title
  department: text("department"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastActiveAt: timestamp("last_active_at"),
}, (table) => [
  index("customer_user_customer_idx").on(table.customerId),
  index("customer_user_user_idx").on(table.userId),
  index("customer_user_status_idx").on(table.status),
  index("customer_user_unique_idx").on(table.customerId, table.userId).unique(),
]);

// B2B Invitations - Track pending invitations
export const customerInvitation = createTable("customer_invitation", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  // Invitation details
  customerId: bigint("customer_id", { mode: "number" }).notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("buyer"),
  
  // Invitation metadata
  invitedBy: bigint("invited_by", { mode: "number" }).notNull(),
  invitationToken: text("invitation_token").unique().notNull(),
  message: text("message"), // Personal message from inviter
  
  // Status
  status: text("status").notNull().default("pending"), // pending, accepted, expired, cancelled
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  acceptedUserId: text("accepted_user_id"), // Better Auth user who accepted
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("customer_invitation_customer_idx").on(table.customerId),
  index("customer_invitation_email_idx").on(table.email),
  index("customer_invitation_token_idx").on(table.invitationToken),
  index("customer_invitation_status_idx").on(table.status),
]);

// Customer role definitions
export const customerRole = createTable("customer_role", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  // Role identification
  customerId: bigint("customer_id", { mode: "number" }).notNull(),
  name: text("name").notNull(), // Custom role name
  code: text("code").notNull(), // Unique within customer
  description: text("description"),
  
  // Permissions
  permissions: jsonb("permissions").$type<CustomerPermission[]>().default([]),
  
  // Settings
  isDefault: boolean("is_default").default(false), // Default role for new users
  canBeDeleted: boolean("can_be_deleted").default(true), // System roles can't be deleted
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("customer_role_customer_idx").on(table.customerId),
  index("customer_role_code_idx").on(table.customerId, table.code).unique(),
]);

// Type definitions
interface CustomerPermission {
  resource: 'orders' | 'users' | 'settings' | 'reports' | 'products';
  actions: ('view' | 'create' | 'edit' | 'delete' | 'approve')[];
  constraints?: {
    ownOnly?: boolean; // Can only see their own
    maxAmount?: number; // Max order amount they can approve
    departments?: string[]; // Limited to specific departments
  };
}

// Predefined B2B roles
export const DEFAULT_B2B_ROLES = {
  admin: {
    name: 'Administrator',
    code: 'admin',
    permissions: [
      { resource: 'orders', actions: ['view', 'create', 'edit', 'delete', 'approve'] },
      { resource: 'users', actions: ['view', 'create', 'edit', 'delete'] },
      { resource: 'settings', actions: ['view', 'edit'] },
      { resource: 'reports', actions: ['view'] },
    ],
  },
  buyer: {
    name: 'Buyer',
    code: 'buyer',
    permissions: [
      { resource: 'orders', actions: ['view', 'create'], constraints: { ownOnly: true } },
      { resource: 'products', actions: ['view'] },
    ],
  },
  approver: {
    name: 'Approver',
    code: 'approver',
    permissions: [
      { resource: 'orders', actions: ['view', 'approve'] },
      { resource: 'reports', actions: ['view'] },
    ],
  },
  viewer: {
    name: 'Viewer',
    code: 'viewer',
    permissions: [
      { resource: 'orders', actions: ['view'] },
      { resource: 'products', actions: ['view'] },
    ],
  },
};

// Create Zod schemas for validation
export const insertCustomerUserSchema = createInsertSchema(customerUser, {
  role: z.enum(['admin', 'buyer', 'viewer', 'approver', 'custom']),
  status: z.enum(['active', 'invited', 'suspended']),
  permissions: z.array(z.string()).optional(),
});
export const selectCustomerUserSchema = createSelectSchema(customerUser);

export const insertCustomerInvitationSchema = createInsertSchema(customerInvitation, {
  email: z.string().email(),
  role: z.enum(['admin', 'buyer', 'viewer', 'approver']),
  status: z.enum(['pending', 'accepted', 'expired', 'cancelled']),
});
export const selectCustomerInvitationSchema = createSelectSchema(customerInvitation);

const customerPermissionSchema = z.object({
  resource: z.enum(['orders', 'users', 'settings', 'reports', 'products']),
  actions: z.array(z.enum(['view', 'create', 'edit', 'delete', 'approve'])),
  constraints: z.object({
    ownOnly: z.boolean().optional(),
    maxAmount: z.number().optional(),
    departments: z.array(z.string()).optional(),
  }).optional(),
});

export const insertCustomerRoleSchema = createInsertSchema(customerRole, {
  permissions: z.array(customerPermissionSchema).optional(),
});
export const selectCustomerRoleSchema = createSelectSchema(customerRole);

// Type exports
export type CustomerUser = typeof customerUser.$inferSelect;
export type NewCustomerUser = typeof customerUser.$inferInsert;
export type CustomerInvitation = typeof customerInvitation.$inferSelect;
export type NewCustomerInvitation = typeof customerInvitation.$inferInsert;
export type CustomerRole = typeof customerRole.$inferSelect;
export type NewCustomerRole = typeof customerRole.$inferInsert;