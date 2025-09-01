/**
 * Configuration Service
 * Loads and validates configuration from environment variables
 */

import { configSchema, type Config } from './config.schema';
import { z } from 'zod';

class ConfigService {
  private config: Config;
  private static instance: ConfigService;
  
  constructor() {
    this.config = this.load();
  }
  
  /**
   * Load and validate configuration from environment variables
   */
  private load(): Config {
    try {
      const config = configSchema.parse({
        app: {
          name: process.env.APP_NAME || 'BunCrawler',
          env: process.env.NODE_ENV || 'development',
          port: parseInt(process.env.PORT || '3000', 10),
          url: process.env.APP_URL || 'http://localhost:3000',
        },
        
        database: {
          url: process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL || '',
          poolSize: parseInt(process.env.DB_POOL_SIZE || '10', 10),
          debug: process.env.DB_DEBUG === 'true',
        },
        
        auth: {
          sessionSecret: process.env.SESSION_SECRET || process.env.BETTER_AUTH_SECRET || 'development-secret-change-in-production-32chars',
          jwtSecret: process.env.JWT_SECRET || process.env.BETTER_AUTH_SECRET || 'development-secret-change-in-production-32chars',
          tokenExpiry: parseInt(process.env.TOKEN_EXPIRY || '86400', 10),
          sessionExpiry: parseInt(process.env.SESSION_EXPIRY || '2592000', 10),
          bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
          baseUrl: process.env.BETTER_AUTH_URL || process.env.SERVER_URL || 'http://localhost:3000',
          trustedOrigins: process.env.TRUSTED_ORIGINS ? process.env.TRUSTED_ORIGINS.split(',') : [
            'http://localhost:5173',
            'http://localhost:5174',
            'http://localhost:3000',
          ],
          emailVerificationCallbackUrl: process.env.EMAIL_VERIFICATION_CALLBACK_URL,
          google: process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          } : undefined,
          github: process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET ? {
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
          } : undefined,
        },
        
        stripe: {
          secretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_dummy',
          webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_dummy',
          enabled: process.env.STRIPE_ENABLED !== 'false',
        },
        
        services: {
          wappalyzer: {
            maxDepth: parseInt(process.env.WAPPALYZER_MAX_DEPTH || '1', 10),
            maxUrls: parseInt(process.env.WAPPALYZER_MAX_URLS || '5', 10),
            timeout: parseInt(process.env.WAPPALYZER_TIMEOUT || '10000', 10),
            enabled: process.env.WAPPALYZER_ENABLED !== 'false',
          },
          lighthouse: {
            timeout: parseInt(process.env.LIGHTHOUSE_TIMEOUT || '30000', 10),
            enabled: process.env.LIGHTHOUSE_ENABLED !== 'false',
          },
          axe: {
            timeout: parseInt(process.env.AXE_TIMEOUT || '15000', 10),
            enabled: process.env.AXE_ENABLED !== 'false',
          },
        },
        
        email: {
          provider: (process.env.EMAIL_PROVIDER as 'resend' | 'smtp' | 'console') || 'console',
          from: process.env.EMAIL_FROM || 'noreply@buncrawler.com',
          resendApiKey: process.env.RESEND_API_KEY,
          smtp: {
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
            secure: process.env.SMTP_SECURE === 'true',
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        },
        
        features: {
          maintenance: process.env.FEATURE_MAINTENANCE === 'true',
          debugMode: process.env.FEATURE_DEBUG === 'true',
          apiDocs: process.env.FEATURE_API_DOCS !== 'false',
          publicSignup: process.env.FEATURE_PUBLIC_SIGNUP !== 'false',
          rateLimiting: process.env.FEATURE_RATE_LIMITING !== 'false',
          logging: process.env.FEATURE_LOGGING !== 'false',
        },
        
        rateLimit: {
          enabled: process.env.RATE_LIMIT_ENABLED !== 'false',
          windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
          windowSeconds: parseInt(process.env.RATE_LIMIT_WINDOW_SECONDS || '60', 10),
          maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
        },
      });
      
      // Log successful config load in development
      if (config.app.env === 'development') {
        console.log('✅ Configuration loaded successfully');
      }
      
      return config;
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('❌ Configuration validation failed:');
        error.issues.forEach((err) => {
          console.error(`  - ${err.path.join('.')}: ${err.message}`);
        });
      } else {
        console.error('❌ Failed to load configuration:', error);
      }
      
      // In production, fail fast
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
      
      // In development, throw to help debugging
      throw new Error('Invalid configuration. Please check your environment variables.');
    }
  }
  
  /**
   * Get a specific configuration section
   */
  get<K extends keyof Config>(key: K): Config[K] {
    return this.config[key];
  }
  
  /**
   * Get the entire configuration
   */
  getAll(): Config {
    return this.config;
  }
  
  /**
   * Check if running in development
   */
  isDevelopment(): boolean {
    return this.config.app.env === 'development';
  }
  
  /**
   * Check if running in production
   */
  isProduction(): boolean {
    return this.config.app.env === 'production';
  }
  
  /**
   * Check if running in staging
   */
  isStaging(): boolean {
    return this.config.app.env === 'staging';
  }
  
  /**
   * Check if running in test
   */
  isTest(): boolean {
    return this.config.app.env === 'test';
  }
  
  /**
   * Get singleton instance
   */
  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }
  
  /**
   * Reload configuration (useful for testing)
   */
  reload(): void {
    this.config = this.load();
  }
}

// Export singleton instance
export const config = ConfigService.getInstance();

// Export types
export type { Config } from './config.schema';