import { pgTableCreator, text, bigint, boolean, timestamp, jsonb, index, unique, uuid, integer, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";
import { z } from "zod";

export const createTable = pgTableCreator((name) => `agency-app_${name}`);

/**
 * Marketing campaigns - email, SMS, social, etc.
 */
export const campaign = createTable(
  "campaign",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    
    // Universal identifier
    uid: uuid("uid").defaultRandom().notNull().unique(),
    
    // Multi-tenant
    organizationId: bigint("organization_id", { mode: "number" }).notNull(),
    
    // Campaign details
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    
    // Type and channel
    type: text("type").notNull(), // 'email', 'sms', 'social', 'push', 'in_app', 'multi_channel'
    channel: text("channel"), // Specific channel like 'facebook', 'instagram', 'email'
    
    // Category
    category: text("category"), // 'promotional', 'transactional', 'newsletter', 'announcement'
    
    // Status
    status: text("status").notNull().default('draft'), // 'draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled'
    
    // Audience
    segmentId: bigint("segment_id", { mode: "number" }),
    audienceFilter: jsonb("audience_filter"), // Additional filters
    estimatedAudience: integer("estimated_audience").default(0),
    
    // Content
    subject: text("subject"), // Email subject
    previewText: text("preview_text"), // Email preview
    content: text("content"), // Plain text content
    contentHtml: text("content_html"), // HTML content
    contentJson: jsonb("content_json"), // Structured content for builders
    
    // Templates
    templateId: text("template_id"),
    templateVariables: jsonb("template_variables"),
    
    // Personalization
    usePersonalization: boolean("use_personalization").default(true),
    personalizationFields: jsonb("personalization_fields"),
    
    // Sender
    fromName: text("from_name"),
    fromEmail: text("from_email"),
    replyTo: text("reply_to"),
    
    // Schedule
    scheduleType: text("schedule_type"), // 'immediate', 'scheduled', 'recurring', 'trigger_based'
    scheduledAt: timestamp("scheduled_at"),
    sendAt: timestamp("send_at"),
    endAt: timestamp("end_at"),
    timezone: text("timezone"),
    
    // Recurrence
    isRecurring: boolean("is_recurring").default(false),
    recurrenceRule: text("recurrence_rule"), // RRULE format
    recurrenceEndDate: timestamp("recurrence_end_date"),
    
    // A/B testing
    isAbTest: boolean("is_ab_test").default(false),
    abTestConfig: jsonb("ab_test_config"), // Test variants and distribution
    winningVariant: text("winning_variant"),
    
    // Goals and tracking
    goal: text("goal"), // 'clicks', 'conversions', 'engagement'
    goalTarget: integer("goal_target"),
    trackingEnabled: boolean("tracking_enabled").default(true),
    utmParameters: jsonb("utm_parameters"),
    
    // Budget
    budget: decimal("budget", { precision: 19, scale: 4 }),
    spentAmount: decimal("spent_amount", { precision: 19, scale: 4 }).default('0'),
    costPerSend: decimal("cost_per_send", { precision: 19, scale: 4 }),
    
    // Performance metrics
    sentCount: integer("sent_count").default(0),
    deliveredCount: integer("delivered_count").default(0),
    openCount: integer("open_count").default(0),
    clickCount: integer("click_count").default(0),
    conversionCount: integer("conversion_count").default(0),
    unsubscribeCount: integer("unsubscribe_count").default(0),
    bounceCount: integer("bounce_count").default(0),
    spamCount: integer("spam_count").default(0),
    
    // Rates (calculated)
    deliveryRate: decimal("delivery_rate", { precision: 5, scale: 2 }),
    openRate: decimal("open_rate", { precision: 5, scale: 2 }),
    clickRate: decimal("click_rate", { precision: 5, scale: 2 }),
    conversionRate: decimal("conversion_rate", { precision: 5, scale: 2 }),
    unsubscribeRate: decimal("unsubscribe_rate", { precision: 5, scale: 2 }),
    
    // Revenue tracking
    revenue: decimal("revenue", { precision: 19, scale: 4 }).default('0'),
    roi: decimal("roi", { precision: 10, scale: 2 }), // Return on investment percentage
    
    // Settings
    settings: jsonb("settings").default('{}'),
    
    // Tags
    tags: text("tags").array().default(sql`ARRAY[]::text[]`),
    
    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    lastSentAt: timestamp("last_sent_at"),
  },
  (table) => ({
    // Core indexes
    uidIdx: index("campaign_uid_idx").on(table.uid),
    orgIdx: index("campaign_org_idx").on(table.organizationId),
    slugIdx: unique("campaign_slug_idx").on(table.organizationId, table.slug),
    
    // Type indexes
    typeIdx: index("campaign_type_idx").on(table.type),
    categoryIdx: index("campaign_category_idx").on(table.category),
    
    // Status indexes
    statusIdx: index("campaign_status_idx").on(table.status),
    
    // Segment index
    segmentIdx: index("campaign_segment_idx").on(table.segmentId),
    
    // Schedule indexes
    scheduledAtIdx: index("campaign_scheduled_at_idx").on(table.scheduledAt),
    sendAtIdx: index("campaign_send_at_idx").on(table.sendAt),
  })
);

/**
 * Audience segments for targeting
 */
export const segment = createTable(
  "segment",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    
    // Universal identifier
    uid: uuid("uid").defaultRandom().notNull().unique(),
    
    // Multi-tenant
    organizationId: bigint("organization_id", { mode: "number" }).notNull(),
    
    // Segment details
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    
    // Type
    type: text("type").notNull(), // 'static', 'dynamic', 'smart'
    
    // Criteria for dynamic segments
    criteria: jsonb("criteria"), // Query criteria for dynamic segments
    sqlQuery: text("sql_query"), // Optional raw SQL for advanced segments
    
    // Size
    memberCount: integer("member_count").default(0),
    lastCalculatedAt: timestamp("last_calculated_at"),
    
    // Status
    isActive: boolean("is_active").default(true),
    isSystem: boolean("is_system").default(false), // System-generated segments
    
    // Display
    color: text("color"),
    icon: text("icon"),
    
    // Refresh settings for dynamic segments
    refreshFrequency: text("refresh_frequency"), // 'realtime', 'hourly', 'daily', 'weekly'
    lastRefreshedAt: timestamp("last_refreshed_at"),
    nextRefreshAt: timestamp("next_refresh_at"),
    
    // Tags
    tags: text("tags").array().default(sql`ARRAY[]::text[]`),
    
    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    // Core indexes
    uidIdx: index("segment_uid_idx").on(table.uid),
    orgIdx: index("segment_org_idx").on(table.organizationId),
    slugIdx: unique("segment_slug_idx").on(table.organizationId, table.slug),
    
    // Type indexes
    typeIdx: index("segment_type_idx").on(table.type),
    
    // Status indexes
    activeIdx: index("segment_active_idx").on(table.isActive),
    systemIdx: index("segment_system_idx").on(table.isSystem),
  })
);

/**
 * Segment members for static segments
 */
export const segmentMember = createTable(
  "segment_member",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    
    segmentId: bigint("segment_id", { mode: "number" })
      .notNull()
      .references(() => segment.id, { onDelete: "cascade" }),
    
    // Member reference (person)
    personId: bigint("person_id", { mode: "number" }).notNull(),
    
    // Additional data
    metadata: jsonb("metadata"),
    
    // Dates
    addedAt: timestamp("added_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at"), // For temporary membership
  },
  (table) => ({
    segmentIdx: index("segment_member_segment_idx").on(table.segmentId),
    personIdx: index("segment_member_person_idx").on(table.personId),
    uniqueMember: unique("segment_member_unique").on(table.segmentId, table.personId),
  })
);

/**
 * Marketing automation workflows
 */
export const automationWorkflow = createTable(
  "automation_workflow",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    
    // Universal identifier
    uid: uuid("uid").defaultRandom().notNull().unique(),
    
    // Multi-tenant
    organizationId: bigint("organization_id", { mode: "number" }).notNull(),
    
    // Workflow details
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    
    // Type
    type: text("type"), // 'email_sequence', 'lead_nurture', 'onboarding', 're_engagement'
    
    // Trigger
    triggerType: text("trigger_type").notNull(), // 'event', 'condition', 'schedule', 'manual'
    triggerConfig: jsonb("trigger_config").notNull(), // Trigger configuration
    
    // Workflow definition
    steps: jsonb("steps").notNull(), // Array of workflow steps
    
    // Entry criteria
    entrySegmentId: bigint("entry_segment_id", { mode: "number" })
      .references(() => segment.id),
    entryCriteria: jsonb("entry_criteria"),
    
    // Exit criteria
    exitCriteria: jsonb("exit_criteria"),
    goalCriteria: jsonb("goal_criteria"),
    
    // Status
    status: text("status").notNull().default('draft'), // 'draft', 'active', 'paused', 'completed'
    
    // Settings
    allowReEntry: boolean("allow_re_entry").default(false),
    reEntryDelay: integer("re_entry_delay"), // Days before re-entry allowed
    maxEnrollments: integer("max_enrollments"), // Max enrollments per person
    
    // Performance
    enrolledCount: integer("enrolled_count").default(0),
    activeCount: integer("active_count").default(0),
    completedCount: integer("completed_count").default(0),
    goalReachedCount: integer("goal_reached_count").default(0),
    
    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    activatedAt: timestamp("activated_at"),
    pausedAt: timestamp("paused_at"),
  },
  (table) => ({
    // Core indexes
    uidIdx: index("automation_uid_idx").on(table.uid),
    orgIdx: index("automation_org_idx").on(table.organizationId),
    slugIdx: unique("automation_slug_idx").on(table.organizationId, table.slug),
    
    // Type indexes
    typeIdx: index("automation_type_idx").on(table.type),
    triggerTypeIdx: index("automation_trigger_type_idx").on(table.triggerType),
    
    // Status indexes
    statusIdx: index("automation_status_idx").on(table.status),
    
    // Segment index
    segmentIdx: index("automation_segment_idx").on(table.entrySegmentId),
  })
);

/**
 * Automation enrollments - tracks people in workflows
 */
export const automationEnrollment = createTable(
  "automation_enrollment",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    
    workflowId: bigint("workflow_id", { mode: "number" })
      .notNull()
      .references(() => automationWorkflow.id, { onDelete: "cascade" }),
    
    personId: bigint("person_id", { mode: "number" }).notNull(),
    
    // Current state
    status: text("status").notNull().default('active'), // 'active', 'paused', 'completed', 'exited'
    currentStep: integer("current_step").default(0),
    currentStepStatus: text("current_step_status"), // 'waiting', 'processing', 'completed'
    
    // Progress
    completedSteps: jsonb("completed_steps"), // Array of completed step IDs
    stepHistory: jsonb("step_history"), // Detailed history
    
    // Exit information
    exitReason: text("exit_reason"), // 'completed', 'goal_reached', 'criteria_met', 'manual', 'error'
    exitDetails: jsonb("exit_details"),
    
    // Goal tracking
    goalReached: boolean("goal_reached").default(false),
    goalReachedAt: timestamp("goal_reached_at"),
    
    // Timestamps
    enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
    completedAt: timestamp("completed_at"),
    exitedAt: timestamp("exited_at"),
    nextStepAt: timestamp("next_step_at"),
  },
  (table) => ({
    workflowIdx: index("enrollment_workflow_idx").on(table.workflowId),
    personIdx: index("enrollment_person_idx").on(table.personId),
    statusIdx: index("enrollment_status_idx").on(table.status),
    nextStepIdx: index("enrollment_next_step_idx").on(table.nextStepAt),
    uniqueActive: unique("enrollment_unique_active").on(table.workflowId, table.personId)
      .where(sql`status = 'active'`),
  })
);

// Type exports
export type Campaign = typeof campaign.$inferSelect;
export type NewCampaign = typeof campaign.$inferInsert;
export type Segment = typeof segment.$inferSelect;
export type NewSegment = typeof segment.$inferInsert;
export type SegmentMember = typeof segmentMember.$inferSelect;
export type NewSegmentMember = typeof segmentMember.$inferInsert;
export type AutomationWorkflow = typeof automationWorkflow.$inferSelect;
export type NewAutomationWorkflow = typeof automationWorkflow.$inferInsert;
export type AutomationEnrollment = typeof automationEnrollment.$inferSelect;
export type NewAutomationEnrollment = typeof automationEnrollment.$inferInsert;

// Validation schemas
export const insertCampaignSchema = createInsertSchema(campaign, {
  name: z.string().min(1).max(255),
  type: z.enum(['email', 'sms', 'social', 'push', 'in_app', 'multi_channel']),
  status: z.enum(['draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled']),
  category: z.enum(['promotional', 'transactional', 'newsletter', 'announcement']).optional(),
  scheduleType: z.enum(['immediate', 'scheduled', 'recurring', 'trigger_based']).optional(),
});

export const insertSegmentSchema = createInsertSchema(segment, {
  name: z.string().min(1).max(100),
  type: z.enum(['static', 'dynamic', 'smart']),
  refreshFrequency: z.enum(['realtime', 'hourly', 'daily', 'weekly']).optional(),
});

export const insertAutomationWorkflowSchema = createInsertSchema(automationWorkflow, {
  name: z.string().min(1).max(255),
  triggerType: z.enum(['event', 'condition', 'schedule', 'manual']),
  status: z.enum(['draft', 'active', 'paused', 'completed']),
  type: z.enum(['email_sequence', 'lead_nurture', 'onboarding', 're_engagement']).optional(),
});

export const insertAutomationEnrollmentSchema = createInsertSchema(automationEnrollment, {
  status: z.enum(['active', 'paused', 'completed', 'exited']),
  exitReason: z.enum(['completed', 'goal_reached', 'criteria_met', 'manual', 'error']).optional(),
});