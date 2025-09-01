/**
 * Load Default Properties from CSV Files
 * This module reads CSV files and provides default properties for CRM objects
 */

import { readFileSync } from "fs";
import { join } from "path";
import { parse } from "csv-parse/sync";

export interface PropertyDefault {
  name: string;
  label: string;
  type: string;
  groupName: string;
  isRequired: boolean;
  isUnique: boolean;
  isSearchable: boolean;
  description?: string;
  options?: string;
  defaultValue?: string;
}

/**
 * Parse a CSV file and return property defaults
 */
function loadPropertiesFromCSV(filename: string): PropertyDefault[] {
  const filepath = join(__dirname, filename);
  const fileContent = readFileSync(filepath, "utf-8");
  
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  
  return records.map((record: any) => ({
    name: record.name,
    label: record.label,
    type: record.type,
    groupName: record.groupName,
    isRequired: record.isRequired === "true",
    isUnique: record.isUnique === "true",
    isSearchable: record.isSearchable === "true",
    description: record.description || undefined,
    options: record.options || undefined,
    defaultValue: record.defaultValue || undefined,
  }));
}

// Load all default properties
export const CONTACT_DEFAULTS = loadPropertiesFromCSV("contact-properties.csv");
export const COMPANY_DEFAULTS = loadPropertiesFromCSV("company-properties.csv");
export const TICKET_DEFAULTS = loadPropertiesFromCSV("ticket-properties.csv");
export const DEAL_DEFAULTS = loadPropertiesFromCSV("deal-properties.csv");
export const LEAD_DEFAULTS = loadPropertiesFromCSV("lead-properties.csv");

// Task and Note defaults (simpler objects)
export const TASK_DEFAULTS: PropertyDefault[] = [
  {
    name: "hs_task_subject",
    label: "Task Title",
    type: "string",
    groupName: "task_information",
    isRequired: true,
    isUnique: false,
    isSearchable: true,
    description: "The title or subject of the task",
  },
  {
    name: "hs_task_body",
    label: "Task Description",
    type: "textarea",
    groupName: "task_information",
    isRequired: false,
    isUnique: false,
    isSearchable: true,
    description: "Detailed description of the task",
  },
  {
    name: "hs_task_status",
    label: "Task Status",
    type: "select",
    groupName: "task_information",
    isRequired: true,
    isUnique: false,
    isSearchable: true,
    description: "Current status of the task",
    options: "not_started;in_progress;waiting;completed;deferred",
    defaultValue: "not_started",
  },
  {
    name: "hs_task_priority",
    label: "Priority",
    type: "select",
    groupName: "task_information",
    isRequired: false,
    isUnique: false,
    isSearchable: false,
    description: "Priority level of the task",
    options: "low;medium;high",
    defaultValue: "medium",
  },
  {
    name: "hs_task_due_date",
    label: "Due Date",
    type: "datetime",
    groupName: "task_information",
    isRequired: false,
    isUnique: false,
    isSearchable: false,
    description: "When the task is due",
  },
  {
    name: "hs_task_reminders",
    label: "Reminder Date",
    type: "datetime",
    groupName: "task_information",
    isRequired: false,
    isUnique: false,
    isSearchable: false,
    description: "When to send a reminder about the task",
  },
  {
    name: "hs_task_completion_date",
    label: "Completion Date",
    type: "datetime",
    groupName: "task_information",
    isRequired: false,
    isUnique: false,
    isSearchable: false,
    description: "When the task was completed",
  },
];

export const NOTE_DEFAULTS: PropertyDefault[] = [
  {
    name: "hs_note_body",
    label: "Note Content",
    type: "textarea",
    groupName: "note_information",
    isRequired: true,
    isUnique: false,
    isSearchable: true,
    description: "The content of the note",
  },
  {
    name: "hs_note_timestamp",
    label: "Note Date",
    type: "datetime",
    groupName: "note_information",
    isRequired: true,
    isUnique: false,
    isSearchable: false,
    description: "When the note was created",
  },
  {
    name: "hs_attachment_ids",
    label: "Attachments",
    type: "string",
    groupName: "note_information",
    isRequired: false,
    isUnique: false,
    isSearchable: false,
    description: "IDs of attached files",
  },
];

/**
 * Get default properties for a specific object type
 */
export function getDefaultPropertiesForObject(objectName: string): PropertyDefault[] {
  switch (objectName.toLowerCase()) {
    case "contact":
      return CONTACT_DEFAULTS;
    case "company":
      return COMPANY_DEFAULTS;
    case "ticket":
      return TICKET_DEFAULTS;
    case "deal":
      return DEAL_DEFAULTS;
    case "lead":
      return LEAD_DEFAULTS;
    case "task":
      return TASK_DEFAULTS;
    case "note":
      return NOTE_DEFAULTS;
    default:
      return [];
  }
}

/**
 * Get default property groups for an object
 */
export function getDefaultPropertyGroups(objectName: string): string[] {
  const properties = getDefaultPropertiesForObject(objectName);
  const groups = new Set(properties.map(p => p.groupName));
  return Array.from(groups);
}

/**
 * Transform property defaults to database format
 */
export function transformToDbFormat(property: PropertyDefault, objectId: number, groupId?: number) {
  // Parse options if they exist
  let optionsArray: string[] | undefined;
  if (property.options) {
    optionsArray = property.options.split(";");
  }
  
  return {
    objectId,
    groupId,
    name: property.name,
    label: property.label,
    type: property.type as any,
    description: property.description,
    isRequired: property.isRequired,
    isUnique: property.isUnique,
    isSearchable: property.isSearchable,
    isCustom: false,
    isPlatformDefined: true, // All CSV properties are platform-defined
    sortOrder: 0, // Will be set during insertion
    displayOrder: 0, // Will be set during insertion
    fieldType: property.type === "multiselect" ? "checkbox" : 
               property.type === "select" ? "select" :
               property.type === "textarea" ? "textarea" :
               property.type === "boolean" ? "booleancheckbox" :
               property.type === "number" ? "number" :
               property.type === "date" ? "date" :
               property.type === "datetime" ? "datetime" :
               "text",
    options: optionsArray,
    defaultValue: property.defaultValue,
    validationRules: {},
    hasHistory: true,
    isEncrypted: false,
    showInUI: true,
    isComputed: false,
    computeFunction: null,
    isReadOnly: ["createdate", "hs_object_id", "hs_lastmodifieddate", "hs_created_by_user_id"].includes(property.name),
    canDelete: !property.isRequired,
    canModify: !["hs_object_id", "createdate"].includes(property.name),
  };
}