import { BaseConnector } from '../core/BaseConnector';
import type { ServiceMetadata, OAuth2Config } from '../types';

export interface MockConnectorConfig {
  serviceName?: string;
  authMethod?: 'oauth2' | 'apikey' | 'basic' | 'custom';
  shouldFailAuth?: boolean;
  shouldFailTest?: boolean;
  shouldFailRefresh?: boolean;
  mockData?: any;
  delay?: number;
}

export class MockConnector extends BaseConnector {
  readonly serviceName: string;
  readonly authMethod: 'oauth2' | 'apikey' | 'basic' | 'custom';
  readonly scopes = ['read', 'write'];
  readonly oauth2Config: OAuth2Config = {
    clientId: 'mock_client_id',
    clientSecret: 'mock_client_secret',
    authorizationUrl: 'https://mock.example.com/oauth/authorize',
    tokenUrl: 'https://mock.example.com/oauth/token',
    redirectUri: 'http://localhost:3000/integrations/mock/callback',
    scopes: this.scopes,
    usePKCE: true,
  };

  private config: MockConnectorConfig;

  constructor(connection: any, storage: any, config: MockConnectorConfig = {}) {
    super(connection, storage);
    this.config = config;
    this.serviceName = config.serviceName || 'MockService';
    this.authMethod = config.authMethod || 'oauth2';
  }

  static metadata = {
    name: 'Mock Service',
    description: 'A mock service for testing',
    icon: 'test',
    authMethod: 'oauth2' as const,
    documentationUrl: 'https://example.com/docs',
    capabilities: ['test'],
  };

  private async delay(): Promise<void> {
    if (this.config.delay) {
      await new Promise(resolve => setTimeout(resolve, this.config.delay));
    }
  }

  async testConnection(): Promise<boolean> {
    await this.delay();
    
    if (this.config.shouldFailTest) {
      return false;
    }
    
    return !!this.connection.oauthAccessToken || !!this.connection.apiKey;
  }

  async getMetadata(): Promise<ServiceMetadata> {
    await this.delay();
    
    return {
      serviceName: this.serviceName,
      serviceVersion: '1.0.0',
      accountId: 'mock_account_123',
      accountName: 'Mock Account',
      permissions: ['read', 'write'],
      limits: {
        rateLimit: 100,
        quotaUsed: 50,
        quotaTotal: 1000,
      },
      lastSync: new Date(),
      syncStatus: 'active',
    };
  }

  async getAuthorizationUrl(): Promise<string | null> {
    if (this.authMethod !== 'oauth2') {
      return null;
    }

    if (this.config.shouldFailAuth) {
      throw new Error('Mock auth failure');
    }

    await this.delay();
    
    const state = this.generateState();
    const { codeChallenge } = this.generatePKCE();
    
    return `${this.oauth2Config.authorizationUrl}?client_id=${this.oauth2Config.clientId}&state=${state.state}&code_challenge=${codeChallenge}`;
  }

  async handleOAuth2Callback(params: Record<string, any>): Promise<void> {
    await this.delay();
    
    if (this.config.shouldFailAuth) {
      throw new Error('Mock callback failure');
    }

    // Simulate successful OAuth flow
    this.connection.oauthAccessToken = 'mock_access_token_' + Date.now();
    this.connection.oauthRefreshToken = 'mock_refresh_token_' + Date.now();
    this.connection.oauthExpiresAt = new Date(Date.now() + 3600000); // 1 hour
    
    await this.storage.saveConnection(this.connection);
    await this.emit('auth:completed', { connectionId: this.connection.id });
  }

  async refreshToken(): Promise<void> {
    await this.delay();
    
    if (this.config.shouldFailRefresh) {
      throw new Error('Mock refresh failure');
    }

    if (!this.connection.oauthRefreshToken) {
      throw new Error('No refresh token');
    }

    // Simulate token refresh
    this.connection.oauthAccessToken = 'mock_refreshed_token_' + Date.now();
    this.connection.oauthExpiresAt = new Date(Date.now() + 3600000);
    
    await this.storage.saveConnection(this.connection);
    await this.emit('auth:refreshed', { connectionId: this.connection.id });
  }

  // Mock data methods
  async getMockData(): Promise<any> {
    await this.delay();
    return this.config.mockData || { 
      items: [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
      ] 
    };
  }

  async createMockItem(data: any): Promise<any> {
    await this.delay();
    return { id: Date.now(), ...data };
  }

  async updateMockItem(id: string | number, data: any): Promise<any> {
    await this.delay();
    return { id, ...data, updated: true };
  }

  async deleteMockItem(id: string | number): Promise<boolean> {
    await this.delay();
    return true;
  }
}