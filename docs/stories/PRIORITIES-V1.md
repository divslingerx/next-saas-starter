# V1 Story Priorities (No Plugin System)

## Phase 1: Foundation & Infrastructure ✅ (Mostly Complete)
**Timeline**: Sprint 1-2
**Status**: Schemas implemented, need service layer

### Completed:
- ✅ Database schemas (products, orders, customers, etc.)
- ✅ Configuration schema added
- ✅ Authentication setup (Better Auth)
- ✅ Project structure (T3 Turbo)
- ✅ Environment validation (@t3-oss/env-nextjs)

### Remaining:
1. **SHELL-001**: Application Boot Sequence (2 pts) - Simplified
2. **AUTH-001**: Customer Account Integration (6 pts) - Critical
3. **ECOM-001**: Product Service Layer (5 pts)
4. **ECOM-003**: Cart Service Layer (5 pts)
5. **ECOM-005**: Customer Service Layer (3 pts)
6. **API-001**: Core tRPC Routes (5 pts)

## Phase 2: Core Commerce Features
**Timeline**: Sprint 3-5
**Focus**: Get basic e-commerce working end-to-end

1. **ECOM-001-UI**: Product Catalog Pages (5 pts)
2. **ECOM-003-UI**: Shopping Cart UI (5 pts)
3. **ECOM-004**: Checkout Flow Implementation (8 pts)
4. **ECOM-002**: Order Management System (8 pts)
5. **SHIP-001**: Basic Shipping Configuration (3 pts)
6. **TAX-001**: Basic Tax Configuration (3 pts)

## Phase 3: Admin Dashboard
**Timeline**: Sprint 6-7
**Focus**: Store management interface

1. **AUTH-002**: Permission System (5 pts) - Required for admin
2. **ADMIN-001**: Admin Layout & Navigation (5 pts)
3. **ADMIN-004**: Data Tables Component (3 pts)
4. **ADMIN-003**: Dynamic Forms System (5 pts)
5. **ECOM-001-ADMIN**: Product Management UI (5 pts)
6. **ECOM-002-ADMIN**: Order Management UI (5 pts)
7. **ECOM-005-ADMIN**: Customer Management UI (3 pts)
8. **SHELL-003**: Configuration Management (4 pts) - Settings UI

## Phase 4: Customer Experience
**Timeline**: Sprint 8-9
**Focus**: Polish customer-facing features

1. **Customer Account Portal** (5 pts) - Uses AUTH-001
2. **PLAT-004**: Email Notifications (5 pts)
3. **PLAT-002**: Product Search (5 pts)
4. **ECOM-004-UX**: Checkout Optimization (3 pts)
5. **B2B-001**: Business Account Features (8 pts)

## Phase 5: Operations & Analytics
**Timeline**: Sprint 10-11
**Focus**: Running the business

1. **INV-001**: Inventory Management (5 pts)
2. **PLAT-003**: Analytics Dashboard (8 pts)
3. **PLAT-005**: Audit Logging (3 pts)
4. **HOOK-001**: Webhook System (5 pts)
5. **PLAT-001**: Import/Export Tools (5 pts)

## Phase 6: API & Integration
**Timeline**: Sprint 12
**Focus**: External integrations

1. **API-002**: REST API Layer (8 pts)
2. **API-003**: API Authentication (3 pts)
3. **Payment Integration**: Stripe Checkout (5 pts)
4. **Email Service**: Resend Integration (3 pts)

## Parallel Tracks

### Documentation (Ongoing)
- **DEV-003**: User Documentation
- **DEV-003**: API Documentation
- **DEV-003**: Admin Guide

### Testing (Ongoing)
- **DEV-004**: E2E Test Suite
- **DEV-004**: Integration Tests
- **DEV-004**: Performance Tests

## Removed/Deferred to V2

### Plugin System (All CORE stories)
- ❌ CORE-001: Plugin Loader
- ❌ CORE-002: Plugin Registry
- ❌ CORE-003: Hook System
- ❌ CORE-004: Schema Management
- ❌ CORE-005: Dependency Resolver

### Plugin-Dependent Features
- ❌ SHELL-002: Dynamic Routing
- ❌ ADMIN-002: Extension Points
- ❌ DEV-001: Plugin CLI Tools
- ❌ DEV-002: Plugin Marketplace
- ❌ PROPS-*: Custom Properties (requires plugin system)

## Success Metrics

### MVP (End of Phase 2)
- [ ] Customers can browse products
- [ ] Customers can add to cart and checkout
- [ ] Admins can manage products
- [ ] Orders are created and tracked

### V1 Release (End of Phase 6)
- [ ] Full e-commerce functionality
- [ ] Admin dashboard
- [ ] Customer accounts
- [ ] B2B support
- [ ] Analytics and reporting
- [ ] API for integrations

## Updated Epic Summary

### Application Shell (6 pts total)
- ✅ SHELL-001: Boot Sequence (2 pts) - Simplified
- ❌ SHELL-002: Dynamic Routing - Deferred to V2
- ✅ SHELL-003: Configuration Management (4 pts) - Updated for settings

### Authentication (11 pts total)
- ✅ AUTH-001: Customer Integration (6 pts) - B2B support added
- ✅ AUTH-002: Permission System (5 pts) - E-commerce focused

### Core Stories Deferred
- ❌ All CORE-* stories (plugin system)
- ❌ ADMIN-002: Extension Points
- ❌ PROPS-*: Custom Properties
- ❌ DEV-001/002: Plugin tools

## Total Effort
- **Original estimate**: 250-300 points (with plugins)
- **V1 estimate**: 160-190 points (updated with new requirements)
- **Time saved**: ~36% reduction
- **Timeline**: 3-4 months vs 6-8 months

## Key Changes in This Update
1. Added configuration schema to completed items
2. Moved AUTH-001 to Phase 1 (critical dependency)
3. Added AUTH-002 to Phase 3 (needed for admin)
4. Added SHELL-003 to Phase 3 (configuration UI)
5. Simplified SHELL-001 (2 pts vs 5 pts)
6. Updated point estimates based on actual complexity