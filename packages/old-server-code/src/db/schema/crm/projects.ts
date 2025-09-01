/**
 * Projects Schema
 * Active work engagements - the deliverable work you do for clients
 * Critical for freelancers and agencies to track project delivery
 */

import { pgTable, serial, varchar, timestamp, integer, decimal, date, boolean, text, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organization } from '../auth';
import { record as platformObjects } from '../platform/core';
import { deals } from './deals';
import { companies } from './companies';
import { contacts } from './contacts';
import { invoices } from './invoices';

export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  organizationId: varchar('organization_id', { length: 255 }).notNull().references(() => organization.id, { onDelete: 'cascade' }),
  objectId: integer('object_id').notNull().references(() => platformObjects.id, { onDelete: 'cascade' }),
  
  // Primary relationships (FK for performance)
  sourceDealId: integer('source_deal_id'), // FK to deals - originated from this deal
  clientCompanyId: integer('client_company_id').notNull(), // FK to companies - client
  primaryContactId: integer('primary_contact_id'), // FK to contacts - main point of contact
  
  // Project identification
  name: varchar('name', { length: 255 }).notNull(),
  projectNumber: varchar('project_number', { length: 50 }), // Internal reference like "PRJ-2024-001"
  
  // Project details
  description: text('description'),
  serviceType: varchar('service_type', { length: 100 }).notNull(), // web_development, branding, marketing, etc.
  projectType: varchar('project_type', { length: 100 }), // fixed_price, hourly, retainer, equity
  
  // Financial tracking
  totalBudget: decimal('total_budget', { precision: 12, scale: 2 }),
  hourlyRate: decimal('hourly_rate', { precision: 8, scale: 2 }),
  currency: varchar('currency', { length: 3 }).default('USD'),
  
  // Timeline
  status: varchar('status', { length: 50 }).notNull().default('planning'),
  // planning, in_progress, review, completed, on_hold, cancelled
  startDate: date('start_date'),
  endDate: date('end_date'),
  actualStartDate: date('actual_start_date'),
  actualEndDate: date('actual_end_date'),
  
  // Project management
  priority: varchar('priority', { length: 20 }).default('medium'), // low, medium, high, urgent
  assignedToUserId: varchar('assigned_to_user_id', { length: 255 }),
  
  // Key deliverables tracking
  deliverables: text('deliverables'), // JSON or text list of key deliverables
  milestonesCompleted: integer('milestones_completed').default(0),
  totalMilestones: integer('total_milestones').default(0),
  
  // Client communication
  lastClientUpdate: date('last_client_update'),
  nextCheckIn: date('next_check_in'),
  
  // Quality and satisfaction
  clientSatisfactionScore: integer('client_satisfaction_score'), // 1-10 rating
  isRecurring: boolean('is_recurring').default(false),
  
  // Tracking
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  // Performance indexes for common views
  orgStatusIdx: index().on(table.organizationId, table.status),
  clientCompanyIdx: index().on(table.clientCompanyId),
  assignedToIdx: index().on(table.assignedToUserId),
  
  // Timeline indexes
  startDateIdx: index().on(table.startDate),
  endDateIdx: index().on(table.endDate),
  
  // Project management indexes
  serviceTypeIdx: index().on(table.serviceType),
  priorityIdx: index().on(table.priority),
  statusStartDateIdx: index().on(table.status, table.startDate),
  
  // Primary relationship indexes
  sourceDealIdx: index().on(table.sourceDealId),
  primaryContactIdx: index().on(table.primaryContactId),
  
  // Reporting indexes
  projectTypeIdx: index().on(table.projectType),
  satisfactionIdx: index().on(table.clientSatisfactionScore),
  
  updatedAtIdx: index().on(table.updatedAt),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  organization: one(organization, {
    fields: [projects.organizationId],
    references: [organization.id],
  }),
  platformObject: one(platformObjects, {
    fields: [projects.objectId],
    references: [platformObjects.id],
  }),
  // Primary business relationships
  sourceDeal: one(deals, {
    fields: [projects.sourceDealId],
    references: [deals.id],
  }),
  clientCompany: one(companies, {
    fields: [projects.clientCompanyId],
    references: [companies.id],
  }),
  primaryContact: one(contacts, {
    fields: [projects.primaryContactId],
    references: [contacts.id],
  }),
  // A project generates invoices
  invoices: many(invoices),
}));