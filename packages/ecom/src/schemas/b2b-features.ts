import { text, bigint, boolean, doublePrecision, integer, timestamp, index, pgTableCreator } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// Create table with prefix
export const createTable = pgTableCreator((name) => `agency-app_${name}`);

// B2B FEATURES

// Company/Organization account
export const company = createTable("company", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  // Company details
  name: text("name").notNull(),
  legalName: text("legal_name"),
  taxId: text("tax_id"), // EIN, VAT number, etc.
  dunsNumber: text("duns_number"),
  
  // Status
  status: text("status"), // pending, approved, suspended
  creditStatus: text("credit_status"), // good, watch, hold
  
  // Contact
  email: text("email"),
  phone: text("phone"),
  website: text("website"),
  
  // Billing
  paymentTerms: text("payment_terms"), // net30, net60, cod, prepaid
  creditLimit: doublePrecision("credit_limit"),
  currentBalance: doublePrecision("current_balance"),
  
  // Account management
  accountManagerId: bigint("account_manager_id", { mode: "number" }),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  approvedAt: timestamp("approved_at"),
});

// Company locations/branches
export const companyLocation = createTable("company_location", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  companyId: bigint("company_id", { mode: "number" }).notNull(),
  
  name: text("name"), // "Main Office", "West Coast Warehouse"
  type: text("type"), // headquarters, branch, warehouse
  
  // Address
  address1: text("address1"),
  address2: text("address2"),
  city: text("city"),
  province: text("province"),
  countryCode: text("country_code"),
  postalCode: text("postal_code"),
  
  // Contact
  phone: text("phone"),
  email: text("email"),
  
  // Permissions
  canOrder: boolean("can_order").default(true),
  canReceiveShipments: boolean("can_receive_shipments").default(true),
  
  isDefault: boolean("is_default").default(false),
});

// Company users/buyers
export const companyUser = createTable("company_user", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  companyId: bigint("company_id", { mode: "number" }).notNull(),
  userId: bigint("user_id", { mode: "number" }).notNull(),
  
  // Role in company
  role: text("role"), // admin, buyer, viewer
  department: text("department"),
  jobTitle: text("job_title"),
  
  // Permissions
  canPlaceOrders: boolean("can_place_orders").default(true),
  canViewPricing: boolean("can_view_pricing").default(true),
  canViewAllOrders: boolean("can_view_all_orders").default(false),
  
  // Spending limits
  orderLimit: doublePrecision("order_limit"), // Per order
  monthlyLimit: doublePrecision("monthly_limit"),
  currentMonthSpent: doublePrecision("current_month_spent"),
  
  // Status
  status: text("status"), // active, suspended
  
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Customer-specific price lists
export const priceList = createTable("price_list", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  name: text("name"), // "Wholesale 2024", "VIP Pricing"
  code: text("code").unique(),
  
  // Validity
  validFrom: timestamp("valid_from"),
  validUntil: timestamp("valid_until"),
  
  // Configuration
  currency: text("currency"),
  includesTax: boolean("includes_tax").default(false),
  
  // Priority (higher wins)
  priority: integer("priority").default(0),
  
  active: boolean("active").default(true),
});

// Price list assignments
export const priceListAssignment = createTable("price_list_assignment", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  priceListId: bigint("price_list_id", { mode: "number" }).notNull(),
  
  // Assignment to either company or customer group
  companyId: bigint("company_id", { mode: "number" }),
  customerGroupId: bigint("customer_group_id", { mode: "number" }),
  customerId: bigint("customer_id", { mode: "number" }),
  
  // Override priority
  priority: integer("priority").default(0),
}, (table) => [
  index("price_list_assignment_list_idx").on(table.priceListId),
  index("price_list_assignment_company_idx").on(table.companyId),
]);

// Price list items
export const priceListItem = createTable("price_list_item", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  priceListId: bigint("price_list_id", { mode: "number" }).notNull(),
  
  // Product/variant
  productId: bigint("product_id", { mode: "number" }),
  variantId: bigint("variant_id", { mode: "number" }),
  
  // Pricing
  price: doublePrecision("price"),
  compareAtPrice: doublePrecision("compare_at_price"),
  
  // Volume pricing tiers
  minQuantity: integer("min_quantity").default(1),
  maxQuantity: integer("max_quantity"),
}, (table) => [
  index("price_list_item_list_idx").on(table.priceListId),
  index("price_list_item_product_idx").on(table.productId),
  index("price_list_item_variant_idx").on(table.variantId),
]);

// Volume/Quantity discounts
export const volumeDiscount = createTable("volume_discount", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  name: text("name"),
  
  // What it applies to
  appliesToAllProducts: boolean("applies_to_all_products").default(false),
  productIds: text("product_ids"), // JSON array
  collectionIds: text("collection_ids"), // JSON array
  
  // Discount tiers
  discountType: text("discount_type"), // percentage, fixed_amount
  
  active: boolean("active").default(true),
});

// Volume discount tiers
export const volumeDiscountTier = createTable("volume_discount_tier", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  volumeDiscountId: bigint("volume_discount_id", { mode: "number" }).notNull(),
  
  minQuantity: integer("min_quantity"),
  maxQuantity: integer("max_quantity"),
  
  discountValue: doublePrecision("discount_value"), // percentage or amount
}, (table) => [
  index("volume_discount_tier_discount_idx").on(table.volumeDiscountId),
]);

// Purchase orders from B2B customers
export const purchaseOrder = createTable("purchase_order", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  companyId: bigint("company_id", { mode: "number" }).notNull(),
  
  // PO details
  poNumber: text("po_number").unique(),
  status: text("status"), // draft, submitted, approved, partial, complete
  
  // Reference
  orderId: bigint("order_id", { mode: "number" }), // When converted to order
  
  // Terms
  paymentTerms: text("payment_terms"),
  requestedDeliveryDate: timestamp("requested_delivery_date"),
  
  // Approval workflow
  submittedByUserId: bigint("submitted_by_user_id", { mode: "number" }),
  approvedByUserId: bigint("approved_by_user_id", { mode: "number" }),
  
  // Notes
  internalNotes: text("internal_notes"),
  customerNotes: text("customer_notes"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  submittedAt: timestamp("submitted_at"),
  approvedAt: timestamp("approved_at"),
});

// Customer groups for segmentation
export const customerGroup = createTable("customer_group", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  name: text("name"), // "Wholesale", "Retailers", "Distributors"
  code: text("code").unique(),
  
  // Auto-assignment rules
  autoAssignRules: text("auto_assign_rules"), // JSON rules
  
  // Default settings
  defaultPaymentTerms: text("default_payment_terms"),
  defaultPriceListId: bigint("default_price_list_id", { mode: "number" }),
  
  active: boolean("active").default(true),
});

// Customer group members
export const customerGroupMember = createTable("customer_group_member", {
  customerGroupId: bigint("customer_group_id", { mode: "number" }).notNull(),
  customerId: bigint("customer_id", { mode: "number" }),
  companyId: bigint("company_id", { mode: "number" }),
  
  joinedAt: timestamp("joined_at").defaultNow(),
}, (table) => [
  index("customer_group_member_group_idx").on(table.customerGroupId),
  index("customer_group_member_customer_idx").on(table.customerId),
  index("customer_group_member_company_idx").on(table.companyId),
]);

// Zod schemas
export const insertCompanySchema = createInsertSchema(company);
export const selectCompanySchema = createSelectSchema(company);

export const insertPriceListSchema = createInsertSchema(priceList);
export const selectPriceListSchema = createSelectSchema(priceList);

export const insertVolumeDiscountSchema = createInsertSchema(volumeDiscount);
export const selectVolumeDiscountSchema = createSelectSchema(volumeDiscount);

// Type exports
export type Company = typeof company.$inferSelect;
export type PriceList = typeof priceList.$inferSelect;
export type VolumeDiscount = typeof volumeDiscount.$inferSelect;