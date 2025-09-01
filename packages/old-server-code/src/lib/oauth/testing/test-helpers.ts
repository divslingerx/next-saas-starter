import { MemoryStorage } from '../storage/MemoryStorage';
import { IntegrationRegistry } from '../core/IntegrationRegistry';
import { WebhookManager } from '../core/WebhookManager';
import { MockConnector } from './MockConnector';
import type { ConnectionData } from '../types';

export function createTestStorage() {
  return new MemoryStorage();
}

export function createTestRegistry() {
  const registry = IntegrationRegistry.getInstance();
  
  // Register mock connector
  registry.register('mock', MockConnector, MockConnector.metadata);
  
  return registry;
}

export function createTestConnection(overrides: Partial<ConnectionData> = {}): ConnectionData {
  return {
    id: 'test_connection_1',
    propertyId: 'test_property_1',
    integrationType: 'mock',
    name: 'Test Connection',
    config: {},
    ...overrides,
  };
}

export function createTestWebhookManager(storage = createTestStorage()) {
  return new WebhookManager(storage);
}

export async function setupTestEnvironment() {
  const storage = createTestStorage();
  const registry = createTestRegistry();
  const webhookManager = createTestWebhookManager(storage);
  
  // Create some test connections
  const connection1 = await storage.saveConnection(createTestConnection({
    id: 'conn_1',
    name: 'Test Connection 1',
  }));
  
  const connection2 = await storage.saveConnection(createTestConnection({
    id: 'conn_2',
    name: 'Test Connection 2',
    oauthAccessToken: 'test_token',
    oauthExpiresAt: new Date(Date.now() + 3600000),
  }));
  
  return {
    storage,
    registry,
    webhookManager,
    connections: [connection1, connection2],
  };
}

export function createMockRequest(options: {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string>;
  query?: Record<string, string>;
}) {
  return {
    method: options.method || 'GET',
    headers: new Headers(options.headers || {}),
    body: options.body,
    params: options.params || {},
    query: options.query || {},
  };
}

export function createMockWebhookPayload(overrides: any = {}) {
  return {
    event: 'test.event',
    data: {
      id: 'test_123',
      type: 'test',
      ...overrides.data,
    },
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

export async function simulateOAuth2Flow(
  connector: any,
  storage: any,
  connectionId: string
) {
  // Start authorization
  const authUrl = await connector.getAuthorizationUrl();
  
  // Simulate user authorization and callback
  const callbackParams = {
    code: 'test_auth_code',
    state: connector.oauth2State?.state || 'test_state',
  };
  
  await connector.handleOAuth2Callback(callbackParams);
  
  // Verify tokens were saved
  const connection = await storage.getConnection(connectionId);
  
  return {
    authUrl,
    connection,
    accessToken: connection?.oauthAccessToken,
    refreshToken: connection?.oauthRefreshToken,
  };
}

export async function simulateTokenExpiry(
  storage: any,
  connectionId: string
) {
  const connection = await storage.getConnection(connectionId);
  if (!connection) throw new Error('Connection not found');
  
  // Set token to expired
  await storage.updateTokens(connectionId, {
    expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
  });
  
  return connection;
}

export function createTestEventListener() {
  const events: any[] = [];
  
  return {
    listener: (event: any) => {
      events.push(event);
    },
    getEvents: () => events,
    getLastEvent: () => events[events.length - 1],
    clear: () => {
      events.length = 0;
    },
  };
}