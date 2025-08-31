# Platform Architecture

## Overview

This is a multi-app platform that enables building different vertical SaaS applications from a shared codebase. Think of it as an internal Platform-as-a-Service (PaaS) where different apps share core infrastructure but have their own domain logic.

## Package Structure

```
packages/
├── platform/         # Core infrastructure
│   ├── identity/    # Person and Organization entities
│   ├── objects/     # Flexible object system (like HubSpot/Salesforce)
│   ├── history/     # Property history and audit trails
│   └── automation/  # Workflow engine
│
├── crm/             # CRM domain
│   ├── deals/       # Deal management and pipelines
│   ├── activities/  # Sales activities
│   └── services/    # CRM business logic
│
├── ecom/            # E-commerce domain  
│   ├── products/    # Product catalog
│   ├── orders/      # Order management
│   ├── cart/        # Shopping cart
│   └── checkout/    # Payment processing
│
├── marketing/       # Marketing domain
│   ├── campaigns/   # Campaign management
│   ├── segments/    # Customer segmentation
│   └── automation/  # Marketing workflows
│
├── email/           # Email infrastructure
│   ├── providers/   # SendGrid, Resend, SES adapters
│   ├── templates/   # React Email templates
│   └── queue/       # Email queue management
│
├── api/            # API layer (tRPC)
├── auth/           # Authentication (Better Auth)
├── db/             # Database layer (Drizzle ORM)
└── ui/             # Shared UI components (shadcn/ui)
```

## Core Concepts

### 1. Flexible Object System

Instead of hard-coded schemas, we use a flexible object system where:
- **Object Definitions** define types (deal, product, custom_entity)
- **Records** store actual data with JSONB properties
- **Property History** tracks every change for audit and workflows
- **Associations** link any entities together

```typescript
// Any domain can define custom objects
await platformService.ensureObjectDefinition('artist', {
  displayName: 'Artist',
  properties: {
    stageName: { type: 'string', required: true },
    genre: { type: 'select', options: ['rock', 'pop', 'jazz'] },
    monthlyListeners: { type: 'number' }
  }
});
```

### 2. Unified Identity System

Single source of truth for people and organizations:
- **Person** - Any individual (customer, user, contact, employee)
- **Organization** - Any company or group
- Shared across all domains (CRM contacts = Ecom customers = Marketing subscribers)

### 3. Property History & Workflows

Every property change is tracked, enabling:
- Complete audit trails
- Time-travel queries (value at specific date)
- Workflow triggers (when stage = 'won', send email)
- Change analytics

### 4. Multi-App Configuration

Different apps from same codebase:

```typescript
// E-commerce App
export const ecomConfig = {
  name: 'CharmCommerce',
  features: {
    ecommerce: true,
    crm: false,
    marketing: true
  },
  customObjects: ['product_review', 'wishlist']
};

// Music Admin Panel
export const musicConfig = {
  name: 'ArtistHub',
  features: {
    ecommerce: false,
    crm: true,
    marketing: true
  },
  customObjects: ['artist', 'release', 'royalty_payment']
};
```

## Domain-Driven Design

Each package represents a bounded context:

### Platform (Infrastructure)
- Generic, reusable mechanisms
- No business logic
- Framework for building domains

### CRM (Domain)
- Sales-specific: deals, pipelines, leads
- B2B focused
- Long sales cycles

### Ecom (Domain)
- Commerce-specific: products, orders, inventory
- Transaction focused
- Immediate purchases

### Marketing (Domain)
- Campaign management
- Customer segmentation
- Cross-domain orchestration

### Email (Infrastructure)
- Pure email functionality
- Template rendering
- Provider abstraction

## Database Design

### Core Tables
- `person` - Unified identity
- `organization` - Companies/groups
- `objectDefinition` - Defines flexible object types
- `record` - Stores flexible object instances (JSONB)
- `propertyHistory` - Tracks all property changes
- `association` - Polymorphic relationships

### Multi-tenancy
- Organization-based isolation
- All queries filtered by `organizationId`
- Consider PostgreSQL schemas for stronger isolation

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Database**: PostgreSQL with Drizzle ORM
- **API**: tRPC for type-safe APIs
- **Auth**: Better Auth
- **Email**: React Email + Resend
- **UI**: Tailwind CSS + shadcn/ui
- **Monorepo**: Turborepo + pnpm

## Scaling Considerations

### Current (MVP)
- 10-100 organizations
- 1K-10K records each
- Single database

### Near-term
- 1K organizations
- 100K records each
- Read replicas for analytics

### Long-term
- 10K+ organizations
- 1M+ records each
- Consider sharding or separate databases

## Key Design Decisions

1. **JSONB vs Columns**: Flexibility over raw performance
2. **Monolith First**: Start simple, extract services later
3. **Domain Packages**: Clean boundaries from day one
4. **Property History**: Built-in audit from the start
5. **Multi-app Ready**: Same code, different configurations