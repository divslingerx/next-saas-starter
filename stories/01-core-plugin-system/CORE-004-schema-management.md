# CORE-004: Plugin Schema Management

## Story
**As a** plugin developer  
**I want** to define database schemas in my plugin  
**So that** plugins can persist their own data

## Acceptance Criteria
- [ ] Schema definition API using Drizzle
- [ ] Automatic table prefixing (plg_[plugin]_[table])
- [ ] Migration management per plugin
- [ ] Schema validation
- [ ] Rollback support
- [ ] Schema introspection

## Technical Notes
```typescript
// Plugin defines schema
export const schema = {
  review: {
    id: text('id').primaryKey(),
    productId: text('product_id').notNull(),
    rating: integer('rating')
  }
}

// System creates: plg_reviews_review table
```

## Dependencies
- CORE-001: Plugin Loader System

## Estimated Points
8