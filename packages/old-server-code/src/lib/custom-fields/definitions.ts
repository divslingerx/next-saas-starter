/**
 * Custom Field Definitions
 * Shared system for defining and validating custom fields across all entities
 */

export type FieldType = 
  | "text"
  | "number"
  | "date"
  | "select"
  | "multiselect"
  | "currency"
  | "boolean"
  | "email"
  | "url"
  | "phone";

export interface FieldDefinition {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  defaultValue?: any;
  placeholder?: string;
  helpText?: string;
  
  // Type-specific options
  options?: string[]; // for select/multiselect
  min?: number; // for number
  max?: number; // for number
  maxLength?: number; // for text
  currency?: string; // for currency type
}

// Predefined field sets for common use cases
export const FIELD_SETS = {
  // Client custom fields
  client: {
    timezone: {
      key: "timezone",
      label: "Time Zone",
      type: "select" as const,
      options: ["EST", "CST", "MST", "PST", "GMT", "CET", "JST", "AEST"],
      defaultValue: "EST",
    },
    preferredCommunication: {
      key: "preferredCommunication",
      label: "Preferred Communication",
      type: "multiselect" as const,
      options: ["Email", "Phone", "Slack", "Teams", "Discord", "In-Person"],
    },
    contractEndDate: {
      key: "contractEndDate",
      label: "Contract End Date",
      type: "date" as const,
    },
    internalNotes: {
      key: "internalNotes",
      label: "Internal Notes",
      type: "text" as const,
      maxLength: 5000,
      placeholder: "Private notes about this client",
    },
  },
  
  // Contact custom fields
  contact: {
    birthday: {
      key: "birthday",
      label: "Birthday",
      type: "date" as const,
    },
    linkedinUrl: {
      key: "linkedinUrl",
      label: "LinkedIn Profile",
      type: "url" as const,
      placeholder: "https://linkedin.com/in/...",
    },
    preferredName: {
      key: "preferredName",
      label: "Preferred Name",
      type: "text" as const,
      maxLength: 100,
    },
    source: {
      key: "source",
      label: "Lead Source",
      type: "select" as const,
      options: ["Website", "Referral", "Social Media", "Event", "Cold Outreach", "Other"],
    },
  },
  
  // Project custom fields
  project: {
    priority: {
      key: "priority",
      label: "Priority",
      type: "select" as const,
      options: ["Critical", "High", "Medium", "Low"],
      defaultValue: "Medium",
    },
    projectType: {
      key: "projectType",
      label: "Project Type",
      type: "select" as const,
      options: ["Website", "Web App", "Mobile App", "Consulting", "Maintenance", "Other"],
    },
    technologies: {
      key: "technologies",
      label: "Technologies",
      type: "multiselect" as const,
      options: ["React", "Next.js", "Node.js", "Python", "PostgreSQL", "MongoDB", "AWS", "Other"],
    },
    completionPercentage: {
      key: "completionPercentage",
      label: "Completion %",
      type: "number" as const,
      min: 0,
      max: 100,
      defaultValue: 0,
    },
  },
  
  // Company custom fields
  company: {
    industry: {
      key: "industry",
      label: "Industry",
      type: "select" as const,
      options: ["Technology", "Healthcare", "Finance", "Retail", "Manufacturing", "Education", "Other"],
    },
    employeeCount: {
      key: "employeeCount",
      label: "Employee Count",
      type: "select" as const,
      options: ["1-10", "11-50", "51-200", "201-500", "500+"],
    },
    annualRevenue: {
      key: "annualRevenue",
      label: "Annual Revenue",
      type: "currency" as const,
      currency: "USD",
    },
    website: {
      key: "website",
      label: "Website",
      type: "url" as const,
      placeholder: "https://example.com",
    },
  },
};

// Helper to get field definition
export function getFieldDefinition(entityType: keyof typeof FIELD_SETS, fieldKey: string): FieldDefinition | undefined {
  const entityFields = FIELD_SETS[entityType];
  if (!entityFields) return undefined;
  return entityFields[fieldKey as keyof typeof entityFields];
}

// Helper to get all fields for an entity type
export function getFieldsForEntity(entityType: keyof typeof FIELD_SETS): FieldDefinition[] {
  return Object.values(FIELD_SETS[entityType] || {});
}