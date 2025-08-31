# Auth Package Migration Guide

## Overview

The auth package has been refactored from providing a singleton auth instance to providing utilities for creating app-specific auth configurations. This ensures complete isolation between different apps in the monorepo.

## Key Changes

### Before (Singleton Pattern)
```typescript
// packages/auth exported a pre-configured auth instance
import { auth } from "@charmlabs/auth";
```

### After (Factory Pattern)
```typescript
// Each app creates its own auth instance
import { createAuth } from "@charmlabs/auth";

const auth = createAuth({
  database: myAppDb,
  appName: "My App",
  // ... app-specific config
});
```

## Migration Steps

### 1. Install Dependencies

Each app now needs its own database and auth dependencies:

```json
{
  "dependencies": {
    "@charmlabs/auth": "workspace:*",
    "better-auth": "^1.14.0",
    "drizzle-orm": "^0.36.0",
    "postgres": "^3.4.0",
    "stripe": "^17.7.0" // if using Stripe
  }
}
```

### 2. Create Database Connection

Each app should create its own database connection:

```typescript
// apps/your-app/src/lib/db.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const conn = postgres(process.env.YOUR_APP_DATABASE_URL);
export const db = drizzle(conn, { schema });
```

### 3. Configure Auth

Create your app's auth configuration:

```typescript
// apps/your-app/src/lib/auth.ts
import { createAuth } from "@charmlabs/auth";
import { db } from "./db";

export const auth = createAuth({
  database: db,
  appName: "Your App Name",
  baseURL: process.env.AUTH_BASE_URL,
  secret: process.env.AUTH_SECRET,
  
  // Configure only what you need
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  },
  
  // Enable features as needed
  enableTwoFactor: true,
  enableOrganizations: true,
});
```

### 4. Update Environment Variables

Each app needs its own database URL:

```env
# Before (shared)
DATABASE_URL=postgresql://...

# After (app-specific)
YOUR_APP_DATABASE_URL=postgresql://localhost:5432/your_app_db
```

### 5. Update Imports

Update all imports from the old auth package:

```typescript
// Before
import { auth } from "@charmlabs/auth";

// After
import { auth } from "@/lib/auth"; // Your app's auth instance
```

## Benefits

1. **Complete Isolation**: Each app has its own database and auth configuration
2. **Independent Scaling**: Scale databases based on each app's needs
3. **Custom Configuration**: Each app can have different auth providers and features
4. **No Cross-App Interference**: Changes to one app's auth don't affect others
5. **Easier Testing**: Test auth flows without affecting other apps

## Example Configurations

### HubSpot Clone
```typescript
export const auth = createAuth({
  database: hubspotDb,
  appName: "HubSpot Clone",
  enableOrganizations: true,
  enableBearerTokens: true, // For API access
  socialProviders: {
    google: { /* ... */ },
    microsoft: { /* ... */ }, // For enterprise SSO
  },
});
```

### Shopify Clone
```typescript
export const auth = createAuth({
  database: shopifyDb,
  appName: "Shopify Clone",
  stripe: {
    client: stripeClient,
    priceIds: SHOP_PRICE_IDS,
  },
  enableTwoFactor: true, // For merchant security
});
```

### Music Platform
```typescript
export const auth = createAuth({
  database: musicDb,
  appName: "Music Platform",
  socialProviders: {
    spotify: { /* ... */ }, // Music-specific OAuth
    apple: { /* ... */ },
  },
  enableMobileSupport: true, // For mobile app
});
```

## Troubleshooting

### Database Connection Issues
- Ensure each app has its own `DATABASE_URL` or app-specific env var
- Check that PostgreSQL is running and accessible
- Verify database exists: `createdb your_app_db`

### Auth Routes Not Working
- Ensure auth handler is properly mounted in your app
- Check that `baseURL` matches your app's URL
- Verify `AUTH_SECRET` is set (minimum 32 characters)

### OAuth Providers Not Working
- Verify client ID and secret are correct
- Check redirect URLs match your app's domain
- Ensure providers are configured in auth setup

## Need Help?

If you encounter issues during migration:
1. Check the example server app implementation in `/apps/server`
2. Review the auth package source in `/packages/auth`
3. Ensure all environment variables are properly set