import { pgTableCreator, text, bigint, boolean, timestamp, jsonb, index, unique, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";
import { z } from "zod";

export const createTable = pgTableCreator((name) => `agency-app_${name}`);

/**
 * Core person entity - single source of truth for all people across the platform
 * This includes customers, contacts, users, leads, vendors - everyone
 */
export const person = createTable(
  "person",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    
    // Universal identifier for cross-system reference
    uid: uuid("uid").defaultRandom().notNull().unique(),
    
    // Organization context (multi-tenant)
    organizationId: bigint("organization_id", { mode: "number" }).notNull(),
    
    // External IDs for integration with other systems
    externalId: text("external_id"), // ID from external system
    externalSource: text("external_source"), // Source system name
    
    // Core identity - email and phone are nullable as not everyone has both
    email: text("email"),
    emailVerified: boolean("email_verified").default(false),
    emailVerifiedAt: timestamp("email_verified_at"),
    
    phone: text("phone"),
    phoneVerified: boolean("phone_verified").default(false),
    phoneVerifiedAt: timestamp("phone_verified_at"),
    
    // Name fields - flexible for different cultures
    firstName: text("first_name"),
    lastName: text("last_name"),
    middleName: text("middle_name"),
    preferredName: text("preferred_name"), // What they want to be called
    fullName: text("full_name"), // Computed or provided
    
    // Profile
    avatarUrl: text("avatar_url"),
    title: text("title"), // Professional title
    bio: text("bio"),
    
    // Important dates
    dateOfBirth: timestamp("date_of_birth"),
    anniversary: timestamp("anniversary"),
    
    // Role flags - a person can have multiple roles
    isUser: boolean("is_user").default(false), // Has login credentials
    isCustomer: boolean("is_customer").default(false), // Has made purchases
    isLead: boolean("is_lead").default(false), // Active sales prospect
    isContact: boolean("is_contact").default(false), // CRM contact
    isVendor: boolean("is_vendor").default(false), // Supplier/vendor
    isPartner: boolean("is_partner").default(false), // Business partner
    isEmployee: boolean("is_employee").default(false), // Internal employee
    
    // Lifecycle and scoring
    lifecycleStage: text("lifecycle_stage"), // 'visitor', 'lead', 'opportunity', 'customer', 'evangelist'
    leadScore: bigint("lead_score", { mode: "number" }).default(0),
    engagementScore: bigint("engagement_score", { mode: "number" }).default(0),
    
    // Source tracking
    source: text("source"), // 'organic', 'paid', 'social', 'referral', 'direct', 'email'
    sourceDetails: jsonb("source_details"), // Additional source information
    utmData: jsonb("utm_data"), // UTM parameters from first touch
    referrer: text("referrer"), // Referring website/person
    
    // Communication preferences
    timezone: text("timezone"),
    locale: text("locale"), // Language preference
    preferredChannel: text("preferred_channel"), // 'email', 'sms', 'phone', 'whatsapp'
    
    // Marketing consent
    acceptsMarketing: boolean("accepts_marketing").default(false),
    acceptsMarketingUpdatedAt: timestamp("accepts_marketing_updated_at"),
    marketingOptInLevel: text("marketing_opt_in_level"), // 'single_opt_in', 'confirmed_opt_in'
    marketingConsentDetails: jsonb("marketing_consent_details"),
    
    // Privacy and compliance
    gdprConsent: boolean("gdpr_consent").default(false),
    gdprConsentAt: timestamp("gdpr_consent_at"),
    dataRetentionDate: timestamp("data_retention_date"),
    deletionRequestedAt: timestamp("deletion_requested_at"),
    
    // Enrichment data
    enrichedData: jsonb("enriched_data"), // Data from enrichment services
    enrichedAt: timestamp("enriched_at"),
    
    // Tags and segmentation
    tags: text("tags").array().default(sql`ARRAY[]::text[]`),
    segments: text("segments").array().default(sql`ARRAY[]::text[]`),
    
    // Custom fields for flexibility
    customFields: jsonb("custom_fields").default({}),
    
    // Computed fields (updated by triggers)
    totalSpent: text("total_spent").default('0'), // Lifetime value as customer
    orderCount: bigint("order_count", { mode: "number" }).default(0),
    lastOrderAt: timestamp("last_order_at"),
    lastActivityAt: timestamp("last_activity_at"),
    
    // Merge handling for deduplication
    mergedIntoId: bigint("merged_into_id", { mode: "number" })
      .references(() => person.id),
    mergedAt: timestamp("merged_at"),
    mergeHistory: jsonb("merge_history"), // Track merge lineage
    
    // Status
    status: text("status").default('active'), // 'active', 'inactive', 'blocked', 'deleted'
    blockedAt: timestamp("blocked_at"),
    blockedReason: text("blocked_reason"),
    
    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    // Core indexes
    uidIdx: index("person_uid_idx").on(table.uid),
    orgIdx: index("person_org_idx").on(table.organizationId),
    
    // Identity indexes
    orgEmailIdx: index("person_org_email_idx").on(table.organizationId, table.email),
    orgPhoneIdx: index("person_org_phone_idx").on(table.organizationId, table.phone),
    externalIdx: index("person_external_idx").on(table.externalSource, table.externalId),
    
    // Search indexes
    nameIdx: index("person_name_idx").on(table.firstName, table.lastName),
    fullNameIdx: index("person_full_name_idx").on(table.fullName),
    
    // Role indexes - partial indexes for performance
    customerIdx: index("person_customer_idx").on(table.organizationId, table.isCustomer)
      .where(sql`is_customer = true`),
    leadIdx: index("person_lead_idx").on(table.organizationId, table.isLead)
      .where(sql`is_lead = true`),
    userIdx: index("person_user_idx").on(table.organizationId, table.isUser)
      .where(sql`is_user = true`),
    
    // Lifecycle indexes
    lifecycleIdx: index("person_lifecycle_idx").on(table.organizationId, table.lifecycleStage),
    scoreIdx: index("person_score_idx").on(table.organizationId, table.leadScore),
    
    // Activity indexes
    lastActivityIdx: index("person_last_activity_idx").on(table.organizationId, table.lastActivityAt),
    
    // Status indexes
    statusIdx: index("person_status_idx").on(table.organizationId, table.status),
    mergedIdx: index("person_merged_idx").on(table.mergedIntoId)
      .where(sql`merged_into_id IS NOT NULL`),
    
    // Unique constraints
    uniqueOrgEmail: unique("person_org_email_unique").on(table.organizationId, table.email)
      .nullsNotDistinct(), // Treat NULL emails as distinct
  })
);

// Type exports
export type Person = typeof person.$inferSelect;
export type NewPerson = typeof person.$inferInsert;

// Validation schemas
export const insertPersonSchema = createInsertSchema(person, {
  email: z.string().email().optional(),
  phone: z.string().min(10).optional(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  lifecycleStage: z.enum(['visitor', 'lead', 'opportunity', 'customer', 'evangelist']).optional(),
  status: z.enum(['active', 'inactive', 'blocked', 'deleted']).optional(),
  preferredChannel: z.enum(['email', 'sms', 'phone', 'whatsapp']).optional(),
  source: z.enum(['organic', 'paid', 'social', 'referral', 'direct', 'email', 'import', 'api']).optional(),
});

export const selectPersonSchema = createSelectSchema(person);
export const updatePersonSchema = insertPersonSchema.partial();