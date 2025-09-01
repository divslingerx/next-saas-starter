/**
 * Client Service
 * Business logic for client management following HubSpot patterns
 */

import { PlatformService } from "./platform-service";
import { ClientRepository } from "../repositories/client-repository";
import type { Record as PlatformRecord } from "../../../db/schema/platform/types";
import type { ClientProperties, ClientSearchFilters } from "../repositories/client-repository";
import { globalContext } from "@/core/context/global-context";
import { z } from "zod";

// Clean Zod validation schema for client properties
const clientValidationSchema = z.object({
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
  lifecycle_stage: z.enum(["lead", "marketing-qualified-lead", "sales-qualified-lead", "opportunity", "customer"]).optional(),
  lead_status: z.enum(["new", "open", "in-progress", "open-deal", "unqualified", "attempted-to-contact", "connected", "bad-timing"]).optional(),
  createdate: z.string().datetime().optional(),
  lastmodifieddate: z.string().datetime().optional(),
}).refine(
  (data) => data.name || data.email,
  {
    message: "Either name or email is required",
    path: ["name"], // Show error on name field
  }
);

/**
 * Client-specific service with validation and business rules
 */
export class ClientService extends PlatformService {
  declare protected repository: ClientRepository;

  constructor() {
    super({
      objectType: "client",
      organizationId: globalContext.organizationId,
      userId: globalContext.userId
    });
    
    // Override repository with client-specific one
    this.repository = new ClientRepository();
    
    // Set up client-specific event handlers
    this.setupEventHandlers();
  }

  /**
   * Set up Zod validation schema
   */
  protected defineValidationSchema(): void {
    this.validationSchema = clientValidationSchema;
  }

  /**
   * Set up client-specific event handlers
   */
  private setupEventHandlers(): void {
    // Auto-generate domain from email
    this.addEventHandler(async (event) => {
      if (event.type === 'record.created' && event.data.record) {
        const record = event.data.record as PlatformRecord;
        const properties = record.properties as ClientProperties;
        
        if (properties.email && !properties.domain) {
          const domain = properties.email.split('@')[1];
          if (domain) {
            await this.repository.update(record.id, { domain });
          }
        }
      }
    });

    // Update lastmodifieddate on any change
    this.addEventHandler(async (event) => {
      if (event.type === 'record.updated' && event.data.record) {
        // Already handled in the service layer
      }
    });
  }

  /**
   * Override create with client-specific logic
   */
  async create(properties: ClientProperties): Promise<PlatformRecord> {
    // Ensure either name or email is provided
    if (!properties.name && !properties.email) {
      throw new Error('Either name or email is required');
    }

    // Use client-specific create method
    return await this.repository.createClient(properties);
  }

  /**
   * Search clients with business-friendly filters
   */
  async searchClients(filters: ClientSearchFilters = {}, options: {
    limit?: number;
    after?: string;
    sortBy?: string;
    sortDirection?: 'ASCENDING' | 'DESCENDING';
  } = {}): Promise<{
    total: number;
    results: PlatformRecord[];
    paging?: { next?: { after: string } };
  }> {
    if (!await this.checkPermissions('search')) {
      throw new Error('Permission denied');
    }

    return await this.repository.searchClients(filters, options);
  }

  /**
   * Get clients by lifecycle stage
   */
  async getClientsByLifecycleStage(
    stage: string,
    options: { limit?: number; after?: string } = {}
  ): Promise<{
    total: number;
    results: PlatformRecord[];
    paging?: { next?: { after: string } };
  }> {
    if (!await this.checkPermissions('read')) {
      throw new Error('Permission denied');
    }

    return await this.repository.getClientsByLifecycleStage(stage, options);
  }

  /**
   * Get clients by lead status
   */
  async getClientsByLeadStatus(
    status: string,
    options: { limit?: number; after?: string } = {}
  ): Promise<{
    total: number;
    results: PlatformRecord[];
    paging?: { next?: { after: string } };
  }> {
    if (!await this.checkPermissions('read')) {
      throw new Error('Permission denied');
    }

    return await this.repository.getClientsByLeadStatus(status, options);
  }

  /**
   * Get recent clients
   */
  async getRecentClients(
    days: number = 30,
    options: { limit?: number; after?: string } = {}
  ): Promise<{
    total: number;
    results: PlatformRecord[];
    paging?: { next?: { after: string } };
  }> {
    if (!await this.checkPermissions('read')) {
      throw new Error('Permission denied');
    }

    return await this.repository.getRecentClients(days, options);
  }

  /**
   * Advance client through lifecycle stages
   */
  async advanceLifecycleStage(clientId: number): Promise<PlatformRecord> {
    if (!await this.checkPermissions('update', clientId)) {
      throw new Error('Permission denied');
    }

    const client = await this.repository.getById(clientId);
    if (!client) {
      throw new Error('Client not found');
    }

    const properties = client.properties as ClientProperties;
    const currentStage = properties.lifecycle_stage || 'subscriber';

    // Define stage progression
    const stageProgression: Record<string, string> = {
      'subscriber': 'lead',
      'lead': 'marketing_qualified_lead', 
      'marketing_qualified_lead': 'sales_qualified_lead',
      'sales_qualified_lead': 'opportunity',
      'opportunity': 'customer'
    };

    const nextStage = stageProgression[currentStage];
    if (!nextStage) {
      throw new Error(`Cannot advance from stage: ${currentStage}`);
    }

    return await this.repository.updateLifecycleStage(clientId, nextStage);
  }

  /**
   * Convert lead to customer
   */
  async convertToCustomer(clientId: number): Promise<PlatformRecord> {
    if (!await this.checkPermissions('update', clientId)) {
      throw new Error('Permission denied');
    }

    const updates = {
      lifecycle_stage: 'customer',
      lead_status: 'connected',
      customer_since: new Date().toISOString()
    };

    const updated = await this.update(clientId, updates);

    // Emit conversion event
    await this.emitEvent('client.converted_to_customer', { 
      clientId, 
      conversionDate: new Date() 
    }, clientId);

    return updated;
  }

  /**
   * Mark lead as unqualified
   */
  async markAsUnqualified(clientId: number, reason?: string): Promise<PlatformRecord> {
    if (!await this.checkPermissions('update', clientId)) {
      throw new Error('Permission denied');
    }

    const updates: ClientProperties = {
      lead_status: 'unqualified',
      unqualified_reason: reason,
      unqualified_date: new Date().toISOString()
    };

    return await this.update(clientId, updates);
  }

  /**
   * Get client statistics and insights
   */
  async getClientStats(): Promise<{
    total: number;
    by_lifecycle_stage: Record<string, number>;
    by_lead_status: Record<string, number>;
    recent_count: number;
  }> {
    if (!await this.checkPermissions('read')) {
      throw new Error('Permission denied');
    }

    return await this.repository.getClientStats();
  }

  /**
   * Bulk update client lifecycle stages
   */
  async bulkUpdateLifecycleStage(
    clientIds: number[], 
    newStage: string
  ): Promise<{
    status: string;
    results: PlatformRecord[];
  }> {
    if (!await this.checkPermissions('update')) {
      throw new Error('Permission denied');
    }

    const updates = clientIds.map(id => ({
      id,
      properties: {
        lifecycle_stage: newStage,
        stage_updated_date: new Date().toISOString()
      } as ClientProperties
    }));

    return await this.repository.batchUpdateClients(updates);
  }

  /**
   * Import clients from external source
   */
  async importClients(
    clientData: ClientProperties[],
    options: { 
      updateExisting?: boolean;
      skipValidation?: boolean;
    } = {}
  ): Promise<{
    created: number;
    updated: number;
    skipped: number;
    errors: Array<{ index: number; error: string }>;
  }> {
    if (!await this.checkPermissions('create')) {
      throw new Error('Permission denied');
    }

    const result = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as Array<{ index: number; error: string }>
    };

    for (let i = 0; i < clientData.length; i++) {
      try {
        const properties = clientData[i];
        
        // Skip if properties is undefined
        if (!properties) {
          result.skipped++;
          continue;
        }

        // Check if client already exists (by email)
        let existingClient = null;
        if (properties.email) {
          const searchResult = await this.searchClients({ email: properties.email });
          existingClient = searchResult.results[0] || null;
        }

        if (existingClient && options.updateExisting) {
          await this.update(existingClient.id, properties);
          result.updated++;
        } else if (existingClient) {
          result.skipped++;
        } else {
          await this.create(properties);
          result.created++;
        }
      } catch (error) {
        result.errors.push({
          index: i,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Emit import event
    await this.emitEvent('clients.imported', {
      total: clientData.length,
      result
    });

    return result;
  }
}