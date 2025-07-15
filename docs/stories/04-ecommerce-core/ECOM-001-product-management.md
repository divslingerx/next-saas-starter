# ECOM-001: Core Product Management Plugin

## Story
**As a** store owner  
**I want** comprehensive product management  
**So that** I can sell products online

## Acceptance Criteria
- [ ] Product CRUD operations
- [ ] Variant support (option1/2/3 pattern)
- [ ] Image management
- [ ] SEO fields (slug, meta description)
- [ ] Product status (active, draft, archived)
- [ ] Bulk operations
- [ ] Import/export functionality

## Technical Notes
- Implement as @core/products plugin
- Use standardized ID format (PROD-{nanoid})
- Register hooks for extensibility
- Include GraphQL-like query builder

## Dependencies
- CORE-001: Plugin Loader System
- SHELL-002: Dynamic Route Registration

## Estimated Points
8