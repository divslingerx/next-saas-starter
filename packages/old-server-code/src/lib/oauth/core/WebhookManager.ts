import { EventEmitter } from 'events';
import type { WebhookConfig, WebhookPayload, IntegrationError } from '../types';
import type { ConnectionStorage } from '../storage/ConnectionStorage';
import { createHash, timingSafeEqual } from 'crypto';

export interface WebhookHandler {
  handleWebhook(payload: WebhookPayload): Promise<void>;
  verifySignature?(payload: any, signature: string, secret: string): boolean;
}

export class WebhookManager extends EventEmitter {
  private handlers = new Map<string, WebhookHandler>();
  private webhooks = new Map<string, WebhookConfig>();
  private storage: ConnectionStorage;

  constructor(storage: ConnectionStorage) {
    super();
    this.storage = storage;
  }

  registerHandler(integrationType: string, handler: WebhookHandler): void {
    this.handlers.set(integrationType, handler);
  }

  async registerWebhook(
    connectionId: string | number,
    config: WebhookConfig
  ): Promise<string> {
    const webhookId = this.generateWebhookId();
    
    // Store webhook config
    this.webhooks.set(webhookId, config);
    
    // Update connection with webhook info
    const connection = await this.storage.getConnection(connectionId);
    if (!connection) {
      throw new Error('Connection not found');
    }

    const webhookConfigs = (connection.config?.webhooks || []) as WebhookConfig[];
    webhookConfigs.push({ ...config, url: `${config.url}/${webhookId}` });
    
    await this.storage.updateConnection(connectionId, {
      config: {
        ...connection.config,
        webhooks: webhookConfigs,
      },
    });

    this.emit('webhook:registered', { connectionId, webhookId, config });
    
    return webhookId;
  }

  async unregisterWebhook(webhookId: string): Promise<void> {
    const config = this.webhooks.get(webhookId);
    if (!config) {
      throw new Error('Webhook not found');
    }

    this.webhooks.delete(webhookId);
    this.emit('webhook:unregistered', { webhookId });
  }

  async handleIncomingWebhook(
    webhookId: string,
    headers: Record<string, string>,
    body: any
  ): Promise<void> {
    const config = this.webhooks.get(webhookId);
    if (!config) {
      throw new Error('Webhook not found');
    }

    if (!config.active) {
      throw new Error('Webhook is not active');
    }

    // Verify signature if secret is configured
    if (config.secret) {
      const signature = headers['x-webhook-signature'] || 
                        headers['x-hub-signature-256'] || 
                        headers['x-signature'];
      
      if (!signature) {
        throw new Error('Missing webhook signature');
      }

      if (!this.verifySignature(body, signature, config.secret)) {
        throw new Error('Invalid webhook signature');
      }
    }

    const payload: WebhookPayload = {
      id: webhookId,
      event: headers['x-webhook-event'] || body.event || 'unknown',
      data: body,
      timestamp: new Date(),
      signature: headers['x-webhook-signature'],
    };

    // Find the appropriate handler based on the webhook config
    // This would need to be extended to map webhooks to connections and handlers
    
    this.emit('webhook:received', payload);
    
    // Process the webhook asynchronously
    setImmediate(() => this.processWebhook(payload, config));
  }

  private async processWebhook(
    payload: WebhookPayload,
    config: WebhookConfig
  ): Promise<void> {
    try {
      // Here you would:
      // 1. Find the connection associated with this webhook
      // 2. Get the appropriate handler for the integration type
      // 3. Process the webhook data
      
      this.emit('webhook:processed', { webhookId: payload.id, event: payload.event });
    } catch (error) {
      this.emit('webhook:error', { webhookId: payload.id, error });
      throw error;
    }
  }

  private verifySignature(
    payload: any,
    signature: string,
    secret: string
  ): boolean {
    // Support different signature formats
    let algorithm = 'sha256';
    let providedSignature = signature;

    // GitHub/HubSpot format: sha256=signature
    if (signature.includes('=')) {
      const parts = signature.split('=');
      algorithm = parts[0] || 'sha256';
      providedSignature = parts[1] || signature;
    }

    const hash = createHash(algorithm)
      .update(typeof payload === 'string' ? payload : JSON.stringify(payload))
      .digest('hex');

    try {
      return timingSafeEqual(
        Buffer.from(hash),
        Buffer.from(providedSignature)
      );
    } catch {
      return false;
    }
  }

  private generateWebhookId(): string {
    return `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getActiveWebhooks(): WebhookConfig[] {
    return Array.from(this.webhooks.values()).filter(w => w.active);
  }

  getWebhookConfig(webhookId: string): WebhookConfig | undefined {
    return this.webhooks.get(webhookId);
  }

  async pauseWebhook(webhookId: string): Promise<void> {
    const config = this.webhooks.get(webhookId);
    if (!config) {
      throw new Error('Webhook not found');
    }

    config.active = false;
    this.emit('webhook:paused', { webhookId });
  }

  async resumeWebhook(webhookId: string): Promise<void> {
    const config = this.webhooks.get(webhookId);
    if (!config) {
      throw new Error('Webhook not found');
    }

    config.active = true;
    this.emit('webhook:resumed', { webhookId });
  }
}