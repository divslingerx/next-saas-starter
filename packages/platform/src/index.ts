/**
 * Platform Package - Core infrastructure for building domain-specific applications
 * 
 * Provides:
 * - Identity management (person, organization)
 * - Flexible object system for any domain
 * - Property history and audit trails
 * - Association management
 * - Activity tracking
 * 
 * Domain-specific packages (CRM, Ecom, etc.) build on top of this foundation.
 */

// Core exports (identity, objects, shared infrastructure)
export * from './core';

// Marketing exports (campaigns, automation)
export * from './marketing';

// Service layer exports
export * from './core/services/platform.service';
export * from './core/services/person.service';

// Repository exports
export * from './core/repositories/base.repository';
export * from './core/repositories/platform.repository';

// Re-export commonly used types
export type {
  Person,
  Organization,
  PersonOrganization,
  ObjectDefinition,
  ObjectRecord,
  ObjectProperty,
} from './core';