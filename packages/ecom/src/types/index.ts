// E-commerce specific types
export type ProductStatus = 'active' | 'draft' | 'archived';
export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
export type FulfillmentStatus = 'unfulfilled' | 'partially_fulfilled' | 'fulfilled';

export interface Money {
  amount: number;
  currencyCode: string;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export interface LineItem {
  id: string;
  productId: string;
  variantId?: string;
  quantity: number;
  price: Money;
  title: string;
  variantTitle?: string;
}