/**
 * Invoices Schema
 * Billing and payment tracking - essential for freelancer/agency cash flow
 */

import { pgTable, serial, varchar, timestamp, integer, decimal, date, boolean, text, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organization } from '../auth';
import { record as platformObjects } from '../platform/core';
import { projects } from './projects';
import { companies } from './companies';
import { contacts } from './contacts';

export const invoices = pgTable('invoices', {
  id: serial('id').primaryKey(),
  organizationId: varchar('organization_id', { length: 255 }).notNull().references(() => organization.id, { onDelete: 'cascade' }),
  objectId: integer('object_id').notNull().references(() => platformObjects.id, { onDelete: 'cascade' }),
  
  // Primary relationships (FK for performance)
  projectId: integer('project_id'), // FK to projects - what work this bills for
  billingCompanyId: integer('billing_company_id').notNull(), // FK to companies - who pays
  billingContactId: integer('billing_contact_id'), // FK to contacts - who receives the invoice
  
  // Invoice identification
  invoiceNumber: varchar('invoice_number', { length: 50 }).notNull(), // "INV-2024-001"
  poNumber: varchar('po_number', { length: 100 }), // Client's purchase order number
  
  // Financial details
  subtotal: decimal('subtotal', { precision: 12, scale: 2 }).notNull(),
  taxAmount: decimal('tax_amount', { precision: 12, scale: 2 }).default('0'),
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('USD'),
  
  // Payment terms and status
  status: varchar('status', { length: 50 }).notNull().default('draft'),
  // draft, sent, viewed, partial_payment, paid, overdue, cancelled, refunded
  paymentTerms: varchar('payment_terms', { length: 50 }).default('net_30'), // net_15, net_30, due_on_receipt
  
  // Important dates
  invoiceDate: date('invoice_date').notNull(),
  dueDate: date('due_date').notNull(),
  sentDate: date('sent_date'),
  viewedDate: date('viewed_date'), // When client first viewed
  paidDate: date('paid_date'),
  
  // Payment tracking
  amountPaid: decimal('amount_paid', { precision: 12, scale: 2 }).default('0'),
  paymentMethod: varchar('payment_method', { length: 50 }), // stripe, bank_transfer, check, etc.
  paymentReference: varchar('payment_reference', { length: 100 }), // Transaction ID, check number, etc.
  
  // Invoice content
  description: text('description'), // Brief description of work
  notes: text('notes'), // Internal notes
  publicNotes: text('public_notes'), // Notes visible to client
  
  // Recurring billing (for retainers)
  isRecurring: boolean('is_recurring').default(false),
  recurringFrequency: varchar('recurring_frequency', { length: 20 }), // monthly, quarterly, annual
  nextInvoiceDate: date('next_invoice_date'),
  
  // Late payment handling
  lateFee: decimal('late_fee', { precision: 10, scale: 2 }).default('0'),
  remindersSent: integer('reminders_sent').default(0),
  lastReminderDate: date('last_reminder_date'),
  
  // Integration with external systems
  stripeInvoiceId: varchar('stripe_invoice_id', { length: 100 }),
  quickbooksId: varchar('quickbooks_id', { length: 100 }),
  
  // Tracking
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  // Critical business indexes
  orgStatusIdx: index().on(table.organizationId, table.status),
  invoiceNumberIdx: index().on(table.organizationId, table.invoiceNumber),
  
  // Cash flow tracking
  dueDateIdx: index().on(table.dueDate),
  statusDueDateIdx: index().on(table.status, table.dueDate),
  paidDateIdx: index().on(table.paidDate),
  
  // Primary relationship indexes
  billingCompanyIdx: index().on(table.billingCompanyId),
  projectIdx: index().on(table.projectId),
  billingContactIdx: index().on(table.billingContactId),
  
  // Financial reporting
  invoiceDateIdx: index().on(table.invoiceDate),
  totalAmountIdx: index().on(table.totalAmount),
  currencyIdx: index().on(table.currency),
  
  // Payment processing
  stripeIdx: index().on(table.stripeInvoiceId),
  paymentReferenceIdx: index().on(table.paymentReference),
  
  // Recurring billing
  recurringIdx: index().on(table.isRecurring, table.nextInvoiceDate),
  
  updatedAtIdx: index().on(table.updatedAt),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  organization: one(organization, {
    fields: [invoices.organizationId],
    references: [organization.id],
  }),
  platformObject: one(platformObjects, {
    fields: [invoices.objectId],
    references: [platformObjects.id],
  }),
  // Primary business relationships
  project: one(projects, {
    fields: [invoices.projectId],
    references: [projects.id],
  }),
  billingCompany: one(companies, {
    fields: [invoices.billingCompanyId],
    references: [companies.id],
  }),
  billingContact: one(contacts, {
    fields: [invoices.billingContactId],
    references: [contacts.id],
  }),
}));