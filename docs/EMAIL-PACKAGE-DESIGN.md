# Email Package Design - Cross-Cutting Infrastructure

## You're Right - Email Needs to be Separate!

Email is needed by EVERYONE:
- **Auth**: Welcome, verification, password reset
- **Ecom**: Order confirmations, shipping updates
- **CRM**: Deal updates, task reminders
- **Marketing**: Campaigns, newsletters
- **Platform**: Admin notifications, alerts

## Proposed Architecture

```
packages/
├── email/                        # 📧 Standalone email package
│   ├── src/
│   │   ├── providers/           # Email provider adapters
│   │   │   ├── resend.ts
│   │   │   ├── sendgrid.ts
│   │   │   └── ses.ts
│   │   │
│   │   ├── templates/           # React Email templates by category
│   │   │   ├── auth/          # Welcome, verify, reset
│   │   │   ├── ecom/          # Orders, shipping
│   │   │   ├── crm/           # Deal updates, tasks
│   │   │   ├── marketing/     # Campaigns, newsletters
│   │   │   └── system/        # Alerts, notifications
│   │   │
│   │   ├── queue/              # Email queue management
│   │   │   ├── bull.ts        # Bull/BullMQ integration
│   │   │   └── memory.ts      # Simple in-memory queue
│   │   │
│   │   ├── tracking/           # Analytics
│   │   │   ├── opens.ts
│   │   │   ├── clicks.ts
│   │   │   └── bounces.ts
│   │   │
│   │   └── email.service.ts   # Main service
│   │
│   └── package.json
```

## Email Service Interface

```typescript
// @charmlabs/email
export interface EmailService {
  // Core sending
  send(options: SendEmailOptions): Promise<EmailResult>;
  sendBatch(emails: SendEmailOptions[]): Promise<EmailResult[]>;
  
  // Queue management
  queue(options: SendEmailOptions, delay?: number): Promise<JobId>;
  scheduleAt(options: SendEmailOptions, date: Date): Promise<JobId>;
  
  // Template management
  renderTemplate(template: string, data: any): Promise<string>;
  previewTemplate(template: string, data: any): Promise<PreviewUrl>;
  
  // List management
  subscribe(email: string, lists: string[]): Promise<void>;
  unsubscribe(email: string, lists?: string[]): Promise<void>;
  
  // Tracking
  trackOpen(emailId: string): Promise<void>;
  trackClick(emailId: string, link: string): Promise<void>;
}
```

## Usage Examples

### 1. Auth Email (Direct)
```typescript
// In auth service
await emailService.send({
  to: user.email,
  template: 'auth/welcome',
  data: {
    name: user.name,
    verificationUrl: generateVerificationUrl(user.id)
  }
});
```

### 2. Ecom Order (Queued)
```typescript
// In order service - queue for reliability
await emailService.queue({
  to: customer.email,
  template: 'ecom/order-confirmation',
  data: {
    orderNumber: order.number,
    items: order.items,
    total: order.total
  }
});
```

### 3. CRM Deal Stage (Conditional)
```typescript
// In deal service
if (dealSettings.notifyOnStageChange) {
  await emailService.send({
    to: [owner.email, ...watchers.map(w => w.email)],
    template: 'crm/deal-stage-changed',
    data: {
      dealName: deal.name,
      previousStage: oldStage.name,
      newStage: newStage.name,
      dealUrl: generateDealUrl(deal.id)
    }
  });
}
```

### 4. Marketing Campaign (Batch)
```typescript
// In marketing automation
const emails = segments.map(contact => ({
  to: contact.email,
  template: 'marketing/campaign',
  data: {
    firstName: contact.firstName,
    productRecommendations: getRecommendations(contact),
    unsubscribeUrl: generateUnsubscribeUrl(contact.id)
  },
  metadata: {
    campaignId: campaign.id,
    segmentId: segment.id
  }
}));

await emailService.sendBatch(emails);
```

## Event-Driven Integration

```typescript
// Email service listens to events from all domains
eventBus.on('user.registered', async (event) => {
  await emailService.send({
    template: 'auth/welcome',
    to: event.user.email,
    data: event.user
  });
});

eventBus.on('order.completed', async (event) => {
  await emailService.queue({
    template: 'ecom/order-confirmation',
    to: event.customer.email,
    data: event.order
  });
});

eventBus.on('deal.stage.changed', async (event) => {
  if (event.deal.notifications.stageChanges) {
    await emailService.send({
      template: 'crm/deal-update',
      to: event.recipients,
      data: event
    });
  }
});
```

## Template Organization

```typescript
// templates/auth/welcome.tsx
export default function WelcomeEmail({ name, verificationUrl }) {
  return (
    <Html>
      <Head />
      <Body>
        <Container>
          <Heading>Welcome to {appName}, {name}!</Heading>
          <Text>Please verify your email:</Text>
          <Button href={verificationUrl}>Verify Email</Button>
        </Container>
      </Body>
    </Html>
  );
}

// templates/ecom/order-confirmation.tsx
export default function OrderConfirmation({ orderNumber, items, total }) {
  return (
    <Html>
      <Head />
      <Body>
        <Container>
          <Heading>Order #{orderNumber} Confirmed</Heading>
          <ItemList items={items} />
          <Text>Total: {formatCurrency(total)}</Text>
        </Container>
      </Body>
    </Html>
  );
}
```

## Benefits of Separate Email Package

1. **Single Source of Truth** - All email logic in one place
2. **Consistent Templates** - Shared components and styling
3. **Provider Agnostic** - Easy to switch email providers
4. **Queue Management** - Reliability and rate limiting
5. **Tracking & Analytics** - Centralized email metrics
6. **Compliance** - Unsubscribe, GDPR, CAN-SPAM in one place
7. **Testing** - Mock email service for tests

## Implementation Steps

1. **Create email package** with basic sending
2. **Move all templates** to email package
3. **Add queue system** for reliability
4. **Implement tracking** for analytics
5. **Add provider adapters** (start with one)
6. **Create template preview** system

## How This App Works Differently?

You mentioned the app works differently - what's unique about your email needs? This will help refine the design!