import { describe, it, expect } from 'vitest';
import { calculateCartTotals, applyDiscount, validateStock } from '@/lib/cart/calculator';

describe('Cart Calculator', () => {
  describe('calculateCartTotals', () => {
    it('should calculate subtotal correctly', () => {
      const items = [
        { price: 10.00, quantity: 2 },
        { price: 15.50, quantity: 1 },
      ];

      const totals = calculateCartTotals(items);
      
      expect(totals.subtotal).toBe(35.50);
      expect(totals.itemCount).toBe(3);
    });

    it('should handle empty cart', () => {
      const totals = calculateCartTotals([]);
      
      expect(totals.subtotal).toBe(0);
      expect(totals.itemCount).toBe(0);
    });
  });

  describe('applyDiscount', () => {
    it('should apply percentage discount', () => {
      const discount = {
        type: 'percentage',
        value: 10,
      };

      const discounted = applyDiscount(100, discount);
      expect(discounted).toBe(90);
    });

    it('should apply fixed amount discount', () => {
      const discount = {
        type: 'fixed',
        value: 15,
      };

      const discounted = applyDiscount(100, discount);
      expect(discounted).toBe(85);
    });

    it('should not allow negative totals', () => {
      const discount = {
        type: 'fixed',
        value: 150,
      };

      const discounted = applyDiscount(100, discount);
      expect(discounted).toBe(0);
    });
  });

  describe('validateStock', () => {
    it('should validate sufficient stock', () => {
      const result = validateStock({
        requested: 5,
        available: 10,
        reserved: 2,
      });

      expect(result.isValid).toBe(true);
      expect(result.availableForPurchase).toBe(8);
    });

    it('should reject insufficient stock', () => {
      const result = validateStock({
        requested: 10,
        available: 10,
        reserved: 5,
      });

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('Only 5 items available');
    });
  });
});