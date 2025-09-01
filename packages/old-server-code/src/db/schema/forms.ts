import {
  serial,
  varchar,
  text,
  integer,
  boolean,
  jsonb,
  timestamp,
  foreignKey,
} from "drizzle-orm/pg-core";

import { createTable } from "../utils";
import { account } from "./auth";

// Forms table
export const forms = createTable("forms", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  accountId: varchar("account_id", { length: 255 }).notNull(),
  membershipId: varchar("membership_id", { length: 255 }), // Optional, if applicable
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Fields table – each field belongs to a form and includes tenant info
export const fields = createTable("fields", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  formId: integer("form_id")
    .notNull()
    .references(() => forms.id, { onDelete: "cascade" }),
  accountId: varchar("account_id", { length: 255 }).notNull(),
  membershipId: varchar("membership_id", { length: 255 }),
  fieldName: varchar("field_name", { length: 100 }).notNull(), // Internal identifier
  label: varchar("label", { length: 255 }).notNull(), // Display label
  type: varchar("type", { length: 50 }).notNull(), // e.g., text, number, date, checkbox, etc.
  placeholder: varchar("placeholder", { length: 255 }),
  orderIndex: integer("order_index").notNull().default(0),
  required: boolean("required").notNull().default(false),
  customProperties: jsonb("custom_properties"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Field Validations table – rules to validate field input
export const fieldValidations = createTable("field_validations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  fieldId: integer("field_id")
    .notNull()
    .references(() => fields.id, { onDelete: "cascade" }),
  accountId: varchar("account_id", { length: 255 })
    .notNull()
    .references(() => account.id),
  membershipId: varchar("membership_id", { length: 255 }),
  validationType: varchar("validation_type", { length: 50 }).notNull(), // e.g., regex, min_length, etc.
  validationParams: jsonb("validation_params"), // e.g., { "regex": "^[A-Za-z]+$" }
  errorMessage: varchar("error_message", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Field Styles table – custom CSS classes or inline style definitions
export const fieldStyles = createTable("field_styles", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  fieldId: integer("field_id")
    .notNull()
    .references(() => fields.id, { onDelete: "cascade" }),
  accountId: varchar("account_id", { length: 255 }).notNull(),
  membershipId: varchar("membership_id", { length: 255 }),
  cssClass: varchar("css_class", { length: 255 }),
  inlineStyles: jsonb("inline_styles"), // e.g., { "color": "#333", "margin": "10px" }
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Form Logic table – rules for conditional display, calculations, etc.
export const formLogic = createTable("form_logic", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  formId: integer("form_id")
    .notNull()
    .references(() => forms.id, { onDelete: "cascade" }),
  accountId: varchar("account_id", { length: 255 }).notNull(),
  membershipId: varchar("membership_id", { length: 255 }),
  triggerField: integer("trigger_field").references(() => fields.id, {
    onDelete: "set null",
  }),
  conditionOperator: varchar("condition_operator", { length: 50 }).notNull(), // e.g., '=', '>', '<'
  conditionValue: text("condition_value").notNull(),
  targetField: integer("target_field").references(() => fields.id, {
    onDelete: "set null",
  }),
  action: varchar("action", { length: 50 }).notNull(), // e.g., 'show', 'hide', 'calculate'
  actionParams: jsonb("action_params"), // Additional parameters for the action
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
