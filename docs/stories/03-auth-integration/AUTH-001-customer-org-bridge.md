# AUTH-001: Customer Account Integration

## Epic

EPIC-002: Authentication & Authorization

## Story

**As a** customer  
**I want** my account integrated with the authentication system  
**So that** I can access my orders, addresses, and account settings

## Background

Better Auth is already set up with organization support. We need to properly integrate customer records with auth users and handle both B2C and B2B scenarios.

## Current Status

✅ **Already Implemented**:

- Better Auth with organization support
- User authentication flows
- Customer table with B2B fields

⚠️ **Missing Link**:

- Customer records not linked to auth users
- No organization structure for B2B

## Acceptance Criteria

### Account Structure

- [ ] Link customer records to Better Auth users
- [ ] Support personal accounts (B2C)
- [ ] Support business accounts (B2B)
- [ ] Handle account type switching
- [ ] Guest checkout with session tracking

### B2B Features

- [ ] Company-level accounts with multiple users
- [ ] User roles within company (admin, buyer, viewer)
- [ ] Approval workflow for new B2B accounts
- [ ] Credit limits at company level
- [ ] Order history by company

### Implementation

- [ ] Add userId field to customers table
- [ ] Create customer on user registration
- [ ] Handle existing customer migration
- [ ] Support multiple addresses per customer
- [ ] Track orders by customer

## Technical Implementation

### Schema Updates

```typescript
// Update customers table
customers: {
  // ... existing fields ...
  userId: text("user_id").unique(), // Better Auth user ID
  // B2B fields already exist
}

// For B2B multi-user support
customerUsers: {
  id: bigint("id").primaryKey(),
  customerId: bigint("customer_id").notNull(), // Company customer
  userId: text("user_id").notNull(), // Better Auth user
  role: text("role").default("buyer"), // admin, buyer, viewer
  createdAt: timestamp("created_at").defaultNow(),
}
```

### Service Integration

```typescript
// packages/ecom/src/services/customer.service.ts
export class CustomerService {
  async createFromAuthUser(user: User): Promise<Customer>
  async linkExistingCustomer(email: string, userId: string): Promise<Customer>
  async getByUserId(userId: string): Promise<Customer>
  async addUserToCompany(customerId: string, userId: string, role: string)
}
```

### Auth Hooks

```typescript
// On user registration
auth.on('user.created', async (user) => {
  await customerService.createFromAuthUser(user);
});

// On user login - check for existing customer
auth.on('user.login', async (user) => {
  await customerService.linkExistingCustomer(user.email, user.id);
});
```

## Non-Functional Requirements

- [ ] Support existing customers without auth accounts
- [ ] Maintain order history during migration
- [ ] No disruption to guest checkout
- [ ] B2B approval process < 24 hours

## Dependencies

- ✅ Better Auth setup
- ✅ Customer schema with B2B fields
- Organization management (Better Auth)

## Definition of Done

- [ ] Customer-auth integration working
- [ ] B2C customers can access their data
- [ ] B2B multi-user support implemented
- [ ] Guest checkout still functional
- [ ] Migration script for existing customers
- [ ] Tests for all scenarios

## Estimated Points

**Original**: 5 points  
**Updated**: 6 points (includes B2B complexity)

## Notes

- Consider SSO for B2B customers in future
- Plan for social login integration
- B2B approval can use notification system
