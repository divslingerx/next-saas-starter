# PROPS-003: Property Query API

## Story
**As a** developer  
**I want** APIs to query by custom properties  
**So that** I can filter and search using custom fields

## Acceptance Criteria
- [ ] Filter products by custom properties
- [ ] Sort by custom properties
- [ ] Search within custom properties
- [ ] Aggregate custom property data
- [ ] GraphQL-like property selection
- [ ] Performance optimization

## Technical Notes
```typescript
// API examples
GET /api/products?custom[color]=red&custom[size]=large
GET /api/products?sort=custom.price_per_sqft
```

## Dependencies
- PROPS-002: Property Value Management
- API-001: Core API Layer

## Estimated Points
5