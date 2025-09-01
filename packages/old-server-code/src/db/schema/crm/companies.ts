/**
 * Companies Schema
 * Organizations and businesses - the entities you do business with
 */

import { pgTable, serial, varchar, timestamp, integer, text, index, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organization } from '../auth';
import { record as platformObjects } from '../platform/core';
import { contacts } from './contacts';
import { leads } from './leads';
import { deals } from './deals';
import { projects } from './projects';
import { invoices } from './invoices';

export const companies = pgTable('companies', {
  id: serial('id').primaryKey(),
  organizationId: varchar('organization_id', { length: 255 }).notNull().references(() => organization.id, { onDelete: 'cascade' }),
  objectId: integer('object_id').notNull().references(() => platformObjects.id, { onDelete: 'cascade' }),
  
  // Core company information
  name: varchar('name', { length: 255 }).notNull(),
  domain: varchar('domain', { length: 255 }), // Primary website domain
  
  // Business details
  industry: varchar('industry', { length: 100 }),
  sizeCategory: varchar('size_category', { length: 50 }), // startup, small, medium, enterprise
  annualRevenue: varchar('annual_revenue', { length: 50 }), // Range like "$1M-$10M"
  
  // Contact information
  address: text('address'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 50 }),
  country: varchar('country', { length: 50 }),
  postalCode: varchar('postal_code', { length: 20 }),
  
  // Key for freelancers/agencies
  clientType: varchar('client_type', { length: 50 }).default('prospect'), // prospect, active, past, partner
  
  // Tracking
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  // Performance indexes for common queries
  orgNameIdx: unique().on(table.organizationId, table.name),
  domainIdx: index().on(table.domain),
  industryIdx: index().on(table.industry),
  clientTypeIdx: index().on(table.clientType),
  updatedAtIdx: index().on(table.updatedAt),
}));

export const companiesRelations = relations(companies, ({ one, many }) => ({
  organization: one(organization, {
    fields: [companies.organizationId],
    references: [organization.id],
  }),
  platformObject: one(platformObjects, {
    fields: [companies.objectId],
    references: [platformObjects.id],
  }),
  // Business relationships - a company can have many associated records
  contacts: many(contacts),
  leads: many(leads),
  deals: many(deals),
  projects: many(projects),
  invoices: many(invoices),
}));