/**
 * Client Controller
 * Client-specific REST API endpoints following HubSpot patterns
 */

import type { Context } from "hono";
import { z } from "zod";
import { PlatformController } from "./platform-controller";
import { ClientService } from "../services/client-service";
import type { ClientSearchFilters } from "../repositories/client-repository";
import { ResponseTransformers } from "@/core/utils/response-transformers";
import { globalContext } from "@/core/context/global-context";

// Client-specific validation schemas
export const clientSearchFiltersSchema = z.object({
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
  created_after: z.string().optional(),
  created_before: z.string().optional()
});

export const bulkLifecycleUpdateSchema = z.object({
  clientIds: z.array(z.number()).min(1).max(100),
  lifecycle_stage: z.string().min(1)
});

export const clientImportSchema = z.object({
  clients: z.array(z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    company: z.string().optional(),
    website: z.string().url().optional(),
    domain: z.string().optional(),
    industry: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    postal_code: z.string().optional(),
    address: z.string().optional(),
    lifecycle_stage: z.string().optional(),
    lead_status: z.string().optional()
  }).refine(
    (client) => client.name || client.email,
    "Either name or email is required"
  )).min(1).max(1000),
  options: z.object({
    updateExisting: z.boolean().optional(),
    skipValidation: z.boolean().optional()
  }).optional()
});

/**
 * Client controller with HubSpot-style endpoints
 */
export class ClientController extends PlatformController {
  protected service: ClientService;

  constructor() {
    super();
    // Service will use global context for organizationId and userId
    this.service = new ClientService();
  }

  /**
   * Search clients with business-friendly filters
   * POST /crm/v3/objects/clients/search-business
   */
  async searchBusiness(c: Context) {
    try {
      const body = await c.req.json();
      const validation = clientSearchFiltersSchema.safeParse(body);

      if (!validation.success) {
        return ResponseTransformers.error(
          c,
          "Invalid search filters: " + validation.error.issues.map(i => i.message).join(', '),
          400,
          "VALIDATION_ERROR"
        );
      }

      const limit = parseInt(c.req.query('limit') || '10');
      const after = c.req.query('after');
      const sortBy = c.req.query('sortBy');
      const sortDirection = c.req.query('sortDirection') as 'ASCENDING' | 'DESCENDING';

      const result = await this.service.searchClients(
        validation.data as ClientSearchFilters,
        { limit, after, sortBy, sortDirection }
      );

      const transformedResult = ResponseTransformers.transformSearchResults(result);
      return ResponseTransformers.success(c, transformedResult, "Clients retrieved successfully");
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  /**
   * Get clients by lifecycle stage
   * GET /crm/v3/objects/clients/lifecycle/{stage}
   */
  async getByLifecycleStage(c: Context) {
    try {
      const stage = c.req.param('stage');
      const limit = parseInt(c.req.query('limit') || '10');
      const after = c.req.query('after');

      const result = await this.service.getClientsByLifecycleStage(
        stage,
        { limit, after }
      );

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
   * Get clients by lead status
   * GET /crm/v3/objects/clients/lead-status/{status}
   */
  async getByLeadStatus(c: Context) {
    try {
      const status = c.req.param('status');
      const limit = parseInt(c.req.query('limit') || '10');
      const after = c.req.query('after');

      const result = await this.service.getClientsByLeadStatus(
        status,
        { limit, after }
      );

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
   * Get recent clients
   * GET /crm/v3/objects/clients/recent
   */
  async getRecent(c: Context) {
    try {
      const days = parseInt(c.req.query('days') || '30');
      const limit = parseInt(c.req.query('limit') || '10');
      const after = c.req.query('after');

      const result = await this.service.getRecentClients(
        days,
        { limit, after }
      );

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
   * Advance client lifecycle stage
   * POST /crm/v3/objects/clients/{id}/advance-stage
   */
  async advanceLifecycleStage(c: Context) {
    try {
      const id = parseInt(c.req.param('id'));

      if (isNaN(id)) {
        return c.json({
          status: "error",
          message: "Invalid ID"
        }, 400);
      }

      const record = await this.service.advanceLifecycleStage(id);

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
   * Convert to customer
   * POST /crm/v3/objects/clients/{id}/convert-to-customer
   */
  async convertToCustomer(c: Context) {
    try {
      const id = parseInt(c.req.param('id'));

      if (isNaN(id)) {
        return c.json({
          status: "error",
          message: "Invalid ID"
        }, 400);
      }

      const record = await this.service.convertToCustomer(id);

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
   * Mark as unqualified
   * POST /crm/v3/objects/clients/{id}/mark-unqualified
   */
  async markUnqualified(c: Context) {
    try {
      const id = parseInt(c.req.param('id'));
      const body = await c.req.json();

      if (isNaN(id)) {
        return c.json({
          status: "error",
          message: "Invalid ID"
        }, 400);
      }

      const record = await this.service.markAsUnqualified(id, body.reason);

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
   * Get client statistics
   * GET /crm/v3/objects/clients/stats
   */
  async getStats(c: Context) {
    try {
      const stats = await this.service.getClientStats();
      return c.json(stats);
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  /**
   * Bulk update lifecycle stage
   * POST /crm/v3/objects/clients/batch/update-lifecycle-stage
   */
  async bulkUpdateLifecycleStage(c: Context) {
    try {
      const body = await c.req.json();
      const validation = bulkLifecycleUpdateSchema.safeParse(body);

      if (!validation.success) {
        return c.json({
          status: "error",
          message: "Invalid request",
          errors: validation.error.issues
        }, 400);
      }

      const result = await this.service.bulkUpdateLifecycleStage(
        validation.data.clientIds,
        validation.data.lifecycle_stage
      );

      return c.json({
        status: result.status,
        results: result.results.map(record => ({
          id: record.id,
          properties: record.properties,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
          archived: record.isArchived
        }))
      });
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  /**
   * Import clients
   * POST /crm/v3/objects/clients/import
   */
  async importClients(c: Context) {
    try {
      const body = await c.req.json();
      const validation = clientImportSchema.safeParse(body);

      if (!validation.success) {
        return c.json({
          status: "error",
          message: "Invalid import request",
          errors: validation.error.issues
        }, 400);
      }

      const result = await this.service.importClients(
        validation.data.clients,
        validation.data.options || {}
      );

      return c.json({
        status: "COMPLETE",
        summary: {
          total: validation.data.clients.length,
          created: result.created,
          updated: result.updated,
          skipped: result.skipped,
          errors: result.errors.length
        },
        errors: result.errors
      });
    } catch (error) {
      return this.handleError(c, error);
    }
  }
}