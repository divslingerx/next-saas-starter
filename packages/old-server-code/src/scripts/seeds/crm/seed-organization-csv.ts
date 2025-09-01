/**
 * Organization CRM Seeding with CSV-based Defaults
 * Seeds a new organization with default CRM objects, properties, and pipelines
 * Using CSV files for property definitions
 * 
 * NOTE: This script is temporarily disabled during platform schema refactor
 */

import { db } from "../../../db/index";
import { eq, and } from "drizzle-orm";
// TODO: CRM schema is being refactored - temporarily commented out
// import {
//   crmObject,
//   crmProperty,
//   crmPropertyGroup,
//   crmAssociationDefinition,
//   crmPipeline,
// } from "./crm-schema";
import {
  getDefaultPropertiesForObject,
  getDefaultPropertyGroups,
  transformToDbFormat,
  type PropertyDefault,
} from "./load-defaults";

// Default objects to create with HubSpot object IDs
const DEFAULT_OBJECTS = [
  {
    name: "contact",
    label: "Contact",
    pluralLabel: "Contacts",
    description: "Individual people",
    type: "standard",
    externalId: "0-1",
    externalSystem: "hubspot",
  },
  {
    name: "company",
    label: "Company",
    pluralLabel: "Companies",
    description: "Organizations and businesses",
    type: "standard",
    externalId: "0-2",
    externalSystem: "hubspot",
  },
  {
    name: "deal",
    label: "Deal",
    pluralLabel: "Deals",
    description: "Revenue opportunities",
    type: "standard",
    externalId: "0-3",
    externalSystem: "hubspot",
  },
  {
    name: "ticket",
    label: "Ticket",
    pluralLabel: "Tickets", 
    description: "Customer service requests",
    type: "standard",
    externalId: "0-5",
    externalSystem: "hubspot",
  },
  {
    name: "lead",
    label: "Lead",
    pluralLabel: "Leads",
    description: "Potential customers",
    type: "standard",
    externalId: "0-49",
    externalSystem: "hubspot",
  },
  {
    name: "task",
    label: "Task",
    pluralLabel: "Tasks",
    description: "Action items and to-dos",
    type: "activity",
    externalId: "0-4",
    externalSystem: "hubspot",
  },
  {
    name: "note",
    label: "Note", 
    pluralLabel: "Notes",
    description: "Text notes and comments",
    type: "activity",
    externalId: "0-4",
    externalSystem: "hubspot",
  },
];

export interface SeedOrganizationOptions {
  organizationId: string;
  createdById?: string;
  includeDefaults?: {
    contact?: boolean;
    company?: boolean;
    deal?: boolean;
    ticket?: boolean;
    lead?: boolean;
    task?: boolean;
    note?: boolean;
    objects?: boolean;
    properties?: boolean;
    pipelines?: boolean;
    associations?: boolean;
  };
  csvDefaults?: boolean; // Whether to use CSV-based defaults
}

/**
 * Seeds a new organization with default CRM configuration using CSV-based defaults
 */
export async function seedOrganizationCRMFromCSV(options: SeedOrganizationOptions) {
  console.warn('CRM seeding is temporarily disabled during platform schema refactor');
  console.log('Organization:', options.organizationId);
  
  // TODO: Implement new CRM seeding logic once platform schema is finalized
  return {
    objects: [],
    properties: [],
    associations: [],
    pipelines: []
  };
}