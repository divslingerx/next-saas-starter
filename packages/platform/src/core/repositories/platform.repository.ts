/**
 * Platform Repository
 * Handles flexible object operations with JSONB properties
 */

import { and, eq, sql, type SQL, inArray, isNull } from 'drizzle-orm';
import { BaseRepository, type PaginatedResult, type FindOptions } from './base.repository';
import type { db as Database } from '@charmlabs/db/client';
import { 
  objectDefinition, 
  objectRecord,
  objectProperty,
  type ObjectDefinition,
  type ObjectRecord,
  type ObjectProperty
} from '../objects/platform-objects';
import { PropertyHistoryService, type PropertyChange } from '../services/property-history.service';

export interface ObjectRecordWithDefinition extends ObjectRecord {
  definition?: ObjectDefinition;
}

export interface CreateObjectRecordInput {
  objectType: string;
  organizationId: number;
  properties: Record<string, any>;
  ownerId?: number;
}

export interface UpdateObjectRecordInput {
  properties?: Record<string, any>;
  ownerId?: number;
}

export interface SearchObjectsInput {
  objectType?: string;
  organizationId: number;
  filters?: Array<{
    property: string;
    operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in';
    value: any;
  }>;
  sort?: {
    property: string;
    direction: 'asc' | 'desc';
  };
  page?: number;
  limit?: number;
}

/**
 * Repository for platform object operations
 */
export class PlatformRepository extends BaseRepository<ObjectRecord, CreateObjectRecordInput, UpdateObjectRecordInput> {
  private definitionRepo: BaseRepository<ObjectDefinition>;
  private propertyRepo: BaseRepository<ObjectProperty>;
  private propertyHistoryService: PropertyHistoryService;

  constructor(db: typeof Database) {
    super(objectRecord, db);
    this.definitionRepo = new BaseRepository(objectDefinition, db);
    this.propertyRepo = new BaseRepository(objectProperty, db);
    this.propertyHistoryService = new PropertyHistoryService(db);
  }

  /**
   * Get or create object definition
   */
  async ensureObjectDefinition(
    internalName: string, 
    definition: Partial<ObjectDefinition>
  ): Promise<ObjectDefinition> {
    const existing = await this.definitionRepo.findOne(
      eq(objectDefinition.internalName, internalName)
    );

    if (existing) {
      return existing;
    }

    return await this.definitionRepo.create({
      internalName,
      displayName: definition.displayName || internalName,
      pluralName: definition.pluralName || `${internalName}s`,
      description: definition.description,
      icon: definition.icon,
      color: definition.color,
      schema: definition.schema || {},
      properties: definition.properties || {},
      searchableProperties: definition.searchableProperties || ['name'],
      requiredProperties: definition.requiredProperties || [],
      uniqueProperties: definition.uniqueProperties || [],
      isSystem: definition.isSystem || false,
      isActive: definition.isActive ?? true,
    } as any);
  }

  /**
   * Create object record with validation
   */
  async createObjectRecord(input: CreateObjectRecordInput): Promise<ObjectRecord> {
    // Get object definition
    const definition = await this.definitionRepo.findOne(
      eq(objectDefinition.internalName, input.objectType)
    );

    if (!definition) {
      throw new Error(`Object type ${input.objectType} not found`);
    }

    // Validate required properties
    const requiredProps = definition.requiredProperties as string[] || [];
    for (const prop of requiredProps) {
      if (!(prop in input.properties)) {
        throw new Error(`Required property ${prop} is missing`);
      }
    }

    // Create record
    return await this.create({
      objectDefinitionId: definition.id,
      organizationId: input.organizationId,
      properties: input.properties,
      ownerId: input.ownerId,
    } as any);
  }

  /**
   * Update object record with merge and history tracking
   */
  async updateObjectRecord(
    id: number,
    input: UpdateObjectRecordInput,
    changedBy?: { id: number; name: string; type: 'user' | 'system' | 'workflow' | 'integration' }
  ): Promise<ObjectRecord | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updates: any = {};
    const propertyChanges: PropertyChange[] = [];
    
    if (input.properties) {
      const existingProps = existing.properties as any || {};
      
      // Track changes for each property
      for (const [key, value] of Object.entries(input.properties)) {
        if (JSON.stringify(existingProps[key]) !== JSON.stringify(value)) {
          propertyChanges.push({
            propertyName: key,
            oldValue: existingProps[key],
            newValue: value,
            changedBy,
            changeSource: changedBy?.type === 'user' ? 'ui' : 'api',
          });
        }
      }
      
      // Merge properties
      updates.properties = {
        ...existingProps,
        ...input.properties
      };
    }

    if (input.ownerId !== undefined) {
      updates.ownerId = input.ownerId;
    }

    // Update the record
    const updated = await this.update(id, updates);
    
    // Track property history if there were changes
    if (updated && propertyChanges.length > 0) {
      await this.propertyHistoryService.trackChanges(
        id,
        existing.organizationId,
        propertyChanges
      );
    }

    return updated;
  }

  /**
   * Search objects with JSONB filters
   */
  async searchObjects(input: SearchObjectsInput): Promise<PaginatedResult<ObjectRecordWithDefinition>> {
    const conditions: SQL[] = [
      eq(objectRecord.organizationId, input.organizationId),
      isNull(objectRecord.deletedAt)
    ];

    // Filter by object type if specified
    if (input.objectType) {
      const definition = await this.definitionRepo.findOne(
        eq(objectDefinition.internalName, input.objectType)
      );
      
      if (definition) {
        conditions.push(eq(objectRecord.objectDefinitionId, definition.id));
      }
    }

    // Apply property filters
    if (input.filters) {
      for (const filter of input.filters) {
        const jsonPath = `properties->>'${filter.property}'`;
        
        switch (filter.operator) {
          case 'eq':
            conditions.push(sql`${sql.raw(jsonPath)} = ${filter.value}`);
            break;
          case 'ne':
            conditions.push(sql`${sql.raw(jsonPath)} != ${filter.value}`);
            break;
          case 'contains':
            conditions.push(sql`${sql.raw(jsonPath)} ILIKE ${'%' + filter.value + '%'}`);
            break;
          case 'gt':
            conditions.push(sql`(${sql.raw(jsonPath)})::numeric > ${filter.value}`);
            break;
          case 'gte':
            conditions.push(sql`(${sql.raw(jsonPath)})::numeric >= ${filter.value}`);
            break;
          case 'lt':
            conditions.push(sql`(${sql.raw(jsonPath)})::numeric < ${filter.value}`);
            break;
          case 'lte':
            conditions.push(sql`(${sql.raw(jsonPath)})::numeric <= ${filter.value}`);
            break;
          case 'in':
            if (Array.isArray(filter.value)) {
              conditions.push(sql`${sql.raw(jsonPath)} = ANY(${filter.value})`);
            }
            break;
        }
      }
    }

    const where = and(...conditions);
    
    // Handle sorting by JSONB property
    let orderBy: SQL | undefined;
    if (input.sort) {
      const jsonPath = `properties->>'${input.sort.property}'`;
      orderBy = input.sort.direction === 'desc' 
        ? sql`${sql.raw(jsonPath)} DESC`
        : sql`${sql.raw(jsonPath)} ASC`;
    }

    // Get paginated results
    const result = await this.findPaginated(
      {
        page: input.page,
        limit: input.limit,
      },
      where
    );

    // Attach definitions
    const definitionIds = [...new Set(result.data.map(r => r.objectDefinitionId))];
    const definitions = await this.definitionRepo.findByIds(definitionIds);
    const definitionMap = new Map(definitions.map(d => [d.id, d]));

    const dataWithDefinitions: ObjectRecordWithDefinition[] = result.data.map(record => ({
      ...record,
      definition: definitionMap.get(record.objectDefinitionId)
    }));

    return {
      ...result,
      data: dataWithDefinitions
    };
  }

  /**
   * Get records by type
   */
  async getByType(
    objectType: string,
    organizationId: number,
    options?: FindOptions
  ): Promise<ObjectRecord[]> {
    const definition = await this.definitionRepo.findOne(
      eq(objectDefinition.internalName, objectType)
    );

    if (!definition) {
      return [];
    }

    const conditions = and(
      eq(objectRecord.objectDefinitionId, definition.id),
      eq(objectRecord.organizationId, organizationId),
      isNull(objectRecord.deletedAt),
      options?.where
    );

    return await this.findMany({
      ...options,
      where: conditions
    });
  }

  /**
   * Get custom properties for an object type
   */
  async getObjectProperties(objectType: string): Promise<ObjectProperty[]> {
    const definition = await this.definitionRepo.findOne(
      eq(objectDefinition.internalName, objectType)
    );

    if (!definition) {
      return [];
    }

    return await this.propertyRepo.findMany({
      where: eq(objectProperty.objectDefinitionId, definition.id)
    });
  }

  /**
   * Create custom property
   */
  async createProperty(
    objectType: string,
    property: Omit<ObjectProperty, 'id' | 'objectDefinitionId' | 'createdAt' | 'updatedAt'>
  ): Promise<ObjectProperty> {
    const definition = await this.definitionRepo.findOne(
      eq(objectDefinition.internalName, objectType)
    );

    if (!definition) {
      throw new Error(`Object type ${objectType} not found`);
    }

    return await this.propertyRepo.create({
      ...property,
      objectDefinitionId: definition.id,
    } as any);
  }

  /**
   * Bulk upsert records
   */
  async bulkUpsert(
    records: CreateObjectRecordInput[],
    uniqueProperty = 'id'
  ): Promise<ObjectRecord[]> {
    const results: ObjectRecord[] = [];

    for (const record of records) {
      const definition = await this.definitionRepo.findOne(
        eq(objectDefinition.internalName, record.objectType)
      );

      if (!definition) continue;

      // Check if record exists
      const existing = await this.findOne(
        and(
          eq(objectRecord.objectDefinitionId, definition.id),
          eq(objectRecord.organizationId, record.organizationId),
          sql`properties->>'${uniqueProperty}' = ${record.properties[uniqueProperty]}`
        )
      );

      if (existing) {
        // Update
        const updated = await this.updateObjectRecord(existing.id, {
          properties: record.properties
        });
        if (updated) results.push(updated);
      } else {
        // Create
        const created = await this.createObjectRecord(record);
        results.push(created);
      }
    }

    return results;
  }
}