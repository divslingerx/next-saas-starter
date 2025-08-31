import { pgTableCreator, text, bigint, boolean, timestamp, jsonb, index, unique, uuid, integer } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { organization } from "../identity/organization";
import { person } from "../identity/person";

export const createTable = pgTableCreator((name) => `agency-app_${name}`);

/**
 * Communication log - tracks all communications (emails, calls, messages, meetings)
 */
export const communication = createTable(
  "communication",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    
    // Universal identifier
    uid: uuid("uid").defaultRandom().notNull().unique(),
    
    // Multi-tenant
    organizationId: bigint("organization_id", { mode: "number" })
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    
    // Communication type
    type: text("type").notNull(), // 'email', 'call', 'sms', 'meeting', 'note', 'chat', 'social'
    direction: text("direction"), // 'inbound', 'outbound', 'internal'
    
    // Channel details
    channel: text("channel"), // 'email', 'phone', 'sms', 'whatsapp', 'slack', 'teams'
    channelDetails: jsonb("channel_details"), // Channel-specific data
    
    // Subject/title
    subject: text("subject"),
    
    // Content
    content: text("content"), // Plain text content
    contentHtml: text("content_html"), // HTML content
    contentType: text("content_type"), // 'text/plain', 'text/html'
    preview: text("preview"), // Short preview of content
    
    // Participants
    fromPersonId: bigint("from_person_id", { mode: "number" })
      .references(() => person.id, { onDelete: "set null" }),
    fromEmail: text("from_email"),
    fromPhone: text("from_phone"),
    fromName: text("from_name"),
    
    toPersonIds: bigint("to_person_ids", { mode: "number" }).array(),
    toEmails: text("to_emails").array(),
    toPhones: text("to_phones").array(),
    
    ccPersonIds: bigint("cc_person_ids", { mode: "number" }).array(),
    ccEmails: text("cc_emails").array(),
    
    bccPersonIds: bigint("bcc_person_ids", { mode: "number" }).array(),
    bccEmails: text("bcc_emails").array(),
    
    // Related entities (polymorphic)
    relatedEntityType: text("related_entity_type"), // 'deal', 'ticket', 'order', etc.
    relatedEntityId: bigint("related_entity_id", { mode: "number" }),
    
    // Threading
    threadId: text("thread_id"), // For grouping related communications
    parentId: bigint("parent_id", { mode: "number" })
      .references(() => communication.id, { onDelete: "set null" }),
    messageId: text("message_id"), // Email message ID
    inReplyTo: text("in_reply_to"), // Email in-reply-to header
    
    // Status
    status: text("status"), // 'draft', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'
    
    // Tracking
    sentAt: timestamp("sent_at"),
    deliveredAt: timestamp("delivered_at"),
    openedAt: timestamp("opened_at"),
    firstOpenedAt: timestamp("first_opened_at"),
    clickedAt: timestamp("clicked_at"),
    repliedAt: timestamp("replied_at"),
    bouncedAt: timestamp("bounced_at"),
    
    // Engagement metrics
    openCount: integer("open_count").default(0),
    clickCount: integer("click_count").default(0),
    replyCount: integer("reply_count").default(0),
    
    // Call-specific fields
    callDuration: integer("call_duration"), // In seconds
    callRecordingUrl: text("call_recording_url"),
    callTranscript: text("call_transcript"),
    callOutcome: text("call_outcome"), // 'connected', 'voicemail', 'no_answer', 'busy'
    
    // Meeting-specific fields
    meetingStartTime: timestamp("meeting_start_time"),
    meetingEndTime: timestamp("meeting_end_time"),
    meetingLocation: text("meeting_location"),
    meetingUrl: text("meeting_url"), // Video meeting link
    meetingAttendees: jsonb("meeting_attendees"),
    meetingAgenda: text("meeting_agenda"),
    meetingNotes: text("meeting_notes"),
    
    // Attachments
    hasAttachments: boolean("has_attachments").default(false),
    attachments: jsonb("attachments"), // Array of attachment metadata
    
    // Sentiment and analysis
    sentiment: text("sentiment"), // 'positive', 'neutral', 'negative'
    sentimentScore: integer("sentiment_score"), // -100 to 100
    language: text("language"), // Detected language
    
    // Tags and categorization
    tags: text("tags").array().default(sql`ARRAY[]::text[]`),
    category: text("category"),
    
    // Source and integration
    source: text("source"), // 'manual', 'api', 'integration', 'automation'
    sourceId: text("source_id"), // External ID from source system
    integrationId: text("integration_id"), // Which integration created this
    
    // Privacy and visibility
    isPrivate: boolean("is_private").default(false),
    visibility: text("visibility").default('organization'), // 'private', 'team', 'organization'
    
    // Automation
    isAutomated: boolean("is_automated").default(false),
    automationId: text("automation_id"), // Which automation sent this
    templateId: text("template_id"), // Which template was used
    
    // User tracking
    createdById: bigint("created_by_id", { mode: "number" })
      .references(() => person.id, { onDelete: "set null" }),
    updatedById: bigint("updated_by_id", { mode: "number" })
      .references(() => person.id, { onDelete: "set null" }),
    
    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    scheduledFor: timestamp("scheduled_for"), // For scheduled sends
    occurredAt: timestamp("occurred_at"), // When the communication actually happened
  },
  (table) => ({
    // Core indexes
    uidIdx: index("comm_uid_idx").on(table.uid),
    orgIdx: index("comm_org_idx").on(table.organizationId),
    
    // Type indexes
    typeIdx: index("comm_type_idx").on(table.type),
    directionIdx: index("comm_direction_idx").on(table.direction),
    channelIdx: index("comm_channel_idx").on(table.channel),
    
    // Participant indexes
    fromPersonIdx: index("comm_from_person_idx").on(table.fromPersonId),
    fromEmailIdx: index("comm_from_email_idx").on(table.fromEmail),
    
    // Related entity
    relatedEntityIdx: index("comm_related_entity_idx").on(table.relatedEntityType, table.relatedEntityId),
    
    // Threading
    threadIdx: index("comm_thread_idx").on(table.threadId),
    parentIdx: index("comm_parent_idx").on(table.parentId),
    
    // Status
    statusIdx: index("comm_status_idx").on(table.status),
    
    // Time indexes
    sentAtIdx: index("comm_sent_at_idx").on(table.sentAt),
    occurredAtIdx: index("comm_occurred_at_idx").on(table.occurredAt),
    scheduledIdx: index("comm_scheduled_idx").on(table.scheduledFor),
    
    // Source
    sourceIdx: index("comm_source_idx").on(table.source),
    automationIdx: index("comm_automation_idx").on(table.automationId),
  })
);

/**
 * Communication templates for reusable content
 */
export const communicationTemplate = createTable(
  "communication_template",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    
    organizationId: bigint("organization_id", { mode: "number" })
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    
    // Template identification
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    
    // Template type
    type: text("type").notNull(), // 'email', 'sms', 'chat'
    category: text("category"), // 'marketing', 'transactional', 'notification'
    
    // Content
    subject: text("subject"),
    content: text("content"),
    contentHtml: text("content_html"),
    
    // Variables
    variables: jsonb("variables"), // Available merge variables
    requiredVariables: text("required_variables").array(),
    
    // Settings
    isActive: boolean("is_active").default(true),
    isSystem: boolean("is_system").default(false),
    
    // Usage tracking
    useCount: integer("use_count").default(0),
    lastUsedAt: timestamp("last_used_at"),
    
    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdx: index("comm_template_org_idx").on(table.organizationId),
    slugIdx: unique("comm_template_slug_idx").on(table.organizationId, table.slug),
    typeIdx: index("comm_template_type_idx").on(table.type),
    activeIdx: index("comm_template_active_idx").on(table.isActive),
  })
);

// Type exports
export type Communication = typeof communication.$inferSelect;
export type NewCommunication = typeof communication.$inferInsert;
export type CommunicationTemplate = typeof communicationTemplate.$inferSelect;
export type NewCommunicationTemplate = typeof communicationTemplate.$inferInsert;

// Validation schemas
export const insertCommunicationSchema = createInsertSchema(communication, {
  type: z.enum(['email', 'call', 'sms', 'meeting', 'note', 'chat', 'social']),
  direction: z.enum(['inbound', 'outbound', 'internal']).optional(),
  channel: z.enum(['email', 'phone', 'sms', 'whatsapp', 'slack', 'teams']).optional(),
  status: z.enum(['draft', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed']).optional(),
  sentiment: z.enum(['positive', 'neutral', 'negative']).optional(),
  visibility: z.enum(['private', 'team', 'organization']).optional(),
});

export const selectCommunicationSchema = createSelectSchema(communication);

export const insertCommunicationTemplateSchema = createInsertSchema(communicationTemplate, {
  type: z.enum(['email', 'sms', 'chat']),
  category: z.enum(['marketing', 'transactional', 'notification']).optional(),
});

export const selectCommunicationTemplateSchema = createSelectSchema(communicationTemplate);