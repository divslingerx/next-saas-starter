import { text, bigint, boolean, doublePrecision, integer, timestamp, jsonb, index, pgTableCreator } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Create table with prefix
export const createTable = pgTableCreator((name) => `agency-app_${name}`);

// Product bundles/kits
export const productBundle = createTable("product_bundle", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  // Bundle product reference (the parent product)
  productId: bigint("product_id", { mode: "number" }).notNull().unique(),
  
  // Bundle type
  type: text("type").notNull(), // fixed, dynamic, mix_match
  
  // Bundle settings
  allowSubstitutions: boolean("allow_substitutions").default(false),
  trackComponentInventory: boolean("track_component_inventory").default(true),
  
  // Pricing strategy
  pricingStrategy: text("pricing_strategy").notNull(), // fixed, sum_components, percentage_discount
  discountPercentage: integer("discount_percentage"), // For percentage_discount strategy
  fixedPrice: doublePrecision("fixed_price"), // For fixed pricing
  
  // Mix and match settings
  minItems: integer("min_items"), // Minimum items for mix & match
  maxItems: integer("max_items"), // Maximum items for mix & match
  
  // Display settings
  showComponents: boolean("show_components").default(true),
  componentLayout: text("component_layout").default("list"), // list, grid, carousel
  
  // Metadata
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("product_bundle_product_idx").on(table.productId),
  index("product_bundle_type_idx").on(table.type),
]);

// Bundle components (items in the bundle)
export const productBundleComponent = createTable("product_bundle_component", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  // Bundle reference
  bundleId: bigint("bundle_id", { mode: "number" }).notNull(),
  
  // Component product/variant
  productId: bigint("product_id", { mode: "number" }).notNull(),
  variantId: bigint("variant_id", { mode: "number" }), // Specific variant, null = any variant
  
  // Quantity and constraints
  quantity: integer("quantity").notNull().default(1),
  isRequired: boolean("is_required").default(true),
  position: integer("position").default(0),
  
  // Mix & match groups
  groupName: text("group_name"), // For grouping in mix & match bundles
  groupMinQuantity: integer("group_min_quantity"),
  groupMaxQuantity: integer("group_max_quantity"),
  
  // Pricing overrides
  priceOverride: doublePrecision("price_override"), // Override component price in bundle
  
  // Display
  displayName: text("display_name"), // Custom name in bundle context
  description: text("description"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("product_bundle_component_bundle_idx").on(table.bundleId),
  index("product_bundle_component_product_idx").on(table.productId),
  index("product_bundle_component_variant_idx").on(table.variantId),
  index("product_bundle_component_position_idx").on(table.position),
  index("product_bundle_component_group_idx").on(table.groupName),
]);

// Bundle inventory tracking
export const productBundleInventory = createTable("product_bundle_inventory", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  // Bundle reference
  bundleId: bigint("bundle_id", { mode: "number" }).notNull(),
  locationId: bigint("location_id", { mode: "number" }).notNull(),
  
  // Calculated availability
  availableQuantity: integer("available_quantity").notNull().default(0),
  reservedQuantity: integer("reserved_quantity").notNull().default(0),
  
  // Last calculation
  lastCalculatedAt: timestamp("last_calculated_at").defaultNow().notNull(),
  
  // Constraints
  maxBundlesFromComponents: integer("max_bundles_from_components"), // Based on component availability
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("product_bundle_inventory_bundle_idx").on(table.bundleId),
  index("product_bundle_inventory_location_idx").on(table.locationId),
  index("product_bundle_inventory_calculated_idx").on(table.lastCalculatedAt),
]);

// Create Zod schemas for validation
export const insertProductBundleSchema = createInsertSchema(productBundle, {
  type: z.enum(["fixed", "dynamic", "mix_match"]),
  pricingStrategy: z.enum(["fixed", "sum_components", "percentage_discount"]),
  componentLayout: z.enum(["list", "grid", "carousel"]).optional(),
  metadata: z.record(z.any()).optional(),
});
export const selectProductBundleSchema = createSelectSchema(productBundle);

export const insertProductBundleComponentSchema = createInsertSchema(productBundleComponent);
export const selectProductBundleComponentSchema = createSelectSchema(productBundleComponent);

export const insertProductBundleInventorySchema = createInsertSchema(productBundleInventory);
export const selectProductBundleInventorySchema = createSelectSchema(productBundleInventory);

// Type exports
export type ProductBundle = typeof productBundle.$inferSelect;
export type NewProductBundle = typeof productBundle.$inferInsert;
export type ProductBundleComponent = typeof productBundleComponent.$inferSelect;
export type NewProductBundleComponent = typeof productBundleComponent.$inferInsert;
export type ProductBundleInventory = typeof productBundleInventory.$inferSelect;
export type NewProductBundleInventory = typeof productBundleInventory.$inferInsert;