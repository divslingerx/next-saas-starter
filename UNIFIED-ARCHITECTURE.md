# Unified CRM + E-commerce Architecture (Greenfield)

## Core Design Principles

Since we're building from scratch, we can implement the ideal architecture without legacy constraints:

1. **Single Identity System** - One person/organization across all domains
2. **Platform Object Model** - Flexible schema for custom entities and fields
3. **Domain-Driven Design** - Clear boundaries with shared kernel
4. **Event-Driven** - Domains communicate through events, not direct dependencies
5. **Multi-Tenant Ready** - Organization isolation from day one

## Database Architecture

### PostgreSQL Schema Organization

```sql
-- Core schemas (shared kernel)
CREATE SCHEMA identity;     -- People, organizations, relationships
CREATE SCHEMA platform;     -- Flexible object model for custom entities
CREATE SCHEMA shared;       -- Addresses, files, audit logs

-- Domain schemas
CREATE SCHEMA commerce;     -- Products, orders, inventory
CREATE SCHEMA crm;         -- Deals, pipelines, activities
CREATE SCHEMA marketing;    -- Campaigns, automation, analytics
CREATE SCHEMA finance;      -- Invoices, payments, accounting

-- System schemas
CREATE SCHEMA auth;        -- Authentication, sessions, permissions
CREATE SCHEMA system;      -- Configuration, feature flags, webhooks
```

## Package Structure

```
packages/
├── core/
│   ├── identity/          # Person, Organization, Team management
│   ├── platform/          # Flexible object model (like HubSpot)
│   └── shared/            # Addresses, files, audit, events
│
├── domains/
│   ├── commerce/          # E-commerce domain
│   │   ├── catalog/       # Products, collections, inventory
│   │   ├── orders/        # Cart, checkout, orders
│   │   ├── customers/     # Customer-specific extensions
│   │   └── fulfillment/   # Shipping, delivery
│   │
│   ├── crm/              # CRM domain
│   │   ├── contacts/     # Contact-specific extensions
│   │   ├── companies/    # Company-specific extensions
│   │   ├── deals/        # Sales pipeline
│   │   └── activities/   # Tasks, calls, meetings
│   │
│   ├── marketing/        # Marketing domain
│   │   ├── campaigns/    # Email, SMS campaigns
│   │   ├── automation/   # Workflows, triggers
│   │   └── analytics/    # Tracking, attribution
│   │
│   └── finance/          # Financial domain
│       ├── billing/      # Invoices, subscriptions
│       ├── payments/     # Transactions, refunds
│       └── accounting/   # Reports, tax
│
└── apps/
    ├── api/              # Unified GraphQL/tRPC API
    ├── web/              # Main web application
    └── admin/            # Admin dashboard
```

## Core Identity Model

```typescript
// packages/core/identity/src/schemas/person.ts

export const person = createTable(
  "person",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    
    // Universal ID for all systems
    uid: uuid("uid").defaultRandom().notNull().unique(),
    
    // Organization context (multi-tenant)
    organizationId: bigint("organization_id", { mode: "number" })
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    
    // Core identity
    email: text("email"),
    emailVerified: boolean("email_verified").default(false),
    phone: text("phone"),
    phoneVerified: boolean("phone_verified").default(false),
    
    // Name (flexible for different cultures)
    firstName: text("first_name"),
    lastName: text("last_name"),
    middleName: text("middle_name"),
    displayName: text("display_name"),
    
    // Avatar/Profile
    avatarUrl: text("avatar_url"),
    
    // Computed type flags (updated by triggers)
    hasAccount: boolean("has_account").default(false),      // Can log in
    hasOrdered: boolean("has_ordered").default(false),      // Made a purchase
    isLead: boolean("is_lead").default(false),             // In sales pipeline
    isCustomer: boolean("is_customer").default(false),      // Active customer
    isVendor: boolean("is_vendor").default(false),         // Supplier
    
    // Lifecycle (computed from activities)
    lifecycleStage: text("lifecycle_stage"), // 'visitor', 'lead', 'customer', 'evangelist'
    leadScore: integer("lead_score").default(0),
    customerValue: decimal("customer_value", { precision: 19, scale: 4 }).default('0'),
    
    // Source tracking
    source: text("source"), // 'organic', 'paid', 'direct', 'referral'
    sourceDetails: jsonb("source_details"),
    
    // Merge handling
    mergedIntoId: bigint("merged_into_id", { mode: "number" })
      .references(() => person.id),
    
    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    lastActivityAt: timestamp("last_activity_at"),
  },
  (table) => ({
    orgEmailIdx: index("person_org_email_idx").on(table.organizationId, table.email),
    uidIdx: index("person_uid_idx").on(table.uid),
    lifecycleIdx: index("person_lifecycle_idx").on(table.lifecycleStage),
    mergedIdx: index("person_merged_idx").on(table.mergedIntoId),
  })
);
```

## Platform Object Model

For ultimate flexibility, implement a platform object model for custom entities:

```typescript
// packages/core/platform/src/schemas/objects.ts

// Define what types of objects exist
export const objectDefinition = createTable(
  "object_definition",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    
    // Object type info
    name: text("name").notNull(), // 'contact', 'deal', 'ticket', 'custom_entity'
    pluralName: text("plural_name").notNull(),
    
    // Configuration
    isSystem: boolean("is_system").default(false), // Built-in vs custom
    isActive: boolean("is_active").default(true),
    
    // Schema definition
    schema: jsonb("schema").notNull(), // JSON Schema for validation
    
    // UI configuration
    icon: text("icon"),
    color: text("color"),
    
    // Features
    features: jsonb("features"), // { "search": true, "duplicate_detection": true }
  }
);

// Actual records of any object type
export const record = createTable(
  "record",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    
    // Multi-tenant
    organizationId: bigint("organization_id", { mode: "number" })
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    
    // Object type
    objectDefinitionId: bigint("object_definition_id", { mode: "number" })
      .notNull()
      .references(() => objectDefinition.id),
    
    // Universal ID
    uid: uuid("uid").defaultRandom().notNull().unique(),
    
    // Link to person if applicable
    personId: bigint("person_id", { mode: "number" })
      .references(() => person.id, { onDelete: "set null" }),
    
    // Flexible properties
    properties: jsonb("properties").notNull().default('{}'),
    
    // Computed fields for performance
    displayName: text("display_name"), // Computed from properties
    searchVector: text("search_vector"), // Full-text search
    
    // Status
    status: text("status"), // Object-specific statuses
    isArchived: boolean("is_archived").default(false),
    
    // Ownership
    ownerId: text("owner_id"), // User who owns this record
    teamId: bigint("team_id", { mode: "number" }),
    
    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    orgObjectIdx: index("record_org_object_idx").on(
      table.organizationId, 
      table.objectDefinitionId
    ),
    personIdx: index("record_person_idx").on(table.personId),
    propertiesIdx: index("record_properties_gin_idx")
      .using("gin", table.properties),
    searchIdx: index("record_search_idx").on(table.searchVector),
  })
);

// Relationships between any records
export const association = createTable(
  "association",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    
    fromRecordId: bigint("from_record_id", { mode: "number" })
      .notNull()
      .references(() => record.id, { onDelete: "cascade" }),
    
    toRecordId: bigint("to_record_id", { mode: "number" })
      .notNull()
      .references(() => record.id, { onDelete: "cascade" }),
    
    // Relationship type
    associationType: text("association_type").notNull(),
    
    // Optional metadata
    properties: jsonb("properties"),
    
    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    fromIdx: index("association_from_idx").on(table.fromRecordId),
    toIdx: index("association_to_idx").on(table.toRecordId),
    typeIdx: index("association_type_idx").on(table.associationType),
    uniqueAssoc: unique("association_unique").on(
      table.fromRecordId,
      table.toRecordId,
      table.associationType
    ),
  })
);
```

## Domain Extensions

Each domain extends the core with specific needs:

```typescript
// packages/domains/commerce/customers/src/schemas/customer.ts

export const customer = createTable(
  "customer",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    
    // Link to core person
    personId: bigint("person_id", { mode: "number" })
      .notNull()
      .unique()
      .references(() => person.id, { onDelete: "cascade" }),
    
    // Customer-specific
    customerNumber: text("customer_number").notNull().unique(),
    
    // Purchase stats (computed by triggers)
    totalSpent: decimal("total_spent", { precision: 19, scale: 4 }).default('0'),
    orderCount: integer("order_count").default(0),
    averageOrderValue: decimal("aov", { precision: 19, scale: 4 }),
    
    // Segmentation
    segment: text("segment"), // 'vip', 'regular', 'at_risk', 'churned'
    cohort: text("cohort"), // '2024-Q1', etc.
    
    // Dates
    firstOrderDate: timestamp("first_order_date"),
    lastOrderDate: timestamp("last_order_date"),
    
    // Preferences
    preferredPaymentMethod: text("preferred_payment_method"),
    preferredShippingMethod: text("preferred_shipping_method"),
  }
);

// packages/domains/crm/contacts/src/schemas/contact.ts

export const contact = createTable(
  "contact",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    
    // Link to core person
    personId: bigint("person_id", { mode: "number" })
      .notNull()
      .unique()
      .references(() => person.id, { onDelete: "cascade" }),
    
    // Link to platform record for flexibility
    recordId: bigint("record_id", { mode: "number" })
      .unique()
      .references(() => record.id, { onDelete: "cascade" }),
    
    // Business info
    jobTitle: text("job_title"),
    department: text("department"),
    companyId: bigint("company_id", { mode: "number" })
      .references(() => company.id),
    
    // Sales
    leadStatus: text("lead_status"), // 'new', 'contacted', 'qualified'
    leadSource: text("lead_source"),
    ownerId: text("owner_id"), // Assigned sales rep
    
    // Activity
    lastContactedAt: timestamp("last_contacted_at"),
    nextFollowUp: timestamp("next_follow_up"),
  }
);
```

## Unified Address System

```typescript
// packages/core/shared/src/schemas/address.ts

export const address = createTable(
  "address",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    
    // Multi-tenant
    organizationId: bigint("organization_id", { mode: "number" })
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    
    // Polymorphic reference
    entityType: text("entity_type").notNull(), // 'person', 'organization', 'order'
    entityId: bigint("entity_id", { mode: "number" }).notNull(),
    entityUid: uuid("entity_uid"), // For external references
    
    // Address type
    type: text("type").notNull(), // 'billing', 'shipping', 'business', 'home'
    label: text("label"), // Custom label
    
    // Address fields (flexible for international)
    lines: text("lines").array(), // Array of address lines
    city: text("city"),
    stateProvince: text("state_province"),
    postalCode: text("postal_code"),
    country: text("country").notNull(),
    countryCode: text("country_code").notNull(),
    
    // Geocoding
    coordinates: point("coordinates"), // PostGIS point type
    timezone: text("timezone"),
    
    // Validation
    isValid: boolean("is_valid").default(false),
    validationData: jsonb("validation_data"),
    
    // Flags
    isDefault: boolean("is_default").default(false),
    
    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    entityIdx: index("address_entity_idx").on(table.entityType, table.entityId),
    coordIdx: index("address_coordinates_idx").using("gist", table.coordinates),
  })
);
```

## Event System

```typescript
// packages/core/shared/src/events/event-bus.ts

export interface DomainEvent {
  id: string;
  type: string;
  organizationId: number;
  userId?: string;
  personId?: number;
  payload: Record<string, any>;
  metadata: {
    source: string;
    timestamp: Date;
    version: string;
  };
}

export class EventBus {
  async emit(event: DomainEvent): Promise<void> {
    // Store event
    await this.storeEvent(event);
    
    // Notify subscribers
    await this.notifySubscribers(event);
    
    // Handle webhooks
    await this.triggerWebhooks(event);
  }
  
  // Domain event examples
  async emitPersonCreated(person: Person) {
    await this.emit({
      type: 'person.created',
      organizationId: person.organizationId,
      personId: person.id,
      payload: { person },
      metadata: {
        source: 'identity',
        timestamp: new Date(),
        version: '1.0'
      }
    });
  }
  
  async emitOrderCompleted(order: Order) {
    await this.emit({
      type: 'order.completed',
      organizationId: order.organizationId,
      personId: order.customerId,
      payload: { order },
      metadata: {
        source: 'commerce',
        timestamp: new Date(),
        version: '1.0'
      }
    });
  }
}

// Event handlers in different domains
export class CRMEventHandler {
  @Subscribe('order.completed')
  async handleOrderCompleted(event: DomainEvent) {
    const { order } = event.payload;
    
    // Update contact in CRM
    await this.contactService.updateLastPurchase(
      order.customerId,
      order.total
    );
    
    // Create activity
    await this.activityService.create({
      type: 'purchase',
      personId: order.customerId,
      description: `Completed order #${order.number} for ${order.total}`
    });
    
    // Update lead score
    await this.scoringService.adjustScore(
      order.customerId,
      'purchase',
      order.total
    );
  }
}
```

## API Layer

```typescript
// packages/apps/api/src/resolvers/unified.ts

export const unifiedResolvers = {
  Query: {
    // Get complete person profile across all domains
    person: async (_, { id }, ctx) => {
      const person = await ctx.identity.getPerson(id);
      
      return {
        ...person,
        // Lazy load domain data
        customer: () => ctx.commerce.getCustomer(person.id),
        contact: () => ctx.crm.getContact(person.id),
        orders: () => ctx.commerce.getOrders(person.id),
        deals: () => ctx.crm.getDeals(person.id),
        activities: () => ctx.shared.getActivities(person.id),
        addresses: () => ctx.shared.getAddresses('person', person.id),
      };
    },
    
    // Search across all entities
    search: async (_, { query, types }, ctx) => {
      const results = await Promise.all([
        types.includes('person') && ctx.identity.searchPeople(query),
        types.includes('company') && ctx.identity.searchCompanies(query),
        types.includes('product') && ctx.commerce.searchProducts(query),
        types.includes('deal') && ctx.crm.searchDeals(query),
      ]);
      
      return results.flat().filter(Boolean);
    }
  },
  
  Mutation: {
    // Create person with automatic domain extensions
    createPerson: async (_, { input }, ctx) => {
      // Create core person
      const person = await ctx.identity.createPerson(input);
      
      // Auto-create domain extensions based on context
      if (input.source === 'checkout') {
        await ctx.commerce.createCustomer(person.id);
      }
      
      if (input.source === 'lead_form') {
        await ctx.crm.createContact(person.id, {
          leadStatus: 'new',
          leadSource: input.leadSource
        });
      }
      
      // Emit event
      await ctx.events.emitPersonCreated(person);
      
      return person;
    }
  }
};
```

## Key Benefits of This Architecture

1. **True Single Customer View** - One person across all systems from day one
2. **Infinite Flexibility** - Platform objects for any custom entity without migrations
3. **Domain Isolation** - Each domain owns its data and business logic
4. **Event-Driven** - Loose coupling between domains
5. **Performance** - Optimized queries within domains, materialized views for cross-domain
6. **Multi-Tenant** - Organization isolation built in
7. **Type Safety** - Full TypeScript with generated types from Drizzle
8. **Scalable** - Can easily break into microservices later by domain

## Implementation Order

1. **Core Identity** - Person, Organization, Team
2. **Platform Objects** - Flexible schema system
3. **Shared Services** - Address, Files, Audit
4. **Commerce Domain** - Products, Orders, Customers
5. **CRM Domain** - Contacts, Deals, Activities
6. **Event System** - Cross-domain communication
7. **Unified API** - GraphQL/tRPC layer

This architecture gives you enterprise-grade flexibility and scalability from the start, without the complexity of managing duplicate data or migration paths.