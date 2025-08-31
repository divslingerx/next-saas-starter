/**
 * HubSpot Provider Exports
 * Provides OAuth adapter, middleware, and routes for HubSpot integration
 */

// OAuth Adapter
export {
  hubspotOAuthPlugin,
  createHubSpotProvider,
  DEFAULT_HUBSPOT_SCOPES,
  AVAILABLE_HUBSPOT_SCOPES,
  type HubSpotOAuthConfig
} from './hubspot.adapter';

// Middleware
export {
  hubspotMiddleware,
  requireHubSpot,
  getHubSpotClient,
  type HubSpotContext
} from './hubspot.middleware';

// Routes (if using Hono)
export { default as hubspotRoutes } from './hubspot.routes';