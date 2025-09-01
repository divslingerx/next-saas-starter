/**
 * Platform Repository Base Class
 * Inspired by HubSpot API patterns for consistent object management
 */

import { and, count, desc, eq, ilike, inArray, or, sql, SQL } from "drizzle-orm";
import type { PgSelect } from "drizzle-orm/pg-core";
import { BaseRepository } from "@/core/base/base.repository";
import { db } from "@/db";
import { withCancellation } from "@/core/utils/cancellation";
import type { ServiceOptions } from "@/core/types/service-options";
import { globalContext } from "@/core/context/global-context";
import { record, objectDefinition, association, organizationObjectSchema } from "../../../db/schema/platform";
import { OrganizationSchemaService } from "../services/organization-schema-service";
import { CounterService } from "../services/counter-service";
import { CacheService } from "../../../services/cache.service";
import type { 
  Record as PlatformRecord, 
  NewRecord, 
  RecordWithAssociations,
  SearchParams,
  SearchResult,
  FilterCriteria,
  FilterCondition,
  BulkOperation,
  BulkOperationResult
} from "../../../db/schema/platform/types";

export interface PlatformRepositoryOptions {
  objectType: string;
  organizationId?: string; // Now optional - defaults to global context
}

export interface GetPageOptions {
  limit?: number;
  after?: string; // cursor for pagination
  properties?: string[];
  propertiesWithHistory?: string[];
  associations?: string[];
  archived?: boolean;
}

export interface BatchInput {
  inputs: Array<{
    id?: number;
    properties: Record<string, any>;
  }>;
}

/**
 * Base repository for all platform objects following HubSpot API patterns
 */
export class PlatformRepository extends BaseRepository<PlatformRecord> {
  protected objectType: string;
  protected organizationId: string;
  protected objectDefinitionId: number | null = null;
  private mergedSchemaCache: any = null;
  
  // Static cache for object definition lookups
  private static objectDefCache = new Map<string, number>();
  
  // Default timeouts for different operations
  protected readonly DEFAULT_TIMEOUT = 15000; // 15 seconds
  protected readonly BULK_TIMEOUT = 60000;    // 60 seconds for bulk operations

  constructor(options: PlatformRepositoryOptions) {
    super(record, db);
    this.objectType = options.objectType;
    this.organizationId = options.organizationId || globalContext.organizationId;
  }

  /**
   * Get merged schema (platform + organization customizations)
   * Enhanced with Redis caching for performance
   */
  protected async getMergedSchema() {
    if (this.mergedSchemaCache) {
      return this.mergedSchemaCache;
    }
    
    // Check Redis cache first
    const cached = await CacheService.getCachedOrgSchema(this.organizationId, this.objectType);
    if (cached) {
      this.mergedSchemaCache = cached;
      return cached;
    }
    
    const merged = await OrganizationSchemaService.getMergedSchema(
      this.organizationId,
      this.objectType
    );
    
    // Cache in both memory and Redis
    this.mergedSchemaCache = merged;
    await CacheService.cacheOrgSchema(this.organizationId, this.objectType, merged);
    
    return merged;
  }
  
  /**
   * Validate properties against merged schema
   */
  protected async validateProperties(properties: Record<string, any>): Promise<void> {
    const { properties: schemaProps } = await this.getMergedSchema();
    
    // Basic validation - check required fields and data types
    Object.entries(properties).forEach(([key, value]) => {
      const propDef = schemaProps[key];
      if (!propDef) {
        throw new Error(`Property '${key}' is not defined for ${this.objectType}`);
      }
      
      // TODO: Add more sophisticated validation (type checking, enum values, etc.)
    });
    
    // Check required fields
    Object.entries(schemaProps).forEach(([key, propDef]) => {
      if ((propDef as any).required && !(key in properties)) {
        throw new Error(`Required property '${key}' is missing`);
      }
    });
  }

  /**
   * Initialize repository by resolving object definition ID
   * Enhanced with Redis caching for better performance
   */
  protected async ensureObjectDefinition(): Promise<number> {
    if (this.objectDefinitionId) {
      return this.objectDefinitionId;
    }
    
    // Check memory cache first
    const memCached = PlatformRepository.objectDefCache.get(this.objectType);
    if (memCached) {
      this.objectDefinitionId = memCached;
      return memCached;
    }

    // Check Redis cache
    const redisCached = await CacheService.getCachedObjectDefinition(this.objectType);
    if (redisCached?.id) {
      PlatformRepository.objectDefCache.set(this.objectType, redisCached.id);
      this.objectDefinitionId = redisCached.id;
      return redisCached.id;
    }

    const [objDef] = await this.db
      .select()
      .from(objectDefinition)
      .where(eq(objectDefinition.objectType, this.objectType))
      .limit(1);

    if (!objDef) {
      throw new Error(`Object definition not found for type: ${this.objectType}`);
    }
    
    // Cache in both memory and Redis
    PlatformRepository.objectDefCache.set(this.objectType, objDef.id);
    await CacheService.cacheObjectDefinition(this.objectType, objDef);

    this.objectDefinitionId = objDef.id;
    return objDef.id;
  }

  /**
   * Create a new record (HubSpot: basicApi.create)
   */
  async create(properties: Record<string, any>, options?: ServiceOptions): Promise<PlatformRecord> {
    const signal = options?.signal || globalContext.signal;
    const timeout = options?.timeout || this.DEFAULT_TIMEOUT;
    
    // Validate properties against merged schema
    await this.validateProperties(properties);
    
    const objectDefId = await this.ensureObjectDefinition();

    const [newRecord] = await withCancellation(
      this.db
        .insert(record)
        .values({
          objectDefinitionId: objectDefId,
          organizationId: this.organizationId,
          properties,
          displayName: this.computeDisplayName(properties),
          searchVector: this.computeSearchVector(properties),
        })
        .returning(),
      signal,
      timeout
    );

    if (!newRecord) {
      throw new Error('Failed to create record');
    }

    // Invalidate related caches
    await CacheService.invalidateOrgCache(this.organizationId);

    return newRecord;
  }

  /**
   * Get records with pagination (HubSpot: basicApi.getPage)
   */
  async getPage(options: GetPageOptions = {}): Promise<{
    results: PlatformRecord[];
    paging?: {
      next?: { after: string; link: string };
      prev?: { after: string; link: string };
    };
  }> {
    const objectDefId = await this.ensureObjectDefinition();
    const limit = Math.min(options.limit || 100, 100);
    
    let query = this.db
      .select()
      .from(record)
      .where(
        and(
          eq(record.objectDefinitionId, objectDefId),
          eq(record.organizationId, this.organizationId),
          options.archived !== undefined ? eq(record.isArchived, options.archived) : undefined
        )
      )
      .orderBy(desc(record.createdAt))
      .$dynamic();

    // Handle cursor pagination
    if (options.after) {
      query = query.where(sql`${record.id} < ${parseInt(options.after, 10)}`);
    }

    query = query.limit(limit + 1); // Get one extra to determine if there's a next page

    const results = await query;
    const hasNext = results.length > limit;
    
    if (hasNext) {
      results.pop(); // Remove the extra record
    }

    const paging: any = {};
    if (hasNext && results.length > 0) {
      const lastRecord = results[results.length - 1];
      if (lastRecord) {
        const lastId = lastRecord.id.toString();
        paging.next = {
          after: lastId,
          link: `/crm/v3/objects/${this.objectType}?after=${lastId}&limit=${limit}`
        };
      }
    }

    return { results, paging: Object.keys(paging).length > 0 ? paging : undefined };
  }

  /**
   * Get record by ID (HubSpot: basicApi.getById)
   * Enhanced with Redis caching for improved performance
   */
  async getById(
    id: number, 
    properties?: string[], 
    propertiesWithHistory?: string[],
    associations?: string[]
  ): Promise<RecordWithAssociations | null> {
    // For simple cases without associations, check cache first
    if (!associations?.length && !propertiesWithHistory?.length) {
      const cached = await CacheService.getCachedRecordWithProperties(id, this.organizationId);
      if (cached) {
        return cached;
      }
    }

    const objectDefId = await this.ensureObjectDefinition();

    const [result] = await this.db
      .select()
      .from(record)
      .where(
        and(
          eq(record.id, id),
          eq(record.objectDefinitionId, objectDefId),
          eq(record.organizationId, this.organizationId)
        )
      )
      .limit(1);

    if (!result) {
      return null;
    }

    // Load associations if requested
    let associationData: any = undefined;
    if (associations?.length) {
      // Check cache first
      associationData = await CacheService.getCachedRecordAssociations(id);
      
      if (!associationData) {
        // TODO: Load actual associations from database
        associationData = { from: [], to: [] };
        await CacheService.cacheRecordAssociations(id, associationData);
      }
    }

    const recordWithAssociations: RecordWithAssociations = {
      ...result,
      associations: associations ? associationData : undefined
    };

    // Cache the result for future use (if no special properties requested)
    if (!associations?.length && !propertiesWithHistory?.length) {
      await CacheService.cacheRecordWithProperties(id, this.organizationId, recordWithAssociations);
    }

    return recordWithAssociations;
  }

  /**
   * Update record (HubSpot: basicApi.update)
   */
  async update(id: number, properties: Record<string, any>): Promise<PlatformRecord> {
    // Validate properties against merged schema
    await this.validateProperties(properties);
    
    const objectDefId = await this.ensureObjectDefinition();

    // Merge with existing properties
    const [existing] = await this.db
      .select()
      .from(record)
      .where(
        and(
          eq(record.id, id),
          eq(record.objectDefinitionId, objectDefId),
          eq(record.organizationId, this.organizationId)
        )
      )
      .limit(1);

    if (!existing) {
      throw new Error(`Record not found: ${id}`);
    }

    const mergedProperties = { ...(existing.properties as Record<string, any>), ...properties };

    const [updated] = await this.db
      .update(record)
      .set({
        properties: mergedProperties,
        displayName: this.computeDisplayName(mergedProperties),
        searchVector: this.computeSearchVector(mergedProperties),
        updatedAt: new Date(),
      })
      .where(eq(record.id, id))
      .returning();

    if (!updated) {
      throw new Error('Failed to update record');
    }

    // Invalidate all caches related to this record
    await CacheService.invalidateRecordCache(id, this.organizationId);

    return updated;
  }

  /**
   * Archive record (HubSpot: basicApi.archive)
   */
  async archive(id: number): Promise<void> {
    const objectDefId = await this.ensureObjectDefinition();

    await this.db
      .update(record)
      .set({
        isArchived: true,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(record.id, id),
          eq(record.objectDefinitionId, objectDefId),
          eq(record.organizationId, this.organizationId)
        )
      );

    // Invalidate all caches related to this record
    await CacheService.invalidateRecordCache(id, this.organizationId);
  }

  /**
   * Batch create records (HubSpot: batchApi.create)
   */
  async batchCreate(batch: BatchInput): Promise<{
    status: string;
    results: PlatformRecord[];
  }> {
    const objectDefId = await this.ensureObjectDefinition();

    const values = batch.inputs.map(input => ({
      objectDefinitionId: objectDefId,
      organizationId: this.organizationId,
      properties: input.properties,
      displayName: this.computeDisplayName(input.properties),
      searchVector: this.computeSearchVector(input.properties),
    }));

    const results = await this.db
      .insert(record)
      .values(values)
      .returning();

    // Invalidate organization cache after bulk create
    await CacheService.invalidateOrgCache(this.organizationId);

    return {
      status: "COMPLETE",
      results
    };
  }

  /**
   * Batch update records (HubSpot: batchApi.update)
   */
  async batchUpdate(batch: BatchInput): Promise<{
    status: string;
    results: PlatformRecord[];
  }> {
    const objectDefId = await this.ensureObjectDefinition();
    const results: PlatformRecord[] = [];

    for (const input of batch.inputs) {
      if (!input.id) {
        throw new Error("ID is required for batch update");
      }

      const updated = await this.update(input.id, input.properties);
      results.push(updated);
    }

    return {
      status: "COMPLETE",
      results
    };
  }

  /**
   * Search records (HubSpot: searchApi.doSearch)
   * Enhanced with caching for common search queries
   */
  async doSearch(searchRequest: {
    filterGroups?: Array<{
      filters: FilterCondition[];
    }>;
    sorts?: Array<{
      propertyName: string;
      direction: 'ASCENDING' | 'DESCENDING';
    }>;
    query?: string;
    properties?: string[];
    limit?: number;
    after?: string;
  }): Promise<{
    total: number;
    results: PlatformRecord[];
    paging?: {
      next?: { after: string };
    };
  }> {
    // For simple text queries without complex filters, check cache
    if (searchRequest.query && 
        !searchRequest.filterGroups?.length && 
        !searchRequest.after &&
        !searchRequest.sorts?.length &&
        (searchRequest.limit || 100) <= 100) {
      
      const cached = await CacheService.getCachedSearchResults(searchRequest.query, this.organizationId);
      if (cached) {
        return {
          total: cached.length,
          results: cached.slice(0, searchRequest.limit || 100),
          paging: undefined
        };
      }
    }

    const objectDefId = await this.ensureObjectDefinition();
    const limit = Math.min(searchRequest.limit || 100, 100);

    // Build dynamic query
    let query = this.db
      .select()
      .from(record)
      .where(
        and(
          eq(record.objectDefinitionId, objectDefId),
          eq(record.organizationId, this.organizationId),
          eq(record.isArchived, false)
        )
      )
      .$dynamic();

    // Add search filters
    const filters: SQL[] = [];

    // Full-text search
    if (searchRequest.query) {
      filters.push(ilike(record.searchVector, `%${searchRequest.query}%`));
    }

    // Filter groups (HubSpot-style filtering)  
    if (searchRequest.filterGroups?.length) {
      try {
        const groupConditions: SQL[] = [];
        
        for (const group of searchRequest.filterGroups) {
          const filterConditions: SQL[] = [];
          
          for (const filter of group.filters) {
            try {
              const condition = this.buildFilterCondition(filter);
              if (condition) {
                filterConditions.push(condition);
              }
            } catch (error) {
              // Skip invalid filter conditions
              console.warn('Invalid filter condition:', filter, error);
            }
          }
          
          const validConditions = filterConditions.filter(Boolean);
          if (validConditions.length === 1) {
            // @ts-ignore
            groupConditions.push(validConditions[0]);
          } else if (validConditions.length > 1) {
            // @ts-ignore
            groupConditions.push(and(...validConditions as SQL[]));
          }
        }
        
        const validGroupConditions = groupConditions.filter(Boolean);
        if (validGroupConditions.length === 1) {
          // @ts-ignore
          filters.push(validGroupConditions[0]);
        } else if (validGroupConditions.length > 1) {
          // @ts-ignore
          filters.push(or(...validGroupConditions as SQL[]));
        }
      } catch (error) {
        // Skip filter groups if there's any error
        console.warn('Error processing filter groups:', error);
      }
    }

    if (filters.length) {
      query = query.where(and(...filters));
    }

    // Add sorting
    if (searchRequest.sorts?.length) {
      const sort = searchRequest.sorts[0]; // HubSpot only supports one sort
      if (sort) {
        const direction = sort.direction === 'ASCENDING' ? 'asc' : 'desc';
        
        if (sort.propertyName === 'createdate') {
          query = query.orderBy(direction === 'asc' ? record.createdAt : desc(record.createdAt));
        } else {
          // Sort by property in JSONB
          query = query.orderBy(
            direction === 'asc' 
              ? sql`${record.properties}->>${sort.propertyName}`
              : sql`${record.properties}->>${sort.propertyName} DESC`
          );
        }
      }
    } else {
      query = query.orderBy(desc(record.createdAt));
    }

    // Handle pagination
    if (searchRequest.after) {
      query = query.where(sql`${record.id} < ${parseInt(searchRequest.after, 10)}`);
    }

    // Get total count
    const [totalResult] = await this.db
      .select({ count: count() })
      .from(record)
      .where(
        and(
          eq(record.objectDefinitionId, objectDefId),
          eq(record.organizationId, this.organizationId),
          eq(record.isArchived, false),
          ...(filters.length ? [and(...filters)] : [])
        )
      );

    // Get results
    const results = await query.limit(limit + 1);
    const hasNext = results.length > limit;
    
    if (hasNext) {
      results.pop();
    }

    const paging: any = {};
    if (hasNext && results.length > 0) {
      const lastRecord = results[results.length - 1];
      if (lastRecord) {
        paging.next = { after: lastRecord.id.toString() };
      }
    }

    const searchResult = {
      total: totalResult?.count || 0,
      results,
      paging: Object.keys(paging).length > 0 ? paging : undefined
    };

    // Cache simple search results
    if (searchRequest.query && 
        !searchRequest.filterGroups?.length && 
        !searchRequest.after &&
        !searchRequest.sorts?.length &&
        results.length > 0) {
      await CacheService.cacheSearchResults(searchRequest.query, this.organizationId, results);
    }

    return searchResult;
  }

  /**
   * Build filter condition for search
   */
  private buildFilterCondition(filter: FilterCondition): SQL {
    const { field, operator, value } = filter;

    switch (operator) {
      case 'EQ':
        return sql`${record.properties}->>${field} = ${value}`;
      case 'NEQ':
        return sql`${record.properties}->>${field} != ${value}`;
      case 'GT':
        return sql`(${record.properties}->>${field})::numeric > ${value}`;
      case 'GTE':
        return sql`(${record.properties}->>${field})::numeric >= ${value}`;
      case 'LT':
        return sql`(${record.properties}->>${field})::numeric < ${value}`;
      case 'LTE':
        return sql`(${record.properties}->>${field})::numeric <= ${value}`;
      case 'CONTAINS_TOKEN':
        return ilike(sql`${record.properties}->>${field}`, `%${value}%`);
      case 'NOT_CONTAINS_TOKEN':
        return sql`${record.properties}->>${field} NOT ILIKE ${`%${value}%`}`;
      case 'IN':
        return sql`${record.properties}->>${field} = ANY(${value})`;
      case 'NOT_IN':
        return sql`${record.properties}->>${field} != ALL(${value})`;
      default:
        throw new Error(`Unsupported operator: ${operator}`);
    }
  }

  /**
   * Compute display name from properties
   */
  private computeDisplayName(properties: Record<string, any>): string {
    // Try common display properties
    return properties.name || 
           properties.title || 
           properties.email || 
           properties.domain ||
           `${this.objectType}_${Date.now()}`;
  }

  /**
   * Compute search vector from properties
   */
  private computeSearchVector(properties: Record<string, any>): string {
    return Object.values(properties)
      .filter(value => typeof value === 'string')
      .join(' ')
      .toLowerCase();
  }

  // ==========================================
  // LIST MANAGEMENT WITH COUNTER UPDATES
  // ==========================================

  /**
   * Add record to list and update counter
   */
  async addToList(recordId: number, listId: number): Promise<void> {
    // Insert list membership
    await this.db.execute(sql`
      INSERT INTO cl_list_membership (list_id, record_id, added_at)
      VALUES (${listId}, ${recordId}, CURRENT_TIMESTAMP)
      ON CONFLICT (list_id, record_id) DO NOTHING
    `);

    // Update counter safely
    await CounterService.updateListMemberCount(listId);

    // Invalidate related caches
    await CacheService.invalidateListCache(listId);
  }

  /**
   * Remove record from list and update counter
   */
  async removeFromList(recordId: number, listId: number): Promise<void> {
    // Remove list membership
    await this.db.execute(sql`
      DELETE FROM cl_list_membership 
      WHERE list_id = ${listId} AND record_id = ${recordId}
    `);

    // Update counter safely
    await CounterService.updateListMemberCount(listId);

    // Invalidate related caches
    await CacheService.invalidateListCache(listId);
  }

  // ==========================================
  // PIPELINE MANAGEMENT WITH COUNTER UPDATES
  // ==========================================

  /**
   * Move record to pipeline stage and update counter
   */
  async moveToStage(recordId: number, pipelineId: number, stageId: string, stageName: string, options?: {
    amount?: number;
    probability?: number;
    expectedCloseDate?: Date;
    notes?: string;
  }): Promise<void> {
    // Insert or update record stage
    await this.db.execute(sql`
      INSERT INTO cl_record_stage (
        record_id, pipeline_id, stage_id, stage_name, 
        entered_at, amount, probability, expected_close_date, stage_notes
      )
      VALUES (
        ${recordId}, ${pipelineId}, ${stageId}, ${stageName},
        CURRENT_TIMESTAMP, ${options?.amount || null}, 
        ${options?.probability || null}, ${options?.expectedCloseDate || null},
        ${options?.notes || null}
      )
      ON CONFLICT (record_id, pipeline_id) 
      DO UPDATE SET
        stage_id = ${stageId},
        stage_name = ${stageName},
        entered_at = CURRENT_TIMESTAMP,
        amount = ${options?.amount || null},
        probability = ${options?.probability || null},
        expected_close_date = ${options?.expectedCloseDate || null},
        stage_notes = ${options?.notes || null},
        updated_at = CURRENT_TIMESTAMP
    `);

    // Update counter safely
    await CounterService.updatePipelineRecordCount(pipelineId);

    // Invalidate related caches
    await CacheService.invalidatePipelineCache(pipelineId);
    await CacheService.invalidateRecordCache(recordId, this.organizationId);
  }

  /**
   * Remove record from pipeline and update counter
   */
  async removeFromPipeline(recordId: number, pipelineId: number): Promise<void> {
    // Remove from pipeline
    await this.db.execute(sql`
      DELETE FROM cl_record_stage 
      WHERE record_id = ${recordId} AND pipeline_id = ${pipelineId}
    `);

    // Update counter safely
    await CounterService.updatePipelineRecordCount(pipelineId);

    // Invalidate related caches
    await CacheService.invalidatePipelineCache(pipelineId);
    await CacheService.invalidateRecordCache(recordId, this.organizationId);
  }

  // ==========================================
  // BATCH COUNTER MANAGEMENT
  // ==========================================

  /**
   * Refresh all counters for this organization (run periodically)
   */
  async refreshAllCounters(): Promise<void> {
    await CounterService.batchUpdateAllCounters();
    console.log(`✅ Refreshed all counters for organization ${this.organizationId}`);
  }
}