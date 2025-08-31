# SHELL-003: Configuration Management

## Epic

EPIC-001: Core E-Commerce Platform

## Story

**As a** platform administrator  
**I want** centralized configuration management  
**So that** I can manage store settings and feature flags efficiently

## Background

Without the plugin system, configuration management focuses on store settings, feature flags, and integration credentials. We're already using @t3-oss/env-nextjs for environment validation.

## Current Status

✅ **Already Implemented**:
- Environment variable validation (@t3-oss/env-nextjs)
- .env.example with all required variables
- Type-safe environment access

## Acceptance Criteria

### Store Configuration
- [ ] Store settings management (name, currency, timezone)
- [ ] Feature flag system for gradual rollouts
- [ ] Tax configuration storage
- [ ] Shipping zone configuration
- [ ] Payment provider settings
- [ ] Email template configuration

### Configuration Storage
- [ ] Database-backed configuration for runtime changes
- [ ] Configuration caching layer
- [ ] Admin UI for configuration management
- [ ] Configuration audit trail
- [ ] Export/import configuration

### Security
- [ ] Encryption for sensitive values (API keys)
- [ ] Role-based access to configuration
- [ ] Configuration validation before save
- [ ] Secure defaults

## Technical Implementation

### Configuration Service
```typescript
// packages/ecom/src/services/config.service.ts
export class ConfigService {
  constructor(private db: DrizzleClient, private cache: CacheService) {}
  
  async get<T>(key: string, defaultValue?: T): Promise<T>
  async set(key: string, value: any): Promise<void>
  async getMultiple(keys: string[]): Promise<Record<string, any>>
  async getNamespace(namespace: string): Promise<Record<string, any>>
  
  // Feature flags
  async isFeatureEnabled(feature: string): Promise<boolean>
  async enableFeature(feature: string): Promise<void>
  async disableFeature(feature: string): Promise<void>
}
```

### Configuration Schema
```typescript
// New table needed
export const configuration = createTable("configuration", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  namespace: text("namespace").notNull(), // 'store', 'tax', 'shipping', etc.
  key: text("key").notNull(),
  value: jsonb("value"),
  encrypted: boolean("encrypted").default(false),
  description: text("description"),
  updatedBy: bigint("updated_by", { mode: "number" }),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

### Usage Examples
```typescript
// Store settings
const currency = await config.get('store.currency', 'USD');
const timezone = await config.get('store.timezone', 'UTC');

// Feature flags
if (await config.isFeatureEnabled('b2b-checkout')) {
  // Show B2B checkout options
}

// Tax configuration
const taxRates = await config.getNamespace('tax.rates');
```

## Non-Functional Requirements
- [ ] Configuration cached in Redis/memory
- [ ] Changes propagated to all instances
- [ ] < 50ms configuration read time
- [ ] Audit trail for all changes

## Dependencies
- ✅ Environment validation (@t3-oss/env-nextjs)
- Database schema for configuration table
- Cache service implementation
- Admin UI components

## Definition of Done
- [ ] Configuration service implemented
- [ ] Database table created
- [ ] Caching layer working
- [ ] Admin UI for configuration
- [ ] Feature flag system tested
- [ ] Documentation written

## Estimated Points

**Original**: 3 points (with plugin config)  
**Updated**: 4 points (includes UI and caching)

## Notes
- Consider using Redis for distributed caching
- Feature flags enable gradual rollout of new features
- Configuration changes should trigger webhooks
- Plan for configuration backup/restore