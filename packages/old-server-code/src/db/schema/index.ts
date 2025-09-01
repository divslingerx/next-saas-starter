/**
 * Database Schema Exports
 * Hybrid Architecture: Platform Objects + Specialized Tables
 */

// ====== CORE PLATFORM ======
// Authentication & Organizations (Better Auth)
export * from "./auth";

// Platform Core Schema (flexible object-based data model)
// Handles: clients, contacts, projects, invoices, domains, sites as platform objects
export * from "./platform/";

// ====== BUSINESS OBJECTS ======
// CRM Objects - Concrete tables with platform object inheritance
// Handles: contacts, companies, leads, deals, projects, invoices as concrete tables
// Each inherits custom properties through platform_objects system
export * from "./crm";

// ====== SPECIALIZED TABLES ======
// Audit Results - Unified versioned audit system
// Handles all site analysis results with version tracking
export * from "./audit-results"; // lighthouse, axe, wappalyzer, dns, security, performance results

// Third-party Integrations
export * from "./integrations"; // OAuth connections, sync logs

// Usage Tracking & Billing
export * from "./usage"; // usage metrics, rate limiting

// Subscriptions (fixed import issues)
export * from "./subscriptions";

// ====== DEPRECATED - TO BE REMOVED ======
// These are now platform objects, commenting out to avoid conflicts
// export * from "./core"; // MIGRATED: clients, contacts, projects -> platform objects
// export * from "./business"; // MIGRATED: invoices, payments -> platform objects
// export * from "./site-analyzer"; // MIGRATED: domains, sites -> platform objects, keeping only analysis tables
// export * from "./workspace-extension-schema"; // Review if needed
