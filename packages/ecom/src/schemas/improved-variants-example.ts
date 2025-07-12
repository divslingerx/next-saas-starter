import { text, bigint, integer, boolean, doublePrecision, index, pgTableCreator } from "drizzle-orm/pg-core";

// Example of improved variant system

export const createTable = pgTableCreator((name) => `agency-app_${name}`);

// Product option types (Size, Color, Material, etc.)
export const productOptionType = createTable("product_option_type", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  productId: bigint("product_id", { mode: "number" }).notNull(),
  name: text("name").notNull(), // "Size", "Color", etc.
  position: integer("position"),
});

// Actual option values
export const productOptionValue = createTable("product_option_value", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  optionTypeId: bigint("option_type_id", { mode: "number" }).notNull(),
  value: text("value").notNull(), // "Large", "Red", etc.
  position: integer("position"),
});

// Link variants to their option values (many-to-many)
export const variantOptionValue = createTable("variant_option_value", {
  variantId: bigint("variant_id", { mode: "number" }).notNull(),
  optionValueId: bigint("option_value_id", { mode: "number" }).notNull(),
}, (table) => [
  index("variant_option_value_variant_idx").on(table.variantId),
  index("variant_option_value_option_idx").on(table.optionValueId),
]);

// This allows unlimited options per product and cleaner queries