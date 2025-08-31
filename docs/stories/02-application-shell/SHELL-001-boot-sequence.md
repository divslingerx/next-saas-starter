# SHELL-001: Application Boot Sequence

## Epic

EPIC-001: Core E-Commerce Platform

## Story

**As a** system  
**I want** a reliable application boot sequence  
**So that** all services initialize correctly and in the right order

## Background

With the removal of the plugin system, the boot sequence is now simpler and more predictable. Services are initialized directly through dependency injection.

## Current Status

✅ **Already Implemented**:

- Next.js app router setup
- Database connection via Drizzle
- Better Auth initialization
- tRPC context creation

## Acceptance Criteria

### Initialization Order

1. [ ] Environment validation (using @t3-oss/env-nextjs)
2. [ ] Database connection pool
3. [ ] Authentication system (Better Auth)
4. [ ] Service layer initialization
5. [ ] tRPC routers registration
6. [ ] Background job queues (if needed)
7. [ ] Health check endpoint

### Service Registration

- [ ] Singleton pattern for services
- [ ] Dependency injection setup
- [ ] Service health checks
- [ ] Graceful shutdown handling

### Error Handling

- [ ] Failed database connection
- [ ] Missing environment variables
- [ ] Service initialization failures
- [ ] Startup timeout handling

## Technical Implementation

### Boot Sequence

```typescript
// packages/api/src/context.ts
export async function createContext() {
  // 1. Validate environment
  const env = validateEnv();
  
  // 2. Initialize database
  const db = createDrizzleClient(env.DATABASE_URL);
  
  // 3. Initialize services
  const services = {
    product: new ProductService(db),
    cart: new CartService(db),
    checkout: new CheckoutService(db),
    // ... other services
  };
  
  // 4. Create context
  return {
    db,
    services,
    auth: createAuth(env),
  };
}
```

### Health Check

```typescript
// app/api/health/route.ts
export async function GET() {
  const checks = {
    database: await checkDatabase(),
    auth: await checkAuth(),
    services: await checkServices(),
  };
  
  return Response.json({
    status: 'healthy',
    checks,
    version: process.env.APP_VERSION,
  });
}
```

## Non-Functional Requirements

- [ ] Boot time < 5 seconds
- [ ] All services ready before accepting requests
- [ ] Graceful degradation if non-critical services fail
- [ ] Proper logging during boot

## Dependencies

- ✅ Next.js setup
- ✅ Database configuration
- ✅ Environment validation

## Definition of Done

- [ ] Boot sequence documented
- [ ] All services initialize correctly
- [ ] Health check endpoint working
- [ ] Error scenarios handled
- [ ] Monitoring in place

## Estimated Points

**Original**: 5 points (with plugin system)  
**Updated**: 2 points (simplified without plugins)

## Notes

- Much simpler without plugin loading
- Focus on service initialization order
- Consider future plugin system requirements
