// Core exports
export * from './types';
export { BaseConnector } from './core/BaseConnector';
export { IntegrationRegistry, integrationRegistry } from './core/IntegrationRegistry';
export { WebhookManager } from './core/WebhookManager';

// Storage exports
export type { ConnectionStorage } from './storage/ConnectionStorage';
export { DrizzleStorage } from './storage/DrizzleStorage';
export { MemoryStorage } from './storage/MemoryStorage';

// Connector exports
export { HubSpotConnector } from './connectors/HubspotConnector';
export { GA4Connector } from './connectors/GA4Connector';
export { WordPressConnector } from './connectors/WordpressConnector';

// Route exports
export { createIntegrationsRouter } from './routes/integrations';

// Setup function to initialize the integration system
import { DrizzleStorage } from './storage/DrizzleStorage';
import { WebhookManager } from './core/WebhookManager';
import { integrationRegistry } from './core/IntegrationRegistry';
import { HubSpotConnector } from './connectors/HubspotConnector';
import { GA4Connector } from './connectors/GA4Connector';
import { WordPressConnector } from './connectors/WordpressConnector';
import { createIntegrationsRouter } from './routes/integrations';
import type { ConnectionStorage } from './storage/ConnectionStorage';

export interface IntegrationSystemConfig {
  storage?: ConnectionStorage;
  enableWebhooks?: boolean;
  autoRegisterConnectors?: boolean;
}

export function setupIntegrationSystem(config: IntegrationSystemConfig = {}) {
  // Set up storage
  const storage = config.storage || new DrizzleStorage();
  
  // Set up webhook manager if enabled
  const webhookManager = config.enableWebhooks ? new WebhookManager(storage) : undefined;
  
  // Auto-register built-in connectors
  if (config.autoRegisterConnectors !== false) {
    // Register HubSpot
    integrationRegistry.register(
      'hubspot',
      HubSpotConnector,
      HubSpotConnector.metadata
    );
    
    // Register GA4
    integrationRegistry.register(
      'ga4',
      GA4Connector,
      GA4Connector.metadata
    );
    
    // Register WordPress
    integrationRegistry.register(
      'wordpress',
      WordPressConnector,
      WordPressConnector.metadata
    );
  }
  
  // Create router
  const router = createIntegrationsRouter(storage, webhookManager);
  
  return {
    storage,
    webhookManager,
    registry: integrationRegistry,
    router,
  };
}