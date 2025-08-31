# ECOM-003: Shopping Cart System

## Epic
EPIC-001: Core E-Commerce Platform

## Story
**As a** customer  
**I want** a persistent shopping cart that saves my selections  
**So that** I can add items over time and checkout when ready

## Background
The cart system is critical for conversion. It must handle both guest and authenticated users, persist across sessions, and provide real-time feedback on availability and pricing.

## Current Status
✅ **Schemas Implemented**:
- Cart table with session/customer tracking
- Cart items with customizations support
- Cart discount tracking
- Checkout sessions for multi-step flow

## Acceptance Criteria

### Service Layer
- [ ] CartService class with core operations
- [ ] Session-based cart for guests
- [ ] Customer-based cart for authenticated users
- [ ] Cart merging logic when guest logs in
- [ ] Automatic cart expiration (30 days)
- [ ] Real-time inventory validation
- [ ] Price calculation including discounts
- [ ] Cart recovery for abandoned carts

### API Layer (tRPC)
- [ ] `cart.get` - retrieve current cart
- [ ] `cart.addItem` - add product/variant
- [ ] `cart.updateItem` - change quantity
- [ ] `cart.removeItem` - remove from cart
- [ ] `cart.clear` - empty cart
- [ ] `cart.applyDiscount` - add discount code
- [ ] `cart.removeDiscount` - remove discount
- [ ] `cart.calculateTotals` - get pricing

### Business Logic
- [ ] Validate product availability on add
- [ ] Check inventory levels on quantity change
- [ ] Prevent negative quantities
- [ ] Handle product price changes
- [ ] Merge duplicate items (same variant)
- [ ] Guest cart → user cart migration
- [ ] Abandoned cart email triggers

### Edge Cases
- [ ] Product deleted while in cart
- [ ] Product out of stock
- [ ] Price changed since adding
- [ ] Discount code expired
- [ ] Session expired handling

## Technical Implementation

### Service Structure
```typescript
// packages/ecom/src/services/cart.service.ts
export class CartService {
  constructor(private db: DrizzleClient) {}
  
  async getCart(sessionId: string, customerId?: string): Promise<Cart>
  async addItem(cartId: string, item: AddToCartDTO): Promise<CartItem>
  async updateItem(cartId: string, itemId: string, quantity: number)
  async removeItem(cartId: string, itemId: string)
  async mergeGuestCart(sessionId: string, customerId: string)
  async calculateTotals(cartId: string): Promise<CartTotals>
  async applyDiscount(cartId: string, code: string)
  async validateCart(cartId: string): Promise<ValidationResult>
}
```

### tRPC Router Structure
```typescript
// packages/api/src/routers/cart.ts
export const cartRouter = router({
  get: publicProcedure.query(async ({ ctx }) => {
    const cartService = new CartService(ctx.db);
    return cartService.getCart(ctx.sessionId, ctx.session?.user?.id);
  }),
  addItem: publicProcedure.input(addItemSchema).mutation(),
  updateItem: publicProcedure.input(updateItemSchema).mutation(),
  removeItem: publicProcedure.input(removeItemSchema).mutation(),
});
```

### Session Management
```typescript
// Use iron-session or similar for guest carts
// Store cart ID in session
// Migrate on authentication
```

## Non-Functional Requirements
- [ ] Cart operations < 100ms response time
- [ ] Support 100+ items per cart
- [ ] Real-time stock validation
- [ ] Resilient to race conditions
- [ ] Cart data encrypted at rest

## Dependencies
- ✅ Database schemas (implemented)
- ✅ Session management (Next.js)
- Product service (ECOM-001)
- Inventory service (INV-001)

## UI Components Needed
- [ ] Mini cart dropdown
- [ ] Cart page with item management
- [ ] Cart totals component
- [ ] Add to cart button with feedback
- [ ] Quantity selector with validation

## Definition of Done
- [ ] All service methods implemented with tests
- [ ] tRPC routes with proper error handling
- [ ] Guest cart functionality working
- [ ] Cart merging on login tested
- [ ] Performance benchmarks met
- [ ] Abandoned cart tracking active

## Estimated Points
**Original**: 5 points  
**Updated**: 5 points (complexity remains similar)

## Notes
- Consider Redis for cart session storage in production
- Implement optimistic updates for better UX
- Plan for real-time updates (stock changes)
- Cart abandonment emails via PLAT-004