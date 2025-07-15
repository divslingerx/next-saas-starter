# ECOM-002: Order Management Plugin

## Story
**As a** store owner  
**I want** complete order management  
**So that** I can process and fulfill customer orders

## Acceptance Criteria
- [ ] Order creation (from cart or admin)
- [ ] Order status workflow
- [ ] Payment status tracking
- [ ] Fulfillment status tracking
- [ ] Order timeline/activity log
- [ ] Email notifications
- [ ] Order cancellation/modification
- [ ] Refund support

## Technical Notes
- Implement as @core/orders plugin
- Emit hooks at each status change
- Support both B2C and B2B workflows
- Include order number generation

## Dependencies
- ECOM-001: Core Product Management Plugin
- AUTH-001: Customer Account to Organization Bridge

## Estimated Points
8