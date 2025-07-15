# AUTH-002: Plugin Permission System

## Story
**As a** platform administrator  
**I want** granular permissions for plugins  
**So that** I can control what each user/role can access

## Acceptance Criteria
- [ ] Define permission schema
- [ ] Plugin permission registration
- [ ] Role-based access control
- [ ] Permission checking middleware
- [ ] UI permission directives
- [ ] Admin permission management UI

## Technical Notes
```typescript
// Plugin registers required permissions
export const permissions = [
  'reviews.view',
  'reviews.create',
  'reviews.moderate',
  'reviews.delete'
]

// Check in handlers
if (!user.can('reviews.moderate')) {
  throw new ForbiddenError()
}
```

## Dependencies
- AUTH-001: Customer Account to Organization Bridge

## Estimated Points
5