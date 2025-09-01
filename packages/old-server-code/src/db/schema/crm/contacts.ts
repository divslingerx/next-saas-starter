/**
 * Contacts Schema
 * Individual people - the human touchpoints in your business relationships
 */

import { pgTable, serial, varchar, timestamp, integer, text, index, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organization } from '../auth';
import { record as platformObjects } from '../platform/core';
import { companies } from './companies';
import { leads } from './leads';
import { deals } from './deals';
import { projects } from './projects';
import { invoices } from './invoices';

export const contacts = pgTable('contacts', {
  id: serial('id').primaryKey(),
  organizationId: varchar('organization_id', { length: 255 }).notNull().references(() => organization.id, { onDelete: 'cascade' }),
  objectId: integer('object_id').notNull().references(() => platformObjects.id, { onDelete: 'cascade' }),
  
  // Core contact information
  email: varchar('email', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  phone: varchar('phone', { length: 50 }),
  
  // Primary business relationship (FK for performance)
  primaryCompanyId: integer('primary_company_id'), // FK to companies - current primary employer
  jobTitle: varchar('job_title', { length: 200 }),
  
  // Contact preferences
  preferredContactMethod: varchar('preferred_contact_method', { length: 50 }).default('email'), // email, phone, slack, etc.
  timezone: varchar('timezone', { length: 50 }),
  
  // Tracking
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  // Performance indexes for common queries
  orgEmailIdx: unique().on(table.organizationId, table.email),
  orgPrimaryCompanyIdx: index().on(table.organizationId, table.primaryCompanyId),
  nameSearchIdx: index().on(table.firstName, table.lastName),
  updatedAtIdx: index().on(table.updatedAt),
}));

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  organization: one(organization, {
    fields: [contacts.organizationId],
    references: [organization.id],
  }),
  platformObject: one(platformObjects, {
    fields: [contacts.objectId],
    references: [platformObjects.id],
  }),
  // Primary business relationship
  primaryCompany: one(companies, {
    fields: [contacts.primaryCompanyId],
    references: [companies.id],
  }),
  // CRM relationships - this contact can be associated with many business objects
  leads: many(leads),
  deals: many(deals),
  projects: many(projects),
  invoices: many(invoices),
}));