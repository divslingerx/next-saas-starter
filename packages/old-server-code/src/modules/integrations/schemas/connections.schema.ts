import { createTable } from "@/db/utils";
import { nanoid } from "nanoid";
import { organization } from "@/db/schema";
import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const slacks = createTable("slacks", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  authedUserId: varchar("authed_user_id", { length: 255 }).notNull().unique(),
  authedUserToken: varchar("authed_user_token", { length: 255 })
    .notNull()
    .unique(),
  appId: varchar("app_id", { length: 255 }).notNull(),
  slackAccessToken: varchar("slack_access_token", { length: 255 })
    .notNull()
    .unique(),
  botUserId: varchar("bot_user_id", { length: 255 }).notNull(),
  teamId: varchar("team_id", { length: 255 }).notNull(),
  teamName: varchar("team_name", { length: 255 }).notNull(),
  organizationId: varchar("organization_id", { length: 15 }).references(
    () => organization.id
  ),
});

export const slackRelations = relations(slacks, ({ many }) => ({
  connections: many(connections),
}));

export const localGoogleCredentials = createTable("local_google_credentials", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  accessToken: varchar("access_token", { length: 255 }).notNull().unique(),
  folderId: varchar("folder_id", { length: 255 }),
  pageToken: varchar("page_token", { length: 255 }),
  channelId: varchar("channel_id", { length: 255 }).$defaultFn(() => nanoid()),
  subscribed: boolean("subscribed").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).$onUpdate(
    () => new Date()
  ),
  organizationId: varchar("organization_id", { length: 15 }).references(
    () => organization.id
  ),
});

export const notions = createTable("notion", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  accessToken: varchar("access_token", { length: 255 }).notNull().unique(),
  workspaceId: varchar("workspace_id", { length: 255 }).notNull().unique(),
  databaseId: varchar("database_id", { length: 255 }).notNull().unique(),
  workspaceName: varchar("workspace_name", { length: 255 }).notNull(),
  workspaceIcon: varchar("workspace_icon", { length: 255 }).notNull(),
  organizationId: varchar("user_id", { length: 15 }).references(
    () => organization.id
  ),
});

export const notionRelations = relations(notions, ({ many }) => ({
  connections: many(connections),
}));

export const connections = createTable("connections", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  type: varchar("type", { length: 255 }).notNull().unique(),
  discordWebhookId: integer("discord_webhook_id").references(
    () => discordWebhooks.id
  ),
  notionId: integer("notion_id").references(() => notions.id),
  organizationId: varchar("user_id", { length: 15 }).references(
    () => organization.id
  ),
  slackId: integer("slack_id").references(() => slacks.id),
});

export const connectionsRelations = relations(connections, ({ one }) => ({
  discordWebhook: one(discordWebhooks, {
    fields: [connections.discordWebhookId],
    references: [discordWebhooks.id],
  }),
  notion: one(notions, {
    fields: [connections.notionId],
    references: [notions.id],
  }),
  slack: one(slacks, {
    fields: [connections.slackId],
    references: [slacks.id],
  }),
  organization: one(organization, {
    fields: [connections.organizationId],
    references: [organization.id],
  }),
}));

export const discordWebhooks = createTable("discord_webhooks", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  webhookId: varchar("webhook_id", { length: 255 }).notNull().unique(),
  url: varchar("url", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  guildName: varchar("guild_name", { length: 255 }).notNull(),
  guildId: varchar("guild_id", { length: 255 }).notNull(),
  channelId: varchar("channel_id", { length: 255 }).notNull().unique(),
  organizationId: varchar("organization_id", { length: 255 })
    .references(() => organization.id)
    .notNull(),
});

export const discordWebhooksRelations = relations(
  discordWebhooks,
  ({ many }) => ({
    connections: many(connections),
  })
);

export const workflows = createTable("workflows", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  nodes: text("nodes"),
  edges: text("edges"),
  name: varchar("name", { length: 255 }).notNull(),
  discordTemplate: text("discord_template"),
  notionTemplate: text("notion_template"),
  slackTemplate: text("slack_template"),
  slackChannels: text("slack_channels").array().default([]),
  slackAccessToken: text("slack_access_token"),
  notionAccessToken: text("notion_access_token"),
  notionDbIds: text("notion_db_id"),
  flowpath: text("flowpath"),
  cronPath: text("cron_path"),
  published: boolean("published").default(false),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).$onUpdate(
    () => new Date()
  ),
  organizationId: varchar("organization_id", { length: 255 })
    .references(() => organization.id)
    .notNull(),
});

export type Workflow = typeof workflows.$inferSelect;
export type NewWorkflow = typeof workflows.$inferInsert;
