import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { 
  setupTestDatabase, 
  cleanupTestDatabase, 
  clearDatabase,
  testFactories 
} from '../setup/database';
import { OrderService } from '@/services/order-service';
import { CartService } from '@/services/cart-service';
import type { Database } from '@/server/db';

describe('Order Service Integration', () => {
  let db: Database;
  let orderService: OrderService;
  let cartService: CartService;

  beforeAll(async () => {
    const testDb = await setupTestDatabase();
    db = testDb.db;
    orderService = new OrderService(db);
    cartService = new CartService(db);
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe('createOrderFromCart', () => {
    it('should create order from cart successfully', async () => {
      // Setup test data
      const customer = await testFactories.createTestCustomer('org-123');
      const product = await testFactories.createTestProduct({
        price: 29.99,
      });

      // Create cart with items
      const cart = await cartService.createCart({
        customerId: customer.id,
        items: [{
          productId: product.id,
          variantId: 'var-123',
          quantity: 2,
          price: product.price,
        }],
      });

      // Create order from cart
      const order = await orderService.createOrderFromCart({
        cartId: cart.id,
        paymentMethod: 'stripe',
        shippingAddress: {
          line1: '123 Test St',
          city: 'Test City',
          postalCode: '12345',
          country: 'US',
        },
      });

      // Assertions
      expect(order).toBeDefined();
      expect(order.customerAccountId).toBe(customer.id);
      expect(order.status).toBe('pending');
      expect(order.totalAmount).toBe(59.98);
      expect(order.lineItems).toHaveLength(1);
      expect(order.lineItems[0].quantity).toBe(2);

      // Verify cart was cleared
      const updatedCart = await cartService.getCart(cart.id);
      expect(updatedCart.items).toHaveLength(0);
    });

    it('should fail with insufficient stock', async () => {
      const customer = await testFactories.createTestCustomer('org-123');
      const product = await testFactories.createTestProduct({
        inventoryQuantity: 1,
      });

      const cart = await cartService.createCart({
        customerId: customer.id,
        items: [{
          productId: product.id,
          quantity: 5, // More than available
          price: product.price,
        }],
      });

      await expect(
        orderService.createOrderFromCart({ cartId: cart.id })
      ).rejects.toThrow('Insufficient stock');
    });
  });

  describe('order workflow', () => {
    it('should handle complete order lifecycle', async () => {
      // Create order
      const customer = await testFactories.createTestCustomer('org-123');
      const order = await testFactories.createTestOrder(customer.id);

      // Process payment
      await orderService.processPayment(order.id, {
        paymentIntentId: 'pi_test_123',
        amount: order.totalAmount,
      });

      let updatedOrder = await orderService.getOrder(order.id);
      expect(updatedOrder.paymentStatus).toBe('paid');
      expect(updatedOrder.status).toBe('processing');

      // Fulfill order
      await orderService.fulfillOrder(order.id, {
        trackingNumber: 'TRACK123',
        carrier: 'USPS',
      });

      updatedOrder = await orderService.getOrder(order.id);
      expect(updatedOrder.fulfillmentStatus).toBe('fulfilled');
      expect(updatedOrder.status).toBe('completed');

      // Verify activity log
      const activities = await orderService.getOrderActivities(order.id);
      expect(activities).toHaveLength(3); // created, paid, fulfilled
    });
  });
});