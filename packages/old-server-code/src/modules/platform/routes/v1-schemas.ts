/**
 * Platform API v1 Validation Schemas
 * Zod schemas for request/response validation
 */

import { z } from "zod";

// Common schemas
export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number)
});

export const clientIdParamSchema = z.object({
  clientId: z.string().regex(/^\d+$/).transform(Number)
});

export const objectTypeParamSchema = z.object({
  objectType: z.string().min(1).max(50)
});

export const paginationQuerySchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).refine(n => n <= 100, "Limit cannot exceed 100").optional(),
  after: z.string().optional()
});

// Generic object schemas
export const createObjectSchema = z.object({
  properties: z.record(z.string(), z.any()).refine(
    (props) => Object.keys(props).length > 0,
    { message: "At least one property is required" }
  )
});

export const updateObjectSchema = z.object({
  properties: z.record(z.string(), z.any()).refine(
    (props) => Object.keys(props).length > 0,
    { message: "At least one property is required" }
  )
});

// Batch operation schemas
export const batchCreateSchema = z.object({
  inputs: z.array(z.object({
    properties: z.record(z.string(), z.any())
  })).min(1, "At least one input is required").max(100, "Maximum 100 inputs allowed")
});

export const batchUpdateSchema = z.object({
  inputs: z.array(z.object({
    id: z.number(),
    properties: z.record(z.string(), z.any())
  })).min(1, "At least one input is required").max(100, "Maximum 100 inputs allowed")
});

// Search schemas
export const filterConditionSchema = z.object({
  field: z.string().min(1),
  operator: z.enum([
    'EQ', 'NEQ', 'GT', 'GTE', 'LT', 'LTE', 
    'CONTAINS_TOKEN', 'NOT_CONTAINS_TOKEN', 'IN', 'NOT_IN'
  ]),
  value: z.any()
});

export const filterGroupSchema = z.object({
  filters: z.array(filterConditionSchema).min(1)
});

export const sortSchema = z.object({
  propertyName: z.string().min(1),
  direction: z.enum(['ASCENDING', 'DESCENDING'])
});

export const searchSchema = z.object({
  filterGroups: z.array(filterGroupSchema).optional(),
  sorts: z.array(sortSchema).optional(),
  query: z.string().optional(),
  properties: z.array(z.string()).optional(),
  limit: z.number().min(1).max(100).optional(),
  after: z.string().optional()
});

// Client-specific schemas
export const clientPropertiesSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters").optional(),
  email: z.string().email("Must be a valid email").optional(),
  phone: z.string().regex(/^[+]?[1-9][\d\s\-()]{7,15}$/, "Must be a valid phone number").optional(),
  domain: z.string().url("Must be a valid domain URL").optional(),
  company: z.string().max(200, "Company name must be less than 200 characters").optional(),
  website: z.string().url("Must be a valid website URL").optional(),
  industry: z.enum([
    "technology", "healthcare", "finance", "education", "retail", 
    "manufacturing", "consulting", "marketing", "real-estate", "other"
  ]).optional(),
  city: z.string().max(50, "City must be less than 50 characters").optional(),
  state: z.string().max(50, "State must be less than 50 characters").optional(),
  country: z.string().length(2, "Country must be 2-letter code").optional(),
  postal_code: z.string().max(20, "Postal code must be less than 20 characters").optional(),
  address: z.string().max(500, "Address must be less than 500 characters").optional(),
  lifecycle_stage: z.enum([
    "lead", "marketing-qualified-lead", "sales-qualified-lead", "opportunity", "customer"
  ]).optional(),
  lead_status: z.enum([
    "new", "open", "in-progress", "open-deal", "unqualified", 
    "attempted-to-contact", "connected", "bad-timing"
  ]).optional(),
  createdate: z.string().datetime().optional(),
  lastmodifieddate: z.string().datetime().optional(),
}).refine(
  (data) => data.name || data.email,
  {
    message: "Either name or email is required",
    path: ["name"], // Show error on name field
  }
);

export const createClientSchema = z.object({
  properties: clientPropertiesSchema
});

export const updateClientSchema = z.object({
  properties: clientPropertiesSchema.partial()
});

export const clientSearchSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  domain: z.string().optional(),
  company: z.string().optional(),
  industry: z.string().optional(),
  lifecycle_stage: z.string().optional(),
  lead_status: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  created_after: z.string().datetime().optional(),
  created_before: z.string().datetime().optional(),
}).and(paginationQuerySchema);

export const lifecycleStageParamSchema = z.object({
  stage: z.enum(["lead", "marketing-qualified-lead", "sales-qualified-lead", "opportunity", "customer"])
});

export const leadStatusParamSchema = z.object({
  status: z.enum([
    "new", "open", "in-progress", "open-deal", "unqualified", 
    "attempted-to-contact", "connected", "bad-timing"
  ])
});

export const recentClientsQuerySchema = z.object({
  days: z.string().regex(/^\d+$/).transform(Number).optional()
});

export const markUnqualifiedSchema = z.object({
  reason: z.string().min(1).max(500).optional()
});

export const bulkUpdateLifecycleSchema = z.object({
  clientIds: z.array(z.number()).min(1).max(100),
  newStage: z.enum(["lead", "marketing-qualified-lead", "sales-qualified-lead", "opportunity", "customer"])
});

export const importClientsSchema = z.object({
  clients: z.array(clientPropertiesSchema).min(1).max(1000),
  updateExisting: z.boolean().optional()
});

// Response schemas
export const standardRecordSchema = z.object({
  id: z.number(),
  properties: z.record(z.string(), z.any()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().nullable(),
  archived: z.boolean()
});

export const paginatedResponseSchema = z.object({
  results: z.array(standardRecordSchema),
  paging: z.object({
    next: z.object({
      after: z.string()
    }).optional()
  }).optional()
});

export const batchOperationResponseSchema = z.object({
  success: z.number(),
  failed: z.number(),
  skipped: z.number(),
  errors: z.array(z.object({
    recordId: z.number(),
    error: z.string(),
    details: z.any().optional()
  }))
});

export const searchResponseSchema = z.object({
  total: z.number(),
  results: z.array(standardRecordSchema),
  paging: z.object({
    next: z.object({
      after: z.string()
    }).optional()
  }).optional()
});

export const clientStatsResponseSchema = z.object({
  total: z.number(),
  by_lifecycle_stage: z.record(z.string(), z.number()),
  by_lead_status: z.record(z.string(), z.number()),
  recent_count: z.number()
});

export const importResultSchema = z.object({
  created: z.number(),
  updated: z.number(),
  skipped: z.number(),
  errors: z.array(z.object({
    index: z.number(),
    error: z.string()
  }))
});

export const errorResponseSchema = z.object({
  status: z.literal("error"),
  message: z.string(),
  errors: z.array(z.object({
    field: z.string().optional(),
    message: z.string()
  })).optional()
});