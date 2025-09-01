import { BaseConnector } from '../core/BaseConnector';
import type { 
  OAuth2Config, 
  ServiceMetadata,
  IntegrationError
} from '../types';
import { z } from 'zod';

// HubSpot specific configuration schema
export const hubspotConfigSchema = z.object({
  portalId: z.string().optional(),
  apiVersion: z.enum(['v3', 'v2', 'v1']).default('v3'),
  scopes: z.array(z.string()).default([
    'crm.objects.contacts.read',
    'crm.objects.contacts.write',
    'crm.objects.companies.read',
    'crm.objects.companies.write',
    'crm.objects.deals.read',
    'crm.objects.deals.write',
  ]),
  syncContacts: z.boolean().default(true),
  syncCompanies: z.boolean().default(true),
  syncDeals: z.boolean().default(true),
  webhookUrl: z.string().url().optional(),
});

export type HubSpotConfig = z.infer<typeof hubspotConfigSchema>;

export class HubSpotConnector extends BaseConnector {
  readonly serviceName = 'HubSpot';
  readonly authMethod = 'oauth2' as const;
  readonly scopes = [
    'crm.objects.contacts.read',
    'crm.objects.contacts.write',
    'crm.objects.companies.read',
    'crm.objects.companies.write',
    'crm.objects.deals.read',
    'crm.objects.deals.write',
    'crm.schemas.contacts.read',
    'crm.schemas.companies.read',
    'crm.schemas.deals.read',
    'oauth',
  ];

  readonly oauth2Config: OAuth2Config = {
    clientId: process.env.HUBSPOT_CLIENT_ID || '',
    clientSecret: process.env.HUBSPOT_CLIENT_SECRET || '',
    authorizationUrl: 'https://app.hubspot.com/oauth/authorize',
    tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
    redirectUri: process.env.HUBSPOT_REDIRECT_URI || 'http://localhost:3000/integrations/hubspot/callback',
    scopes: this.scopes,
    usePKCE: false, // HubSpot doesn't require PKCE
  };

  // Static metadata for registry
  static metadata = {
    name: 'HubSpot',
    description: 'Connect to HubSpot CRM for contact, company, and deal management',
    icon: 'hubspot',
    authMethod: 'oauth2' as const,
    configSchema: hubspotConfigSchema,
    documentationUrl: 'https://developers.hubspot.com/docs/api/oauth',
    capabilities: ['contacts', 'companies', 'deals', 'webhooks', 'custom-objects'],
  };

  private get config(): HubSpotConfig {
    return hubspotConfigSchema.parse(this.connection.config || {});
  }

  async testConnection(): Promise<boolean> {
    if (!this.connection.oauthAccessToken) return false;

    try {
      const response = await this.makeAuthenticatedRequest(
        'https://api.hubapi.com/oauth/v1/access-tokens/' + this.connection.oauthAccessToken
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  async getMetadata(): Promise<ServiceMetadata> {
    if (!this.connection.oauthAccessToken) {
      throw new Error('Not authenticated');
    }

    try {
      // Get account info
      const accountResponse = await this.makeAuthenticatedRequest(
        'https://api.hubapi.com/account-info/v3/details'
      );
      const accountData = await accountResponse.json() as any;

      // Get token info
      const tokenResponse = await this.makeAuthenticatedRequest(
        'https://api.hubapi.com/oauth/v1/access-tokens/' + this.connection.oauthAccessToken
      );
      const tokenData = await tokenResponse.json() as any;

      return {
        serviceName: 'HubSpot',
        serviceVersion: 'v3',
        accountId: accountData.portalId?.toString(),
        accountName: accountData.companyName,
        permissions: tokenData.scopes || [],
        limits: {
          rateLimit: 100, // HubSpot's default rate limit
        },
        lastSync: this.connection.updatedAt,
        syncStatus: 'active',
      };
    } catch (error) {
      throw new Error(`Failed to get metadata: ${error}`);
    }
  }

  // HubSpot-specific methods
  async getContacts(limit: number = 100, after?: string) {
    const params = new URLSearchParams({
      limit: limit.toString(),
      ...(after && { after }),
    });

    const response = await this.makeAuthenticatedRequest(
      `https://api.hubapi.com/crm/v3/objects/contacts?${params}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch contacts: ${response.statusText}`);
    }

    return response.json();
  }

  async getCompanies(limit: number = 100, after?: string) {
    const params = new URLSearchParams({
      limit: limit.toString(),
      ...(after && { after }),
    });

    const response = await this.makeAuthenticatedRequest(
      `https://api.hubapi.com/crm/v3/objects/companies?${params}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch companies: ${response.statusText}`);
    }

    return response.json();
  }

  async getDeals(limit: number = 100, after?: string) {
    const params = new URLSearchParams({
      limit: limit.toString(),
      ...(after && { after }),
    });

    const response = await this.makeAuthenticatedRequest(
      `https://api.hubapi.com/crm/v3/objects/deals?${params}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch deals: ${response.statusText}`);
    }

    return response.json();
  }

  async createContact(properties: Record<string, any>) {
    const response = await this.makeAuthenticatedRequest(
      'https://api.hubapi.com/crm/v3/objects/contacts',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ properties }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create contact: ${error}`);
    }

    return response.json();
  }

  async createWebhook(events: string[], url: string) {
    if (!this.config.portalId) {
      throw new Error('Portal ID not configured');
    }

    const response = await this.makeAuthenticatedRequest(
      `https://api.hubapi.com/webhooks/v3/${this.config.portalId}/subscriptions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventType: events[0], // HubSpot creates one subscription per event
          propertyName: '*',
          active: true,
          url,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create webhook: ${error}`);
    }

    return response.json();
  }

  async verifyWebhookSignature(
    payload: any,
    signature: string,
    secret: string
  ): Promise<boolean> {
    const crypto = await import('crypto');
    const hash = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    return hash === signature;
  }

  // Override refresh token to handle HubSpot's specific refresh response
  async refreshToken(): Promise<void> {
    if (!this.connection.oauthRefreshToken) {
      throw new Error('No refresh token available');
    }

    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: this.oauth2Config.clientId,
      client_secret: this.oauth2Config.clientSecret,
      refresh_token: this.connection.oauthRefreshToken,
    });

    const response = await fetch(this.oauth2Config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token refresh failed: ${error}`);
    }

    const data = await response.json() as any;
    
    await this.saveTokens({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    });

    this.emitIntegrationEvent('auth:refreshed', { connectionId: this.connection.id });
  }
}