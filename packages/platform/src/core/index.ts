// Platform Core - Identity, Objects, and Shared Infrastructure

// Identity exports
export * from "./identity/person";
export * from "./identity/organization";

// Platform object model exports
export * from "./objects/platform-objects";
export * from "./objects/associations";

// Property history exports
export * from "./history/property-history";
export * from "./services/property-history.service";

// Repository exports
export * from "./repositories/base.repository";
export * from "./repositories/platform.repository";

// Service exports
export * from "./services/platform.service";
export * from "./services/person.service";

// Shared infrastructure exports
export * from "./shared/address";
export * from "./shared/communication";
export * from "./shared/activity";
export * from "./shared/audit";
export * from "./shared/permissions";
export * from "./shared/events";

// Re-export the table creator for consistency
export { createTable } from "./identity/person";