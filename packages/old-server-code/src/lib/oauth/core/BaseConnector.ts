import { EventEmitter } from 'events';
import type {
  ConnectionData,
  AuthMethod,
  ServiceMetadata,
  TokenSet,
  OAuth2Config,
  OAuth2State,
  IntegrationEvent,
  IntegrationEventType
} from '../types';
import {
  TokenExpiredError,
  RateLimitError,
  IntegrationError
} from '../types';
import type { ConnectionStorage } from '../storage/ConnectionStorage';
import { createHash, randomBytes } from 'crypto';

export abstract class BaseConnector extends EventEmitter {
  protected connection: ConnectionData;
  protected storage: ConnectionStorage;
  protected oauth2State?: OAuth2State;
  
  // Abstract properties that subclasses must define
  abstract readonly serviceName: string;
  abstract readonly authMethod: AuthMethod;
  abstract readonly scopes?: string[];
  abstract readonly oauth2Config?: OAuth2Config;

  constructor(connection: ConnectionData, storage: ConnectionStorage) {
    super();
    this.connection = connection;
    this.storage = storage;
  }

  // Core abstract methods
  abstract testConnection(): Promise<boolean>;
  abstract getMetadata(): Promise<ServiceMetadata>;
  
  // OAuth2 specific methods (optional for non-OAuth2 connectors)
  async getAuthorizationUrl(): Promise<string | null> {
    if (this.authMethod !== 'oauth2' || !this.oauth2Config) {
      return null;
    }

    const state = this.generateState();
    const params = new URLSearchParams({
      client_id: this.oauth2Config.clientId,
      redirect_uri: this.oauth2Config.redirectUri,
      response_type: 'code',
      scope: this.oauth2Config.scopes.join(' '),
      state: state.state,
      ...this.oauth2Config.additionalParams
    });

    // Add PKCE if enabled
    if (this.oauth2Config.usePKCE) {
      const { codeChallenge, codeVerifier } = this.generatePKCE();
      state.codeVerifier = codeVerifier;
      state.codeChallenge = codeChallenge;
      params.append('code_challenge', codeChallenge);
      params.append('code_challenge_method', 'S256');
    }

    this.oauth2State = state;
    this.emitIntegrationEvent('auth:started', { connectionId: this.connection.id, service: this.serviceName });

    return `${this.oauth2Config.authorizationUrl}?${params.toString()}`;
  }

  async handleOAuth2Callback(params: Record<string, any>): Promise<void> {
    if (this.authMethod !== 'oauth2' || !this.oauth2Config) {
      throw new IntegrationError('Not an OAuth2 connector', 'INVALID_AUTH_METHOD');
    }

    // Verify state
    if (!this.oauth2State || params.state !== this.oauth2State.state) {
      throw new IntegrationError('Invalid state parameter', 'INVALID_STATE', 400);
    }

    if (params.error) {
      const error = new IntegrationError(
        params.error_description || params.error,
        'OAUTH_ERROR',
        400
      );
      this.emitIntegrationEvent('auth:failed', { connectionId: this.connection.id, error });
      throw error;
    }

    const code = params.code;
    if (!code) {
      throw new IntegrationError('No authorization code received', 'NO_CODE', 400);
    }

    try {
      const tokens = await this.exchangeCodeForToken(code);
      await this.saveTokens(tokens);
      this.emitIntegrationEvent('auth:completed', { connectionId: this.connection.id, tokens });
    } catch (error) {
      this.emitIntegrationEvent('auth:failed', { connectionId: this.connection.id, error });
      throw error;
    }
  }

  protected async exchangeCodeForToken(code: string): Promise<TokenSet> {
    if (!this.oauth2Config) {
      throw new IntegrationError('OAuth2 config not defined', 'NO_CONFIG');
    }

    const params: Record<string, string> = {
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.oauth2Config.redirectUri,
      client_id: this.oauth2Config.clientId,
      client_secret: this.oauth2Config.clientSecret,
    };

    // Add PKCE verifier if used
    if (this.oauth2State?.codeVerifier) {
      params.code_verifier = this.oauth2State.codeVerifier;
    }

    const response = await fetch(this.oauth2Config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(params),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new IntegrationError(`Token exchange failed: ${error}`, 'TOKEN_EXCHANGE_FAILED', response.status);
    }

    const data = await response.json() as any;
    
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
      tokenType: data.token_type,
      scope: data.scope,
    };
  }

  async refreshToken(): Promise<void> {
    if (this.authMethod !== 'oauth2' || !this.oauth2Config) {
      return;
    }

    if (!this.connection.oauthRefreshToken) {
      throw new TokenExpiredError('No refresh token available');
    }

    try {
      const response = await fetch(this.oauth2Config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.connection.oauthRefreshToken,
          client_id: this.oauth2Config.clientId,
          client_secret: this.oauth2Config.clientSecret,
        }),
      });

      if (!response.ok) {
        throw new TokenExpiredError('Token refresh failed');
      }

      const data = await response.json() as any;
      const tokens: TokenSet = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || this.connection.oauthRefreshToken,
        expiresIn: data.expires_in,
        expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
      };

      await this.saveTokens(tokens);
      this.emitIntegrationEvent('auth:refreshed', { connectionId: this.connection.id });
    } catch (error) {
      this.emitIntegrationEvent('error:occurred', { connectionId: this.connection.id, error });
      throw error;
    }
  }

  async revokeAccess(): Promise<void> {
    // Subclasses can override this for service-specific revocation
    this.connection.oauthAccessToken = undefined;
    this.connection.oauthRefreshToken = undefined;
    this.connection.oauthExpiresAt = undefined;
    await this.storage.saveConnection(this.connection);
    this.emitIntegrationEvent('auth:revoked', { connectionId: this.connection.id });
  }

  protected async saveTokens(tokens: TokenSet): Promise<void> {
    this.connection.oauthAccessToken = tokens.accessToken;
    this.connection.oauthRefreshToken = tokens.refreshToken;
    this.connection.oauthExpiresAt = tokens.expiresAt;
    await this.storage.saveConnection(this.connection);
  }

  protected generateState(): OAuth2State {
    return {
      state: randomBytes(32).toString('hex'),
      nonce: randomBytes(16).toString('hex'),
    };
  }

  protected generatePKCE(): { codeVerifier: string; codeChallenge: string } {
    const codeVerifier = randomBytes(32).toString('base64url');
    const codeChallenge = createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');
    
    return { codeVerifier, codeChallenge };
  }

  protected async makeAuthenticatedRequest(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    // Check if token needs refresh
    if (this.connection.oauthExpiresAt && this.connection.oauthExpiresAt < new Date()) {
      await this.refreshToken();
    }

    const headers = new Headers(options.headers);
    
    if (this.authMethod === 'oauth2' && this.connection.oauthAccessToken) {
      headers.set('Authorization', `Bearer ${this.connection.oauthAccessToken}`);
    } else if (this.authMethod === 'apikey' && this.connection.apiKey) {
      headers.set('Authorization', `Bearer ${this.connection.apiKey}`);
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle common errors
    if (response.status === 401) {
      if (this.authMethod === 'oauth2') {
        await this.refreshToken();
        // Retry once after refresh
        return this.makeAuthenticatedRequest(url, options);
      }
      throw new TokenExpiredError();
    }

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      throw new RateLimitError('Rate limit exceeded', retryAfter ? parseInt(retryAfter) : undefined);
    }

    return response;
  }

  protected emitIntegrationEvent(event: IntegrationEventType, data: any): void {
    const integrationEvent: IntegrationEvent = {
      connectionId: this.connection.id,
      eventType: event,
      timestamp: new Date(),
      data: data.data,
      error: data.error,
    };
    
    super.emit(event, integrationEvent);
    super.emit('event', integrationEvent); // Emit a generic event for logging
  }
}