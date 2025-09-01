/**
 * Platform Controller
 * REST API endpoints following HubSpot CRM v3 patterns
 */

import type { Context } from "hono";
import { z } from "zod";
import { PlatformService } from "../services/platform-service";

// Validation schemas
export const createRecordSchema = z.object({
  properties: z.record(z.string(), z.any()).refine(
    (props) => Object.keys(props).length > 0,
    { message: "At least one property is required" }
  )
});

export const updateRecordSchema = z.object({
  properties: z.record(z.string(), z.any()).refine(
    (props) => Object.keys(props).length > 0,
    { message: "At least one property is required" }
  )
});

export const batchInputSchema = z.object({
  inputs: z.array(z.object({
    id: z.number().optional(),
    properties: z.record(z.string(), z.any())
  })).min(1, "At least one input is required").max(100, "Maximum 100 inputs allowed")
});

export const searchRequestSchema = z.object({
  filterGroups: z.array(z.object({
    filters: z.array(z.object({
      field: z.string().min(1),
      operator: z.enum(['EQ', 'NEQ', 'GT', 'GTE', 'LT', 'LTE', 'CONTAINS_TOKEN', 'NOT_CONTAINS_TOKEN', 'IN', 'NOT_IN']),
      value: z.any()
    })).min(1).max(3) // HubSpot limit: max 3 filters per group
  })).max(3).optional(), // HubSpot limit: max 3 filter groups
  sorts: z.array(z.object({
    propertyName: z.string().min(1),
    direction: z.enum(['ASCENDING', 'DESCENDING'])
  })).max(1).optional(), // HubSpot limit: only 1 sort allowed
  query: z.string().optional(),
  properties: z.array(z.string()).optional(),
  limit: z.number().min(1).max(100).optional(),
  after: z.string().optional()
});

/**
 * Base controller for platform objects following HubSpot API patterns
 */
export abstract class PlatformController {
  protected abstract service: PlatformService;

  /**
   * Create a new record
   * POST /crm/v3/objects/{objectType}
   */
  async create(c: Context) {
    try {
      const body = await c.req.json();
      const validation = createRecordSchema.safeParse(body);
      
      if (!validation.success) {
        return c.json({
          status: "error",
          message: "Invalid request",
          errors: validation.error.issues
        }, 400);
      }

      const record = await this.service.create(validation.data.properties);

      return c.json({
        id: record.id,
        properties: record.properties,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        archived: record.isArchived
      });
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  /**
   * Get records with pagination
   * GET /crm/v3/objects/{objectType}
   */
  async getPage(c: Context) {
    try {
      const limit = parseInt(c.req.query('limit') || '10');
      const after = c.req.query('after');
      const properties = c.req.query('properties')?.split(',');
      const propertiesWithHistory = c.req.query('propertiesWithHistory')?.split(',');
      const associations = c.req.query('associations')?.split(',');
      const archived = c.req.query('archived') === 'true';

      const result = await this.service.getAll({
        limit,
        after
      });

      return c.json({
        results: result.results.map((record: any) => ({
          id: record.id,
          properties: record.properties,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
          archived: record.isArchived
        })),
        paging: result.paging
      });
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  /**
   * Get record by ID
   * GET /crm/v3/objects/{objectType}/{recordId}
   */
  async getById(c: Context) {
    try {
      const id = parseInt(c.req.param('id'));
      const properties = c.req.query('properties')?.split(',');
      const propertiesWithHistory = c.req.query('propertiesWithHistory')?.split(',');
      const associations = c.req.query('associations')?.split(',');

      if (isNaN(id)) {
        return c.json({
          status: "error",
          message: "Invalid ID"
        }, 400);
      }

      const record = await this.service.findById(id);
      
      if (!record) {
        return c.json({
          status: "error",
          message: "Record not found"
        }, 404);
      }

      return c.json({
        id: record.id,
        properties: record.properties,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        archived: record.isArchived
      });
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  /**
   * Update record
   * PATCH /crm/v3/objects/{objectType}/{recordId}
   */
  async update(c: Context) {
    try {
      const id = parseInt(c.req.param('id'));
      const body = await c.req.json();

      if (isNaN(id)) {
        return c.json({
          status: "error",
          message: "Invalid ID"
        }, 400);
      }

      const validation = updateRecordSchema.safeParse(body);
      if (!validation.success) {
        return c.json({
          status: "error",
          message: "Invalid request",
          errors: validation.error.issues
        }, 400);
      }

      const record = await this.service.update(id, validation.data.properties);

      return c.json({
        id: record.id,
        properties: record.properties,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        archived: record.isArchived
      });
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  /**
   * Archive record
   * DELETE /crm/v3/objects/{objectType}/{recordId}
   */
  async archive(c: Context) {
    try {
      const id = parseInt(c.req.param('id'));

      if (isNaN(id)) {
        return c.json({
          status: "error",
          message: "Invalid ID"
        }, 400);
      }

      await this.service.archive(id);

      return c.json({
        status: "success",
        message: "Record archived successfully"
      });
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  /**
   * Batch create records
   * POST /crm/v3/objects/{objectType}/batch/create
   */
  async batchCreate(c: Context) {
    try {
      const body = await c.req.json();
      const validation = batchInputSchema.safeParse(body);

      if (!validation.success) {
        return c.json({
          status: "error",
          message: "Invalid request",
          errors: validation.error.issues
        }, 400);
      }

      const result = await this.service.batchCreate(validation.data.inputs.map(input => input.properties));

      return c.json({
        success: result.success,
        failed: result.failed,
        skipped: result.skipped,
        errors: result.errors
      });
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  /**
   * Batch update records
   * POST /crm/v3/objects/{objectType}/batch/update
   */
  async batchUpdate(c: Context) {
    try {
      const body = await c.req.json();
      const validation = batchInputSchema.safeParse(body);

      if (!validation.success) {
        return c.json({
          status: "error",
          message: "Invalid request",
          errors: validation.error.issues
        }, 400);
      }

      const result = await this.service.batchUpdate(validation.data);

      return c.json({
        success: result.success,
        failed: result.failed,
        skipped: result.skipped,
        errors: result.errors
      });
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  /**
   * Search records
   * POST /crm/v3/objects/{objectType}/search
   */
  async search(c: Context) {
    try {
      const body = await c.req.json();
      const validation = searchRequestSchema.safeParse(body);

      if (!validation.success) {
        return c.json({
          status: "error",
          message: "Invalid search request",
          errors: validation.error.issues
        }, 400);
      }

      const result = await this.service.search({ 
        ...validation.data, 
        organizationId: c.get('organizationId') as string 
      });

      return c.json({
        total: result.total,
        results: result.results.map(record => ({
          id: record.id,
          properties: record.properties,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
          archived: record.isArchived
        })),
        paging: result.paging
      });
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  /**
   * Handle errors consistently
   */
  protected handleError(c: Context, error: any) {
    console.error('Platform Controller Error:', error);

    if (error.message === 'Permission denied') {
      return c.json({
        status: "error",
        message: "Permission denied"
      }, 403);
    }

    if (error.message === 'Record not found') {
      return c.json({
        status: "error",
        message: "Record not found"
      }, 404);
    }

    if (error.message?.includes('Validation failed')) {
      return c.json({
        status: "error",
        message: error.message
      }, 400);
    }

    return c.json({
      status: "error",
      message: "Internal server error"
    }, 500);
  }
}