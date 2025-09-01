/**
 * Configuration Schema
 * Defines and validates all application configuration
 */

import { z } from 'zod';

export const configSchema = z.object({
  app: z.object({
    name: z.string().default('BunCrawler'),
    env: z.enum(['development', 'staging', 'production', 'test']).default('development'),
    port: z.number().min(1).max(65535),
    url: z.string().url(),
  }),
  
  database: z.object({
    url: z.string().min(1),
    poolSize: z.number().min(1).max(100).default(10),
    debug: z.boolean().default(false),
  }),
  
  auth: z.object({
    sessionSecret: z.string().min(32),
    jwtSecret: z.string().min(32),
    tokenExpiry: z.number().positive().default(86400), // 24 hours in seconds
    sessionExpiry: z.number().positive().default(2592000), // 30 days in seconds
    bcryptRounds: z.number().min(10).max(15).default(12),
    baseUrl: z.string().url().optional(),
    trustedOrigins: z.array(z.string()).default([
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
    ]),
    emailVerificationCallbackUrl: z.string().optional(),
    google: z.object({
      clientId: z.string(),
      clientSecret: z.string(),
    }).optional(),
    github: z.object({
      clientId: z.string(),
      clientSecret: z.string(),
    }).optional(),
  }),
  
  stripe: z.object({
    secretKey: z.string().startsWith('sk_'),
    webhookSecret: z.string().startsWith('whsec_'),
    enabled: z.boolean().default(true),
  }),
  
  services: z.object({
    wappalyzer: z.object({
      maxDepth: z.number().min(1).max(5).default(1),
      maxUrls: z.number().min(1).max(20).default(5),
      timeout: z.number().min(5000).max(60000).default(10000),
      enabled: z.boolean().default(true),
    }),
    lighthouse: z.object({
      timeout: z.number().min(10000).max(120000).default(30000),
      enabled: z.boolean().default(true),
    }),
    axe: z.object({
      timeout: z.number().min(5000).max(60000).default(15000),
      enabled: z.boolean().default(true),
    }),
  }),
  
  email: z.object({
    provider: z.enum(['resend', 'smtp', 'console']).default('console'),
    from: z.string().email(),
    resendApiKey: z.string().optional(),
    smtp: z.object({
      host: z.string().optional(),
      port: z.number().min(1).max(65535).optional(),
      secure: z.boolean().optional(),
      user: z.string().optional(),
      pass: z.string().optional(),
    }).optional(),
  }),
  
  // Environment-based feature flags (system features)
  features: z.object({
    maintenance: z.boolean().default(false),
    debugMode: z.boolean().default(false),
    apiDocs: z.boolean().default(true),
    publicSignup: z.boolean().default(true),
    rateLimiting: z.boolean().default(true),
    logging: z.boolean().default(true),
  }),
  
  // Rate limiting configuration
  rateLimit: z.object({
    enabled: z.boolean().default(true),
    windowMs: z.number().min(1000).default(60000), // 1 minute
    windowSeconds: z.number().min(1).default(60), // 60 seconds
    maxRequests: z.number().min(1).default(100),
  }),
});

export type Config = z.infer<typeof configSchema>;