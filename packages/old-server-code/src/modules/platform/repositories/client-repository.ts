/**
 * Client Repository
 * Specialized repository for client objects following HubSpot API patterns
 */

import { and, count, eq, ilike, sql } from "drizzle-orm";
import { PlatformRepository } from "./platform-repository";
import { record } from "../../../db/schema/platform";
import { withCancellation } from "@/core/utils/cancellation";
import type { ServiceOptions } from "@/core/types/service-options";
import { globalContext } from "@/core/context/global-context";
import type { Record as PlatformRecord, FilterCondition } from "../../../db/schema/platform/types";

export interface ClientProperties {
  name?: string;
  email?: string;
  phone?: string;
  domain?: string;
  company?: string;
  website?: string;
  industry?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  address?: string;
  lifecycle_stage?: string;
  lead_status?: string;
  createdate?: string;
  lastmodifieddate?: string;
  [key: string]: any;
}

export interface ClientSearchFilters {
  name?: string;
  email?: string;
  domain?: string;
  company?: string;
  industry?: string;
  lifecycle_stage?: string;
  lead_status?: string;
  city?: string;
  state?: string;
  country?: string;
  created_after?: string;
  created_before?: string;
}

/**
 * Client-specific repository with business logic for client management
 */
export class ClientRepository extends PlatformRepository {
  protected readonly DEFAULT_TIMEOUT = 15000; // 15 seconds for client operations
  
  constructor() {
    super({
      objectType: "client"
      // organizationId will come from global context via parent constructor
    });
  }

  /**
   * Create a new client with client-specific validation
   */
  async createClient(properties: ClientProperties, options?: ServiceOptions): Promise<PlatformRecord> {
    const signal = options?.signal || globalContext.signal;
    const timeout = options?.timeout || this.DEFAULT_TIMEOUT;
    // Add client-specific defaults
    const clientProperties: ClientProperties = {
      lifecycle_stage: "lead",
      lead_status: "new",
      createdate: new Date().toISOString(),
      ...properties
    };

    // Validate required fields
    if (!clientProperties.name && !clientProperties.email) {
      throw new Error("Either name or email is required for client creation");
    }

    return withCancellation(
      this.create(clientProperties),
      signal,
      timeout
    );
  }

  /**
   * Search clients with common business filters
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
    // Convert business filters to HubSpot-style filter groups
    const filterGroups: Array<{ filters: FilterCondition[] }> = [];

    if (Object.keys(filters).length > 0) {
      const conditions: FilterCondition[] = [];

      // Text-based filters
      if (filters.name) {
        conditions.push({
          field: "name",
          operator: "CONTAINS_TOKEN",
          value: filters.name
        });
      }

      if (filters.email) {
        conditions.push({
          field: "email",
          operator: "CONTAINS_TOKEN", 
          value: filters.email
        });
      }

      if (filters.domain) {
        conditions.push({
          field: "domain",
          operator: "CONTAINS_TOKEN",
          value: filters.domain
        });
      }

      if (filters.company) {
        conditions.push({
          field: "company",
          operator: "CONTAINS_TOKEN",
          value: filters.company
        });
      }

      // Exact match filters
      if (filters.industry) {
        conditions.push({
          field: "industry",
          operator: "EQ",
          value: filters.industry
        });
      }

      if (filters.lifecycle_stage) {
        conditions.push({
          field: "lifecycle_stage",
          operator: "EQ",
          value: filters.lifecycle_stage
        });
      }

      if (filters.lead_status) {
        conditions.push({
          field: "lead_status",
          operator: "EQ",
          value: filters.lead_status
        });
      }

      if (filters.city) {
        conditions.push({
          field: "city",
          operator: "EQ",
          value: filters.city
        });
      }

      if (filters.state) {
        conditions.push({
          field: "state",
          operator: "EQ",
          value: filters.state
        });
      }

      if (filters.country) {
        conditions.push({
          field: "country",
          operator: "EQ",
          value: filters.country
        });
      }

      // Date range filters
      if (filters.created_after) {
        conditions.push({
          field: "createdate",
          operator: "GTE",
          value: filters.created_after
        });
      }

      if (filters.created_before) {
        conditions.push({
          field: "createdate",
          operator: "LTE",
          value: filters.created_before
        });
      }

      if (conditions.length > 0) {
        filterGroups.push({ filters: conditions });
      }
    }

    // Build sort configuration
    const sorts = options.sortBy ? [{
      propertyName: options.sortBy,
      direction: options.sortDirection || 'DESCENDING'
    }] : [{
      propertyName: "createdate",
      direction: 'DESCENDING' as const
    }];

    return await this.doSearch({
      filterGroups,
      sorts,
      limit: options.limit,
      after: options.after
    });
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
    return await this.searchClients(
      { lifecycle_stage: stage },
      options
    );
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
    return await this.searchClients(
      { lead_status: status },
      options
    );
  }

  /**
   * Get clients created in the last N days
   */
  async getRecentClients(
    days: number = 30,
    options: { limit?: number; after?: string } = {}
  ): Promise<{
    total: number;
    results: PlatformRecord[];
    paging?: { next?: { after: string } };
  }> {
    const createdAfter = new Date();
    createdAfter.setDate(createdAfter.getDate() - days);

    return await this.searchClients(
      { created_after: createdAfter.toISOString() },
      options
    );
  }

  /**
   * Update client lifecycle stage
   */
  async updateLifecycleStage(clientId: number, stage: string): Promise<PlatformRecord> {
    return await this.update(clientId, {
      lifecycle_stage: stage,
      lastmodifieddate: new Date().toISOString()
    });
  }

  /**
   * Update client lead status
   */
  async updateLeadStatus(clientId: number, status: string): Promise<PlatformRecord> {
    return await this.update(clientId, {
      lead_status: status,
      lastmodifieddate: new Date().toISOString()
    });
  }

  /**
   * Get client statistics
   */
  async getClientStats(): Promise<{
    total: number;
    by_lifecycle_stage: Record<string, number>;
    by_lead_status: Record<string, number>;
    recent_count: number;
  }> {
    await this.ensureObjectDefinition();
    
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    // Use efficient SQL aggregation instead of loading all records
    const [totalResult] = await this.db
      .select({
        total: count(),
        recentCount: sql<number>`COUNT(CASE WHEN ${record.createdAt} > ${weekAgo} THEN 1 END)`
      })
      .from(record)
      .where(and(
        eq(record.organizationId, this.organizationId),
        eq(record.objectDefinitionId, this.objectDefinitionId!),
        eq(record.isArchived, false)
      ));

    // Get lifecycle stage distribution
    const lifecycleResults = await this.db
      .select({
        stage: sql<string>`COALESCE(${record.properties}->>'lifecycle_stage', 'unknown')`,
        count: count()
      })
      .from(record)
      .where(and(
        eq(record.organizationId, this.organizationId),
        eq(record.objectDefinitionId, this.objectDefinitionId!),
        eq(record.isArchived, false)
      ))
      .groupBy(sql`${record.properties}->>'lifecycle_stage'`);

    // Get lead status distribution
    const leadStatusResults = await this.db
      .select({
        status: sql<string>`COALESCE(${record.properties}->>'lead_status', 'unknown')`,
        count: count()
      })
      .from(record)
      .where(and(
        eq(record.organizationId, this.organizationId),
        eq(record.objectDefinitionId, this.objectDefinitionId!),
        eq(record.isArchived, false)
      ))
      .groupBy(sql`${record.properties}->>'lead_status'`);

    // Convert results to the expected format
    const by_lifecycle_stage: Record<string, number> = {};
    for (const result of lifecycleResults) {
      by_lifecycle_stage[result.stage] = result.count;
    }

    const by_lead_status: Record<string, number> = {};
    for (const result of leadStatusResults) {
      by_lead_status[result.status] = result.count;
    }

    return {
      total: totalResult?.total || 0,
      by_lifecycle_stage,
      by_lead_status,
      recent_count: totalResult?.recentCount || 0
    };
  }

  /**
   * Batch update client properties
   */
  async batchUpdateClients(updates: Array<{
    id: number;
    properties: Partial<ClientProperties>;
  }>): Promise<{
    status: string;
    results: PlatformRecord[];
  }> {
    // Add lastmodifieddate to all updates
    const updatesWithTimestamp = updates.map(update => ({
      id: update.id,
      properties: {
        ...update.properties,
        lastmodifieddate: new Date().toISOString()
      }
    }));

    return await this.batchUpdate({ inputs: updatesWithTimestamp });
  }
}