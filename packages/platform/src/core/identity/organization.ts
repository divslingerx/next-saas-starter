import { pgTableCreator, text, bigint, boolean, timestamp, jsonb, index, unique, uuid, integer, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { person } from "./person";

export const createTable = pgTableCreator((name) => `agency-app_${name}`);

/**
 * Organization entity - represents companies, businesses, or any organizational entity
 * This is the tenant in a multi-tenant system
 */
export const organization = createTable(
  "organization",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    
    // Universal identifier
    uid: uuid("uid").defaultRandom().notNull().unique(),
    
    // Parent organization for hierarchical structures
    parentOrganizationId: bigint("parent_organization_id", { mode: "number" })
      .references(() => organization.id),
    
    // External IDs
    externalId: text("external_id"),
    externalSource: text("external_source"),
    
    // Basic information
    name: text("name").notNull(),
    legalName: text("legal_name"),
    dba: text("dba"), // Doing Business As
    slug: text("slug").unique(), // URL-friendly identifier
    
    // Organization type
    type: text("type"), // 'company', 'nonprofit', 'government', 'education', 'individual'
    subtype: text("subtype"), // More specific categorization
    
    // Contact information
    email: text("email"),
    phone: text("phone"),
    website: text("website"),
    
    // Branding
    logoUrl: text("logo_url"),
    faviconUrl: text("favicon_url"),
    primaryColor: text("primary_color"),
    
    // Business information
    industry: text("industry"),
    subIndustry: text("sub_industry"),
    employeeCount: text("employee_count"), // Range: '1-10', '11-50', etc.
    employeeCountExact: integer("employee_count_exact"),
    annualRevenue: text("annual_revenue"), // Range: '$0-1M', '$1-10M', etc.
    annualRevenueExact: decimal("annual_revenue_exact", { precision: 19, scale: 4 }),
    
    // Location
    headquarters: text("headquarters"),
    locations: jsonb("locations"), // Array of location objects
    timezone: text("timezone"),
    locale: text("locale"),
    
    // Tax and legal
    taxId: text("tax_id"), // EIN, VAT number, etc.
    taxExempt: boolean("tax_exempt").default(false),
    taxExemptDetails: jsonb("tax_exempt_details"),
    
    // For customers/accounts
    isCustomer: boolean("is_customer").default(false),
    customerSince: timestamp("customer_since"),
    customerStatus: text("customer_status"), // 'active', 'churned', 'paused'
    
    // For vendors/partners
    isVendor: boolean("is_vendor").default(false),
    isPartner: boolean("is_partner").default(false),
    partnerType: text("partner_type"), // 'reseller', 'affiliate', 'technology'
    
    // Account management
    accountManagerId: bigint("account_manager_id", { mode: "number" })
      .references(() => person.id),
    salesRepId: bigint("sales_rep_id", { mode: "number" })
      .references(() => person.id),
    
    // Lifecycle and scoring
    lifecycleStage: text("lifecycle_stage"), // 'prospect', 'lead', 'opportunity', 'customer'
    leadScore: bigint("lead_score", { mode: "number" }).default(0),
    healthScore: bigint("health_score", { mode: "number" }).default(100), // 0-100
    
    // Financial
    creditLimit: decimal("credit_limit", { precision: 19, scale: 4 }),
    balance: decimal("balance", { precision: 19, scale: 4 }).default('0'),
    totalSpent: decimal("total_spent", { precision: 19, scale: 4 }).default('0'),
    paymentTerms: text("payment_terms"), // 'net30', 'net60', 'due_on_receipt'
    
    // Important dates
    foundedDate: timestamp("founded_date"),
    firstContactDate: timestamp("first_contact_date"),
    lastActivityAt: timestamp("last_activity_at"),
    renewalDate: timestamp("renewal_date"),
    
    // Source tracking
    source: text("source"),
    sourceDetails: jsonb("source_details"),
    
    // Tags and segmentation
    tags: text("tags").array().default(sql`ARRAY[]::text[]`),
    segments: text("segments").array().default(sql`ARRAY[]::text[]`),
    
    // Custom fields
    customFields: jsonb("custom_fields").default({}),
    
    // Enrichment
    enrichedData: jsonb("enriched_data"),
    enrichedAt: timestamp("enriched_at"),
    
    // Settings and preferences
    settings: jsonb("settings").default({}),
    features: jsonb("features").default({}), // Feature flags
    
    // Status
    status: text("status").default('active'), // 'active', 'inactive', 'suspended', 'deleted'
    suspendedAt: timestamp("suspended_at"),
    suspendedReason: text("suspended_reason"),
    
    // Plan/subscription info
    plan: text("plan"), // 'free', 'starter', 'pro', 'enterprise'
    planDetails: jsonb("plan_details"),
    
    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    // Core indexes
    uidIdx: index("org_uid_idx").on(table.uid),
    slugIdx: unique("org_slug_idx").on(table.slug),
    nameIdx: index("org_name_idx").on(table.name),
    
    // Hierarchy
    parentIdx: index("org_parent_idx").on(table.parentOrganizationId),
    
    // Contact indexes
    emailIdx: index("org_email_idx").on(table.email),
    websiteIdx: index("org_website_idx").on(table.website),
    
    // External
    externalIdx: index("org_external_idx").on(table.externalSource, table.externalId),
    
    // Business indexes
    industryIdx: index("org_industry_idx").on(table.industry),
    
    // Role indexes
    customerIdx: index("org_customer_idx").on(table.isCustomer)
      .where(sql`is_customer = true`),
    vendorIdx: index("org_vendor_idx").on(table.isVendor)
      .where(sql`is_vendor = true`),
    
    // Lifecycle
    lifecycleIdx: index("org_lifecycle_idx").on(table.lifecycleStage),
    healthIdx: index("org_health_idx").on(table.healthScore),
    
    // Status
    statusIdx: index("org_status_idx").on(table.status),
    planIdx: index("org_plan_idx").on(table.plan),
  })
);

/**
 * Person-Organization relationships
 * Defines how people are related to organizations
 */
export const personOrganization = createTable(
  "person_organization",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    
    personId: bigint("person_id", { mode: "number" })
      .notNull()
      .references(() => person.id, { onDelete: "cascade" }),
    
    organizationId: bigint("organization_id", { mode: "number" })
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    
    // Relationship type
    relationship: text("relationship").notNull(), // 'employee', 'owner', 'contact', 'customer'
    
    // Role details
    jobTitle: text("job_title"),
    department: text("department"),
    
    // Employment details
    startDate: timestamp("start_date"),
    endDate: timestamp("end_date"),
    isCurrent: boolean("is_current").default(true),
    isPrimary: boolean("is_primary").default(false), // Primary organization for this person
    
    // Decision making
    isDecisionMaker: boolean("is_decision_maker").default(false),
    isBillingContact: boolean("is_billing_contact").default(false),
    isTechnicalContact: boolean("is_technical_contact").default(false),
    
    // Additional metadata
    metadata: jsonb("metadata"),
    
    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    personIdx: index("person_org_person_idx").on(table.personId),
    orgIdx: index("person_org_org_idx").on(table.organizationId),
    relationshipIdx: index("person_org_relationship_idx").on(table.relationship),
    currentIdx: index("person_org_current_idx").on(table.isCurrent),
    uniqueRelationship: unique("person_org_unique").on(
      table.personId,
      table.organizationId,
      table.relationship
    ),
  })
);

// Type exports
export type Organization = typeof organization.$inferSelect;
export type NewOrganization = typeof organization.$inferInsert;
export type PersonOrganization = typeof personOrganization.$inferSelect;
export type NewPersonOrganization = typeof personOrganization.$inferInsert;

// Validation schemas
export const insertOrganizationSchema = createInsertSchema(organization, {
  name: z.string().min(1).max(255),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  type: z.enum(['company', 'nonprofit', 'government', 'education', 'individual']).optional(),
  lifecycleStage: z.enum(['prospect', 'lead', 'opportunity', 'customer']).optional(),
  status: z.enum(['active', 'inactive', 'suspended', 'deleted']).optional(),
});

export const selectOrganizationSchema = createSelectSchema(organization);
export const updateOrganizationSchema = insertOrganizationSchema.partial();

export const insertPersonOrganizationSchema = createInsertSchema(personOrganization, {
  relationship: z.enum(['employee', 'owner', 'contact', 'customer', 'vendor', 'partner']),
});

export const selectPersonOrganizationSchema = createSelectSchema(personOrganization);