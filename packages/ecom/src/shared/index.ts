// Shared e-commerce schemas and utilities

// Export normalized schemas
export * from "./schemas/address";
export * from "./schemas/pricing";
export * from "./schemas/common";

// Re-export the table creator for consistency
export { createTable } from "./schemas/address";