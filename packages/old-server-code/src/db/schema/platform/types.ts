/**
 * Platform TypeScript Types
 * Strongly typed interfaces for platform entities
 */

import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import type {
  objectDefinition,
  record,
  organizationObjectSchema,
} from "./core";
import type {
  associationType,
  association,
  organizationAssociationLabel,
} from "./associations";
import type {
  list,
  listMembership,
  savedFilter,
  segment,
} from "./lists";
import type {
  pipeline,
  recordStage,
  stageHistory,
  pipelineMetrics,
  stageAutomation,
} from "./pipelines";
import type {
  auditLog,
  propertyHistory,
  bulkOperationLog,
  dataExportLog,
  accessLog,
} from "./audit";

// ==========================================
// CORE TYPES
// ==========================================

export type ObjectDefinition = InferSelectModel<typeof objectDefinition>;
export type NewObjectDefinition = InferInsertModel<typeof objectDefinition>;

export type Record = InferSelectModel<typeof record>;
export type NewRecord = InferInsertModel<typeof record>;

export type OrganizationObjectSchema = InferSelectModel<typeof organizationObjectSchema>;
export type NewOrganizationObjectSchema = InferInsertModel<typeof organizationObjectSchema>;

// ==========================================
// ASSOCIATION TYPES
// ==========================================

export type AssociationType = InferSelectModel<typeof associationType>;
export type NewAssociationType = InferInsertModel<typeof associationType>;

export type Association = InferSelectModel<typeof association>;
export type NewAssociation = InferInsertModel<typeof association>;

export type OrganizationAssociationLabel = InferSelectModel<typeof organizationAssociationLabel>;
export type NewOrganizationAssociationLabel = InferInsertModel<typeof organizationAssociationLabel>;

// ==========================================
// LIST TYPES
// ==========================================

export type List = InferSelectModel<typeof list>;
export type NewList = InferInsertModel<typeof list>;

export type ListMembership = InferSelectModel<typeof listMembership>;
export type NewListMembership = InferInsertModel<typeof listMembership>;

export type SavedFilter = InferSelectModel<typeof savedFilter>;
export type NewSavedFilter = InferInsertModel<typeof savedFilter>;

export type Segment = InferSelectModel<typeof segment>;
export type NewSegment = InferInsertModel<typeof segment>;

// ==========================================
// PIPELINE TYPES
// ==========================================

export type Pipeline = InferSelectModel<typeof pipeline>;
export type NewPipeline = InferInsertModel<typeof pipeline>;

export type RecordStage = InferSelectModel<typeof recordStage>;
export type NewRecordStage = InferInsertModel<typeof recordStage>;

export type StageHistory = InferSelectModel<typeof stageHistory>;
export type NewStageHistory = InferInsertModel<typeof stageHistory>;

export type PipelineMetrics = InferSelectModel<typeof pipelineMetrics>;
export type NewPipelineMetrics = InferInsertModel<typeof pipelineMetrics>;

export type StageAutomation = InferSelectModel<typeof stageAutomation>;
export type NewStageAutomation = InferInsertModel<typeof stageAutomation>;

// ==========================================
// AUDIT TYPES
// ==========================================

export type AuditLog = InferSelectModel<typeof auditLog>;
export type NewAuditLog = InferInsertModel<typeof auditLog>;

export type PropertyHistory = InferSelectModel<typeof propertyHistory>;
export type NewPropertyHistory = InferInsertModel<typeof propertyHistory>;

export type BulkOperationLog = InferSelectModel<typeof bulkOperationLog>;
export type NewBulkOperationLog = InferInsertModel<typeof bulkOperationLog>;

export type DataExportLog = InferSelectModel<typeof dataExportLog>;
export type NewDataExportLog = InferInsertModel<typeof dataExportLog>;

export type AccessLog = InferSelectModel<typeof accessLog>;
export type NewAccessLog = InferInsertModel<typeof accessLog>;

// ==========================================
// PROPERTY TYPES
// ==========================================

export interface PropertyDefinition {
  type: string;
  label: string;
  required?: boolean;
  default?: any;
  indexed?: boolean;
  unique?: boolean;
  description?: string;
  validation?: PropertyValidation;
  options?: string[]; // For enumeration/multi_select
  reference?: string; // For reference types
}

export interface PropertyValidation {
  pattern?: string;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  message?: string;
}

// ==========================================
// FILTER TYPES
// ==========================================

export interface FilterCriteria {
  operator: "and" | "or";
  conditions: FilterCondition[];
}

export interface FilterCondition {
  field: string;
  operator: string;
  value: any;
  type?: string;
}

// ==========================================
// STAGE TYPES
// ==========================================

export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  color?: string;
  probability?: number;
  metadata?: globalThis.Record<string, any>;
  automations?: StageAutomationConfig[];
}

export interface StageAutomationConfig {
  trigger: string;
  action: string;
  config: globalThis.Record<string, any>;
}

// ==========================================
// RECORD WITH ASSOCIATIONS
// ==========================================

export interface RecordWithAssociations extends Record {
  associations?: {
    from: AssociationDetail[];
    to: AssociationDetail[];
  };
  stage?: RecordStage;
  lists?: List[];
}

export interface AssociationDetail {
  type: string;
  typeId: number;
  recordId: number;
  record?: Record;
  properties?: globalThis.Record<string, any>;
}

// ==========================================
// SEARCH TYPES
// ==========================================

export interface SearchParams {
  organizationId: string;
  query: string;
  objectType?: string;
  filters?: FilterCriteria;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface SearchResult {
  recordId: number;
  objectType: string;
  displayName: string;
  properties: globalThis.Record<string, any>;
  score: number;
  highlights?: globalThis.Record<string, string[]>;
}

// ==========================================
// BULK OPERATION TYPES
// ==========================================

export interface BulkOperation {
  type: string;
  recordIds: number[];
  updates?: globalThis.Record<string, any>;
  options?: BulkOperationOptions;
}

export interface BulkOperationOptions {
  skipValidation?: boolean;
  skipTriggers?: boolean;
  skipAudit?: boolean;
  rollbackOnError?: boolean;
}

export interface BulkOperationResult {
  success: number;
  failed: number;
  skipped: number;
  errors: BulkOperationError[];
}

export interface BulkOperationError {
  recordId: number;
  error: string;
  details?: any;
}

// ==========================================
// IMPORT/EXPORT TYPES
// ==========================================

export interface ImportConfig {
  objectType: string;
  mapping: globalThis.Record<string, string>;
  options: ImportOptions;
}

export interface ImportOptions {
  updateExisting?: boolean;
  skipDuplicates?: boolean;
  validateData?: boolean;
  dryRun?: boolean;
}

export interface ExportConfig {
  objectTypes: string[];
  filters?: FilterCriteria;
  fields?: string[];
  format: "csv" | "json" | "excel";
  options?: ExportOptions;
}

export interface ExportOptions {
  includeAssociations?: boolean;
  includeHistory?: boolean;
  compress?: boolean;
  encrypt?: boolean;
}

// ==========================================
// SCHEMA MIGRATION TYPES
// ==========================================

export interface SchemaMigration {
  version: number;
  timestamp: string;
  description: string;
  changes: globalThis.Record<string, any>;
  rollbackData?: globalThis.Record<string, any> | null;
}

export interface MigrationData {
  description: string;
  changes: globalThis.Record<string, any>;
  rollbackData?: globalThis.Record<string, any>;
}