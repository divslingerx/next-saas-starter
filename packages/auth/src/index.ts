/**
 * @charmlabs/auth
 * 
 * Authentication utilities and OAuth provider integrations.
 * Apps configure Better Auth directly but can use these helpers for common integrations.
 */

// Provider Integrations
export * from './providers/hubspot';
// export * from './providers/shopify';
// export * from './providers/spotify';
// export * from './providers/stripe';

// Common Types
export * from './types';

// Re-export useful Better Auth utilities for convenience
export { genericOAuth } from 'better-auth/plugins';