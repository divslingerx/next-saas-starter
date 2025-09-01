/**
 * Core Business Entities
 * Simplified schema for freelancer/agency platform
 * Uses JSONB for flexibility without over-engineering
 */

import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  json,
  text,
  timestamp,
  varchar,
  pgEnum,
  unique,
} from "drizzle-orm/pg-core";
import { createTable } from "../utils";
import { organization } from "./auth";

// ==========================================
// Enums
// ==========================================

export const clientStatusEnum = pgEnum("client_status", [
  "prospect",
  "active",
  "inactive",
  "past",
]);

export const projectStatusEnum = pgEnum("project_status", [
  "planning",
  "active",
  "on_hold",
  "completed",
  "cancelled",
]);

// ==========================================
// Field Schema Table
// ==========================================

/**
 * Field schemas define the custom fields for each entity type
 * Includes defaults, validation rules, and field metadata
 */
export const fieldSchemas = createTable(
  "field_schemas",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    organizationId: varchar("organization_id", { length: 15 })
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    
    entityType: varchar("entity_type", { length: 50 }).notNull(), // 'client', 'contact', 'company', 'project'
    
    // The schema definition
    fields: json("fields").$type<Record<string, {
      type: "text" | "number" | "date" | "select" | "multiselect" | "currency" | "boolean" | "email" | "url";
      label: string;
      required?: boolean;
      defaultValue?: any;
      options?: string[]; // for select/multiselect
      min?: number;
      max?: number;
      trackHistory?: boolean; // whether to track history for this field
    }>>().notNull().default({}),
    
    // Metadata
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  },
  (table) => [
    index("field_schemas_org_id_idx").on(table.organizationId),
    index("field_schemas_entity_type_idx").on(table.entityType),
    // Ensure one schema per entity type per organization
    unique("field_schemas_unique_idx").on(table.organizationId, table.entityType),
  ]
);

// ==========================================
// Core Tables
// ==========================================

/**
 * Contacts - Individual people
 * Can belong to a company, be standalone, or both
 */
export const contacts = createTable(
  "contacts",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    organizationId: varchar("organization_id", { length: 15 })
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    
    // Core fields
    email: varchar("email", { length: 255 }).notNull(),
    firstName: varchar("first_name", { length: 100 }),
    lastName: varchar("last_name", { length: 100 }),
    phone: varchar("phone", { length: 50 }),
    
    // Relationships
    companyId: integer("company_id").references(() => companies.id, { onDelete: "set null" }),
    
    // Flexible fields
    tags: text("tags").array().default([]),
    custom: json("custom").$type<Record<string, any>>().default({}),
    
    // Metadata
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  },
  (table) => [
    index("contacts_org_id_idx").on(table.organizationId),
    index("contacts_email_idx").on(table.email),
    index("contacts_company_id_idx").on(table.companyId),
  ]
);

/**
 * Companies - Organizations/businesses
 */
export const companies = createTable(
  "companies",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    organizationId: varchar("organization_id", { length: 15 })
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    
    // Core fields
    name: varchar("name", { length: 255 }).notNull(),
    domain: varchar("domain", { length: 255 }),
    
    // Flexible fields
    tags: text("tags").array().default([]),
    custom: json("custom").$type<Record<string, any>>().default({}),
    
    // Metadata
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  },
  (table) => [
    index("companies_org_id_idx").on(table.organizationId),
    index("companies_name_idx").on(table.name),
    index("companies_domain_idx").on(table.domain),
  ]
);

/**
 * Clients - The business relationship
 * Can be linked to company, contact, or both
 */
export const clients = createTable(
  "clients",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    organizationId: varchar("organization_id", { length: 15 })
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    
    // Core fields
    name: varchar("name", { length: 255 }).notNull(),
    status: clientStatusEnum("status").notNull().default("prospect"),
    
    // Relationships (flexible - can have one, both, or neither)
    companyId: integer("company_id").references(() => companies.id, { onDelete: "set null" }),
    primaryContactIds: integer("primary_contact_ids").array().default([]),
    
    // Billing info in JSONB for flexibility
    billing: json("billing").$type<{
      method?: "hourly" | "retainer" | "project" | "mixed";
      hourlyRate?: number;
      retainerAmount?: number;
      paymentTerms?: string;
      currency?: string;
    }>().default({}),
    
    // Flexible fields
    tags: text("tags").array().default([]),
    custom: json("custom").$type<Record<string, any>>().default({}),
    
    // Metadata
    clientSince: timestamp("client_since"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  },
  (table) => [
    index("clients_org_id_idx").on(table.organizationId),
    index("clients_status_idx").on(table.status),
    index("clients_company_id_idx").on(table.companyId),
  ]
);

/**
 * Projects - Work being done for clients
 */
export const projects = createTable(
  "projects",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    organizationId: varchar("organization_id", { length: 15 })
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    
    // Core fields
    name: varchar("name", { length: 255 }).notNull(),
    status: projectStatusEnum("status").notNull().default("planning"),
    description: text("description"),
    
    // Relationships
    clientId: integer("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    
    // Timeline and budget in JSONB for flexibility
    timeline: json("timeline").$type<{
      startDate?: string;
      endDate?: string;
      estimatedHours?: number;
      actualHours?: number;
    }>().default({}),
    
    budget: json("budget").$type<{
      total?: number;
      spent?: number;
      currency?: string;
    }>().default({}),
    
    // Flexible fields
    tags: text("tags").array().default([]),
    custom: json("custom").$type<Record<string, any>>().default({}),
    
    // Metadata
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  },
  (table) => [
    index("projects_org_id_idx").on(table.organizationId),
    index("projects_client_id_idx").on(table.clientId),
    index("projects_status_idx").on(table.status),
  ]
);

/**
 * Lists - Saved segments/filters for any entity type
 */
export const lists = createTable(
  "lists",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    organizationId: varchar("organization_id", { length: 15 })
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    
    name: varchar("name", { length: 255 }).notNull(),
    entityType: varchar("entity_type", { length: 50 }).notNull(), // 'contact', 'company', 'client', 'project'
    
    // List type and criteria
    listType: varchar("list_type", { length: 20 }).notNull().default("static"), // 'static' or 'smart'
    criteria: json("criteria").$type<Array<{
      field: string;
      operator: string;
      value: any;
    }>>().default([]),
    
    // For static lists, track members
    memberIds: integer("member_ids").array().default([]),
    
    // Metadata
    isPublic: boolean("is_public").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  },
  (table) => [
    index("lists_org_id_idx").on(table.organizationId),
    index("lists_entity_type_idx").on(table.entityType),
  ]
);

// ==========================================
// Relations
// ==========================================

export const fieldSchemasRelations = relations(fieldSchemas, ({ one }) => ({
  organization: one(organization, {
    fields: [fieldSchemas.organizationId],
    references: [organization.id],
  }),
}));

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  organization: one(organization, {
    fields: [contacts.organizationId],
    references: [organization.id],
  }),
  company: one(companies, {
    fields: [contacts.companyId],
    references: [companies.id],
  }),
}));

export const companiesRelations = relations(companies, ({ one, many }) => ({
  organization: one(organization, {
    fields: [companies.organizationId],
    references: [organization.id],
  }),
  contacts: many(contacts),
  clients: many(clients),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  organization: one(organization, {
    fields: [clients.organizationId],
    references: [organization.id],
  }),
  company: one(companies, {
    fields: [clients.companyId],
    references: [companies.id],
  }),
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one }) => ({
  organization: one(organization, {
    fields: [projects.organizationId],
    references: [organization.id],
  }),
  client: one(clients, {
    fields: [projects.clientId],
    references: [clients.id],
  }),
}));

export const listsRelations = relations(lists, ({ one }) => ({
  organization: one(organization, {
    fields: [lists.organizationId],
    references: [organization.id],
  }),
}));

// ==========================================
// Type exports
// ==========================================

export type FieldSchema = typeof fieldSchemas.$inferSelect;
export type NewFieldSchema = typeof fieldSchemas.$inferInsert;
export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;
export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type List = typeof lists.$inferSelect;
export type NewList = typeof lists.$inferInsert;

// Custom field value types with history support
export interface CustomFieldValue {
  value: any;
  date: string;
  source?: "manual" | "api" | "workflow" | "import";
  changedBy?: string;
}

export interface CustomFields {
  [key: string]: any | CustomFieldValue[];
  _history?: {
    [key: string]: CustomFieldValue[];
  };
}