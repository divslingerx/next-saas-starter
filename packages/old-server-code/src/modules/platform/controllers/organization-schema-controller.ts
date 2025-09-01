/**
 * Organization Schema Controller
 * API endpoints for managing custom properties and schema overrides
 */

import type { Context } from "hono";
import { OrganizationSchemaService } from "../services/organization-schema-service";
import { z } from "zod";
import { globalContext } from "@/core/context/global-context";

// Validation schemas
const customPropertySchema = z.object({
  name: z.string().min(1, "Property name is required"),
  type: z.enum(["string", "number", "boolean", "date", "enumeration"]),
  label: z.string().min(1, "Property label is required"),
  required: z.boolean().optional().default(false),
  options: z.array(z.string()).optional(), // For enumeration types
  default: z.any().optional(),
});

const propertyOverrideSchema = z.object({
  label: z.string().optional(),
  required: z.boolean().optional(), 
  default: z.any().optional(),
  options: z.array(z.string()).optional(),
  hidden: z.boolean().optional(),
});

export class OrganizationSchemaController {
  
  /**
   * GET /api/platform/schema/:objectType
   * Get merged schema for an object type
   */
  static async getMergedSchema(c: Context) {
    try {
      const objectType = c.req.param("objectType");
      const organizationId = globalContext.organizationId;
      
      if (!organizationId) {
        return c.json({ error: "Organization not found" }, 400);
      }
      
      const schema = await OrganizationSchemaService.getMergedSchema(
        organizationId,
        objectType
      );
      
      return c.json({
        success: true,
        data: schema
      });
      
    } catch (error) {
      console.error("Error getting merged schema:", error);
      return c.json({ 
        error: error instanceof Error ? error.message : "Failed to get schema" 
      }, 500);
    }
  }
  
  /**
   * POST /api/platform/schema/:objectType/properties
   * Add custom property to object type
   */
  static async addCustomProperty(c: Context) {
    try {
      const objectType = c.req.param("objectType");
      const organizationId = globalContext.organizationId;
      
      if (!organizationId) {
        return c.json({ error: "Organization not found" }, 400);
      }
      
      const body = await c.req.json();
      const property = customPropertySchema.parse(body);
      
      await OrganizationSchemaService.addCustomProperty(
        organizationId,
        objectType,
        property
      );
      
      return c.json({
        success: true,
        message: `Custom property '${property.name}' added to ${objectType}`
      });
      
    } catch (error) {
      console.error("Error adding custom property:", error);
      if (error instanceof z.ZodError) {
        return c.json({ 
          error: "Validation error",
          details: error.issues
        }, 400);
      }
      return c.json({ 
        error: error instanceof Error ? error.message : "Failed to add property" 
      }, 500);
    }
  }
  
  /**
   * PUT /api/platform/schema/:objectType/properties/:propertyName
   * Override existing property (e.g., change enum options, labels)
   */
  static async overrideProperty(c: Context) {
    try {
      const objectType = c.req.param("objectType");
      const propertyName = c.req.param("propertyName");
      const organizationId = globalContext.organizationId;
      
      if (!organizationId) {
        return c.json({ error: "Organization not found" }, 400);
      }
      
      const body = await c.req.json();
      const overrides = propertyOverrideSchema.parse(body);
      
      await OrganizationSchemaService.overrideProperty(
        organizationId,
        objectType,
        propertyName,
        overrides
      );
      
      return c.json({
        success: true,
        message: `Property '${propertyName}' overridden for ${objectType}`
      });
      
    } catch (error) {
      console.error("Error overriding property:", error);
      if (error instanceof z.ZodError) {
        return c.json({ 
          error: "Validation error",
          details: error.issues
        }, 400);
      }
      return c.json({ 
        error: error instanceof Error ? error.message : "Failed to override property" 
      }, 500);
    }
  }
  
  /**
   * POST /api/platform/schema/initialize
   * Initialize organization schemas (for existing orgs)
   */
  static async initializeSchemas(c: Context) {
    try {
      const organizationId = globalContext.organizationId;
      
      if (!organizationId) {
        return c.json({ error: "Organization not found" }, 400);
      }
      
      await OrganizationSchemaService.initializeOrganizationSchema({
        organizationId
      });
      
      return c.json({
        success: true,
        message: `Organization schemas initialized for ${organizationId}`
      });
      
    } catch (error) {
      console.error("Error initializing schemas:", error);
      return c.json({ 
        error: error instanceof Error ? error.message : "Failed to initialize schemas" 
      }, 500);
    }
  }
}