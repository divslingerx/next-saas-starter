import { text, bigint, boolean, doublePrecision, integer, index, pgTableCreator } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// Create table with prefix
export const createTable = pgTableCreator((name) => `agency-app_${name}`);

// Location zones for organized warehouse management
export const locationZone = createTable("location_zone", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  locationId: bigint("location_id", { mode: "number" }).notNull(),
  
  name: text("name"), // "A1", "Cold Storage", "High Value"
  type: text("type"), // picking, storage, receiving, shipping
  
  // Physical location
  aisle: text("aisle"),
  rack: text("rack"),
  shelf: text("shelf"),
  bin: text("bin"),
  
  // Constraints
  temperatureControlled: boolean("temperature_controlled"),
  securityLevel: text("security_level"), // standard, high, restricted
  maxWeight: doublePrecision("max_weight"),
  
  active: boolean("active").default(true),
});

// Where specific inventory is located within a location
export const inventoryBin = createTable("inventory_bin", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  inventoryItemId: bigint("inventory_item_id", { mode: "number" }).notNull(),
  locationId: bigint("location_id", { mode: "number" }).notNull(),
  locationZoneId: bigint("location_zone_id", { mode: "number" }),
  
  // Specific location
  binCode: text("bin_code"), // "A1-R3-S2"
  quantity: integer("quantity"),
  
  // Stock type
  stockType: text("stock_type"), // available, damaged, quarantine, reserved
  
  // Picking priority
  pickingPriority: integer("picking_priority"), // 1 = pick first
  
  // Dates
  receivedDate: timestamp("received_date"),
  expiryDate: timestamp("expiry_date"),
  
  // Batch/lot tracking
  batchNumber: text("batch_number"),
  serialNumbers: text("serial_numbers"), // JSON array
}, (table) => [
  index("inventory_bin_item_location_idx").on(table.inventoryItemId, table.locationId),
  index("inventory_bin_zone_idx").on(table.locationZoneId),
  index("inventory_bin_expiry_idx").on(table.expiryDate),
]);

// Location capabilities and constraints
export const locationCapability = createTable("location_capability", {
  locationId: bigint("location_id", { mode: "number" }).primaryKey(),
  
  // Capabilities
  canFulfillOrders: boolean("can_fulfill_orders").default(true),
  canReceiveInventory: boolean("can_receive_inventory").default(true),
  canTransferInventory: boolean("can_transfer_inventory").default(true),
  
  // Services
  supportsPickup: boolean("supports_pickup").default(false),
  supportsSameDay: boolean("supports_same_day").default(false),
  supportsNextDay: boolean("supports_next_day").default(true),
  
  // Constraints
  maxOrdersPerDay: integer("max_orders_per_day"),
  processingCutoffTime: text("processing_cutoff_time"), // "14:00"
  
  // Shipping carriers available
  availableCarriers: text("available_carriers"), // JSON array
});

// Safety stock levels per location
export const inventorySafetyStock = createTable("inventory_safety_stock", {
  inventoryItemId: bigint("inventory_item_id", { mode: "number" }).notNull(),
  locationId: bigint("location_id", { mode: "number" }).notNull(),
  
  minQuantity: integer("min_quantity"),
  maxQuantity: integer("max_quantity"),
  reorderPoint: integer("reorder_point"),
  reorderQuantity: integer("reorder_quantity"),
  
  // Lead times
  leadTimeDays: integer("lead_time_days"),
  
  // Auto-reorder
  autoReorder: boolean("auto_reorder").default(false),
  preferredSupplierId: bigint("preferred_supplier_id", { mode: "number" }),
}, (table) => [
  index("inventory_safety_stock_item_location_idx").on(table.inventoryItemId, table.locationId),
]);

// ABC analysis for inventory optimization
export const inventoryAbcAnalysis = createTable("inventory_abc_analysis", {
  inventoryItemId: bigint("inventory_item_id", { mode: "number" }).primaryKey(),
  
  // Classification
  abcCategory: text("abc_category"), // A, B, C
  
  // Metrics (calculated periodically)
  annualRevenue: doublePrecision("annual_revenue"),
  annualUnitsSold: integer("annual_units_sold"),
  turnoverRate: doublePrecision("turnover_rate"),
  
  // Recommendations
  recommendedMinStock: integer("recommended_min_stock"),
  recommendedMaxStock: integer("recommended_max_stock"),
  
  lastCalculatedAt: timestamp("last_calculated_at"),
});

// Zod schemas
export const insertLocationZoneSchema = createInsertSchema(locationZone);
export const selectLocationZoneSchema = createSelectSchema(locationZone);

export const insertInventoryBinSchema = createInsertSchema(inventoryBin);
export const selectInventoryBinSchema = createSelectSchema(inventoryBin);

export const insertLocationCapabilitySchema = createInsertSchema(locationCapability);
export const selectLocationCapabilitySchema = createSelectSchema(locationCapability);

export const insertInventorySafetyStockSchema = createInsertSchema(inventorySafetyStock);
export const selectInventorySafetyStockSchema = createSelectSchema(inventorySafetyStock);

// Type exports
export type LocationZone = typeof locationZone.$inferSelect;
export type InventoryBin = typeof inventoryBin.$inferSelect;
export type LocationCapability = typeof locationCapability.$inferSelect;
export type InventorySafetyStock = typeof inventorySafetyStock.$inferSelect;