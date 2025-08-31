# @charmlabs/auth

Authentication utilities and OAuth provider integrations for the monorepo apps.

## Philosophy

Rather than wrapping Better Auth with unnecessary abstractions, this package provides **actual value** through:
- Pre-built OAuth provider integrations (HubSpot, Shopify, Spotify, etc.)
- Middleware for handling provider-specific authentication flows
- Ready-to-use API routes for provider operations
- Type-safe interfaces for provider APIs

Each app configures Better Auth directly for maximum flexibility, while using these utilities for common integrations.

## Structure

```
packages/auth/
├── src/
│   ├── providers/           # OAuth provider integrations
│   │   ├── hubspot/
│   │   │   ├── hubspot.adapter.ts    # Better Auth OAuth configuration
│   │   │   ├── hubspot.middleware.ts # Token management & client creation
│   │   │   ├── hubspot.routes.ts     # Ready-to-use API endpoints
│   │   │   └── index.ts              # Provider exports
│   │   ├── shopify/
│   │   └── spotify/
│   ├── types.ts            # Common types
│   └── index.ts            # Package exports
```

## Usage

### 1. Configure Better Auth in Your App

Each app owns its Better Auth configuration:

```typescript
// apps/your-app/src/lib/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { hubspotOAuthPlugin } from "@charmlabs/auth/providers/hubspot";
import { db } from "./db"; // Your app's database

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  plugins: [
    // Add HubSpot OAuth support
    hubspotOAuthPlugin({
      clientId: process.env.HUBSPOT_CLIENT_ID!,
      clientSecret: process.env.HUBSPOT_CLIENT_SECRET!,
      scopes: ["crm.objects.contacts.read", "crm.objects.deals.read"]
    })
  ]
});
```

### 2. Use Provider Middleware

```typescript
// apps/your-app/src/routes/api.ts
import { Hono } from "hono";
import { hubspotMiddleware, requireHubSpot } from "@charmlabs/auth/providers/hubspot";

const app = new Hono();

// Apply HubSpot middleware to make client available
app.use("/api/hubspot/*", hubspotMiddleware);

// Use in your routes
app.get("/api/hubspot/deals", requireHubSpot, async (c) => {
  const hubspotClient = c.get("hubspotClient");
  const deals = await hubspotClient.crm.deals.basicApi.getPage();
  return c.json(deals);
});
```

### 3. Mount Pre-built Routes

```typescript
// apps/your-app/src/routes/api.ts
import { hubspotRoutes } from "@charmlabs/auth/providers/hubspot";

// Mount all HubSpot routes
app.route("/api/hubspot", hubspotRoutes);

// Now you have endpoints like:
// GET  /api/hubspot/deals
// GET  /api/hubspot/deals/:id
// POST /api/hubspot/deals/search
// GET  /api/hubspot/properties/:objectType
// GET  /api/hubspot/pipelines
```

## Adding New Providers

To add a new OAuth provider:

1. Create a new directory: `src/providers/[provider-name]/`

2. Implement the adapter:
```typescript
// src/providers/shopify/shopify.adapter.ts
import { genericOAuth } from "better-auth/plugins";

export function shopifyOAuthPlugin(config: ShopifyOAuthConfig) {
  return genericOAuth({
    config: [{
      providerId: "shopify",
      authorizationUrl: "https://myshop.myshopify.com/admin/oauth/authorize",
      tokenUrl: "https://myshop.myshopify.com/admin/oauth/access_token",
      // ... OAuth configuration
    }]
  });
}
```

3. Create middleware for token/client management:
```typescript
// src/providers/shopify/shopify.middleware.ts
export async function shopifyMiddleware(c: Context, next: Next) {
  // Retrieve stored access token
  // Create Shopify client
  // Add to context
}
```

4. Add useful routes:
```typescript
// src/providers/shopify/shopify.routes.ts
const shopifyRoutes = new Hono();
shopifyRoutes.get("/products", requireShopify, async (c) => {
  // Implementation
});
```

## Provider-Specific Documentation

### HubSpot

The HubSpot provider includes:
- Full OAuth flow with configurable scopes
- Automatic token management
- Pre-built routes for:
  - Deals (CRUD, search, statistics)
  - Properties (for any object type)
  - Pipelines and stages
  - More coming soon...

### Shopify (Coming Soon)

### Spotify (Coming Soon)

## Environment Variables

Each app needs its own provider credentials:

```env
# HubSpot
HUBSPOT_CLIENT_ID=your-client-id
HUBSPOT_CLIENT_SECRET=your-client-secret

# Shopify
SHOPIFY_API_KEY=your-api-key
SHOPIFY_API_SECRET=your-api-secret
SHOPIFY_SHOP_DOMAIN=yourshop.myshopify.com
```

## Benefits

✅ **No unnecessary abstractions** - Apps use Better Auth directly
✅ **Real value-add** - Pre-built integrations save development time
✅ **Type-safe** - Full TypeScript support for provider APIs
✅ **Modular** - Use only the providers you need
✅ **Extensible** - Easy to add new providers following the pattern