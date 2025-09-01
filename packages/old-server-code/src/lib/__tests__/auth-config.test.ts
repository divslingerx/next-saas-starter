/**
 * Auth Config Tests
 * Tests for auth service config integration
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';

describe('Auth Service with Config', () => {
  const originalEnv = { ...process.env };
  
  beforeEach(() => {
    // Clear module cache
    delete require.cache[require.resolve('@/core/config')];
    delete require.cache[require.resolve('../auth')];
    
    // Set up test environment with required auth config
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = 'postgres://test';
    process.env.SESSION_SECRET = 'test-secret-at-least-32-characters-long';
    process.env.JWT_SECRET = 'test-jwt-secret-at-least-32-characters';
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_123';
    process.env.PORT = '3000';
    process.env.SERVER_URL = 'http://localhost:3000';
    process.env.BETTER_AUTH_URL = 'http://localhost:3000';
    process.env.EMAIL_FROM = 'test@example.com';
    process.env.EMAIL_PROVIDER = 'console';
  });
  
  afterEach(() => {
    process.env = originalEnv;
  });
  
  it('should use config values for auth setup', () => {
    const { config } = require('@/core/config');
    const authConfig = config.get('auth');
    
    expect(authConfig.baseUrl).toBe('http://localhost:3000');
    expect(authConfig.sessionExpiry).toBe(2592000); // 30 days in seconds
    expect(authConfig.trustedOrigins).toContain('http://localhost:5173');
  });
  
  it('should use config for Stripe integration', () => {
    const { config } = require('@/core/config');
    const stripeConfig = config.get('stripe');
    
    expect(stripeConfig.secretKey).toBe('sk_test_123');
    expect(stripeConfig.webhookSecret).toBe('whsec_test_123');
  });
  
  it('should conditionally enable social providers', () => {
    process.env.GOOGLE_CLIENT_ID = 'google_test_id';
    process.env.GOOGLE_CLIENT_SECRET = 'google_test_secret';
    
    // Clear cache to reload with new env
    delete require.cache[require.resolve('@/core/config')];
    
    const { config } = require('@/core/config');
    const authConfig = config.get('auth');
    
    expect(authConfig.google).toBeTruthy();
    expect(authConfig.google?.clientId).toBe('google_test_id');
    expect(authConfig.google?.clientSecret).toBe('google_test_secret');
  });
  
  it('should handle missing social provider config', () => {
    // No Google config set
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.GITHUB_CLIENT_ID;
    delete process.env.GITHUB_CLIENT_SECRET;
    
    // Clear cache to reload with new env
    delete require.cache[require.resolve('@/core/config')];
    
    const { config } = require('@/core/config');
    const authConfig = config.get('auth');
    
    expect(authConfig.google).toBeUndefined();
    expect(authConfig.github).toBeUndefined();
  });
  
  it('should use production settings when appropriate', () => {
    process.env.NODE_ENV = 'production';
    
    // Clear cache to reload with new env
    delete require.cache[require.resolve('@/core/config')];
    
    const { config } = require('@/core/config');
    
    expect(config.isProduction()).toBe(true);
    expect(config.isDevelopment()).toBe(false);
  });
  
  it('should handle auth rate limiting config', () => {
    const { config } = require('@/core/config');
    const rateLimitConfig = config.get('rateLimit');
    
    expect(rateLimitConfig.enabled).toBe(true);
    expect(rateLimitConfig.windowSeconds).toBe(60);
    expect(rateLimitConfig.maxRequests).toBe(100);
  });
  
  it('should provide email verification callback URL', () => {
    process.env.EMAIL_VERIFICATION_CALLBACK_URL = '/dashboard';
    
    // Clear cache to reload with new env
    delete require.cache[require.resolve('@/core/config')];
    
    const { config } = require('@/core/config');
    const authConfig = config.get('auth');
    
    expect(authConfig.emailVerificationCallbackUrl).toBe('/dashboard');
  });
});