# Email, Marketing & Automation Architecture

## You're Absolutely Right! 

The separation should be:

### 📧 Email Package (Infrastructure)
Pure email infrastructure - knows nothing about business logic:
```typescript
// @charmlabs/email
- Email client (SendGrid, Resend, SES)
- Template engine (React Email)
- Queue management
- Delivery tracking
- Bounce handling
- Unsubscribe management

// Example usage:
await emailService.send({
  to: "user@example.com",
  template: "order-confirmation",
  data: { name: "John", orderNumber: "12345" }
});
```

### 🎯 Marketing/Automation (Business Logic)
This is where the orchestration happens - pulls data from CRM/Ecom:
```typescript
// @charmlabs/platform/marketing
- Campaign management
- Customer segmentation
- Email automation workflows
- A/B testing
- Analytics

// Example workflow:
async function sendAbandonedCartEmail(customerId: string) {
  // Pull from ecom
  const cart = await ecomService.getCart(customerId);
  
  // Pull from CRM
  const customer = await crmService.getCustomer(customerId);
  
  // Use email service
  await emailService.send({
    to: customer.email,
    template: 'abandoned-cart',
    data: {
      customerName: customer.firstName,
      items: cart.items,
      cartUrl: generateCartUrl(cart.id)
    }
  });
}
```

## Recommended Architecture

```
packages/
├── email/                    # ✅ Separate package
│   ├── src/
│   │   ├── clients/         # SendGrid, Resend, SES adapters
│   │   ├── templates/       # React Email templates
│   │   ├── queue/          # Email queue management
│   │   └── tracking/       # Opens, clicks, bounces
│   │
├── platform/
│   ├── src/
│   │   ├── marketing/      # Marketing automation
│   │   │   ├── campaigns/  # Campaign management
│   │   │   ├── automation/ # Workflow engine
│   │   │   ├── segments/   # Customer segmentation
│   │   │   └── analytics/  # Marketing analytics
│   │   │
│   │   └── crm/           # Customer data
│   │
└── ecom/                   # Product/order data
```

## Why This Makes Sense

### 1. **Email is Infrastructure**
- Like a database or cache
- Doesn't need to know about customers or orders
- Just sends what it's told to send

### 2. **Marketing is Business Logic**
- Orchestrates between systems
- Knows when to send what to whom
- Makes decisions based on data

### 3. **Clean Dependencies**
```
marketing → email (uses email service)
marketing → crm (gets customer data)
marketing → ecom (gets order data)

email → ✗ (knows nothing about business)
```

## Example: Order Confirmation Flow

```typescript
// In @charmlabs/ecom/services/order.service.ts
class OrderService {
  async completeOrder(orderId: string) {
    const order = await this.processPayment(orderId);
    
    // Emit event
    await eventBus.emit('order.completed', { orderId });
    
    return order;
  }
}

// In @charmlabs/platform/marketing/automation/handlers.ts
class OrderCompletedHandler {
  async handle(event: { orderId: string }) {
    // Get data from different sources
    const order = await ecomService.getOrder(event.orderId);
    const customer = await crmService.getCustomer(order.customerId);
    const products = await ecomService.getProducts(order.items);
    
    // Use email service to send
    await emailService.send({
      to: customer.email,
      template: 'order-confirmation',
      data: {
        customerName: customer.firstName,
        orderNumber: order.number,
        items: products,
        total: order.total,
        estimatedDelivery: order.estimatedDelivery
      }
    });
  }
}
```

## Benefits of This Approach

1. **Email package is reusable** - Could use it in any project
2. **Marketing has all context** - Can make smart decisions
3. **No circular dependencies** - Clear flow direction
4. **Easy to test** - Email doesn't need mocked business data
5. **Scalable** - Email service could be replaced without touching business logic

## Implementation Priority

1. **First**: Keep email templates in platform for now (easiest)
2. **Later**: Extract email package when you need:
   - Multiple email providers
   - Complex queue management
   - Reuse in other projects
3. **Much Later**: Separate marketing service when you have:
   - Complex automation workflows
   - Multiple marketing channels
   - Dedicated marketing team

## Current Recommendation

For now, keep it simple:
```
platform/
├── marketing/       # All marketing logic
├── email/          # Email templates and sending
└── automation/     # Workflow engine
```

When you need more scale, extract email as infrastructure package!