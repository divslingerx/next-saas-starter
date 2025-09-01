/**
 * Organization CRM Seeding
 * Seeds a new organization with default CRM objects, properties, and pipelines
 * 
 * NOTE: This script is temporarily disabled during platform schema refactor
 */

import { db } from "../../../db/index";
// TODO: CRM schema is being refactored - temporarily commented out
// import {
//   crmObject,
//   crmProperty,
//   crmPropertyGroup,
//   crmAssociationDefinition,
//   crmPipeline,
// } from "./crm-schema";
// import {
//   DEFAULT_OBJECTS,
//   DEFAULT_PROPERTIES,
//   DEFAULT_PROPERTY_GROUPS,
//   DEFAULT_ASSOCIATIONS,
//   DEFAULT_PIPELINES,
// } from "./default-objects";

export interface SeedOrganizationOptions {
  organizationId: string;
  createdById?: string;
  includeDefaults?: {
    objects?: boolean;
    properties?: boolean;
    pipelines?: boolean;
    associations?: boolean;
  };
}

/**
 * Seeds a new organization with default CRM configuration
 */
export async function seedOrganizationCRM(options: SeedOrganizationOptions) {
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