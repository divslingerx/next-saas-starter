/**
 * Complete E-commerce Schema Export
 * This file exports all database tables from the ecom package
 * Import this in your server to get all table definitions
 */

// Re-export everything from each domain
// This ensures we get all the actual exports without having to manually maintain a list

// Core schemas
export * from "./core/schemas/product";
export * from "./core/schemas/collection";
export * from "./core/schemas/category-tag";
export * from "./core/schemas/product-bundle";
export * from "./core/schemas/product-visibility";
export * from "./core/schemas/inventory-tracking";
export * from "./core/schemas/inventory-advanced";

// Customer schemas
export * from "./customer/schemas/customer";
export * from "./customer/schemas/customer-group";
export * from "./customer/schemas/customer-user";

// Order schemas
export * from "./order/schemas/order";
export * from "./order/schemas/cart";
export * from "./order/schemas/checkout-session";
export * from "./order/schemas/draft-order";
export * from "./order/schemas/order-activity";

// Fulfillment schemas
export * from "./fulfillment/schemas/fulfillment";
export * from "./fulfillment/schemas/location";
export * from "./fulfillment/schemas/shipping-tax-config";

// Payment schemas
export * from "./payment/schemas/payment";
export * from "./payment/schemas/refund";

// B2B schemas
export * from "./b2b/schemas/companies";
export * from "./b2b/schemas/price-lists";
export * from "./b2b/schemas/discounts";

// Marketing schemas
export * from "./marketing/schemas/abandoned-checkout";
export * from "./marketing/schemas/notification";
export * from "./marketing/schemas/automation-workflow";
export * from "./marketing/schemas/crm-features";

// Configuration schemas
export * from "./config/schemas/shop";
export * from "./config/schemas/configuration";
export * from "./config/schemas/country";

// Shared schemas
export * from "./shared/schemas/address";
export * from "./shared/schemas/pricing";
export * from "./shared/schemas/common";

// Export the table creator
export { createTable } from "./utils";