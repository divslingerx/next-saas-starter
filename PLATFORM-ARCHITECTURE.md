# Unified Platform Architecture

## Overview

We've built a unified platform that seamlessly integrates e-commerce, CRM, marketing, and automation capabilities. The architecture is designed for performance, scalability, and flexibility from day one.

## Core Design Principles

1. **Single Source of Truth**: One person, one organization - no duplicates across systems
2. **Domain Separation**: Clear boundaries between e-commerce, CRM, and marketing
3. **Flexible Schema**: Platform object model for custom entities without migrations
4. **Performance First**: Optimized indexes and query patterns
5. **Multi-Tenant Ready**: Organization isolation built into every table

## Package Architecture

```
packages/
├── platform-core/          # Foundation layer
│   ├── identity/          # Person & Organization (single source of truth)
│   ├── objects/           # Flexible platform object model
│   └── shared/            # Address, Communication, Activity tracking
│
├── platform-crm/          # CRM domain
│   └── schemas/           # Deals, Pipelines, Sales stages
│
├── platform-marketing/    # Marketing domain
│   └── schemas/           # Campaigns, Segments, Automation
│
├── ecom-* (existing)      # E-commerce domains
│   ├── ecom-core/        # Products, Inventory
│   ├── ecom-order/       # Orders, Cart, Checkout
│   └── ecom-payment/     # Payments, Refunds
```

## Key Components

### 1. Unified Identity System (`platform-core/identity`)

#### Person Entity
- **Single record per person** across all systems
- **Role flags**: `isCustomer`, `isLead`, `isContact`, `isVendor`, `isEmployee`
- **Lifecycle tracking**: Automatically computed based on activity
- **Merge handling**: Built-in deduplication support
- **Rich profile**: Email, phone, social, preferences, consent

#### Organization Entity
- **Companies and businesses** with hierarchical support
- **Multi-purpose**: Can be customer, vendor, partner
- **Financial tracking**: Credit limits, payment terms, balance
- **Relationship mapping**: Person-to-organization associations

### 2. Platform Object Model (`platform-core/objects`)

Provides HubSpot-like flexibility for custom entities:

```typescript
// Define any custom object type
objectDefinition {
  name: "Product Request",
  properties: { /* custom fields */ },
  schema: { /* JSON Schema validation */ }
}

// Store flexible data
record {
  objectDefinitionId: "product_request",
  properties: {
    productName: "Widget X",
    quantity: 100,
    urgency: "high"
  }
}
```

**Benefits**:
- No migrations for new fields
- Custom entities without code changes
- Flexible associations between any entities
- JSONB with GIN indexes for performance

### 3. Shared Infrastructure (`platform-core/shared`)

#### Address System
- Polymorphic - can attach to any entity
- International support with flexible fields
- Geocoding and validation built-in
- Single address can serve multiple purposes

#### Communication Tracking
- Unified log for all communications (email, call, SMS, meeting)
- Threading and conversation support
- Engagement metrics and tracking
- Template system for reusable content

#### Activity & Audit Trail
- Every action tracked across the platform
- Polymorphic - tracks activities on any entity
- Rich context and change tracking
- Used for timelines and audit compliance

### 4. CRM Domain (`platform-crm`)

#### Sales Pipeline
- Multiple pipelines per organization
- Customizable stages with automation
- Deal value and probability tracking
- Stage history and movement tracking

#### Deals
- Links to both person and organization
- Multi-currency support
- Recurring revenue tracking
- Competition and product tracking
- Full activity timeline

### 5. Marketing Domain (`platform-marketing`)

#### Campaigns
- Multi-channel support (email, SMS, social, push)
- A/B testing capabilities
- Performance metrics and ROI tracking
- Budget and spend tracking

#### Segments
- Static and dynamic segments
- SQL-based criteria for complex targeting
- Real-time or scheduled refresh
- Used across campaigns and automation

#### Automation
- Workflow engine for multi-step journeys
- Event-based and condition-based triggers
- Re-enrollment and goal tracking
- Step-by-step progress tracking

## Data Flow Examples

### Customer Journey

```typescript
// 1. Person visits website
const person = await createPerson({
  email: 'john@example.com',
  source: 'organic',
  lifecycleStage: 'visitor'
});

// 2. Person fills out lead form - automatically becomes CRM lead
await activity.create({
  type: 'form_submission',
  subjectType: 'person',
  subjectId: person.id
});
// Triggers: person.isLead = true, lifecycleStage = 'lead'

// 3. Sales creates deal
const deal = await createDeal({
  primaryPersonId: person.id,
  amount: 10000,
  pipelineId: salesPipeline.id
});

// 4. Person makes purchase - becomes customer
const order = await createOrder({
  customerId: person.id,
  total: 10000
});
// Triggers: person.isCustomer = true, lifecycleStage = 'customer'

// 5. Marketing enrolls in retention campaign
await enrollInAutomation(person.id, 'customer_retention');
```

### Unified View

```typescript
// Get complete person profile
const profile = await getPersonProfile(personId);

// Returns unified data:
{
  identity: { /* core person data */ },
  
  // E-commerce data
  customer: {
    totalSpent: 10000,
    orderCount: 1,
    lastOrderDate: '2024-01-15'
  },
  
  // CRM data
  deals: [
    { title: 'Enterprise Package', amount: 10000, status: 'won' }
  ],
  
  // Marketing data
  campaigns: {
    enrolled: ['customer_retention'],
    emailEngagement: { opens: 5, clicks: 2 }
  },
  
  // Activity timeline
  activities: [
    { type: 'order_placed', date: '2024-01-15' },
    { type: 'deal_won', date: '2024-01-14' },
    { type: 'email_opened', date: '2024-01-13' }
  ]
}
```

## Performance Optimizations

### Smart Indexing
```sql
-- Partial indexes for role-based queries
CREATE INDEX person_customer_idx ON person(organization_id, is_customer) 
WHERE is_customer = true;

-- GIN indexes for JSONB
CREATE INDEX record_properties_gin ON record USING gin(properties);

-- Composite indexes for common queries
CREATE INDEX deal_org_status_idx ON deal(organization_id, status, close_date);
```

### Query Patterns
```typescript
// Fast: Direct lookup with index
const customer = await db.query.person.findFirst({
  where: and(
    eq(person.organizationId, orgId),
    eq(person.isCustomer, true),
    eq(person.email, email)
  )
});

// Fast: Domain-specific query
const openDeals = await db.query.deal.findMany({
  where: and(
    eq(deal.organizationId, orgId),
    eq(deal.status, 'open')
  )
});

// Optimized: Cross-domain with selective joins
const customerWithDeals = await db
  .select({
    person: person,
    deals: deal
  })
  .from(person)
  .leftJoin(deal, eq(deal.primaryPersonId, person.id))
  .where(eq(person.id, personId));
```

## Migration Path to Microservices

The architecture is designed for easy separation when needed:

```yaml
# Current: Monolith with domain separation
monolith:
  - platform-core (shared)
  - platform-crm
  - platform-marketing
  - ecom-*

# Future: Service separation (if needed)
identity-service:
  owns: [person, organization]
  
crm-service:
  owns: [deal, pipeline]
  depends: identity-service
  
marketing-service:
  owns: [campaign, segment, automation]
  depends: identity-service
  
commerce-service:
  owns: [product, order, payment]
  depends: identity-service
```

## Key Benefits

1. **No Duplicate Data**: Single person across all systems
2. **Infinite Flexibility**: Platform objects for custom needs
3. **High Performance**: Optimized queries and indexes
4. **Clear Boundaries**: Domains are separate but integrated
5. **Future Proof**: Easy to scale and separate when needed
6. **Developer Friendly**: TypeScript types, clear patterns

## Next Steps

1. **Add remaining e-commerce integration**:
   - Link orders to unified person
   - Connect customer to person entity

2. **Implement event system**:
   - Cross-domain event bus
   - Webhook support
   - Real-time updates

3. **Build service layer**:
   - Repository pattern for data access
   - Business logic services
   - API layer (GraphQL/tRPC)

4. **Add automation engine**:
   - Workflow execution
   - Trigger management
   - Action scheduling

## Database Migrations

```bash
# Generate initial migrations
pnpm db:generate

# Review the generated SQL
# Check packages/db/drizzle/

# Run migrations
pnpm db:migrate

# Start development
pnpm dev
```

## Summary

This architecture provides a solid foundation for a unified platform that handles e-commerce, CRM, marketing, and automation. The key innovation is the single identity system that prevents data duplication while maintaining domain separation for scalability. The platform object model provides unlimited flexibility without sacrificing performance.