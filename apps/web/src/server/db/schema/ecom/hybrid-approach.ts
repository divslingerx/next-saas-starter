// HYBRID APPROACH: Best of Both Worlds

// 1. Keep core e-commerce tables for performance
// These are your high-traffic, performance-critical tables
export * from './product';
export * from './order';
export * from './customer';
export * from './inventory-tracking';
export * from './cart';

// 2. Add object registry for extensibility
// Every core entity ALSO gets an object entry
import { pgTable, text, bigint, foreignKey } from "drizzle-orm/pg-core";

export const objectRegistry = pgTable("object_registry", {
  objectId: text("object_id").primaryKey(), // "PROD-123"
  objectType: text("object_type"), // "product"
  
  // Reference to the actual table
  tableReference: text("table_reference"), // "product"
  tablePrimaryKey: bigint("table_primary_key", { mode: "number" }), // 123
  
  // This allows custom properties on core objects
  allowCustomProperties: boolean("allow_custom_properties").default(true),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// 3. Custom properties only for flexibility
// Core fields stay in original tables, custom fields go here
export const customProperty = pgTable("custom_property", {
  objectId: text("object_id").notNull(),
  propertyName: text("property_name").notNull(),
  propertyValue: jsonb("property_value"),
  
  // Indexes for performance
  unique("custom_property_unique").on("object_id", "property_name"),
  index("custom_property_object_idx").on("object_id"),
});

// 4. Use unified model for NEW features
// CRM, workflows, etc. use the flexible model
export * from './unified-object-model';
export * from './automation-workflow';
export * from './crm-features';

// 5. Smart Query Builder
// Abstraction that knows when to use which approach
export class SmartQueryBuilder {
  // For core objects, use direct queries
  async getProduct(id: number) {
    return db.query.product.findFirst({
      where: eq(product.id, id),
      with: {
        variants: true,
        images: true,
        // Custom properties loaded separately if needed
      }
    });
  }
  
  // For custom objects, use unified model
  async getCustomObject(objectId: string) {
    return db.query.object.findFirst({
      where: eq(object.objectId, objectId),
      with: {
        properties: true,
        relationships: true,
      }
    });
  }
  
  // Unified API that routes appropriately
  async getAnyObject(objectId: string) {
    const type = objectId.split('-')[0];
    
    switch(type) {
      case 'PROD': return this.getProduct(/* extract id */);
      case 'ORD': return this.getOrder(/* extract id */);
      default: return this.getCustomObject(objectId);
    }
  }
}