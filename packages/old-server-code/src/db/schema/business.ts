/**
 * Business Operations Schema
 * Tables for invoicing, time tracking, and financial management
 */

import { relations } from "drizzle-orm";
import {
  boolean,
  decimal,
  index,
  integer,
  json,
  text,
  timestamp,
  varchar,
  pgEnum,
  date,
  unique,
} from "drizzle-orm/pg-core";
import { createTable } from "../utils";
import { organization } from "./auth";
import { clients, projects } from "./core";

// ==========================================
// Enums
// ==========================================

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "sent",
  "viewed",
  "paid",
  "partial",
  "overdue",
  "cancelled",
  "refunded",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "bank_transfer",
  "credit_card",
  "paypal",
  "stripe",
  "cash",
  "check",
  "other",
]);

export const recurringFrequencyEnum = pgEnum("recurring_frequency", [
  "weekly",
  "biweekly",
  "monthly",
  "quarterly",
  "semiannual",
  "annual",
]);

// ==========================================
// Time Tracking
// ==========================================

/**
 * Time entries - Track work done on projects
 */
export const timeEntries = createTable(
  "time_entries",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    organizationId: varchar("organization_id", { length: 15 })
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    
    // What was worked on
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    taskId: integer("task_id"), // Optional, for future task tracking
    
    // Who and when
    userId: varchar("user_id", { length: 15 }).notNull(), // References auth.user
    date: date("date").notNull(),
    
    // Time details
    hours: decimal("hours", { precision: 5, scale: 2 }).notNull(),
    description: text("description"),
    
    // Billing
    billable: boolean("billable").notNull().default(true),
    billed: boolean("billed").notNull().default(false),
    hourlyRate: decimal("hourly_rate", { precision: 8, scale: 2 }),
    invoiceItemId: integer("invoice_item_id"), // Link to invoice line item when billed
    
    // Metadata
    tags: text("tags").array().default([]),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  },
  (table) => [
    index("time_entries_org_id_idx").on(table.organizationId),
    index("time_entries_project_id_idx").on(table.projectId),
    index("time_entries_user_id_idx").on(table.userId),
    index("time_entries_date_idx").on(table.date),
    index("time_entries_billable_idx").on(table.billable, table.billed),
  ]
);

// ==========================================
// Invoicing
// ==========================================

/**
 * Invoices - Main invoice records
 */
export const invoices = createTable(
  "invoices",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    organizationId: varchar("organization_id", { length: 15 })
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    
    // Invoice details
    invoiceNumber: varchar("invoice_number", { length: 50 }).notNull(),
    status: invoiceStatusEnum("status").notNull().default("draft"),
    
    // Client and project
    clientId: integer("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "restrict" }),
    projectId: integer("project_id")
      .references(() => projects.id, { onDelete: "set null" }),
    
    // Dates
    issueDate: date("issue_date").notNull(),
    dueDate: date("due_date").notNull(),
    sentDate: timestamp("sent_date"),
    viewedDate: timestamp("viewed_date"),
    paidDate: timestamp("paid_date"),
    
    // Amounts (stored in cents to avoid decimal issues)
    subtotal: integer("subtotal").notNull(), // in cents
    taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("0"),
    taxAmount: integer("tax_amount").notNull().default(0), // in cents
    discountAmount: integer("discount_amount").notNull().default(0), // in cents
    total: integer("total").notNull(), // in cents
    paidAmount: integer("paid_amount").notNull().default(0), // in cents
    currency: varchar("currency", { length: 3 }).notNull().default("USD"),
    
    // Content
    notes: text("notes"), // Invoice notes
    termsAndConditions: text("terms_and_conditions"),
    
    // Payment details
    paymentMethod: paymentMethodEnum("payment_method"),
    paymentReference: text("payment_reference"), // Check number, transaction ID, etc.
    
    // Reminders
    reminderCount: integer("reminder_count").notNull().default(0),
    lastReminderAt: timestamp("last_reminder_at"),
    nextReminderAt: timestamp("next_reminder_at"),
    
    // External references
    stripeInvoiceId: varchar("stripe_invoice_id", { length: 100 }),
    quickbooksInvoiceId: varchar("quickbooks_invoice_id", { length: 100 }),
    
    // Metadata
    custom: json("custom").$type<Record<string, any>>().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  },
  (table) => [
    index("invoices_org_id_idx").on(table.organizationId),
    index("invoices_client_id_idx").on(table.clientId),
    index("invoices_project_id_idx").on(table.projectId),
    index("invoices_status_idx").on(table.status),
    index("invoices_due_date_idx").on(table.dueDate),
    unique("invoices_number_unique_idx").on(table.organizationId, table.invoiceNumber),
  ]
);

/**
 * Invoice line items
 */
export const invoiceItems = createTable(
  "invoice_items",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    invoiceId: integer("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    
    // Item details
    description: text("description").notNull(),
    quantity: decimal("quantity", { precision: 8, scale: 2 }).notNull().default("1"),
    rate: integer("rate").notNull(), // in cents
    amount: integer("amount").notNull(), // in cents (quantity * rate)
    
    // Optional tax override for this item
    taxRate: decimal("tax_rate", { precision: 5, scale: 2 }),
    taxAmount: integer("tax_amount"), // in cents
    
    // Linking to time entries
    timeEntryIds: integer("time_entry_ids").array().default([]),
    
    // Metadata
    sortOrder: integer("sort_order").notNull().default(0),
    category: varchar("category", { length: 50 }), // 'service', 'product', 'expense', etc.
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("invoice_items_invoice_id_idx").on(table.invoiceId),
    index("invoice_items_sort_order_idx").on(table.sortOrder),
  ]
);

/**
 * Recurring invoices - Templates for automatic invoice generation
 */
export const recurringInvoices = createTable(
  "recurring_invoices",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    organizationId: varchar("organization_id", { length: 15 })
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    
    // Template info
    name: varchar("name", { length: 255 }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
    
    // Client and project
    clientId: integer("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "restrict" }),
    projectId: integer("project_id")
      .references(() => projects.id, { onDelete: "set null" }),
    
    // Schedule
    frequency: recurringFrequencyEnum("frequency").notNull(),
    nextDate: date("next_date").notNull(),
    endDate: date("end_date"), // Optional end date
    
    // Template data
    template: json("template").$type<{
      items: Array<{
        description: string;
        quantity: number;
        rate: number;
        taxRate?: number;
      }>;
      notes?: string;
      termsAndConditions?: string;
      paymentTermsDays: number;
    }>().notNull(),
    
    // Generation tracking
    lastGeneratedAt: timestamp("last_generated_at"),
    generationCount: integer("generation_count").notNull().default(0),
    
    // Metadata
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  },
  (table) => [
    index("recurring_invoices_org_id_idx").on(table.organizationId),
    index("recurring_invoices_client_id_idx").on(table.clientId),
    index("recurring_invoices_next_date_idx").on(table.nextDate),
    index("recurring_invoices_active_idx").on(table.isActive),
  ]
);

/**
 * Expenses - Track business expenses
 */
export const expenses = createTable(
  "expenses",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    organizationId: varchar("organization_id", { length: 15 })
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    
    // Expense details
    date: date("date").notNull(),
    amount: integer("amount").notNull(), // in cents
    currency: varchar("currency", { length: 3 }).notNull().default("USD"),
    description: text("description").notNull(),
    category: varchar("category", { length: 50 }).notNull(),
    
    // Associations
    clientId: integer("client_id")
      .references(() => clients.id, { onDelete: "set null" }),
    projectId: integer("project_id")
      .references(() => projects.id, { onDelete: "set null" }),
    
    // Reimbursement
    billable: boolean("billable").notNull().default(false),
    billed: boolean("billed").notNull().default(false),
    invoiceItemId: integer("invoice_item_id"),
    
    // Receipt
    receiptUrl: text("receipt_url"),
    
    // Metadata
    tags: text("tags").array().default([]),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  },
  (table) => [
    index("expenses_org_id_idx").on(table.organizationId),
    index("expenses_date_idx").on(table.date),
    index("expenses_client_id_idx").on(table.clientId),
    index("expenses_project_id_idx").on(table.projectId),
    index("expenses_billable_idx").on(table.billable, table.billed),
  ]
);

/**
 * Payment records - Track payments received
 */
export const payments = createTable(
  "payments",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    organizationId: varchar("organization_id", { length: 15 })
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    
    // Payment details
    invoiceId: integer("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "restrict" }),
    
    amount: integer("amount").notNull(), // in cents
    currency: varchar("currency", { length: 3 }).notNull().default("USD"),
    paymentDate: date("payment_date").notNull(),
    paymentMethod: paymentMethodEnum("payment_method").notNull(),
    
    // Reference info
    reference: text("reference"), // Check number, transaction ID, etc.
    notes: text("notes"),
    
    // External references
    stripePaymentId: varchar("stripe_payment_id", { length: 100 }),
    
    // Metadata
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  },
  (table) => [
    index("payments_org_id_idx").on(table.organizationId),
    index("payments_invoice_id_idx").on(table.invoiceId),
    index("payments_date_idx").on(table.paymentDate),
  ]
);

// ==========================================
// Relations
// ==========================================

export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
  organization: one(organization, {
    fields: [timeEntries.organizationId],
    references: [organization.id],
  }),
  project: one(projects, {
    fields: [timeEntries.projectId],
    references: [projects.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  organization: one(organization, {
    fields: [invoices.organizationId],
    references: [organization.id],
  }),
  client: one(clients, {
    fields: [invoices.clientId],
    references: [clients.id],
  }),
  project: one(projects, {
    fields: [invoices.projectId],
    references: [projects.id],
  }),
  items: many(invoiceItems),
  payments: many(payments),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
}));

export const recurringInvoicesRelations = relations(recurringInvoices, ({ one }) => ({
  organization: one(organization, {
    fields: [recurringInvoices.organizationId],
    references: [organization.id],
  }),
  client: one(clients, {
    fields: [recurringInvoices.clientId],
    references: [clients.id],
  }),
  project: one(projects, {
    fields: [recurringInvoices.projectId],
    references: [projects.id],
  }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  organization: one(organization, {
    fields: [expenses.organizationId],
    references: [organization.id],
  }),
  client: one(clients, {
    fields: [expenses.clientId],
    references: [clients.id],
  }),
  project: one(projects, {
    fields: [expenses.projectId],
    references: [projects.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  organization: one(organization, {
    fields: [payments.organizationId],
    references: [organization.id],
  }),
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
}));

// ==========================================
// Type exports
// ==========================================

export type TimeEntry = typeof timeEntries.$inferSelect;
export type NewTimeEntry = typeof timeEntries.$inferInsert;
export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;
export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type NewInvoiceItem = typeof invoiceItems.$inferInsert;
export type RecurringInvoice = typeof recurringInvoices.$inferSelect;
export type NewRecurringInvoice = typeof recurringInvoices.$inferInsert;
export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;