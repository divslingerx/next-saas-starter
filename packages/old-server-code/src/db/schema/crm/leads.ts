/**
 * Leads Schema  
 * Active prospects in your sales pipeline - potential business opportunities
 */

import { pgTable, serial, varchar, timestamp, integer, decimal, date, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organization } from '../auth';
import { record as platformObjects } from '../platform/core';
import { contacts } from './contacts';
import { companies } from './companies';
import { deals } from './deals';

export const leads = pgTable('leads', {
  id: serial('id').primaryKey(),
  organizationId: varchar('organization_id', { length: 255 }).notNull().references(() => organization.id, { onDelete: 'cascade' }),
  objectId: integer('object_id').notNull().references(() => platformObjects.id, { onDelete: 'cascade' }),
  
  // Primary relationships (FK for performance) 
  primaryContactId: integer('primary_contact_id').notNull(), // FK to contacts - main contact
  primaryCompanyId: integer('primary_company_id'), // FK to companies - target company
  
  // Lead qualification and tracking
  status: varchar('status', { length: 50 }).notNull().default('new'), // new, contacted, qualified, unqualified, converted
  source: varchar('source', { length: 100 }), // website, referral, cold_outreach, linkedin, etc.
  
  // Scoring and prioritization
  score: integer('score').default(0), // Lead scoring 0-100
  temperature: varchar('temperature', { length: 20 }).default('cold'), // cold, warm, hot
  
  // Project details (key for freelancers/agencies)
  projectType: varchar('project_type', { length: 100 }), // web_development, branding, marketing, etc.
  estimatedBudget: decimal('estimated_budget', { precision: 12, scale: 2 }),
  timeframe: varchar('timeframe', { length: 50 }), // immediate, 1_month, 3_months, 6_months, etc.
  
  // Timeline tracking
  firstContactDate: date('first_contact_date'),
  lastContactDate: date('last_contact_date'),
  qualificationDate: date('qualification_date'),
  convertedDate: date('converted_date'), // When converted to deal/customer
  
  // Assignment
  assignedToUserId: varchar('assigned_to_user_id', { length: 255 }),
  
  // Tracking
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  // Performance indexes for common queries
  orgStatusIdx: index().on(table.organizationId, table.status),
  primaryContactIdx: index().on(table.primaryContactId),
  primaryCompanyIdx: index().on(table.primaryCompanyId),
  assignedToIdx: index().on(table.assignedToUserId),
  scoreIdx: index().on(table.score),
  projectTypeIdx: index().on(table.projectType),
  updatedAtIdx: index().on(table.updatedAt),
  // Pipeline view optimization
  statusCreatedIdx: index().on(table.status, table.createdAt),
}));

export const leadsRelations = relations(leads, ({ one, many }) => ({
  organization: one(organization, {
    fields: [leads.organizationId],
    references: [organization.id],
  }),
  platformObject: one(platformObjects, {
    fields: [leads.objectId],
    references: [platformObjects.id],
  }),
  // Primary business relationships
  primaryContact: one(contacts, {
    fields: [leads.primaryContactId],
    references: [contacts.id],
  }),
  primaryCompany: one(companies, {
    fields: [leads.primaryCompanyId],
    references: [companies.id],
  }),
  // A lead can be converted to multiple deals over time
  deals: many(deals),
}));