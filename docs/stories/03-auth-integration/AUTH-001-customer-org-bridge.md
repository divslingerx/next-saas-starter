# AUTH-001: Customer Account to Organization Bridge

## Story
**As a** platform developer  
**I want** customer accounts linked to auth organizations  
**So that** users can manage multiple contexts

## Acceptance Criteria
- [ ] Update customer_account schema with auth_org_id
- [ ] Auto-create "Personal Account" org on signup
- [ ] Migration for existing customers
- [ ] Ensure one customer_account per org
- [ ] Handle org switching in session
- [ ] Guest checkout support with anonymous auth

## Technical Notes
```typescript
customer_account {
  id: string
  auth_org_id: string (unique)
  account_type: 'personal' | 'business'
  // commerce fields
}
```

## Dependencies
None - uses existing Better Auth

## Estimated Points
5