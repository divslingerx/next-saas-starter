/**
 * Platform Routes Index
 * Exports both legacy RPC routes and new versioned API routes
 */

import { Hono } from "hono";
// import { createClientRPC } from "./client-rpc";
import { platformV1Routes } from "./v1-routes";

/**
 * Platform base routes
 * Simple health check and platform info endpoints
 */
export const platformRoutes = new Hono()
  .get('/health', (c) => {
    return c.json({ 
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'platform-api'
    });
  });

// Export the type for RPC client usage
export type PlatformAppType = typeof platformRoutes;

// Re-export both route styles for flexibility
export { platformV1Routes };
export default platformRoutes;