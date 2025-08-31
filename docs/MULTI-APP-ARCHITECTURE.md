# Multi-App Platform Architecture

## Your Platform = Foundation for Multiple Apps

### Current Apps:
1. **Marketing/Ecom Platform** - Full e-commerce with CRM
2. **Music Artist Admin Panel** - Artist management, royalties, releases

### Future Apps (easily spinnable):
- SaaS Admin Dashboard
- Real Estate CRM
- Healthcare Practice Manager
- Any vertical that needs CRM + Commerce + Admin

## Core Architecture

```
┌─────────────────────────────────────────────────┐
│                  Apps Layer                      │
├─────────────────────┬────────────────────────────┤
│   Ecom/Marketing    │    Music Admin Panel       │
│   (app-ecom)        │    (app-music)             │
├─────────────────────┴────────────────────────────┤
│              Shared Platform Layer               │
├───────────────────────────────────────────────────┤
│ @charmlabs/platform │ @charmlabs/ecom │ @charmlabs/email │
│ - Identity/Auth     │ - Products      │ - Templates     │
│ - CRM/Contacts      │ - Orders        │ - Providers     │
│ - Flexible Objects  │ - Payments      │ - Queue         │
│ - Automation        │ - Inventory     │ - Tracking      │
└───────────────────────────────────────────────────┘
```

## App Configuration Pattern

Each app defines its configuration:

```typescript
// apps/app-ecom/config.ts
export const appConfig = {
  name: 'CharmCommerce',
  domain: 'commerce.charmlabs.com',
  
  // Features to enable
  features: {
    ecommerce: true,
    crm: true,
    marketing: true,
    inventory: true,
    b2b: false,
  },
  
  // Custom objects for this app
  customObjects: [
    { name: 'product_review', label: 'Product Review' },
    { name: 'wishlist', label: 'Wishlist' },
  ],
  
  // Email templates to use
  emailTemplates: ['order', 'cart', 'customer', 'marketing'],
  
  // UI theme
  theme: {
    primaryColor: '#10b981',
    logo: '/logos/commerce.svg',
  }
};

// apps/app-music/config.ts
export const appConfig = {
  name: 'ArtistHub',
  domain: 'artists.charmlabs.com',
  
  features: {
    ecommerce: false, // No direct sales
    crm: true,        // Fan management
    marketing: true,  // Email campaigns
    inventory: false,
    b2b: true,        // Label relationships
  },
  
  customObjects: [
    { name: 'artist', label: 'Artist' },
    { name: 'release', label: 'Release' },
    { name: 'track', label: 'Track' },
    { name: 'royalty_payment', label: 'Royalty Payment' },
    { name: 'streaming_report', label: 'Streaming Report' },
  ],
  
  emailTemplates: ['artist', 'release', 'royalty', 'fan'],
  
  theme: {
    primaryColor: '#8b5cf6',
    logo: '/logos/music.svg',
  }
};
```

## Email Package for Multi-App

```typescript
// packages/email/src/templates/registry.ts
export const templateRegistry = {
  // Shared templates (all apps)
  'auth/welcome': WelcomeEmail,
  'auth/reset': PasswordResetEmail,
  'system/notification': SystemNotification,
  
  // Ecom-specific templates
  'ecom/order-confirmation': OrderConfirmationEmail,
  'ecom/shipping-update': ShippingUpdateEmail,
  'ecom/cart-abandoned': AbandonedCartEmail,
  
  // Music-specific templates
  'music/release-notification': ReleaseNotificationEmail,
  'music/royalty-statement': RoyaltyStatementEmail,
  'music/fan-update': FanUpdateEmail,
};

// Usage in app
const emailService = new EmailService({
  appId: 'app-music',
  templates: appConfig.emailTemplates,
});
```

## Flexible Object System for Different Verticals

```typescript
// Music app creates artist object
await platformService.createObjectDefinition({
  name: 'artist',
  properties: {
    stageName: { type: 'string', required: true },
    realName: { type: 'string' },
    genre: { type: 'select', options: ['rock', 'pop', 'jazz'] },
    label: { type: 'relation', relatedTo: 'company' },
    monthlyListeners: { type: 'number' },
    verified: { type: 'boolean' },
  }
});

// Ecom app uses standard products
await ecomService.createProduct({
  name: 'T-Shirt',
  price: 29.99,
  inventory: 100,
});
```

## Shared Services, Different Context

```typescript
// CRM in Ecom context
const ecomCRM = new CRMService({
  context: 'ecommerce',
  personTypes: ['customer', 'lead'],
  customFields: ['lifetime_value', 'last_purchase'],
});

// CRM in Music context  
const musicCRM = new CRMService({
  context: 'music',
  personTypes: ['artist', 'fan', 'label_exec'],
  customFields: ['favorite_genres', 'concert_attendance'],
});
```

## Deployment Strategy

```yaml
# docker-compose.yml
services:
  # Shared services
  postgres:
    image: postgres:15
  
  redis:
    image: redis:7
  
  # App instances
  app-ecom:
    build: .
    environment:
      - APP_ID=app-ecom
      - APP_CONFIG=/configs/ecom.json
    ports:
      - "3000:3000"
  
  app-music:
    build: .
    environment:
      - APP_ID=app-music
      - APP_CONFIG=/configs/music.json
    ports:
      - "3001:3000"
```

## Benefits of This Approach

1. **Rapid App Creation** - New vertical in days, not months
2. **Shared Maintenance** - Fix once, deploy everywhere
3. **Consistent Quality** - All apps get same robust foundation
4. **Flexible Customization** - Each app can have unique objects
5. **Cost Effective** - Shared infrastructure and code
6. **Easy Testing** - Test core once, confidence everywhere

## Email Templates Organization

```
email/src/templates/
├── shared/           # Used by all apps
│   ├── auth/
│   ├── system/
│   └── components/   # Shared email components
│
├── ecom/            # Ecommerce-specific
│   ├── order/
│   ├── customer/
│   └── marketing/
│
├── music/           # Music platform-specific
│   ├── artist/
│   ├── release/
│   └── royalty/
│
└── [new-vertical]/  # Easy to add new verticals
```

## Quick App Checklist

To spin up a new app:
1. ✅ Create app config file
2. ✅ Define custom objects needed
3. ✅ Select features to enable
4. ✅ Add any vertical-specific email templates
5. ✅ Customize UI theme
6. ✅ Deploy with environment config

## This is Smart Because...

- **No code duplication** - Core logic shared
- **Vertical agnostic** - Platform doesn't care about specific use case
- **Easy pivots** - Can quickly test new markets
- **White-label ready** - Each app fully branded
- **Unified maintenance** - One codebase to manage

You're essentially building a **Platform-as-a-Service (PaaS)** for yourself!