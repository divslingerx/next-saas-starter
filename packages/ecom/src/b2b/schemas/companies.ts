import { text, bigint, boolean, doublePrecision, integer, timestamp, index, pgTableCreator } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// Create table with prefix
export const createTable = pgTableCreator((name) => `agency-app_${name}`);

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

// Zod schemas
export const insertCompanySchema = createInsertSchema(company);
export const selectCompanySchema = createSelectSchema(company);

export const insertCompanyLocationSchema = createInsertSchema(companyLocation);
export const selectCompanyLocationSchema = createSelectSchema(companyLocation);

export const insertCompanyUserSchema = createInsertSchema(companyUser);
export const selectCompanyUserSchema = createSelectSchema(companyUser);

export const insertPurchaseOrderSchema = createInsertSchema(purchaseOrder);
export const selectPurchaseOrderSchema = createSelectSchema(purchaseOrder);

// Type exports
export type Company = typeof company.$inferSelect;
export type NewCompany = typeof company.$inferInsert;
export type CompanyLocation = typeof companyLocation.$inferSelect;
export type NewCompanyLocation = typeof companyLocation.$inferInsert;
export type CompanyUser = typeof companyUser.$inferSelect;
export type NewCompanyUser = typeof companyUser.$inferInsert;
export type PurchaseOrder = typeof purchaseOrder.$inferSelect;
export type NewPurchaseOrder = typeof purchaseOrder.$inferInsert;