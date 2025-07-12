import { text, bigint, doublePrecision, timestamp, integer, index, pgTableCreator } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// Create table with prefix
export const createTable = pgTableCreator((name) => `agency-app_${name}`);

// Stock movement/adjustment history
export const stockMovement = createTable("stock_movement", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  // Item and location
  inventoryItemId: bigint("inventory_item_id", { mode: "number" }).notNull(),
  locationId: bigint("location_id", { mode: "number" }).notNull(),
  
  // Movement details
  movementType: text("movement_type").notNull(), // sale, return, adjustment, transfer, damaged, theft, found
  quantity: integer("quantity").notNull(), // positive or negative
  
  // Running balance after movement
  balanceAfter: integer("balance_after").notNull(),
  
  // Reference to source
  referenceType: text("reference_type"), // order, refund, transfer, adjustment, count
  referenceId: bigint("reference_id", { mode: "number" }),
  
  // Reason and notes
  reason: text("reason"),
  note: text("note"),
  
  // User tracking
  performedByUserId: bigint("performed_by_user_id", { mode: "number" }),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("stock_movement_item_location_idx").on(table.inventoryItemId, table.locationId),
  index("stock_movement_type_idx").on(table.movementType),
  index("stock_movement_reference_idx").on(table.referenceType, table.referenceId),
  index("stock_movement_created_at_idx").on(table.createdAt),
]);

// Inventory transfer between locations
export const inventoryTransfer = createTable("inventory_transfer", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  // Transfer details
  transferNumber: text("transfer_number").unique(),
  status: text("status"), // pending, in_transit, completed, cancelled
  
  // Locations
  fromLocationId: bigint("from_location_id", { mode: "number" }).notNull(),
  toLocationId: bigint("to_location_id", { mode: "number" }).notNull(),
  
  // Notes
  note: text("note"),
  
  // User tracking
  createdByUserId: bigint("created_by_user_id", { mode: "number" }),
  receivedByUserId: bigint("received_by_user_id", { mode: "number" }),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  shippedAt: timestamp("shipped_at"),
  receivedAt: timestamp("received_at"),
  expectedArrival: timestamp("expected_arrival"),
}, (table) => [
  index("inventory_transfer_number_idx").on(table.transferNumber),
  index("inventory_transfer_status_idx").on(table.status),
  index("inventory_transfer_from_location_idx").on(table.fromLocationId),
  index("inventory_transfer_to_location_idx").on(table.toLocationId),
]);

// Transfer line items
export const inventoryTransferItem = createTable("inventory_transfer_item", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  transferId: bigint("transfer_id", { mode: "number" }).notNull(),
  inventoryItemId: bigint("inventory_item_id", { mode: "number" }).notNull(),
  
  // Quantities
  quantityRequested: integer("quantity_requested").notNull(),
  quantityShipped: integer("quantity_shipped"),
  quantityReceived: integer("quantity_received"),
  
  // Discrepancy handling
  discrepancyReason: text("discrepancy_reason"),
}, (table) => [
  index("inventory_transfer_item_transfer_idx").on(table.transferId),
  index("inventory_transfer_item_inventory_idx").on(table.inventoryItemId),
]);

// Reserved inventory for pending orders
export const inventoryReservation = createTable("inventory_reservation", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  // Item and location
  inventoryItemId: bigint("inventory_item_id", { mode: "number" }).notNull(),
  locationId: bigint("location_id", { mode: "number" }).notNull(),
  
  // Reservation details
  quantity: integer("quantity").notNull(),
  
  // Reference
  referenceType: text("reference_type"), // order, cart
  referenceId: bigint("reference_id", { mode: "number" }),
  
  // Expiration
  expiresAt: timestamp("expires_at"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("inventory_reservation_item_location_idx").on(table.inventoryItemId, table.locationId),
  index("inventory_reservation_reference_idx").on(table.referenceType, table.referenceId),
  index("inventory_reservation_expires_idx").on(table.expiresAt),
]);

// Inventory count/cycle count
export const inventoryCount = createTable("inventory_count", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  // Count details
  countNumber: text("count_number").unique(),
  countType: text("count_type"), // full, cycle, spot
  status: text("status"), // scheduled, in_progress, completed, cancelled
  locationId: bigint("location_id", { mode: "number" }).notNull(),
  
  // User tracking
  scheduledByUserId: bigint("scheduled_by_user_id", { mode: "number" }),
  performedByUserId: bigint("performed_by_user_id", { mode: "number" }),
  
  // Notes
  note: text("note"),
  discrepancySummary: text("discrepancy_summary"), // JSON summary
  
  // Timestamps
  scheduledFor: timestamp("scheduled_for"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
}, (table) => [
  index("inventory_count_number_idx").on(table.countNumber),
  index("inventory_count_status_idx").on(table.status),
  index("inventory_count_location_idx").on(table.locationId),
]);

// Count items
export const inventoryCountItem = createTable("inventory_count_item", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  countId: bigint("count_id", { mode: "number" }).notNull(),
  inventoryItemId: bigint("inventory_item_id", { mode: "number" }).notNull(),
  
  // Quantities
  expectedQuantity: integer("expected_quantity"),
  countedQuantity: integer("counted_quantity"),
  
  // Variance
  variance: integer("variance"),
  varianceValue: doublePrecision("variance_value"), // monetary value of variance
  
  // Status
  status: text("status"), // pending, counted, verified
  verifiedByUserId: bigint("verified_by_user_id", { mode: "number" }),
}, (table) => [
  index("inventory_count_item_count_idx").on(table.countId),
  index("inventory_count_item_inventory_idx").on(table.inventoryItemId),
]);

// Zod schemas
export const insertStockMovementSchema = createInsertSchema(stockMovement);
export const selectStockMovementSchema = createSelectSchema(stockMovement);

export const insertInventoryTransferSchema = createInsertSchema(inventoryTransfer);
export const selectInventoryTransferSchema = createSelectSchema(inventoryTransfer);

export const insertInventoryTransferItemSchema = createInsertSchema(inventoryTransferItem);
export const selectInventoryTransferItemSchema = createSelectSchema(inventoryTransferItem);

export const insertInventoryReservationSchema = createInsertSchema(inventoryReservation);
export const selectInventoryReservationSchema = createSelectSchema(inventoryReservation);

export const insertInventoryCountSchema = createInsertSchema(inventoryCount);
export const selectInventoryCountSchema = createSelectSchema(inventoryCount);

export const insertInventoryCountItemSchema = createInsertSchema(inventoryCountItem);
export const selectInventoryCountItemSchema = createSelectSchema(inventoryCountItem);

// Type exports
export type StockMovement = typeof stockMovement.$inferSelect;
export type NewStockMovement = typeof stockMovement.$inferInsert;

export type InventoryTransfer = typeof inventoryTransfer.$inferSelect;
export type NewInventoryTransfer = typeof inventoryTransfer.$inferInsert;

export type InventoryTransferItem = typeof inventoryTransferItem.$inferSelect;
export type NewInventoryTransferItem = typeof inventoryTransferItem.$inferInsert;

export type InventoryReservation = typeof inventoryReservation.$inferSelect;
export type NewInventoryReservation = typeof inventoryReservation.$inferInsert;

export type InventoryCount = typeof inventoryCount.$inferSelect;
export type NewInventoryCount = typeof inventoryCount.$inferInsert;

export type InventoryCountItem = typeof inventoryCountItem.$inferSelect;
export type NewInventoryCountItem = typeof inventoryCountItem.$inferInsert;