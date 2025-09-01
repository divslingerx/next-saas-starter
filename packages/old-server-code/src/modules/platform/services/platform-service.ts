/**
 * Platform Service Base Class
 * Business logic layer following HubSpot API patterns
 */

import { PlatformRepository } from "../repositories/platform-repository";
import type { 
  Record as PlatformRecord, 
  RecordWithAssociations,
  SearchParams,
  BulkOperationResult,
  FilterCondition
} from "../../../db/schema/platform/types";
import type { GetPageOptions, BatchInput } from "../repositories/platform-repository";
import { z } from "zod";

export interface PlatformServiceOptions {
  objectType: string;
  organizationId: string;
  userId?: string;
}

// Zod-based validation schema
export type ValidationSchema = z.ZodObject<any>;

export interface PlatformEvent {
  type: string;
  objectType: string;
  objectId?: number;
  organizationId: string;
  userId?: string;
  data: any;
  timestamp: Date;
}

/**
 * Base service for all platform objects with business logic
 */
export abstract class PlatformService {
  protected repository: PlatformRepository;
  protected objectType: string;
  protected organizationId: string;
  protected userId?: string;
  protected validationSchema?: ValidationSchema;
  protected eventHandlers: Array<(event: PlatformEvent) => void | Promise<void>> = [];

  constructor(options: PlatformServiceOptions) {
    this.objectType = options.objectType;
    this.organizationId = options.organizationId;
    this.userId = options.userId;
    this.repository = new PlatformRepository({
      objectType: options.objectType,
      organizationId: options.organizationId
    });
    this.defineValidationSchema();
  }

  /**
   * Define validation schema for the object type
   * Override in child classes
   */
  protected defineValidationSchema(): void {
    // Override in child classes to set this.validationSchema
  }

  /**
   * Add event handler
   */
  protected addEventHandler(handler: (event: PlatformEvent) => void | Promise<void>): void {
    this.eventHandlers.push(handler);
  }

  /**
   * Validate properties using Zod schema
   */
  protected async validateProperties(
    properties: Record<string, any>, 
    isUpdate = false
  ): Promise<{ isValid: boolean; errors: string[] }> {
    if (!this.validationSchema) {
      // No validation schema defined, skip validation
      return { isValid: true, errors: [] };
    }

    try {
      // For updates, make all fields optional
      const schema = isUpdate ? this.validationSchema.partial() : this.validationSchema;
      schema.parse(properties);
      return { isValid: true, errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.issues.map(issue => 
          `${issue.path.join('.')}: ${issue.message}`
        );
        return { isValid: false, errors };
      }
      return { isValid: false, errors: ['Validation failed'] };
    }
  }

  /**
   * Check permissions for operation
   * Override in child classes for specific permission logic
   */
  protected async checkPermissions(operation: string, recordId?: number): Promise<boolean> {
    // Basic implementation - override in child classes
    return true;
  }

  /**
   * Emit platform event
   */
  protected async emitEvent(type: string, data: any, objectId?: number): Promise<void> {
    const event: PlatformEvent = {
      type,
      objectType: this.objectType,
      objectId,
      organizationId: this.organizationId,
      userId: this.userId,
      data,
      timestamp: new Date()
    };

    // Execute all event handlers
    await Promise.allSettled(
      this.eventHandlers.map(handler => handler(event))
    );
  }

  /**
   * Create new record with validation and events
   */
  async create(properties: Record<string, any>): Promise<PlatformRecord> {
    const validation = await this.validateProperties(properties, false);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const hasPermission = await this.checkPermissions('create');
    if (!hasPermission) {
      throw new Error('Permission denied');
    }

    const record = await this.repository.create(properties);
    
    await this.emitEvent('record.created', record, record.id);
    
    return record;
  }

  /**
   * Update existing record with validation and events
   */
  async update(id: number, properties: Record<string, any>): Promise<PlatformRecord> {
    const validation = await this.validateProperties(properties, true);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const hasPermission = await this.checkPermissions('update', id);
    if (!hasPermission) {
      throw new Error('Permission denied');
    }

    const record = await this.repository.update(id, properties);
    
    await this.emitEvent('record.updated', { id, properties, record }, id);
    
    return record;
  }

  /**
   * Delete record with permissions and events
   */
  async delete(id: number): Promise<void> {
    const hasPermission = await this.checkPermissions('delete', id);
    if (!hasPermission) {
      throw new Error('Permission denied');
    }

    const record = await this.repository.findById(id);
    await this.repository.delete(id);
    
    await this.emitEvent('record.deleted', { id, record }, id);
  }

  /**
   * Get record by ID with permissions
   */
  async findById(id: number): Promise<PlatformRecord | null> {
    const hasPermission = await this.checkPermissions('read', id);
    if (!hasPermission) {
      throw new Error('Permission denied');
    }

    return this.repository.findById(id);
  }

  /**
   * Search records with permissions
   */
  async search(searchRequest: {
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
    organizationId?: string;
  }): Promise<{
    total: number;
    results: PlatformRecord[];
    paging?: { next?: { after: string } };
  }> {
    const hasPermission = await this.checkPermissions('read');
    if (!hasPermission) {
      throw new Error('Permission denied');
    }

    const { organizationId, ...searchParams } = searchRequest;
    return this.repository.doSearch(searchParams);
  }

  /**
   * Get all records (paginated)
   */
  async getAll(options?: GetPageOptions): Promise<{ 
    results: PlatformRecord[]; 
    paging?: { 
      next?: { after: string; link: string };
      prev?: { after: string; link: string };
    };
  }> {
    const hasPermission = await this.checkPermissions('read');
    if (!hasPermission) {
      throw new Error('Permission denied');
    }

    return this.repository.getPage(options);
  }

  /**
   * Batch create records
   */
  async batchCreate(inputs: Array<Record<string, any>>): Promise<BulkOperationResult> {
    const hasPermission = await this.checkPermissions('create');
    if (!hasPermission) {
      throw new Error('Permission denied');
    }

    // Validate all inputs
    const validationResults = await Promise.all(
      inputs.map(input => this.validateProperties(input, false))
    );

    const validInputs: Array<{ properties: Record<string, any> }> = [];
    const errors: Array<{ recordId: number; error: string; details?: any }> = [];

    inputs.forEach((input, index) => {
      const validation = validationResults[index];
      if (validation?.isValid) {
        validInputs.push({ properties: input });
      } else {
        errors.push({
          recordId: index,
          error: validation?.errors?.join(', ') || 'Validation failed',
          details: input
        });
      }
    });

    if (validInputs.length === 0) {
      return {
        success: 0,
        failed: inputs.length,
        skipped: 0,
        errors
      };
    }

    const result = await this.repository.batchCreate({ inputs: validInputs });
    
    await this.emitEvent('records.batch_created', {
      created: result.results.length,
      failed: errors.length,
      results: result.results
    });
    
    return {
      success: result.results.length,
      failed: errors.length,
      skipped: 0,
      errors
    };
  }

  /**
   * Batch update records
   */
  async batchUpdate(inputs: BatchInput): Promise<BulkOperationResult> {
    const hasPermission = await this.checkPermissions('update');
    if (!hasPermission) {
      throw new Error('Permission denied');
    }

    // Validate all updates
    const validationResults = await Promise.all(
      inputs.inputs.map(input => this.validateProperties(input.properties, true))
    );

    const validInputs = inputs.inputs.filter((_, index) => validationResults[index]?.isValid);
    const errors: Array<{ recordId: number; error: string; details?: any }> = [];

    inputs.inputs.forEach((input, index) => {
      const validation = validationResults[index];
      if (!validation?.isValid) {
        errors.push({
          recordId: input.id || index,
          error: validation?.errors?.join(', ') || 'Validation failed',
          details: input
        });
      }
    });
    
    if (validInputs.length === 0) {
      return {
        success: 0,
        failed: inputs.inputs.length,
        skipped: 0,
        errors
      };
    }

    const result = await this.repository.batchUpdate({ inputs: validInputs });
    
    await this.emitEvent('records.batch_updated', {
      updated: result.results.length,
      results: result.results
    });
    
    return {
      success: result.results.length,
      failed: errors.length,
      skipped: 0,
      errors
    };
  }

  /**
   * Archive record (soft delete)
   */
  async archive(id: number): Promise<PlatformRecord> {
    const hasPermission = await this.checkPermissions('delete', id);
    if (!hasPermission) {
      throw new Error('Permission denied');
    }

    const record = await this.repository.update(id, { isArchived: true });
    
    await this.emitEvent('record.archived', { id, record }, id);
    
    return record;
  }

  /**
   * Unarchive record
   */
  async unarchive(id: number): Promise<PlatformRecord> {
    const hasPermission = await this.checkPermissions('update', id);
    if (!hasPermission) {
      throw new Error('Permission denied');
    }

    const record = await this.repository.update(id, { isArchived: false });
    
    await this.emitEvent('record.unarchived', { id, record }, id);
    
    return record;
  }
}