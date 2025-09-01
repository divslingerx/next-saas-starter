import { z } from "zod";

// Core connection types
export interface ConnectionData {
  id: string | number;
  propertyId: string | number;
  integrationType: string;
  name?: string;
  oauthAccessToken?: string;
  oauthRefreshToken?: string;
  oauthExpiresAt?: Date;
  apiKey?: string;
  apiSecret?: string;
  config?: Record<string, unknown>;
  metadata?: ServiceMetadata;
  createdAt?: Date;
  updatedAt?: Date;
}

// OAuth2 specific types
export interface OAuth2Config {
  clientId: string;
  clientSecret: string;
  authorizationUrl: string;
  tokenUrl: string;
  redirectUri: string;
  scopes: string[];
  usePKCE?: boolean;
  additionalParams?: Record<string, string>;
}

export interface TokenSet {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  expiresAt?: Date;
  tokenType?: string;
  scope?: string;
}

export interface OAuth2State {
  state: string;
  codeVerifier?: string;
  codeChallenge?: string;
  nonce?: string;
  returnUrl?: string;
}

// Service metadata
export interface ServiceMetadata {
  serviceName: string;
  serviceVersion?: string;
  accountId?: string;
  accountName?: string;
  permissions?: string[];
  limits?: {
    rateLimit?: number;
    quotaUsed?: number;
    quotaTotal?: number;
  };
  lastSync?: Date;
  syncStatus?: 'active' | 'paused' | 'error';
}

// Auth methods
export type AuthMethod = 'oauth2' | 'apikey' | 'basic' | 'custom';

// Event types
export interface IntegrationEvent {
  connectionId: string | number;
  eventType: string;
  timestamp: Date;
  data?: any;
  error?: Error;
}

export type IntegrationEventType = 
  | 'auth:started'
  | 'auth:completed'
  | 'auth:failed'
  | 'auth:refreshed'
  | 'auth:revoked'
  | 'data:fetched'
  | 'data:synced'
  | 'webhook:received'
  | 'error:occurred';

// Webhook types
export interface WebhookConfig {
  url: string;
  events: string[];
  secret?: string;
  active: boolean;
}

export interface WebhookPayload {
  id: string;
  event: string;
  data: any;
  timestamp: Date;
  signature?: string;
}

// Error types
export class IntegrationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public retryable: boolean = false,
    public details?: any
  ) {
    super(message);
    this.name = 'IntegrationError';
  }
}

export class TokenExpiredError extends IntegrationError {
  constructor(message = 'Token expired') {
    super(message, 'TOKEN_EXPIRED', 401, true);
  }
}

export class RateLimitError extends IntegrationError {
  constructor(message = 'Rate limit exceeded', public retryAfter?: number) {
    super(message, 'RATE_LIMIT', 429, true);
  }
}

// Configuration schemas
export const baseConfigSchema = z.object({
  enabled: z.boolean().default(true),
  syncInterval: z.number().optional(),
  retryAttempts: z.number().default(3),
  timeout: z.number().default(30000),
});

export type BaseConfig = z.infer<typeof baseConfigSchema>;