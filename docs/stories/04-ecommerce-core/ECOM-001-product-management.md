# ECOM-001: Product Management System

## Epic

EPIC-001: Core E-Commerce Platform

## Story

**As a** store owner  
**I want** comprehensive product management capabilities  
**So that** I can create, organize, and sell products online effectively

## Background

The product management system is the foundation of the e-commerce platform. It needs to support complex product configurations while remaining easy to use.

## Current Status

✅ **Schemas Implemented**:

- Product table with SEO fields
- Product variants (option1/2/3 pattern)
- Product images
- Collections (enhanced with SEO)
- Categories (hierarchical)
- Tags
- Product bundles

## Acceptance Criteria

### Service Layer

- [x] ProductService class with CRUD operations
- [x] Variant management (create, update, inventory sync)
- [ ] Image upload and management via UploadThing
- [ ] Collection assignment logic
- [ ] Category hierarchy management
- [ ] Tag management
- [x] Product search and filtering
- [x] Bulk operations (update prices, archive, etc.)

### API Layer (tRPC)

- [x] `product.list` - paginated with filters
- [x] `product.get` - by ID or handle
- [x] `product.create` - with variants
- [x] `product.update` - partial updates
- [x] `product.delete` - soft delete
- [x] `product.search` - full-text search
- [x] `product.bulkUpdate` - batch operations

### Data Validation

- [x] Ensure unique handles (slugs)
- [ ] Validate variant combinations
- [x] Price validation (no negative values)
- [ ] Image format validation
- [x] SEO field length limits

### Business Logic

- [x] Auto-generate handle from title if not provided
- [x] Track inventory at variant level
- [x] Published/draft status workflow
- [x] Price comparison (regular vs compare-at)
- [ ] Variant option validation

## Technical Implementation

### Service Structure

```typescript
// packages/ecom/src/services/product.service.ts
export class ProductService {
  constructor(private db: DrizzleClient) {}
  
  async create(data: CreateProductDTO): Promise<Product>
  async update(id: string, data: UpdateProductDTO): Promise<Product>
  async delete(id: string): Promise<void>
  async findById(id: string): Promise<Product>
  async findByHandle(handle: string): Promise<Product>
  async list(filters: ProductFilters): Promise<PaginatedProducts>
  async addVariant(productId: string, variant: CreateVariantDTO)
  async updateInventory(variantId: string, quantity: number)
}
```

### tRPC Router Structure

```typescript
// packages/api/src/routers/product.ts
export const productRouter = router({
  list: publicProcedure.input(listSchema).query(),
  get: publicProcedure.input(getSchema).query(),
  create: protectedProcedure.input(createSchema).mutation(),
  update: protectedProcedure.input(updateSchema).mutation(),
  delete: protectedProcedure.input(deleteSchema).mutation(),
});
```

## Non-Functional Requirements

- [ ] Response time < 200ms for product queries
- [ ] Support 10k+ products
- [ ] Image optimization for web delivery
- [ ] SEO-friendly URLs
- [ ] Cache product data appropriately

## Dependencies

- ✅ Database schemas (implemented)
- ✅ Authentication system (Better Auth)
- Image storage solution (UploadThing)
- Search infrastructure (PostgreSQL full-text)

## Definition of Done

- [ ] All service methods implemented with tests
- [ ] tRPC routes exposed and documented
- [ ] Integration tests for complex scenarios
- [ ] Performance benchmarks met
- [ ] Error handling for edge cases

## Estimated Points

**Original**: 8 points (with plugin system)  
**Updated**: 5 points (direct implementation)

## Notes

- V1 implements direct service pattern, not as a plugin
- Consider caching strategy for frequently accessed products
- Plan for future plugin extensibility in service interfaces

## Dev Agent Record

### Agent Model Used
Claude 3 Opus

### Debug Log References
- Fixed TypeScript errors with auto-generated IDs using `generatedByDefaultAsIdentity()`
- Implemented transaction handling for complex operations (create with variants/images)
- Added proper error handling for unique constraint violations
- Implemented soft delete pattern using status field

### Completion Notes
- [x] Created ProductService with full CRUD operations
- [x] Implemented variant management with inventory tracking
- [x] Created tRPC router with all endpoints
- [x] Added validation schemas for all operations
- [x] Implemented bulk operations and search functionality
- [ ] Image upload integration pending (requires UploadThing setup)
- [ ] Collection/Category/Tag management pending (separate services needed)
- [ ] Testing implementation pending

### File List
- Created: packages/ecom/src/services/product.service.ts
- Created: packages/ecom/src/services/index.ts
- Created: packages/api/src/routers/product.ts
- Modified: packages/api/src/root.ts
- Modified: packages/ecom/src/index.ts
- Modified: packages/ecom/src/schemas/product.ts

### Change Log
- Added auto-generation to all ID fields in product schema
- Implemented ProductService with comprehensive CRUD operations
- Added variant and inventory management functionality
- Created tRPC router with public and protected procedures
- Integrated product router into main API router

### Status
In Progress - Core functionality complete, needs image upload, collections, and testing
