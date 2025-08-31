/**
 * Platform Service
 * Business logic for flexible object operations
 */

import { z } from 'zod';
import type { db as Database } from '@charmlabs/db/client';
import { PlatformRepository, type CreateObjectRecordInput, type UpdateObjectRecordInput, type SearchObjectsInput } from '../repositories/platform.repository';
import type { ObjectDefinition, ObjectRecord, ObjectProperty } from '../objects/platform-objects';

export interface PlatformServiceOptions {
  db: typeof Database;
  organizationId: number;
  userId?: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface BulkOperationResult {
  success: number;
  failed: number;
  errors: Array<{
    index: number;
    message: string;
    data?: any;
  }>;
}

/**
 * Service for platform object business logic
 */
export class PlatformService {
  private repository: PlatformRepository;
  private organizationId: number;
  private userId?: number;
  private schemaCache: Map<string, z.ZodSchema> = new Map();

  constructor(options: PlatformServiceOptions) {
    this.repository = new PlatformRepository(options.db);
    this.organizationId = options.organizationId;
    this.userId = options.userId;
  }

  /**
   * Initialize default object definitions
   */
  async initializeDefaults(): Promise<void> {
    const defaults = [
      {
        internalName: 'contact',
        displayName: 'Contact',
        pluralName: 'Contacts',
        description: 'Customer relationship management contacts',
        icon: 'User',
        color: 'blue',
        searchableProperties: ['firstName', 'lastName', 'email', 'company'],
        requiredProperties: ['email'],
        uniqueProperties: ['email'],
      },
      {
        internalName: 'company',
        displayName: 'Company',
        pluralName: 'Companies',
        description: 'Business organizations',
        icon: 'Building',
        color: 'green',
        searchableProperties: ['name', 'domain', 'industry'],
        requiredProperties: ['name'],
        uniqueProperties: ['domain'],
      },
      {
        internalName: 'deal',
        displayName: 'Deal',
        pluralName: 'Deals',
        description: 'Sales opportunities',
        icon: 'DollarSign',
        color: 'orange',
        searchableProperties: ['title', 'stage', 'value'],
        requiredProperties: ['title', 'stage'],
      },
      {
        internalName: 'ticket',
        displayName: 'Ticket',
        pluralName: 'Tickets',
        description: 'Support tickets',
        icon: 'Ticket',
        color: 'purple',
        searchableProperties: ['subject', 'status', 'priority'],
        requiredProperties: ['subject', 'status'],
      }
    ];

    for (const def of defaults) {
      await this.repository.ensureObjectDefinition(def.internalName, def);
    }
  }

  /**
   * Get validation schema for object type
   */
  private getValidationSchema(definition: ObjectDefinition): z.ZodSchema {
    const cached = this.schemaCache.get(definition.internalName);
    if (cached) return cached;

    // Build schema from definition
    const schemaObj: Record<string, z.ZodTypeAny> = {};
    const properties = definition.properties as Record<string, any> || {};
    const required = definition.requiredProperties as string[] || [];

    for (const [key, config] of Object.entries(properties)) {
      let fieldSchema: z.ZodTypeAny;

      switch (config.type) {
        case 'string':
          fieldSchema = z.string();
          if (config.minLength) fieldSchema = (fieldSchema as z.ZodString).min(config.minLength);
          if (config.maxLength) fieldSchema = (fieldSchema as z.ZodString).max(config.maxLength);
          if (config.pattern) fieldSchema = (fieldSchema as z.ZodString).regex(new RegExp(config.pattern));
          break;
        case 'number':
          fieldSchema = z.number();
          if (config.min !== undefined) fieldSchema = (fieldSchema as z.ZodNumber).min(config.min);
          if (config.max !== undefined) fieldSchema = (fieldSchema as z.ZodNumber).max(config.max);
          break;
        case 'boolean':
          fieldSchema = z.boolean();
          break;
        case 'date':
          fieldSchema = z.string().datetime();
          break;
        case 'email':
          fieldSchema = z.string().email();
          break;
        case 'url':
          fieldSchema = z.string().url();
          break;
        case 'enum':
          if (config.values && Array.isArray(config.values)) {
            fieldSchema = z.enum(config.values as [string, ...string[]]);
          } else {
            fieldSchema = z.string();
          }
          break;
        case 'array':
          fieldSchema = z.array(z.any());
          break;
        case 'object':
          fieldSchema = z.record(z.any());
          break;
        default:
          fieldSchema = z.any();
      }

      // Make optional if not required
      if (!required.includes(key)) {
        fieldSchema = fieldSchema.optional();
      }

      schemaObj[key] = fieldSchema;
    }

    const schema = z.object(schemaObj);
    this.schemaCache.set(definition.internalName, schema);
    return schema;
  }

  /**
   * Validate properties against schema
   */
  async validateProperties(
    objectType: string,
    properties: Record<string, any>
  ): Promise<ValidationResult> {
    try {
      const definitions = await this.repository['definitionRepo'].findOne(
        (t: any) => t.internalName === objectType
      );

      if (!definitions) {
        return { isValid: false, errors: [`Unknown object type: ${objectType}`] };
      }

      const schema = this.getValidationSchema(definitions);
      schema.parse(properties);

      return { isValid: true, errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`)
        };
      }
      return { isValid: false, errors: ['Validation failed'] };
    }
  }

  /**
   * Create object with validation and auditing
   */
  async create(
    objectType: string,
    properties: Record<string, any>
  ): Promise<ObjectRecord> {
    // Validate
    const validation = await this.validateProperties(objectType, properties);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Add audit fields
    const now = new Date().toISOString();
    const enrichedProperties = {
      ...properties,
      createdAt: now,
      createdBy: this.userId,
      updatedAt: now,
      updatedBy: this.userId,
    };

    return await this.repository.createObjectRecord({
      objectType,
      organizationId: this.organizationId,
      properties: enrichedProperties,
      ownerId: this.userId,
    });
  }

  /**
   * Update object with validation and auditing
   */
  async update(
    id: number,
    properties: Record<string, any>
  ): Promise<ObjectRecord | null> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error(`Record ${id} not found`);
    }

    // Get object type for validation
    const definition = await this.repository['definitionRepo'].findById(existing.objectDefinitionId);
    if (!definition) {
      throw new Error('Object definition not found');
    }

    // Validate partial update
    const mergedProperties = {
      ...(existing.properties as any || {}),
      ...properties
    };
    
    const validation = await this.validateProperties(definition.internalName, mergedProperties);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Add audit fields
    const enrichedProperties = {
      ...properties,
      updatedAt: new Date().toISOString(),
      updatedBy: this.userId,
    };

    return await this.repository.updateObjectRecord(id, {
      properties: enrichedProperties
    });
  }

  /**
   * Search objects with filters
   */
  async search(input: Omit<SearchObjectsInput, 'organizationId'>) {
    return await this.repository.searchObjects({
      ...input,
      organizationId: this.organizationId,
    });
  }

  /**
   * Batch create with validation
   */
  async batchCreate(
    objectType: string,
    records: Array<Record<string, any>>
  ): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      success: 0,
      failed: 0,
      errors: []
    };

    const validRecords: CreateObjectRecordInput[] = [];

    // Validate all records
    for (let i = 0; i < records.length; i++) {
      const validation = await this.validateProperties(objectType, records[i]);
      
      if (validation.isValid) {
        const now = new Date().toISOString();
        validRecords.push({
          objectType,
          organizationId: this.organizationId,
          properties: {
            ...records[i],
            createdAt: now,
            createdBy: this.userId,
            updatedAt: now,
            updatedBy: this.userId,
          },
          ownerId: this.userId,
        });
      } else {
        result.failed++;
        result.errors.push({
          index: i,
          message: validation.errors.join(', '),
          data: records[i]
        });
      }
    }

    // Create valid records
    if (validRecords.length > 0) {
      try {
        const created = await this.repository.bulkUpsert(validRecords);
        result.success = created.length;
      } catch (error) {
        result.failed += validRecords.length;
        result.errors.push({
          index: -1,
          message: error instanceof Error ? error.message : 'Bulk creation failed'
        });
      }
    }

    return result;
  }

  /**
   * Get or create record by unique property
   */
  async findOrCreate(
    objectType: string,
    uniqueProperty: string,
    uniqueValue: any,
    properties: Record<string, any>
  ): Promise<{ record: ObjectRecord; created: boolean }> {
    // Search for existing
    const existing = await this.search({
      objectType,
      filters: [{
        property: uniqueProperty,
        operator: 'eq',
        value: uniqueValue
      }],
      limit: 1
    });

    if (existing.data.length > 0) {
      return { record: existing.data[0], created: false };
    }

    // Create new
    const record = await this.create(objectType, {
      ...properties,
      [uniqueProperty]: uniqueValue
    });

    return { record, created: true };
  }

  /**
   * Delete record (soft delete)
   */
  async delete(id: number): Promise<boolean> {
    const existing = await this.repository.findById(id);
    if (!existing) return false;

    await this.repository.update(id, {
      deletedAt: new Date(),
      deletedBy: this.userId
    } as any);

    return true;
  }

  /**
   * Restore soft-deleted record
   */
  async restore(id: number): Promise<ObjectRecord | null> {
    return await this.repository.update(id, {
      deletedAt: null,
      deletedBy: null
    } as any);
  }

  /**
   * Get custom properties for an object type
   */
  async getCustomProperties(objectType: string): Promise<ObjectProperty[]> {
    return await this.repository.getObjectProperties(objectType);
  }

  /**
   * Add custom property to object type
   */
  async addCustomProperty(
    objectType: string,
    property: {
      name: string;
      displayName: string;
      type: string;
      description?: string;
      isRequired?: boolean;
      isUnique?: boolean;
      defaultValue?: any;
      options?: any;
    }
  ): Promise<ObjectProperty> {
    return await this.repository.createProperty(objectType, {
      ...property,
      createdBy: this.userId,
    } as any);
  }
}