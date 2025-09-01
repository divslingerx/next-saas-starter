/**
 * Configuration Service Integration Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';

describe('ConfigService Integration', () => {
  // Save original env
  const originalEnv = { ...process.env };
  
  beforeEach(() => {
    // Clear module cache to force reload
    delete require.cache[require.resolve('../index')];
    
    // Set up test environment
    process.env = {
      NODE_ENV: 'test',
      APP_NAME: 'TestApp',
      PORT: '4000',
      APP_URL: 'http://localhost:4000',
      DATABASE_URL: 'libsql://test-db',
      SESSION_SECRET: 'test-session-secret-32-characters-long!!',
      JWT_SECRET: 'test-jwt-secret-32-characters-long!!!!!',
      STRIPE_SECRET_KEY: 'sk_test_testkey',
      STRIPE_WEBHOOK_SECRET: 'whsec_testwebhook',
    };
  });
  
  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
  });
  
  it('should load configuration from environment variables', () => {
    const { config } = require('../index');
    
    const appConfig = config.get('app');
    expect(appConfig.name).toBe('TestApp');
    expect(appConfig.port).toBe(4000);
    expect(appConfig.url).toBe('http://localhost:4000');
  });
  
  it('should provide helper methods', () => {
    const { config } = require('../index');
    
    process.env.NODE_ENV = 'development';
    config.reload();
    expect(config.isDevelopment()).toBe(true);
    expect(config.isProduction()).toBe(false);
    
    process.env.NODE_ENV = 'production';
    config.reload();
    expect(config.isDevelopment()).toBe(false);
    expect(config.isProduction()).toBe(true);
  });
  
  it('should get all configuration', () => {
    const { config } = require('../index');
    
    const allConfig = config.getAll();
    expect(allConfig).toBeDefined();
    expect(allConfig.app).toBeDefined();
    expect(allConfig.database).toBeDefined();
    expect(allConfig.auth).toBeDefined();
  });
  
  it('should handle missing optional values', () => {
    delete process.env.RESEND_API_KEY;
    delete process.env.SMTP_HOST;
    
    const { config } = require('../index');
    config.reload();
    
    const emailConfig = config.get('email');
    expect(emailConfig.resendApiKey).toBeUndefined();
    expect(emailConfig.smtp?.host).toBeUndefined();
  });
  
  it('should use default values when env vars are not set', () => {
    delete process.env.DB_POOL_SIZE;
    delete process.env.TOKEN_EXPIRY;
    delete process.env.WAPPALYZER_MAX_DEPTH;
    
    const { config } = require('../index');
    config.reload();
    
    expect(config.get('database').poolSize).toBe(10);
    expect(config.get('auth').tokenExpiry).toBe(86400);
    expect(config.get('services').wappalyzer.maxDepth).toBe(1);
  });
  
  it('should parse boolean values correctly', () => {
    process.env.FEATURE_MAINTENANCE = 'true';
    process.env.FEATURE_DEBUG = 'false';
    process.env.STRIPE_ENABLED = 'false';
    
    const { config } = require('../index');
    config.reload();
    
    expect(config.get('features').maintenance).toBe(true);
    expect(config.get('features').debugMode).toBe(false);
    expect(config.get('stripe').enabled).toBe(false);
  });
  
  it('should be a singleton', () => {
    const { config: config1 } = require('../index');
    const { config: config2 } = require('../index');
    
    // Both should be the same instance
    expect(config1).toBe(config2);
  });
});