/**
 * Configuration Service Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { configSchema } from '../config.schema';

describe('Configuration Schema', () => {
  // Save original env
  const originalEnv = process.env;
  
  beforeEach(() => {
    // Reset env for each test
    process.env = { ...originalEnv };
  });
  
  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
  });
  
  describe('App Configuration', () => {
    it('should validate valid app config', () => {
      const config = {
        app: {
          name: 'TestApp',
          env: 'development' as const,
          port: 3000,
          url: 'http://localhost:3000',
        },
      };
      
      const result = configSchema.shape.app.parse(config.app);
      expect(result).toEqual(config.app);
    });
    
    it('should reject invalid port', () => {
      const config = {
        app: {
          name: 'TestApp',
          env: 'development' as const,
          port: 70000, // Invalid port
          url: 'http://localhost:3000',
        },
      };
      
      expect(() => configSchema.shape.app.parse(config.app)).toThrow();
    });
    
    it('should reject invalid environment', () => {
      const config = {
        app: {
          name: 'TestApp',
          env: 'invalid' as any,
          port: 3000,
          url: 'http://localhost:3000',
        },
      };
      
      expect(() => configSchema.shape.app.parse(config.app)).toThrow();
    });
    
    it('should reject invalid URL', () => {
      const config = {
        app: {
          name: 'TestApp',
          env: 'development' as const,
          port: 3000,
          url: 'not-a-url',
        },
      };
      
      expect(() => configSchema.shape.app.parse(config.app)).toThrow();
    });
  });
  
  describe('Database Configuration', () => {
    it('should validate valid database config', () => {
      const config = {
        database: {
          url: 'postgresql://user:pass@localhost:5432/db',
          poolSize: 20,
          debug: true,
        },
      };
      
      const result = configSchema.shape.database.parse(config.database);
      expect(result).toEqual(config.database);
    });
    
    it('should use default pool size', () => {
      const config = {
        database: {
          url: 'postgresql://user:pass@localhost:5432/db',
        },
      };
      
      const result = configSchema.shape.database.parse(config.database);
      expect(result.poolSize).toBe(10);
      expect(result.debug).toBe(false);
    });
    
    it('should reject empty database URL', () => {
      const config = {
        database: {
          url: '',
        },
      };
      
      expect(() => configSchema.shape.database.parse(config.database)).toThrow();
    });
  });
  
  describe('Auth Configuration', () => {
    it('should validate valid auth config', () => {
      const config = {
        auth: {
          sessionSecret: 'a'.repeat(32),
          jwtSecret: 'b'.repeat(32),
          tokenExpiry: 3600,
          bcryptRounds: 12,
        },
      };
      
      const result = configSchema.shape.auth.parse(config.auth);
      expect(result.sessionSecret).toEqual(config.auth.sessionSecret);
      expect(result.jwtSecret).toEqual(config.auth.jwtSecret);
      expect(result.tokenExpiry).toEqual(config.auth.tokenExpiry);
      expect(result.bcryptRounds).toEqual(config.auth.bcryptRounds);
      // Check that defaults are added
      expect(result.sessionExpiry).toBe(2592000);
      expect(result.trustedOrigins).toEqual(['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000']);
    });
    
    it('should reject short secrets', () => {
      const config = {
        auth: {
          sessionSecret: 'too-short',
          jwtSecret: 'also-too-short',
        },
      };
      
      expect(() => configSchema.shape.auth.parse(config.auth)).toThrow();
    });
    
    it('should use default values', () => {
      const config = {
        auth: {
          sessionSecret: 'a'.repeat(32),
          jwtSecret: 'b'.repeat(32),
        },
      };
      
      const result = configSchema.shape.auth.parse(config.auth);
      expect(result.tokenExpiry).toBe(86400);
      expect(result.bcryptRounds).toBe(12);
    });
  });
  
  describe('Stripe Configuration', () => {
    it('should validate valid Stripe config', () => {
      const config = {
        stripe: {
          secretKey: 'sk_test_123456789',
          webhookSecret: 'whsec_123456789',
          enabled: true,
        },
      };
      
      const result = configSchema.shape.stripe.parse(config.stripe);
      expect(result).toEqual(config.stripe);
    });
    
    it('should reject invalid secret key format', () => {
      const config = {
        stripe: {
          secretKey: 'invalid_key',
          webhookSecret: 'whsec_123456789',
        },
      };
      
      expect(() => configSchema.shape.stripe.parse(config.stripe)).toThrow();
    });
    
    it('should reject invalid webhook secret format', () => {
      const config = {
        stripe: {
          secretKey: 'sk_test_123456789',
          webhookSecret: 'invalid_webhook',
        },
      };
      
      expect(() => configSchema.shape.stripe.parse(config.stripe)).toThrow();
    });
  });
  
  describe('Service Configuration', () => {
    it('should validate valid service config', () => {
      const config = {
        services: {
          wappalyzer: {
            maxDepth: 2,
            maxUrls: 10,
            timeout: 15000,
            enabled: true,
          },
          lighthouse: {
            timeout: 45000,
            enabled: true,
          },
          axe: {
            timeout: 20000,
            enabled: false,
          },
        },
      };
      
      const result = configSchema.shape.services.parse(config.services);
      expect(result).toEqual(config.services);
    });
    
    it('should use default values', () => {
      const config = {
        services: {
          wappalyzer: {},
          lighthouse: {},
          axe: {},
        },
      };
      
      const result = configSchema.shape.services.parse(config.services);
      expect(result.wappalyzer.maxDepth).toBe(1);
      expect(result.wappalyzer.maxUrls).toBe(5);
      expect(result.lighthouse.timeout).toBe(30000);
      expect(result.axe.enabled).toBe(true);
    });
    
    it('should reject invalid timeout values', () => {
      const config = {
        services: {
          wappalyzer: {
            timeout: 1000, // Too low
          },
          lighthouse: {},
          axe: {},
        },
      };
      
      expect(() => configSchema.shape.services.parse(config.services)).toThrow();
    });
  });
  
  describe('Email Configuration', () => {
    it('should validate valid email config', () => {
      const config = {
        email: {
          provider: 'resend' as const,
          from: 'test@example.com',
          resendApiKey: 're_123456789',
        },
      };
      
      const result = configSchema.shape.email.parse(config.email);
      expect(result).toEqual(config.email);
    });
    
    it('should validate SMTP config', () => {
      const config = {
        email: {
          provider: 'smtp' as const,
          from: 'test@example.com',
          smtp: {
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            user: 'user@gmail.com',
            pass: 'password',
          },
        },
      };
      
      const result = configSchema.shape.email.parse(config.email);
      expect(result).toEqual(config.email);
    });
    
    it('should reject invalid email address', () => {
      const config = {
        email: {
          provider: 'console' as const,
          from: 'not-an-email',
        },
      };
      
      expect(() => configSchema.shape.email.parse(config.email)).toThrow();
    });
  });
  
  describe('Feature Flags', () => {
    it('should validate feature flags', () => {
      const config = {
        features: {
          maintenance: true,
          debugMode: false,
          apiDocs: true,
          publicSignup: false,
          rateLimiting: true,
          logging: true,
        },
      };
      
      const result = configSchema.shape.features.parse(config.features);
      expect(result).toEqual(config.features);
    });
    
    it('should use default values', () => {
      const config = {
        features: {},
      };
      
      const result = configSchema.shape.features.parse(config.features);
      expect(result.maintenance).toBe(false);
      expect(result.apiDocs).toBe(true);
      expect(result.publicSignup).toBe(true);
    });
  });
  
  describe('Full Configuration', () => {
    it('should validate a complete valid configuration', () => {
      const fullConfig = {
        app: {
          name: 'BunCrawler',
          env: 'development' as const,
          port: 3000,
          url: 'http://localhost:3000',
        },
        database: {
          url: 'postgresql://localhost:5432/test',
          poolSize: 10,
          debug: false,
        },
        auth: {
          sessionSecret: 'a'.repeat(32),
          jwtSecret: 'b'.repeat(32),
          tokenExpiry: 86400,
          bcryptRounds: 12,
        },
        stripe: {
          secretKey: 'sk_test_123',
          webhookSecret: 'whsec_123',
          enabled: true,
        },
        services: {
          wappalyzer: {
            maxDepth: 1,
            maxUrls: 5,
            timeout: 10000,
            enabled: true,
          },
          lighthouse: {
            timeout: 30000,
            enabled: true,
          },
          axe: {
            timeout: 15000,
            enabled: true,
          },
        },
        email: {
          provider: 'console' as const,
          from: 'test@example.com',
        },
        features: {
          maintenance: false,
          debugMode: false,
          apiDocs: true,
          publicSignup: true,
          rateLimiting: true,
          logging: true,
        },
        rateLimit: {
          enabled: true,
          windowMs: 60000,
          maxRequests: 100,
        },
      };
      
      const result = configSchema.parse(fullConfig);
      expect(result).toBeDefined();
      expect(result.app.name).toBe('BunCrawler');
    });
  });
});