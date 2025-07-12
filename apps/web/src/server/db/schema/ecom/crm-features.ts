import { text, bigint, boolean, timestamp, jsonb, integer, doublePrecision, index, pgTableCreator } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// Create table with prefix
export const createTable = pgTableCreator((name) => `agency-app_${name}`);

// CRM-SPECIFIC FEATURES (using the unified object model)

// Deals/Opportunities
export const deal = createTable("deal", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  objectId: bigint("object_id", { mode: "number" }).unique().notNull(), // Links to unified object
  
  // Deal basics
  name: text("name"),
  amount: doublePrecision("amount"),
  currency: text("currency"),
  
  // Stage tracking
  stageId: bigint("stage_id", { mode: "number" }),
  probability: integer("probability"), // 0-100%
  
  // Dates
  closeDate: timestamp("close_date"),
  closedAt: timestamp("closed_at"),
  
  // Related objects (using object relationships)
  // - Company (via object_relationship)
  // - Contact (via object_relationship)
  // - Products (via object_relationship)
  
  // Deal type
  dealType: text("deal_type"), // new_business, renewal, upsell
  
  // Competition
  competitors: jsonb("competitors"),
  competitorStatus: text("competitor_status"), // winning, at_risk, lost
  
  // Lost reason
  lostReason: text("lost_reason"),
  lostNotes: text("lost_notes"),
});

// Pipeline stages (reusable across deal types)
export const pipelineStage = createTable("pipeline_stage", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  pipelineId: bigint("pipeline_id", { mode: "number" }).notNull(),
  name: text("name"),
  
  // Stage config
  order: integer("order"),
  probability: integer("probability").default(0),
  
  // Automation
  entryActions: jsonb("entry_actions"), // What happens when deal enters
  exitActions: jsonb("exit_actions"), // What happens when deal leaves
  
  // Requirements
  requiredFields: jsonb("required_fields"), // Fields that must be filled
  
  isWinStage: boolean("is_win_stage").default(false),
  isLostStage: boolean("is_lost_stage").default(false),
});

// Communications/Interactions
export const communication = createTable("communication", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  objectId: bigint("object_id", { mode: "number" }).unique().notNull(), // Links to unified object
  
  // Communication details
  type: text("type"), // email, call, meeting, note, sms, chat
  direction: text("direction"), // inbound, outbound
  
  // Content
  subject: text("subject"),
  body: text("body"),
  htmlBody: text("html_body"),
  
  // Participants (using object relationships)
  // - From (via object_relationship)
  // - To (via object_relationship)
  // - CC (via object_relationship)
  
  // Call/Meeting specific
  duration: integer("duration"), // seconds
  recordingUrl: text("recording_url"),
  transcript: text("transcript"),
  
  // Email specific
  messageId: text("message_id"),
  threadId: text("thread_id"),
  
  // Status
  status: text("status"), // sent, delivered, opened, clicked, replied
  
  // Engagement tracking
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  repliedAt: timestamp("replied_at"),
  
  // Scheduling
  scheduledFor: timestamp("scheduled_for"),
  completedAt: timestamp("completed_at"),
});

// Tasks (unified across all object types)
export const task = createTable("task", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  objectId: bigint("object_id", { mode: "number" }).unique().notNull(), // Links to unified object
  
  // Task details
  title: text("title"),
  description: text("description"),
  priority: text("priority"), // low, medium, high, urgent
  
  // Assignment
  assigneeId: bigint("assignee_id", { mode: "number" }),
  
  // Dates
  dueDate: timestamp("due_date"),
  reminderDate: timestamp("reminder_date"),
  completedAt: timestamp("completed_at"),
  
  // Related to any object (using object relationships)
  // Can be related to deals, customers, orders, etc.
  
  // Task type
  taskType: text("task_type"), // call, email, follow_up, custom
  
  // Outcome
  outcome: text("outcome"),
  outcomeNotes: text("outcome_notes"),
});

// Campaigns (marketing/sales campaigns)
export const campaign = createTable("campaign", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  objectId: bigint("object_id", { mode: "number" }).unique().notNull(), // Links to unified object
  
  // Campaign details
  name: text("name"),
  type: text("type"), // email, social, event, webinar, paid
  
  // Status
  status: text("status"), // draft, scheduled, active, paused, completed
  
  // Targeting
  targetObjectType: text("target_object_type"), // customer, lead, contact
  targetCriteria: jsonb("target_criteria"), // Segment definition
  
  // Budget
  budgetAmount: doublePrecision("budget_amount"),
  actualSpend: doublePrecision("actual_spend"),
  
  // Dates
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  
  // Goals
  goals: jsonb("goals"), // {type: "conversions", target: 100}
  
  // Content
  contentTemplates: jsonb("content_templates"), // Email templates, ad creative, etc.
});

// Campaign members (who's in the campaign)
export const campaignMember = createTable("campaign_member", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  campaignId: bigint("campaign_id", { mode: "number" }).notNull(),
  objectId: bigint("object_id", { mode: "number" }).notNull(), // The person/company
  
  // Status in campaign
  status: text("status"), // targeted, sent, opened, clicked, converted
  
  // Engagement
  engagementScore: integer("engagement_score"),
  lastEngagedAt: timestamp("last_engaged_at"),
  
  // Results
  converted: boolean("converted").default(false),
  conversionValue: doublePrecision("conversion_value"),
  
  addedAt: timestamp("added_at").defaultNow(),
}, (table) => [
  index("campaign_member_campaign_idx").on(table.campaignId),
  index("campaign_member_object_idx").on(table.objectId),
]);

// Forms (for lead capture)
export const form = createTable("form", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  // Form details
  name: text("name"),
  type: text("type"), // contact, newsletter, demo_request, custom
  
  // Configuration
  fields: jsonb("fields"), // Form field definitions
  submitButtonText: text("submit_button_text"),
  successMessage: text("success_message"),
  
  // Actions
  onSubmitActions: jsonb("on_submit_actions"), // Create object, send email, etc.
  
  // Tracking
  conversionRate: doublePrecision("conversion_rate"),
  totalSubmissions: integer("total_submissions").default(0),
  
  isActive: boolean("is_active").default(true),
});

// Form submissions
export const formSubmission = createTable("form_submission", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  objectId: bigint("object_id", { mode: "number" }).unique().notNull(), // Links to unified object
  
  formId: bigint("form_id", { mode: "number" }).notNull(),
  
  // Submission data
  formData: jsonb("form_data"),
  
  // Source
  sourceUrl: text("source_url"),
  referrer: text("referrer"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  
  // Processing
  processed: boolean("processed").default(false),
  processingErrors: jsonb("processing_errors"),
  
  submittedAt: timestamp("submitted_at").defaultNow(),
});

// Contact/Company enrichment data
export const enrichmentData = createTable("enrichment_data", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  objectId: bigint("object_id", { mode: "number" }).notNull(),
  
  // Source
  provider: text("provider"), // clearbit, fullcontact, etc.
  
  // Enriched data
  data: jsonb("data"),
  confidence: doublePrecision("confidence"), // 0-1
  
  // Status
  status: text("status"), // pending, enriched, failed
  
  enrichedAt: timestamp("enriched_at"),
  expiresAt: timestamp("expires_at"),
}, (table) => [
  index("enrichment_data_object_idx").on(table.objectId),
]);

// Sequences (for sales outreach)
export const sequence = createTable("sequence", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  name: text("name"),
  description: text("description"),
  
  // Steps are workflow actions
  workflowId: bigint("workflow_id", { mode: "number" }),
  
  // Performance
  replyRate: doublePrecision("reply_rate"),
  conversionRate: doublePrecision("conversion_rate"),
  
  isActive: boolean("is_active").default(true),
});

// Sequence enrollment
export const sequenceEnrollment = createTable("sequence_enrollment", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  sequenceId: bigint("sequence_id", { mode: "number" }).notNull(),
  objectId: bigint("object_id", { mode: "number" }).notNull(),
  
  // Status
  status: text("status"), // active, paused, completed, unenrolled
  currentStep: integer("current_step").default(0),
  
  // Engagement
  replied: boolean("replied").default(false),
  repliedAt: timestamp("replied_at"),
  
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  completedAt: timestamp("completed_at"),
}, (table) => [
  index("sequence_enrollment_sequence_idx").on(table.sequenceId),
  index("sequence_enrollment_object_idx").on(table.objectId),
]);

// Zod schemas
export const insertDealSchema = createInsertSchema(deal);
export const selectDealSchema = createSelectSchema(deal);

export const insertCommunicationSchema = createInsertSchema(communication);
export const selectCommunicationSchema = createSelectSchema(communication);

export const insertTaskSchema = createInsertSchema(task);
export const selectTaskSchema = createSelectSchema(task);

export const insertCampaignSchema = createInsertSchema(campaign);
export const selectCampaignSchema = createSelectSchema(campaign);

// Type exports
export type Deal = typeof deal.$inferSelect;
export type Communication = typeof communication.$inferSelect;
export type Task = typeof task.$inferSelect;
export type Campaign = typeof campaign.$inferSelect;