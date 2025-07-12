# ECOM-003: Shopping Cart System

## Story
**As a** customer  
**I want** a persistent shopping cart  
**So that** I can add items and checkout when ready

## Acceptance Criteria
- [ ] Cart creation and persistence
- [ ] Add/update/remove items
- [ ] Cart merging on login
- [ ] Guest cart support
- [ ] Cart expiration handling
- [ ] Price calculation with discounts
- [ ] Stock validation
- [ ] Cart abandonment tracking

## Technical Notes
- Implement as @core/cart plugin
- Use session-based for guests
- Merge guest→user cart on login
- Real-time stock checking
- Emit hooks for analytics

## Dependencies
- ECOM-001: Core Product Management Plugin
- AUTH-001: Customer Account to Organization Bridge

## Estimated Points
5