/**
 * E-commerce Package - Complete commerce functionality
 * Includes products, orders, customers, payments, and more
 */

// Core domain - products, inventory, collections
export * from "./core";

// Customer domain - profiles, groups, addresses
export * from "./customer";

// Order domain - cart, checkout, orders
export * from "./order";

// Fulfillment domain - shipping, locations, fulfillment
export * from "./fulfillment";

// Payment domain - transactions, refunds, disputes
export * from "./payment";

// B2B domain - companies, price lists, purchase orders
export * from "./b2b";

// Marketing domain - campaigns, abandoned carts, notifications
export * from "./marketing";

// Configuration domain - shop settings, feature flags, countries
export * from "./config";

// Shared utilities and normalized schemas
export * from "./shared";

// Export services
export * from "./services";

// Export types
export * from "./types";

// Export unified schema - all tables in one import
export * as ecomSchema from "./all-schemas";
