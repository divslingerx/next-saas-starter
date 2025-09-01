/**
 * CRM Object Service
 * Manages the inheritance between concrete CRM tables and platform objects
 * Provides unified access to both concrete fields and custom properties
 */

import { db } from "../../../db";
import { 
  contacts, 
  companies, 
  leads, 
  deals, 
  projects, 
  invoices 
} from "../../../db/schema/crm";
import { record as platformObjects } from "../../../db/schema/platform/core";
import { eq, and, sql } from "drizzle-orm";
import { CacheService } from "../../../services/cache.service";

type CrmObjectType = 'contacts' | 'companies' | 'leads' | 'deals' | 'projects' | 'invoices';

const tableMapping = {
  contacts,
  companies,
  leads,
  deals,
  projects,
  invoices,
} as const;

export class CrmObjectService {
  /**
   * Create a new CRM object with platform object inheritance
   */
  static async create(
    objectType: CrmObjectType,
    organizationId: string,
    data: any,
    customProperties: Record<string, any> = {}
  ): Promise<any> {
    return await db.transaction(async (tx) => {
      // 1. Create platform object first
      const [platformObject] = await tx.insert(platformObjects).values({
        organizationId,
        objectDefinitionId: 1, // TODO: Get actual object definition ID based on objectType
        properties: customProperties,
      }).returning();

      if (!platformObject) {
        throw new Error('Failed to create platform object');
      }

      // 2. Create concrete CRM object with reference to platform object
      const table = tableMapping[objectType];
      const [crmObject] = await tx.insert(table).values({
        ...data,
        organizationId,
        objectId: platformObject.id,
      }).returning();

      if (!crmObject) {
        throw new Error('Failed to create CRM object');
      }

      // 3. Clear relevant caches
      await CacheService.invalidateRecordCache(crmObject.id, organizationId);

      return {
        ...crmObject,
        customProperties,
      };
    });
  }

  /**
   * Get CRM object with custom properties merged
   */
  static async findById(
    objectType: CrmObjectType,
    id: number,
    organizationId: string
  ): Promise<any> {
    // Try cache first
    const cached = await CacheService.getCachedRecordWithProperties(id, organizationId);
    if (cached) {
      return cached;
    }

    const table = tableMapping[objectType];
    
    // Get concrete object
    const crmResults = await db
      .select()
      .from(table)
      .where(and(
        eq((table as any).id, id),
        eq((table as any).organizationId, organizationId)
      ))
      .limit(1);

    if (crmResults.length === 0) {
      return null;
    }

    const crmRecord = crmResults[0];

    // Get platform object properties
    const platformResults = await db
      .select()
      .from(platformObjects)
      .where(eq(platformObjects.id, (crmRecord as any).objectId))
      .limit(1);

    const platformRecord = platformResults[0];
    
    const record = {
      ...crmRecord,
      customProperties: platformRecord?.properties || {},
    };

    // Cache the result
    await CacheService.cacheRecordWithProperties(id, organizationId, record);

    return record;
  }

  /**
   * Update CRM object including custom properties
   */
  static async update(
    objectType: CrmObjectType,
    id: number,
    organizationId: string,
    updates: any,
    customPropertyUpdates: Record<string, any> = {}
  ): Promise<any> {
    return await db.transaction(async (tx) => {
      const table = tableMapping[objectType];

      // 1. Update concrete table
      const [updatedRecord] = await tx
        .update(table)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(and(
          eq((table as any).id, id),
          eq((table as any).organizationId, organizationId)
        ))
        .returning();

      // 2. Update custom properties if provided
      if (Object.keys(customPropertyUpdates).length > 0) {
        // Get existing platform object
        const [platformObject] = await tx
          .select()
          .from(platformObjects)
          .where(eq(platformObjects.id, (updatedRecord as any).objectId));

        const currentProperties = platformObject?.properties || {};
        const mergedProperties = {
          ...currentProperties,
          ...customPropertyUpdates,
        };

        await tx
          .update(platformObjects)
          .set({
            properties: mergedProperties,
          })
          .where(eq(platformObjects.id, (updatedRecord as any).objectId));
      }

      // 3. Clear cache
      await CacheService.invalidateRecordCache(id, organizationId);

      return updatedRecord;
    });
  }

  /**
   * Delete CRM object and its platform object
   */
  static async delete(
    objectType: CrmObjectType,
    id: number,
    organizationId: string
  ): Promise<boolean> {
    return await db.transaction(async (tx) => {
      const table = tableMapping[objectType];

      // Get the object to find its platform object ID
      const records = await tx
        .select({ objectId: (table as any).objectId })
        .from(table)
        .where(and(
          eq((table as any).id, id),
          eq((table as any).organizationId, organizationId)
        ));

      if (records.length === 0) {
        return false;
      }

      const record = records[0];
      if (!record) {
        return false;
      }

      // Delete from concrete table (this will cascade due to FK constraints)
      await tx
        .delete(table)
        .where(and(
          eq((table as any).id, id),
          eq((table as any).organizationId, organizationId)
        ));

      // Delete platform object (cascade will handle related records)
      await tx
        .delete(platformObjects)
        .where(eq(platformObjects.id, record.objectId));

      // Clear cache
      await CacheService.invalidateRecordCache(id, organizationId);

      return true;
    });
  }

  /**
   * Simple search for CRM objects
   */
  static async search(
    objectType: CrmObjectType,
    organizationId: string,
    filters: any = {},
    pagination: { limit: number; offset: number } = { limit: 50, offset: 0 }
  ): Promise<{ records: any[]; total: number }> {
    const table = tableMapping[objectType];

    // Simple search on concrete table for now
    const whereConditions = [eq((table as any).organizationId, organizationId)];
    
    // Add basic filters (this is simplified - in real implementation you'd need proper typing)
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        // This is a type-unsafe approach but works for the current implementation
        whereConditions.push(eq((table as any)[key], value));
      }
    });

    const records = await db
      .select()
      .from(table)
      .where(and(...whereConditions))
      .limit(pagination.limit)
      .offset(pagination.offset);

    // Get total count (simplified)
    const totalResult = await db
      .select({ count: sql`count(*)` })
      .from(table)
      .where(and(...whereConditions));

    return {
      records,
      total: Number(totalResult[0]?.count || 0),
    };
  }
}