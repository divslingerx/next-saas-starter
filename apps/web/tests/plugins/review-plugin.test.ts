import { describe, it, expect, beforeEach } from 'vitest';
import { PluginTestHarness, createTestPlugin } from './plugin-test-harness';
import { ReviewPlugin } from '@/plugins/reviews';

describe('Review Plugin', () => {
  let harness: PluginTestHarness;

  beforeEach(() => {
    harness = new PluginTestHarness();
  });

  it('should register required hooks', async () => {
    await harness.loadPlugin(ReviewPlugin);

    harness.expectHookRegistered('order.completed');
    harness.expectHookRegistered('product.beforeDelete');
  });

  it('should create review request after order completion', async () => {
    await harness.loadPlugin(ReviewPlugin);

    const orderData = {
      id: 'ORD-123',
      customerEmail: 'test@example.com',
      lineItems: [
        { productId: 'PROD-1', name: 'Test Product' },
      ],
    };

    await harness.triggerHook('order.completed', orderData);

    // Check that review request was created
    const context = harness.getContext();
    expect(context.db.insert).toHaveBeenCalledWith('review_requests', {
      orderId: 'ORD-123',
      customerEmail: 'test@example.com',
      status: 'pending',
    });

    // Check that email was scheduled
    harness.expectEventEmitted('email.schedule', {
      template: 'review-request',
      to: 'test@example.com',
    });
  });

  it('should prevent product deletion with reviews', async () => {
    await harness.loadPlugin(ReviewPlugin);

    const context = harness.getContext();
    context.db.query.mockResolvedValueOnce([
      { id: 'REV-1', rating: 5 },
    ]); // Mock existing reviews

    const productData = {
      id: 'PROD-1',
      name: 'Test Product',
    };

    await expect(
      harness.triggerHook('product.beforeDelete', productData)
    ).rejects.toThrow('Cannot delete product with existing reviews');
  });

  it('should calculate average rating', async () => {
    await harness.loadPlugin(ReviewPlugin);

    const context = harness.getContext();
    context.db.query.mockResolvedValueOnce([
      { rating: 5 },
      { rating: 4 },
      { rating: 3 },
    ]);

    // Call plugin API
    const plugin = await context.plugins.get('@official/reviews');
    const avgRating = await plugin.getAverageRating('PROD-1');

    expect(avgRating).toBe(4);
  });

  it('should expose review widget component', async () => {
    await harness.loadPlugin(ReviewPlugin);

    const context = harness.getContext();
    expect(context.ui.registerExtension).toHaveBeenCalledWith(
      'product.detail.widgets',
      expect.objectContaining({
        component: 'ReviewWidget',
        priority: 100,
      })
    );
  });

  it('should handle review moderation workflow', async () => {
    await harness.loadPlugin(ReviewPlugin);

    const reviewData = {
      id: 'REV-123',
      productId: 'PROD-1',
      rating: 1,
      comment: 'spam content',
      flaggedWords: ['spam'],
    };

    await harness.triggerHook('review.created', reviewData);

    // Should auto-moderate based on flagged words
    const context = harness.getContext();
    expect(context.db.update).toHaveBeenCalledWith(
      'reviews',
      { id: 'REV-123' },
      { status: 'pending_moderation' }
    );

    // Should notify moderators
    harness.expectEventEmitted('notification.create', {
      type: 'review_needs_moderation',
      reviewId: 'REV-123',
    });
  });
});