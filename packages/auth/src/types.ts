/**
 * Common types for auth package
 */

import type { Context } from 'hono';

/**
 * OAuth provider configuration base
 */
export interface OAuthProviderConfig {
  clientId: string;
  clientSecret: string;
  redirectUri?: string;
  scopes?: string[];
}

/**
 * OAuth tokens response
 */
export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
  scope?: string;
}

/**
 * Provider connection status
 */
export interface ProviderConnection {
  providerId: string;
  connected: boolean;
  userId: string;
  accountId?: string;
  accountEmail?: string;
  scopes?: string[];
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

/**
 * Common middleware context additions
 */
export interface AuthenticatedContext {
  userId: string;
  sessionId: string;
  organizationId?: string;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  metadata?: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  };
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
  after?: string;
  before?: string;
}

/**
 * Sort parameters
 */
export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc' | 'ascending' | 'descending';
}

/**
 * Filter parameters
 */
export interface FilterParams {
  filters?: Record<string, any>;
  search?: string;
  query?: string;
}