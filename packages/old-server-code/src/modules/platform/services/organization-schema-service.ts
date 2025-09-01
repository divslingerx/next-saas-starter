/**
 * Organization Schema Service
 * Manages organization-level customizations of platform objects
 */

import { db } from "@/db";
import { eq, and, sql } from "drizzle-orm";
import { objectDefinition, organizationObjectSchema } from "../../../db/schema/platform/core";
import type { PropertyDefinition } from "../../../db/schema/platform/types";

export interface InitializeOrganizationSchemaOptions {
  organizationId: string;
  objectTypes?: string[]; // If not provided, initializes all platform objects
}

export interface CustomProperty extends PropertyDefinition {
  name: string;
}

export interface PropertyOverride {
  label?: string;
  required?: boolean;
  default?: any;
  options?: string[]; // For enums
  hidden?: boolean;
}

/**
 * Service for managing organization-level schema customizations
 */
export class OrganizationSchemaService {
  
  /**
   * Initialize organization schema when org is created
   * Copies all platform object definitions as customizable schemas
   */
  static async initializeOrganizationSchema(options: InitializeOrganizationSchemaOptions): Promise<void> {
    const { organizationId, objectTypes } = options;
    
    // Get all platform object definitions (or filtered set)
    let platformObjects;
    if (objectTypes?.length) {
      platformObjects = await db.select()
        .from(objectDefinition)
        .where(
          and(
            eq(objectDefinition.isActive, true),
            sql`${objectDefinition.objectType} = ANY(${objectTypes})`
          )
        );
    } else {
      platformObjects = await db.select()
        .from(objectDefinition)
        .where(eq(objectDefinition.isActive, true));
    }
    
    // Create organization schema entries for each platform object with versioning
    const organizationSchemas = platformObjects.map((obj: any) => ({
      organizationId,
      objectDefinitionId: obj.id,
      customProperties: {}, // Empty initially - will be added via API
      hiddenProperties: [], // Empty initially
      propertyDefaults: {}, // Empty initially - org uses platform defaults
      customLayouts: null, // Will be added later
      schemaVersion: 1, // Start with version 1
      propertyMigrations: [], // Empty migration history
      lastMigrationAt: null, // No migrations yet
    }));
    
    // Insert all at once
    if (organizationSchemas.length > 0) {
      await db.insert(organizationObjectSchema).values(organizationSchemas);
    }
    
    console.log(`✅ Initialized ${organizationSchemas.length} object schemas for organization ${organizationId}`);
  }
  
  /**
   * Get merged schema for an object type (platform + organization customizations)
   */
  static async getMergedSchema(organizationId: string, objectType: string): Promise<{
    objectDefinition: any;
    properties: Record<string, PropertyDefinition>;
  }> {
    // Get platform object definition
    const [platformObject] = await db
      .select()
      .from(objectDefinition)
      .where(eq(objectDefinition.objectType, objectType))
      .limit(1);
      
    if (!platformObject) {
      throw new Error(`Object type '${objectType}' not found`);
    }
    
    // Get organization customizations
    const [orgSchema] = await db
      .select()
      .from(organizationObjectSchema)
      .where(
        eq(organizationObjectSchema.organizationId, organizationId) &&
        eq(organizationObjectSchema.objectDefinitionId, platformObject.id)
      )
      .limit(1);
    
    // If no org schema exists, initialize it
    if (!orgSchema) {
      await this.initializeOrganizationSchema({
        organizationId,
        objectTypes: [objectType]
      });
      
      // Retry getting org schema
      const [newOrgSchema] = await db
        .select()
        .from(organizationObjectSchema)
        .where(
          and(
            eq(organizationObjectSchema.organizationId, organizationId),
            eq(organizationObjectSchema.objectDefinitionId, platformObject.id)
          )
        )
        .limit(1);
        
      return {
        objectDefinition: platformObject,
        properties: platformObject.properties as Record<string, PropertyDefinition>
      };
    }
    
    // Merge platform + organization properties
    const platformProps = platformObject.properties as Record<string, PropertyDefinition>;
    const customProps = orgSchema.customProperties as Record<string, PropertyDefinition>;
    const propertyOverrides = orgSchema.propertyDefaults as Record<string, Partial<PropertyDefinition>>;
    const hiddenProps = orgSchema.hiddenProperties as string[];
    
    // Start with platform properties
    const mergedProperties = { ...platformProps };
    
    // Apply organization overrides to existing properties
    Object.entries(propertyOverrides).forEach(([propName, overrides]) => {
      if (mergedProperties[propName]) {
        mergedProperties[propName] = {
          ...mergedProperties[propName],
          ...overrides
        };
      }
    });
    
    // Add custom properties
    Object.entries(customProps).forEach(([propName, propDef]) => {
      mergedProperties[propName] = propDef;
    });
    
    // Remove hidden properties
    hiddenProps.forEach(propName => {
      delete mergedProperties[propName];
    });
    
    return {
      objectDefinition: {
        ...platformObject,
        properties: mergedProperties
      },
      properties: mergedProperties
    };
  }
  
  /**
   * Add custom property to organization object
   */
  static async addCustomProperty(
    organizationId: string, 
    objectType: string, 
    property: CustomProperty
  ): Promise<void> {
    const { name, ...propertyDef } = property;
    
    // Get platform object
    const [platformObject] = await db
      .select()
      .from(objectDefinition)
      .where(eq(objectDefinition.objectType, objectType))
      .limit(1);
      
    if (!platformObject) {
      throw new Error(`Object type '${objectType}' not found`);
    }
    
    // Update organization schema
    await db
      .update(organizationObjectSchema)
      .set({
        customProperties: {
          [name]: propertyDef
        }
      })
      .where(
        eq(organizationObjectSchema.organizationId, organizationId) &&
        eq(organizationObjectSchema.objectDefinitionId, platformObject.id)
      );
  }
  
  /**
   * Override property defaults (e.g., change enum options, labels)
   */
  static async overrideProperty(
    organizationId: string,
    objectType: string, 
    propertyName: string,
    overrides: PropertyOverride
  ): Promise<void> {
    // Get platform object
    const [platformObject] = await db
      .select()
      .from(objectDefinition)
      .where(eq(objectDefinition.objectType, objectType))
      .limit(1);
      
    if (!platformObject) {
      throw new Error(`Object type '${objectType}' not found`);
    }
    
    // Handle hidden property separately
    if (overrides.hidden) {
      await db
        .update(organizationObjectSchema)
        .set({
          hiddenProperties: [propertyName] // TODO: Handle array properly
        })
        .where(
          and(
            eq(organizationObjectSchema.organizationId, organizationId),
            eq(organizationObjectSchema.objectDefinitionId, platformObject.id)
          )
        );
    } else {
      // Update property defaults
      await db
        .update(organizationObjectSchema)
        .set({
          propertyDefaults: {
            [propertyName]: overrides
          }
        })
        .where(
          and(
            eq(organizationObjectSchema.organizationId, organizationId),
            eq(organizationObjectSchema.objectDefinitionId, platformObject.id)
          )
        );
    }
  }

  /**
   * Migrate organization schema to new version
   */
  static async migrateSchema(
    organizationId: string,
    objectType: string,
    newVersion: number,
    migrationData: {
      description: string;
      changes: Record<string, any>;
      rollbackData?: Record<string, any>;
    }
  ) {
    // Get platform object definition
    const [platformObject] = await db
      .select()
      .from(objectDefinition)
      .where(eq(objectDefinition.objectType, objectType))
      .limit(1);

    if (!platformObject) {
      throw new Error(`Object definition not found for type: ${objectType}`);
    }

    // Add migration to history
    const migration = {
      version: newVersion,
      timestamp: new Date().toISOString(),
      description: migrationData.description,
      changes: migrationData.changes,
      rollbackData: migrationData.rollbackData || null,
    };

    await db
      .update(organizationObjectSchema)
      .set({
        schemaVersion: newVersion,
        propertyMigrations: sql`${organizationObjectSchema.propertyMigrations} || ${JSON.stringify([migration])}::jsonb`,
        lastMigrationAt: new Date(),
      })
      .where(
        and(
          eq(organizationObjectSchema.organizationId, organizationId),
          eq(organizationObjectSchema.objectDefinitionId, platformObject.id)
        )
      );

    console.log(`✅ Migrated ${objectType} schema to version ${newVersion} for organization ${organizationId}`);
  }

  /**
   * Get current schema version for an organization's object type
   */
  static async getSchemaVersion(organizationId: string, objectType: string): Promise<number> {
    const [platformObject] = await db
      .select()
      .from(objectDefinition)
      .where(eq(objectDefinition.objectType, objectType))
      .limit(1);

    if (!platformObject) {
      throw new Error(`Object definition not found for type: ${objectType}`);
    }

    const [orgSchema] = await db
      .select({ schemaVersion: organizationObjectSchema.schemaVersion })
      .from(organizationObjectSchema)
      .where(
        and(
          eq(organizationObjectSchema.organizationId, organizationId),
          eq(organizationObjectSchema.objectDefinitionId, platformObject.id)
        )
      )
      .limit(1);

    return orgSchema?.schemaVersion || 1;
  }
}