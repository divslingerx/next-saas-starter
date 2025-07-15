# ECOM-004: Checkout Flow

## Story
**As a** customer  
**I want** a smooth checkout process  
**So that** I can complete my purchase easily

## Acceptance Criteria
- [ ] Multi-step checkout process
- [ ] Guest checkout with Better Auth anonymous
- [ ] Address management
- [ ] Shipping method selection
- [ ] Payment method integration
- [ ] Order review step
- [ ] Order placement
- [ ] Success/confirmation page

## Technical Notes
- Implement as @core/checkout plugin
- Integrate with payment providers
- Support saved addresses
- Calculate tax and shipping
- Validate inventory before order

## Dependencies
- ECOM-002: Order Management Plugin
- ECOM-003: Shopping Cart System
- SHIP-001: Shipping Configuration

## Estimated Points
8