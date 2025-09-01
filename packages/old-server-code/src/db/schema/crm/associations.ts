/**
 * Object Associations Schema
 * Industry-standard pattern for flexible CRM relationships
 * 
 * Supports any-to-any relationships with rich metadata:
 * - Contact -> Company (employee_of, contractor_for, former_employee)
 * - Contact -> Deal (decision_maker, technical_contact, influencer) 
 * - Contact -> Project (project_manager, developer, stakeholder)
 * - Deal -> Company (primary_opportunity, expansion_deal)
 */

import { pgTable, serial, varchar, integer, jsonb, boolean, timestamp, index, unique } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { organization } from '../auth';

export const objectAssociations = pgTable('object_associations', {
  id: serial('id').primaryKey(),
  organizationId: varchar('organization_id', { length: 255 }).notNull().references(() => organization.id, { onDelete: 'cascade' }),
  
  // Source object
  fromObjectType: varchar('from_object_type', { length: 50 }).notNull(), // 'contacts', 'companies', 'deals', etc.
  fromObjectId: integer('from_object_id').notNull(),
  
  // Target object  
  toObjectType: varchar('to_object_type', { length: 50 }).notNull(),
  toObjectId: integer('to_object_id').notNull(),
  
  // Association details
  associationType: varchar('association_type', { length: 100 }).notNull(), // 'employee_of', 'decision_maker', etc.
  
  // Rich metadata about the relationship
  metadata: jsonb('metadata').default({}), // Role details, permissions, notes, etc.
  
  // Relationship status
  isPrimary: boolean('is_primary').default(false), // Is this the primary relationship of this type?
  isActive: boolean('is_active').default(true),
  
  // Time bounds for relationship history
  startDate: timestamp('start_date', { withTimezone: true }),
  endDate: timestamp('end_date', { withTimezone: true }), // null = still active
  
  // Tracking
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  
  // Who created/modified this association
  createdByUserId: varchar('created_by_user_id', { length: 255 }),
  
}, (table) => ({
  // Prevent duplicate active associations of the same type
  uniqueActiveAssociation: unique('obj_assoc_unique_active').on(
    table.organizationId,
    table.fromObjectType,
    table.fromObjectId,
    table.toObjectType, 
    table.toObjectId,
    table.associationType
  ),
  
  // Performance indexes for common queries
  fromObjectIdx: index('obj_assoc_from_idx').on(table.fromObjectType, table.fromObjectId),
  toObjectIdx: index('obj_assoc_to_idx').on(table.toObjectType, table.toObjectId),
  associationTypeIdx: index('obj_assoc_type_idx').on(table.associationType),
  
  // Relationship queries
  fromToTypeIdx: index('obj_assoc_from_to_type_idx').on(table.fromObjectType, table.toObjectType, table.associationType),
  activeIdx: index('obj_assoc_active_idx').on(table.isActive),
  primaryIdx: index('obj_assoc_primary_idx').on(table.isPrimary),
  
  // Timeline queries
  activePeriodIdx: index('obj_assoc_period_idx').on(table.startDate, table.endDate),
  
  // Organization scoped queries (most important for performance)
  orgFromIdx: index('obj_assoc_org_from_idx').on(table.organizationId, table.fromObjectType, table.fromObjectId),
  orgToIdx: index('obj_assoc_org_to_idx').on(table.organizationId, table.toObjectType, table.toObjectId),
}));

export const objectAssociationsRelations = relations(objectAssociations, ({ one }) => ({
  organization: one(organization, {
    fields: [objectAssociations.organizationId],
    references: [organization.id],
  }),
}));

/**
 * Association Type Registry
 * Define standard association types and their metadata
 */
export const ASSOCIATION_TYPES = {
  // Contact <-> Company
  CONTACT_COMPANY: {
    EMPLOYEE: 'employee_of',
    CONTRACTOR: 'contractor_for', 
    FOUNDER: 'founder_of',
    FORMER_EMPLOYEE: 'former_employee_of',
    ADVISOR: 'advisor_to',
  },
  
  // Contact <-> Deal
  CONTACT_DEAL: {
    DECISION_MAKER: 'decision_maker_for',
    TECHNICAL_CONTACT: 'technical_contact_for',
    ECONOMIC_BUYER: 'economic_buyer_for',
    INFLUENCER: 'influencer_on',
    STAKEHOLDER: 'stakeholder_in',
  },
  
  // Contact <-> Project  
  CONTACT_PROJECT: {
    PROJECT_MANAGER: 'project_manager_for',
    TECHNICAL_LEAD: 'technical_lead_on',
    DEVELOPER: 'developer_on',
    DESIGNER: 'designer_on', 
    QA_LEAD: 'qa_lead_on',
    CLIENT_CONTACT: 'client_contact_for',
  },
  
  // Company <-> Deal
  COMPANY_DEAL: {
    PRIMARY_ACCOUNT: 'primary_account_for',
    PARTNER_ACCOUNT: 'partner_account_for',
    COMPETITOR: 'competitor_in',
  },
  
  // Deal <-> Project
  DEAL_PROJECT: {
    RESULTED_IN: 'resulted_in_project',
    EXPANDED_TO: 'expanded_to_project',
  },
  
  // Project <-> Invoice
  PROJECT_INVOICE: {
    BILLED_BY: 'billed_by_invoice',
    PARTIAL_BILL: 'partially_billed_by',
  },
} as const;