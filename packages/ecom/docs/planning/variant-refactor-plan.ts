import { text, bigint, integer, boolean, doublePrecision, timestamp, index, unique, pgTableCreator } from "drizzle-orm/pg-core";

// VARIANT REFACTORING PLAN

export const createTable = pgTableCreator((name) => `agency-app_${name}`);

// Step 1: Keep existing productVariant table but add new fields
export const productVariantEnhanced = createTable("product_variant", {
  // ... existing fields ...
  
  // New: SKU pattern for auto-generation
  skuPattern: text("sku_pattern"), // "{product_code}-{color}-{size}"
  
  // New: Display name pattern
  displayNamePattern: text("display_name_pattern"), // "{product_name} - {color} {size}"
});

// Step 2: New flexible option system (runs parallel to old one)
export const productOptionType = createTable("product_option_type", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  productId: bigint("product_id", { mode: "number" }).notNull(),
  
  name: text("name").notNull(), // "Color", "Size", "Material"
  displayName: text("display_name"), // "Choose your color"
  
  // Option configuration
  optionType: text("option_type"), // select, swatch, button, custom
  isRequired: boolean("is_required").default(true),
  
  // Display
  position: integer("position"),
  showInListing: boolean("show_in_listing").default(false),
  
  // Validation
  validationRule: text("validation_rule"), // JSON: min/max length, regex, etc.
}, (table) => [
  index("product_option_type_product_idx").on(table.productId),
]);

// Step 3: Option values
export const productOptionValue = createTable("product_option_value", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  optionTypeId: bigint("option_type_id", { mode: "number" }).notNull(),
  
  value: text("value").notNull(), // "Red", "Large", "Cotton"
  displayValue: text("display_value"), // "Red (#FF0000)"
  
  // Additional metadata
  colorHex: text("color_hex"), // For color swatches
  imageUrl: text("image_url"), // For visual options
  
  // Inventory impact
  additionalPrice: doublePrecision("additional_price"),
  additionalWeight: doublePrecision("additional_weight"),
  
  // Availability
  isAvailable: boolean("is_available").default(true),
  position: integer("position"),
}, (table) => [
  index("product_option_value_type_idx").on(table.optionTypeId),
]);

// Step 4: Link variants to option values (many-to-many)
export const variantOptionValue = createTable("variant_option_value", {
  variantId: bigint("variant_id", { mode: "number" }).notNull(),
  optionValueId: bigint("option_value_id", { mode: "number" }).notNull(),
}, (table) => [
  index("variant_option_value_variant_idx").on(table.variantId),
  index("variant_option_value_option_idx").on(table.optionValueId),
  unique("variant_option_unique").on(table.variantId, table.optionValueId),
]);

// Step 5: Variant combination matrix (for quick lookups)
export const variantCombination = createTable("variant_combination", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  productId: bigint("product_id", { mode: "number" }).notNull(),
  variantId: bigint("variant_id", { mode: "number" }).notNull(),
  
  // Combination hash for fast lookup
  combinationHash: text("combination_hash").notNull(), // MD5 of sorted option values
  combinationDisplay: text("combination_display"), // "Red / Large / Cotton"
  
  // Quick access to options (denormalized for performance)
  optionValues: text("option_values"), // JSON: {"color": "red", "size": "large"}
  
  // Stock status
  isInStock: boolean("is_in_stock").default(true),
  stockLevel: integer("stock_level"),
}, (table) => [
  index("variant_combination_product_idx").on(table.productId),
  index("variant_combination_hash_idx").on(table.combinationHash),
  unique("variant_combination_unique").on(table.variantId),
]);

// Migration helper view (use during transition)
export const variantMigrationView = `
CREATE VIEW variant_option_mapping AS
SELECT 
  v.id as variant_id,
  v.product_id,
  'option1' as option_position,
  v.option1 as option_value
FROM product_variant v
WHERE v.option1 IS NOT NULL

UNION ALL

SELECT 
  v.id as variant_id,
  v.product_id,
  'option2' as option_position,
  v.option2 as option_value
FROM product_variant v
WHERE v.option2 IS NOT NULL

UNION ALL

SELECT 
  v.id as variant_id,
  v.product_id,
  'option3' as option_position,
  v.option3 as option_value
FROM product_variant v
WHERE v.option3 IS NOT NULL;
`;

// Benefits of this approach:
// 1. Unlimited options per product
// 2. Rich option metadata (colors, images)
// 3. Better querying: "Find all red shirts" is now simple
// 4. Gradual migration: Old system keeps working
// 5. Performance: Combination hash for fast lookups
// 6. Flexibility: Different option types per product