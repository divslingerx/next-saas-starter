# CRM & E-commerce Integration Strategy

## Executive Summary

After analyzing both your e-commerce schema and the CRM example, I recommend a **Unified Identity Platform** approach with domain-specific extensions. The CRM uses a sophisticated dual-architecture (platform object model + optimized tables) that can complement your domain-driven e-commerce structure.

## Architecture Recommendation

### 1. Core Identity Layer (Shared Foundation)

Create a unified identity system that both CRM and e-commerce domains reference:

```
packages/
├── core-identity/           # Shared identity management
│   ├── person/             # Unified person/contact model
│   ├── organization/       # Companies/businesses
│   ├── relationships/      # Person-to-org relationships
│   └── resolution/         # Identity merging/deduplication
```

### 2. Database Schema Strategy

Use PostgreSQL schemas for logical separation while maintaining cross-domain queries:

```sql
-- Core shared schema
CREATE SCHEMA core;

-- Domain schemas
CREATE SCHEMA ecom;
CREATE SCHEMA crm;
CREATE SCHEMA platform;  -- For flexible object model

-- Shared tables in core
core.person
core.organization
core.address
core.communication

-- Domain tables reference core
ecom.customer -> core.person
crm.contact -> core.person
platform.record -> core.person (via external_id)
```

### 3. Unified Person Model

```typescript
// packages/core-identity/src/schemas/person.ts

export const person = createTable(
  "person",
  {
    id: bigint("id", { mode: "number" }).primaryKey(),
    
    // Universal identifier for cross-system reference
    externalId: uuid("external_id").defaultRandom().unique(),
    
    // Core identity fields
    email: text("email"),
    emailVerified: boolean("email_verified").default(false),
    phone: text("phone"),
    phoneVerified: boolean("phone_verified").default(false),
    
    // Basic information
    firstName: text("first_name"),
    lastName: text("last_name"),
    displayName: text("display_name"), // Computed or custom
    
    // Role flags (person can have multiple roles)
    isUser: boolean("is_user").default(false),         // Has login credentials
    isCustomer: boolean("is_customer").default(false),  // Has made purchases
    isContact: boolean("is_contact").default(false),    // CRM contact
    isLead: boolean("is_lead").default(false),         // Active sales lead
    isVendor: boolean("is_vendor").default(false),     // Supplier/vendor
    
    // Organization association
    primaryOrganizationId: bigint("primary_organization_id", { mode: "number" })
      .references(() => organization.id),
    
    // Merge tracking for deduplication
    canonicalPersonId: bigint("canonical_person_id", { mode: "number" })
      .references(() => person.id),
    mergedAt: timestamp("merged_at"),
    mergeReason: text("merge_reason"),
    
    // Lifecycle and tracking
    lifecycleStage: text("lifecycle_stage"), // 'visitor', 'lead', 'customer', 'evangelist'
    source: text("source"),                  // 'ecommerce', 'crm', 'import', 'api'
    sourceDetails: jsonb("source_details"),
    
    // Privacy and compliance
    gdprConsent: boolean("gdpr_consent").default(false),
    gdprConsentDate: timestamp("gdpr_consent_date"),
    dataRetentionDate: timestamp("data_retention_date"),
    
    // Metadata
    tags: text("tags").array(),
    customFields: jsonb("custom_fields"),
    
    // Timestamps
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    lastSeenAt: timestamp("last_seen_at"),
  }
);
```

### 4. Domain Extensions Pattern

Each domain extends the core person with domain-specific data:

```typescript
// packages/ecom-customer/src/schemas/customer-extension.ts
export const customerExtension = createTable(
  "customer_extension",
  {
    id: bigint("id", { mode: "number" }).primaryKey(),
    personId: bigint("person_id", { mode: "number" })
      .notNull()
      .unique()
      .references(() => person.id, { onDelete: "cascade" }),
    
    // E-commerce specific
    customerNumber: text("customer_number").unique(),
    totalSpent: decimal("total_spent", { precision: 19, scale: 4 }).default('0'),
    orderCount: integer("order_count").default(0),
    averageOrderValue: decimal("average_order_value", { precision: 19, scale: 4 }),
    
    // Marketing
    acceptsEmailMarketing: boolean("accepts_email_marketing").default(false),
    acceptsSmsMarketing: boolean("accepts_sms_marketing").default(false),
    marketingOptInDate: timestamp("marketing_opt_in_date"),
    
    // Loyalty
    loyaltyPoints: integer("loyalty_points").default(0),
    loyaltyTier: text("loyalty_tier"),
    vipStatus: boolean("vip_status").default(false),
    
    // Timestamps
    firstPurchaseDate: timestamp("first_purchase_date"),
    lastPurchaseDate: timestamp("last_purchase_date"),
  }
);

// packages/crm-contacts/src/schemas/contact-extension.ts
export const contactExtension = createTable(
  "contact_extension",
  {
    id: bigint("id", { mode: "number" }).primaryKey(),
    personId: bigint("person_id", { mode: "number" })
      .notNull()
      .unique()
      .references(() => person.id, { onDelete: "cascade" }),
    
    // CRM specific
    leadScore: integer("lead_score").default(0),
    leadStatus: text("lead_status"), // 'new', 'contacted', 'qualified', 'unqualified'
    leadSource: text("lead_source"),
    
    // Business relationship
    jobTitle: text("job_title"),
    department: text("department"),
    reportsTo: bigint("reports_to", { mode: "number" })
      .references(() => person.id),
    
    // Sales process
    assignedToUserId: text("assigned_to_user_id"),
    lastContactedAt: timestamp("last_contacted_at"),
    nextFollowUpDate: timestamp("next_follow_up_date"),
    
    // Communication preferences
    preferredContactMethod: text("preferred_contact_method"), // 'email', 'phone', 'sms'
    bestTimeToContact: text("best_time_to_contact"),
    timezone: text("timezone"),
  }
);
```

### 5. Shared Address System

Use the CRM's approach but in the core schema:

```typescript
// packages/core-identity/src/schemas/address.ts
export const address = createTable(
  "address",
  {
    id: bigint("id", { mode: "number" }).primaryKey(),
    
    // Polymorphic association
    entityType: text("entity_type").notNull(), // 'person', 'organization', 'order'
    entityId: bigint("entity_id", { mode: "number" }).notNull(),
    
    // Address type and context
    addressType: text("address_type").notNull(), // 'billing', 'shipping', 'business', 'home'
    label: text("label"), // Custom label like "Headquarters", "Home Office"
    
    // Address fields
    line1: text("line1").notNull(),
    line2: text("line2"),
    city: text("city").notNull(),
    stateProvince: text("state_province"),
    postalCode: text("postal_code"),
    country: text("country").notNull(),
    countryCode: text("country_code").notNull(),
    
    // Geocoding
    latitude: decimal("latitude", { precision: 10, scale: 8 }),
    longitude: decimal("longitude", { precision: 11, scale: 8 }),
    
    // Validation
    isValidated: boolean("is_validated").default(false),
    validatedAt: timestamp("validated_at"),
    validationProvider: text("validation_provider"),
    
    // Usage tracking
    isDefault: boolean("is_default").default(false),
    isPrimary: boolean("is_primary").default(false),
    
    // Timestamps
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    entityIdx: index("address_entity_idx").on(table.entityType, table.entityId),
    typeIdx: index("address_type_idx").on(table.addressType),
  })
);
```

### 6. Platform Object Integration

Leverage the CRM's flexible platform object model for custom entities:

```typescript
// Both systems can use platform objects for flexibility
platform.record {
  organizationId: 1,
  objectDefinitionId: 'custom_product_inquiry',
  properties: {
    personId: '123',  // Links to core.person
    productSku: 'ABC-123',
    inquiryType: 'availability',
    message: 'When will this be back in stock?'
  }
}
```

### 7. Cross-Domain Service Layer

```typescript
// packages/core-identity/src/services/identity-service.ts

export class IdentityService {
  /**
   * Find or create a person across all systems
   */
  async resolveIdentity(input: {
    email?: string;
    phone?: string;
    externalId?: string;
    source: 'ecommerce' | 'crm' | 'import';
  }): Promise<Person> {
    // Check for existing person
    const existing = await this.findExisting(input);
    
    if (existing) {
      // Check if this is a duplicate that should be merged
      const duplicates = await this.findPotentialDuplicates(existing);
      if (duplicates.length > 0) {
        return this.mergePeople([existing, ...duplicates]);
      }
      return existing;
    }
    
    // Create new person
    return this.createPerson(input);
  }

  /**
   * Link person to e-commerce as customer
   */
  async linkToEcommerce(personId: number, data: Partial<CustomerExtension>) {
    const person = await this.getPerson(personId);
    
    // Update person flags
    await db.update(person).set({ 
      isCustomer: true,
      lifecycleStage: 'customer' 
    });
    
    // Create or update customer extension
    await db.insert(customerExtension)
      .values({ personId, ...data })
      .onConflictDoUpdate();
    
    // Emit event for other systems
    await this.emit('person.became_customer', { personId });
  }

  /**
   * Link person to CRM as contact
   */
  async linkToCRM(personId: number, data: Partial<ContactExtension>) {
    const person = await this.getPerson(personId);
    
    // Update person flags
    await db.update(person).set({ 
      isContact: true,
      lifecycleStage: data.leadStatus === 'qualified' ? 'lead' : 'contact'
    });
    
    // Create or update contact extension
    await db.insert(contactExtension)
      .values({ personId, ...data })
      .onConflictDoUpdate();
    
    // Create platform record for CRM
    await this.createPlatformRecord(personId, 'contact', data);
  }

  /**
   * Get unified view of a person
   */
  async getUnifiedProfile(personId: number): Promise<UnifiedProfile> {
    const person = await this.getPerson(personId);
    
    const [customer, contact, user, addresses] = await Promise.all([
      this.getCustomerExtension(personId),
      this.getContactExtension(personId),
      this.getUserAccount(personId),
      this.getAddresses(personId)
    ]);
    
    return {
      identity: person,
      ecommerce: customer,
      crm: contact,
      auth: user,
      addresses,
      timeline: await this.getUnifiedTimeline(personId)
    };
  }
}
```

### 8. Event-Driven Synchronization

```typescript
// packages/core-identity/src/events/sync-events.ts

// E-commerce events
on('order.completed', async (event) => {
  const { customerId, orderTotal } = event.data;
  
  // Update customer extension
  await updateCustomerStats(customerId, orderTotal);
  
  // Notify CRM if this is a significant order
  if (orderTotal > 1000) {
    await notifyCRM('high_value_purchase', { customerId, orderTotal });
  }
});

// CRM events
on('deal.won', async (event) => {
  const { contactId, dealValue } = event.data;
  
  // Check if contact is also a customer
  const person = await identityService.getPersonByContactId(contactId);
  if (person.isCustomer) {
    // Update customer lifetime value
    await updateCustomerLTV(person.id, dealValue);
  }
});

// Identity events
on('person.merged', async (event) => {
  const { primaryId, mergedIds } = event.data;
  
  // Update all references in both systems
  await Promise.all([
    updateEcommerceReferences(primaryId, mergedIds),
    updateCRMReferences(primaryId, mergedIds),
    updatePlatformRecords(primaryId, mergedIds)
  ]);
});
```

### 9. Migration Path

#### Phase 1: Core Identity (Week 1-2)
1. Create `core-identity` package
2. Implement person and organization tables
3. Set up address system
4. Create identity service

#### Phase 2: E-commerce Integration (Week 3-4)
1. Create customer extensions
2. Migrate existing customer data
3. Update order system to reference core.person
4. Implement customer sync events

#### Phase 3: CRM Integration (Week 5-6)
1. Adapt CRM platform object model
2. Create contact extensions
3. Set up CRM-specific tables
4. Implement bidirectional sync

#### Phase 4: Unification (Week 7-8)
1. Implement deduplication logic
2. Create unified API endpoints
3. Build admin UI for managing identities
4. Set up monitoring and analytics

### 10. Key Design Decisions

#### Use Platform Objects for Flexibility
- Keep the CRM's platform object model for custom entities
- Use it for both CRM and e-commerce custom fields
- Provides unlimited extensibility without migrations

#### Maintain Domain Separation
- Each domain owns its specific data
- Core identity is the single source of truth for person/org
- Domains communicate through events

#### Progressive Enhancement
- Start with basic identity resolution
- Add advanced features (dedup, merge) over time
- Begin with one-way sync, evolve to bidirectional

### 11. Benefits of This Approach

1. **Single Customer View**: One person across all systems
2. **No Duplication**: Addresses, contacts, customers all reference same person
3. **Flexible Evolution**: Can start simple and add complexity
4. **Domain Autonomy**: Each system maintains its own business logic
5. **Migration Path**: Clear path to microservices when needed
6. **Performance**: Optimized queries within domains, joins only for unified views
7. **Extensibility**: Platform objects provide unlimited custom fields

### 12. Example Flows

#### Customer Makes First Purchase
```typescript
// 1. User signs up on e-commerce site
const person = await identityService.resolveIdentity({
  email: 'john@example.com',
  source: 'ecommerce'
});

// 2. Complete checkout
await orderService.createOrder({
  personId: person.id,
  items: [...],
  total: 150.00
});

// 3. System automatically:
// - Creates customer extension
// - Updates person.isCustomer = true
// - Emits event to CRM
// - CRM creates contact record for follow-up
```

#### Sales Team Adds Lead, Later Becomes Customer
```typescript
// 1. Sales adds lead in CRM
const person = await identityService.resolveIdentity({
  email: 'jane@company.com',
  source: 'crm'
});

await identityService.linkToCRM(person.id, {
  leadStatus: 'qualified',
  leadSource: 'webinar',
  assignedToUserId: 'sales-rep-1'
});

// 2. Later, person makes purchase
await identityService.linkToEcommerce(person.id, {
  customerNumber: 'CUST-001'
});

// 3. Sales rep sees in CRM:
// - Contact is now also a customer
// - Can see purchase history
// - Gets notified of the purchase
```

## Conclusion

This unified approach provides the best of both worlds:
- **CRM Flexibility**: Platform object model for custom fields and entities
- **E-commerce Performance**: Optimized domain-specific tables
- **Unified Identity**: Single source of truth for people and organizations
- **Future-Proof**: Clear migration path to microservices

The key is starting with the shared identity layer and progressively integrating each domain while maintaining their autonomy.