/**
 * Deals Schema
 * Revenue opportunities - qualified leads that have potential to close
 */

import { pgTable, serial, varchar, timestamp, integer, decimal, date, boolean, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organization } from '../auth';
import { record as platformObjects } from '../platform/core';
import { leads } from './leads';
import { contacts } from './contacts';
import { companies } from './companies';
import { projects } from './projects';

export const deals = pgTable('deals', {
  id: serial('id').primaryKey(),
  organizationId: varchar('organization_id', { length: 255 }).notNull().references(() => organization.id, { onDelete: 'cascade' }),
  objectId: integer('object_id').notNull().references(() => platformObjects.id, { onDelete: 'cascade' }),
  
  // Primary relationships (FK for performance)
  sourceLeadId: integer('source_lead_id'), // FK to leads - where this deal originated  
  primaryContactId: integer('primary_contact_id').notNull(), // FK to contacts - decision maker
  primaryCompanyId: integer('primary_company_id').notNull(), // FK to companies - client
  
  // Deal identification
  name: varchar('name', { length: 255 }).notNull(), // "Website Redesign for Acme Corp"
  
  // Financial information
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('USD'),
  
  // Pipeline management
  stage: varchar('stage', { length: 50 }).notNull().default('qualification'), 
  // qualification, proposal, negotiation, closed_won, closed_lost
  probability: integer('probability').default(50), // % chance of closing (0-100)
  
  // Timeline
  closeDate: date('close_date'), // Expected or actual close date
  createdDate: date('created_date').defaultNow(),
  
  // Deal specifics for freelancers/agencies
  projectScope: varchar('project_scope', { length: 200 }), // Brief description
  serviceType: varchar('service_type', { length: 100 }), // web_dev, design, marketing, consulting
  deliverables: varchar('deliverables', { length: 500 }), // Key deliverables summary
  
  // Competition and positioning  
  competitors: varchar('competitors', { length: 200 }), // Who else is bidding
  differentiators: varchar('differentiators', { length: 300 }), // Our competitive advantages
  
  // Assignment and ownership
  assignedToUserId: varchar('assigned_to_user_id', { length: 255 }),
  
  // Deal outcome
  isWon: boolean('is_won'),
  lostReason: varchar('lost_reason', { length: 200 }), // If closed_lost, why?
  
  // Tracking
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  // Performance indexes for pipeline views
  orgStageIdx: index().on(table.organizationId, table.stage),
  assignedToIdx: index().on(table.assignedToUserId),
  closeDateIdx: index().on(table.closeDate),
  
  // Primary relationship indexes
  sourceLeadIdx: index().on(table.sourceLeadId),
  primaryContactIdx: index().on(table.primaryContactId),
  primaryCompanyIdx: index().on(table.primaryCompanyId),
  
  // Reporting indexes
  serviceTypeIdx: index().on(table.serviceType),
  probabilityIdx: index().on(table.probability),
  amountIdx: index().on(table.amount),
  
  // Pipeline sorting
  stageAmountIdx: index().on(table.stage, table.amount),
  closeDateAmountIdx: index().on(table.closeDate, table.amount),
  
  updatedAtIdx: index().on(table.updatedAt),
}));

export const dealsRelations = relations(deals, ({ one, many }) => ({
  organization: one(organization, {
    fields: [deals.organizationId],
    references: [organization.id],
  }),
  platformObject: one(platformObjects, {
    fields: [deals.objectId],
    references: [platformObjects.id],
  }),
  // Primary business relationships
  sourceLead: one(leads, {
    fields: [deals.sourceLeadId],
    references: [leads.id],
  }),
  primaryContact: one(contacts, {
    fields: [deals.primaryContactId],
    references: [contacts.id],
  }),
  primaryCompany: one(companies, {
    fields: [deals.primaryCompanyId],
    references: [companies.id],
  }),
  // A deal can result in multiple projects
  projects: many(projects),
}));