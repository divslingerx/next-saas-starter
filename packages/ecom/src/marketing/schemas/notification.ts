import { text, bigint, boolean, timestamp, jsonb, integer, index, pgTableCreator } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Create table with prefix
export const createTable = pgTableCreator((name) => `agency-app_${name}`);

// Notifications table - tracks all communications sent
export const notification = createTable("notification", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  // Recipient information
  recipientType: text("recipient_type").notNull(), // customer, admin, vendor
  recipientId: bigint("recipient_id", { mode: "number" }).notNull(),
  recipientEmail: text("recipient_email"),
  recipientPhone: text("recipient_phone"),
  
  // Notification type and channel
  type: text("type").notNull(), // order_confirmation, shipping_update, password_reset, etc.
  channel: text("channel").notNull(), // email, sms, push, in_app
  
  // Content
  subject: text("subject"),
  content: text("content").notNull(), // HTML for email, text for SMS
  preview: text("preview"), // Plain text preview
  
  // Template information
  templateId: text("template_id"),
  templateVariables: jsonb("template_variables").$type<Record<string, any>>().default({}),
  
  // Status tracking
  status: text("status").notNull().default("pending"), // pending, sending, sent, delivered, failed, bounced
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  
  // Error handling
  failureReason: text("failure_reason"),
  retryCount: integer("retry_count").default(0),
  lastRetryAt: timestamp("last_retry_at"),
  
  // Related entities
  orderId: bigint("order_id", { mode: "number" }),
  customerId: bigint("customer_id", { mode: "number" }),
  
  // Provider information
  provider: text("provider"), // sendgrid, twilio, resend, etc.
  providerMessageId: text("provider_message_id"),
  providerResponse: jsonb("provider_response").$type<Record<string, any>>(),
  
  // Metadata
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("notification_recipient_idx").on(table.recipientId),
  index("notification_type_idx").on(table.type),
  index("notification_channel_idx").on(table.channel),
  index("notification_status_idx").on(table.status),
  index("notification_created_idx").on(table.createdAt),
  index("notification_order_idx").on(table.orderId),
  index("notification_customer_idx").on(table.customerId),
]);

// Notification templates
export const notificationTemplate = createTable("notification_template", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  // Template identification
  code: text("code").unique().notNull(), // order_confirmation_email, shipping_sms, etc.
  name: text("name").notNull(),
  description: text("description"),
  
  // Template type
  type: text("type").notNull(), // order, customer, marketing, system
  channel: text("channel").notNull(), // email, sms, push
  
  // Content
  subject: text("subject"), // For email
  content: text("content").notNull(), // Liquid/Handlebars template
  
  // Settings
  active: boolean("active").default(true),
  isDefault: boolean("is_default").default(false), // System default template
  
  // Variables schema
  variableSchema: jsonb("variable_schema").$type<TemplateVariable[]>().default([]),
  
  // Metadata
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("notification_template_code_idx").on(table.code),
  index("notification_template_type_idx").on(table.type),
  index("notification_template_channel_idx").on(table.channel),
  index("notification_template_active_idx").on(table.active),
]);

// Communication preferences per customer
export const communicationPreference = createTable("communication_preference", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  // Customer reference
  customerId: bigint("customer_id", { mode: "number" }).notNull().unique(),
  
  // Channel preferences
  emailEnabled: boolean("email_enabled").default(true),
  smsEnabled: boolean("sms_enabled").default(false),
  pushEnabled: boolean("push_enabled").default(false),
  
  // Type preferences
  orderUpdates: boolean("order_updates").default(true),
  shippingUpdates: boolean("shipping_updates").default(true),
  marketingEmails: boolean("marketing_emails").default(false),
  productUpdates: boolean("product_updates").default(false),
  
  // Frequency settings
  digestFrequency: text("digest_frequency"), // immediate, daily, weekly
  quietHoursStart: text("quiet_hours_start"), // "22:00"
  quietHoursEnd: text("quiet_hours_end"), // "08:00"
  timezone: text("timezone"),
  
  // Language preference
  preferredLanguage: text("preferred_language").default("en"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("communication_preference_customer_idx").on(table.customerId),
]);

// Type definitions
interface TemplateVariable {
  name: string;
  type: string; // string, number, boolean, object, array
  required: boolean;
  description?: string;
  defaultValue?: any;
}

// Create Zod schemas for validation
const templateVariableSchema = z.object({
  name: z.string(),
  type: z.string(),
  required: z.boolean(),
  description: z.string().optional(),
  defaultValue: z.any().optional(),
});

export const insertNotificationSchema = createInsertSchema(notification, {
  recipientType: z.enum(["customer", "admin", "vendor"]),
  channel: z.enum(["email", "sms", "push", "in_app"]),
  status: z.enum(["pending", "sending", "sent", "delivered", "failed", "bounced"]).optional(),
  templateVariables: z.record(z.any()).optional(),
  providerResponse: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
});
export const selectNotificationSchema = createSelectSchema(notification);

export const insertNotificationTemplateSchema = createInsertSchema(notificationTemplate, {
  type: z.enum(["order", "customer", "marketing", "system"]),
  channel: z.enum(["email", "sms", "push"]),
  variableSchema: z.array(templateVariableSchema).optional(),
  metadata: z.record(z.any()).optional(),
});
export const selectNotificationTemplateSchema = createSelectSchema(notificationTemplate);

export const insertCommunicationPreferenceSchema = createInsertSchema(communicationPreference, {
  digestFrequency: z.enum(["immediate", "daily", "weekly"]).optional(),
});
export const selectCommunicationPreferenceSchema = createSelectSchema(communicationPreference);

// Type exports
export type Notification = typeof notification.$inferSelect;
export type NewNotification = typeof notification.$inferInsert;
export type NotificationTemplate = typeof notificationTemplate.$inferSelect;
export type NewNotificationTemplate = typeof notificationTemplate.$inferInsert;
export type CommunicationPreference = typeof communicationPreference.$inferSelect;
export type NewCommunicationPreference = typeof communicationPreference.$inferInsert;