# AUTH-002: E-Commerce Permission System

## Epic

EPIC-002: Authentication & Authorization

## Story

**As a** platform administrator  
**I want** role-based permissions for e-commerce features  
**So that** I can control what each user type can access

## Background

Without plugins, we need a simpler permission system focused on e-commerce roles: customers, staff, and admins. B2B adds complexity with company-level permissions.

## Current Status

✅ **Already Available**:
- Better Auth with role support
- Basic user/admin distinction

❌ **Missing**:
- E-commerce specific roles
- B2B user permissions
- Admin permission granularity

## Acceptance Criteria

### Role Definitions
- [ ] Customer roles (guest, registered, B2B)
- [ ] Staff roles (support, warehouse, marketing)
- [ ] Admin roles (full admin, limited admin)
- [ ] B2B roles (company admin, buyer, viewer)

### Permission Areas
- [ ] Order management (view own, view all, modify)
- [ ] Product management (create, edit, delete)
- [ ] Customer data access (own, all)
- [ ] Inventory management
- [ ] Financial data (reports, refunds)
- [ ] Settings and configuration

### Implementation
- [ ] Permission checking middleware
- [ ] UI components for permission-based rendering
- [ ] Admin UI for role management
- [ ] Audit log for permission changes

## Technical Implementation

### Permission Structure
```typescript
// Define permissions
export const permissions = {
  // Orders
  'orders.view.own': 'View own orders',
  'orders.view.all': 'View all orders',
  'orders.manage': 'Manage orders',
  'orders.refund': 'Issue refunds',
  
  // Products
  'products.view': 'View products',
  'products.create': 'Create products',
  'products.edit': 'Edit products',
  'products.delete': 'Delete products',
  
  // Customers
  'customers.view.own': 'View own data',
  'customers.view.all': 'View all customers',
  'customers.manage': 'Manage customers',
  
  // Admin
  'admin.access': 'Access admin panel',
  'admin.settings': 'Manage settings',
  'admin.users': 'Manage users',
} as const;

// Role definitions
export const roles = {
  customer: ['orders.view.own', 'customers.view.own'],
  b2b_buyer: ['orders.view.own', 'customers.view.own', 'orders.create'],
  b2b_admin: ['orders.view.all', 'customers.manage', 'orders.manage'],
  staff: ['admin.access', 'orders.view.all', 'customers.view.all'],
  admin: Object.keys(permissions), // All permissions
};
```

### Permission Service
```typescript
// packages/ecom/src/services/permission.service.ts
export class PermissionService {
  async getUserPermissions(userId: string): Promise<string[]>
  async hasPermission(userId: string, permission: string): Promise<boolean>
  async grantRole(userId: string, role: string): Promise<void>
  async revokeRole(userId: string, role: string): Promise<void>
  
  // B2B specific
  async getCompanyPermissions(userId: string, companyId: string): Promise<string[]>
}
```

### tRPC Integration
```typescript
// Protected procedures with permission checks
export const adminProcedure = t.procedure
  .use(isAuthenticated)
  .use(hasPermission('admin.access'));

export const productRouter = router({
  create: adminProcedure
    .use(hasPermission('products.create'))
    .input(createProductSchema)
    .mutation(/* ... */),
});
```

### UI Components
```typescript
// Permission-based rendering
<PermissionGate permission="products.edit">
  <EditProductButton />
</PermissionGate>

// Hook for permissions
const { hasPermission } = usePermissions();
if (hasPermission('orders.refund')) {
  // Show refund button
}
```

## Non-Functional Requirements
- [ ] Permission checks < 10ms
- [ ] Caching for performance
- [ ] Clear audit trail
- [ ] No security bypasses
- [ ] Graceful degradation

## Dependencies
- ✅ Better Auth system
- AUTH-001 (Customer integration)
- Admin UI framework

## Definition of Done
- [ ] Permission system implemented
- [ ] All routes protected appropriately
- [ ] UI respects permissions
- [ ] Admin can manage roles
- [ ] B2B permissions working
- [ ] Performance targets met
- [ ] Security review passed

## Estimated Points

**Original**: 5 points (plugin-based)  
**Updated**: 5 points (similar complexity)

## Notes
- Start with simple role-based system
- Consider attribute-based access control (ABAC) for V2
- B2B permissions scoped to company
- Cache permissions in Redis/memory