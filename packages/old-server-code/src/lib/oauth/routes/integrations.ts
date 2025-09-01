import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import type { ConnectionStorage } from '../storage/ConnectionStorage';
import { integrationRegistry } from '../core/IntegrationRegistry';
import { WebhookManager } from '../core/WebhookManager';
import { IntegrationError } from '../types';

// Validation schemas
const createConnectionSchema = z.object({
  propertyId: z.union([z.string(), z.number()]),
  integrationType: z.string(),
  name: z.string().optional(),
  config: z.record(z.string(), z.any()).optional(),
});

const updateConnectionSchema = z.object({
  name: z.string().optional(),
  config: z.record(z.string(), z.any()).optional(),
});

const oauthCallbackSchema = z.object({
  code: z.string().optional(),
  state: z.string().optional(),
  error: z.string().optional(),
  error_description: z.string().optional(),
});

export function createIntegrationsRouter(
  storage: ConnectionStorage,
  webhookManager?: WebhookManager
) {
  const app = new Hono();

  // List available integration types
  app.get('/available', (c) => {
    const integrations = Array.from(integrationRegistry.getAllMetadata().entries()).map(
      ([type, metadata]) => ({
        type,
        ...metadata,
      })
    );
    return c.json(integrations);
  });

  // Get integration metadata
  app.get('/metadata/:type', (c) => {
    const type = c.req.param('type');
    const metadata = integrationRegistry.getMetadata(type);
    
    if (!metadata) {
      return c.json({ error: 'Integration type not found' }, 404);
    }
    
    return c.json(metadata);
  });

  // List connections for a property
  app.get('/property/:propertyId', async (c) => {
    const propertyId = c.req.param('propertyId');
    const connections = await storage.getConnectionsByProperty(propertyId);
    
    return c.json(connections);
  });

  // Get a specific connection
  app.get('/connection/:id', async (c) => {
    const id = c.req.param('id');
    const connection = await storage.getConnection(id);
    
    if (!connection) {
      return c.json({ error: 'Connection not found' }, 404);
    }
    
    // Don't expose sensitive tokens
    const sanitized = {
      ...connection,
      oauthAccessToken: connection.oauthAccessToken ? '[REDACTED]' : undefined,
      oauthRefreshToken: connection.oauthRefreshToken ? '[REDACTED]' : undefined,
      apiKey: connection.apiKey ? '[REDACTED]' : undefined,
      apiSecret: connection.apiSecret ? '[REDACTED]' : undefined,
    };
    
    return c.json(sanitized);
  });

  // Create a new connection
  app.post(
    '/connection',
    zValidator('json', createConnectionSchema),
    async (c) => {
      const data = c.req.valid('json');
      
      if (!integrationRegistry.has(data.integrationType)) {
        return c.json({ error: 'Invalid integration type' }, 400);
      }

      const connection = await storage.saveConnection({
        id: Date.now(), // Or use UUID
        propertyId: data.propertyId,
        integrationType: data.integrationType,
        name: data.name,
        config: data.config,
      });

      return c.json(connection, 201);
    }
  );

  // Update a connection
  app.patch(
    '/connection/:id',
    zValidator('json', updateConnectionSchema),
    async (c) => {
      const id = c.req.param('id');
      const updates = c.req.valid('json');
      
      try {
        const updated = await storage.updateConnection(id, updates);
        return c.json(updated);
      } catch (error) {
        if (error instanceof IntegrationError && error.code === 'NOT_FOUND') {
          return c.json({ error: 'Connection not found' }, 404);
        }
        throw error;
      }
    }
  );

  // Delete a connection
  app.delete('/connection/:id', async (c) => {
    const id = c.req.param('id');
    
    try {
      await storage.deleteConnection(id);
      return c.json({ success: true });
    } catch (error) {
      return c.json({ error: 'Connection not found' }, 404);
    }
  });

  // Test a connection
  app.post('/connection/:id/test', async (c) => {
    const id = c.req.param('id');
    const connection = await storage.getConnection(id);
    
    if (!connection) {
      return c.json({ error: 'Connection not found' }, 404);
    }

    try {
      const connector = integrationRegistry.create(
        connection.integrationType,
        connection,
        storage
      );
      
      const result = await connector.testConnection();
      return c.json({ success: result });
    } catch (error) {
      return c.json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Test failed' 
      });
    }
  });

  // Get connection metadata
  app.get('/connection/:id/metadata', async (c) => {
    const id = c.req.param('id');
    const connection = await storage.getConnection(id);
    
    if (!connection) {
      return c.json({ error: 'Connection not found' }, 404);
    }

    try {
      const connector = integrationRegistry.create(
        connection.integrationType,
        connection,
        storage
      );
      
      const metadata = await connector.getMetadata();
      return c.json(metadata);
    } catch (error) {
      return c.json({ 
        error: error instanceof Error ? error.message : 'Failed to get metadata' 
      }, 500);
    }
  });

  // OAuth2 flow - start authorization
  app.get('/connection/:id/authorize', async (c) => {
    const id = c.req.param('id');
    const connection = await storage.getConnection(id);
    
    if (!connection) {
      return c.json({ error: 'Connection not found' }, 404);
    }

    try {
      const connector = integrationRegistry.create(
        connection.integrationType,
        connection,
        storage
      );
      
      const authUrl = await connector.getAuthorizationUrl();
      
      if (!authUrl) {
        return c.json({ error: 'This integration does not support OAuth2' }, 400);
      }
      
      return c.redirect(authUrl);
    } catch (error) {
      return c.json({ 
        error: error instanceof Error ? error.message : 'Authorization failed' 
      }, 500);
    }
  });

  // OAuth2 flow - handle callback
  app.get(
    '/callback/:type',
    zValidator('query', oauthCallbackSchema),
    async (c) => {
      const type = c.req.param('type');
      const params = c.req.valid('query');
      
      // Extract connection ID from state parameter
      // In production, state should include encrypted connection ID
      const state = params.state;
      if (!state) {
        return c.json({ error: 'Missing state parameter' }, 400);
      }

      // For now, assume state contains connection ID
      // In production, decrypt and validate state
      const connectionId = state; // This should be extracted/decrypted
      
      const connection = await storage.getConnection(connectionId);
      if (!connection) {
        return c.json({ error: 'Connection not found' }, 404);
      }

      try {
        const connector = integrationRegistry.create(
          connection.integrationType,
          connection,
          storage
        );
        
        await connector.handleOAuth2Callback(params);
        
        // Redirect to success page or return success response
        return c.json({ success: true, connectionId });
      } catch (error) {
        return c.json({ 
          error: error instanceof Error ? error.message : 'Callback processing failed' 
        }, 500);
      }
    }
  );

  // Refresh OAuth2 token
  app.post('/connection/:id/refresh', async (c) => {
    const id = c.req.param('id');
    const connection = await storage.getConnection(id);
    
    if (!connection) {
      return c.json({ error: 'Connection not found' }, 404);
    }

    try {
      const connector = integrationRegistry.create(
        connection.integrationType,
        connection,
        storage
      );
      
      await connector.refreshToken();
      return c.json({ success: true });
    } catch (error) {
      return c.json({ 
        error: error instanceof Error ? error.message : 'Token refresh failed' 
      }, 500);
    }
  });

  // Revoke access
  app.post('/connection/:id/revoke', async (c) => {
    const id = c.req.param('id');
    const connection = await storage.getConnection(id);
    
    if (!connection) {
      return c.json({ error: 'Connection not found' }, 404);
    }

    try {
      const connector = integrationRegistry.create(
        connection.integrationType,
        connection,
        storage
      );
      
      await connector.revokeAccess();
      return c.json({ success: true });
    } catch (error) {
      return c.json({ 
        error: error instanceof Error ? error.message : 'Revocation failed' 
      }, 500);
    }
  });

  // Webhook endpoints (if webhook manager is provided)
  if (webhookManager) {
    // Register a webhook for a connection
    app.post('/connection/:id/webhook', async (c) => {
      const id = c.req.param('id');
      const { events, url, secret } = await c.req.json();
      
      const webhookId = await webhookManager.registerWebhook(id, {
        url,
        events,
        secret,
        active: true,
      });
      
      return c.json({ webhookId });
    });

    // Handle incoming webhooks
    app.post('/webhook/:webhookId', async (c) => {
      const webhookId = c.req.param('webhookId');
      const headers = Object.fromEntries(c.req.raw.headers.entries());
      const body = await c.req.json();
      
      try {
        await webhookManager.handleIncomingWebhook(webhookId, headers, body);
        return c.json({ success: true });
      } catch (error) {
        return c.json({ 
          error: error instanceof Error ? error.message : 'Webhook processing failed' 
        }, 500);
      }
    });

    // List webhooks for a connection
    app.get('/connection/:id/webhooks', async (c) => {
      const id = c.req.param('id');
      const connection = await storage.getConnection(id);
      
      if (!connection) {
        return c.json({ error: 'Connection not found' }, 404);
      }
      
      const webhooks = (connection.config?.webhooks || []) as any[];
      return c.json(webhooks);
    });

    // Delete a webhook
    app.delete('/webhook/:webhookId', async (c) => {
      const webhookId = c.req.param('webhookId');
      
      try {
        await webhookManager.unregisterWebhook(webhookId);
        return c.json({ success: true });
      } catch (error) {
        return c.json({ error: 'Webhook not found' }, 404);
      }
    });
  }

  return app;
}