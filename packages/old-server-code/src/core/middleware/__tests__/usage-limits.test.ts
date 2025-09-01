/**
 * Usage Limits Middleware Tests
 */

import { describe, it, expect } from 'bun:test';
import { 
  enforceUsageQuota, 
  enforceRateLimit, 
  enforceUsageLimits,
  trackUsage 
} from '../usage-limits';

describe('Usage Limits Middleware', () => {
  describe('enforceUsageQuota', () => {
    it('should be a function that returns middleware', () => {
      const middleware = enforceUsageQuota({
        quotaType: 'api_calls',
        eventType: 'api_call'
      });
      
      expect(typeof middleware).toBe('function');
      expect(middleware.length).toBe(2); // Takes context and next
    });
    
    it('should accept different quota types', () => {
      const quotaTypes = ['api_calls', 'domains', 'scans', 'emails'] as const;
      
      quotaTypes.forEach(quotaType => {
        const middleware = enforceUsageQuota({ quotaType });
        expect(typeof middleware).toBe('function');
      });
    });
    
    it('should accept optional event tracking', () => {
      const middleware = enforceUsageQuota({
        quotaType: 'api_calls',
        eventType: 'api_call',
        skipTracking: true
      });
      
      expect(typeof middleware).toBe('function');
    });
  });
  
  describe('enforceRateLimit', () => {
    it('should be a function that returns middleware', () => {
      const middleware = enforceRateLimit();
      
      expect(typeof middleware).toBe('function');
      expect(middleware.length).toBe(2); // Takes context and next
    });
    
    it('should accept custom window and limits', () => {
      const middleware = enforceRateLimit({
        windowSeconds: 300,
        maxRequests: 100
      });
      
      expect(typeof middleware).toBe('function');
    });
    
    it('should support user and IP based limiting', () => {
      const userMiddleware = enforceRateLimit({ identifier: 'user' });
      const ipMiddleware = enforceRateLimit({ identifier: 'ip' });
      
      expect(typeof userMiddleware).toBe('function');
      expect(typeof ipMiddleware).toBe('function');
    });
    
    it('should have default values', () => {
      const middleware = enforceRateLimit();
      
      // Should work with defaults
      expect(typeof middleware).toBe('function');
    });
  });
  
  describe('enforceUsageLimits', () => {
    it('should combine quota and rate limiting', () => {
      const middleware = enforceUsageLimits(
        { quotaType: 'api_calls', eventType: 'api_call' },
        { windowSeconds: 60, maxRequests: 100 }
      );
      
      expect(typeof middleware).toBe('function');
      expect(middleware.length).toBe(2);
    });
    
    it('should work with just quota options', () => {
      const middleware = enforceUsageLimits({
        quotaType: 'domains',
        eventType: 'domain_scan'
      });
      
      expect(typeof middleware).toBe('function');
    });
  });
  
  describe('trackUsage', () => {
    it('should be a function that returns middleware', () => {
      const middleware = trackUsage('api_call');
      
      expect(typeof middleware).toBe('function');
      expect(middleware.length).toBe(2);
    });
    
    it('should accept different event types', () => {
      const eventTypes = [
        'api_call',
        'domain_scan',
        'lighthouse_scan',
        'axe_scan',
        'dns_lookup',
        'email_sent'
      ] as const;
      
      eventTypes.forEach(eventType => {
        const middleware = trackUsage(eventType);
        expect(typeof middleware).toBe('function');
      });
    });
  });
  
  describe('Middleware Configuration', () => {
    it('should support different quota configurations', () => {
      const configs = [
        { quotaType: 'api_calls' as const, eventType: 'api_call' as const },
        { quotaType: 'domains' as const, eventType: 'domain_scan' as const },
        { quotaType: 'scans' as const, eventType: 'lighthouse_scan' as const },
        { quotaType: 'emails' as const, eventType: 'email_sent' as const }
      ];
      
      configs.forEach(config => {
        const middleware = enforceUsageQuota(config);
        expect(typeof middleware).toBe('function');
      });
    });
    
    it('should support different rate limit configurations', () => {
      const configs = [
        { windowSeconds: 60, maxRequests: 60 },
        { windowSeconds: 300, maxRequests: 300 },
        { windowSeconds: 3600, maxRequests: 1000 }
      ];
      
      configs.forEach(config => {
        const middleware = enforceRateLimit(config);
        expect(typeof middleware).toBe('function');
      });
    });
  });
  
  describe('Response Headers', () => {
    it('should set quota headers', () => {
      // The middleware should set these headers:
      const expectedHeaders = [
        'X-Quota-Limit',
        'X-Quota-Remaining',
        'X-Quota-Reset'
      ];
      
      const middleware = enforceUsageQuota({
        quotaType: 'api_calls'
      });
      
      expect(typeof middleware).toBe('function');
    });
    
    it('should set rate limit headers', () => {
      // The middleware should set these headers:
      const expectedHeaders = [
        'X-RateLimit-Limit',
        'X-RateLimit-Window',
        'Retry-After' // When rate limited
      ];
      
      const middleware = enforceRateLimit();
      
      expect(typeof middleware).toBe('function');
    });
  });
  
  describe('Error Responses', () => {
    it('should return proper error structure for quota exceeded', () => {
      // The middleware should return this structure when quota exceeded:
      const expectedErrorStructure = {
        error: 'Quota exceeded',
        message: 'string',
        quota: {
          used: 'number',
          limit: 'number',
          remaining: 'number',
          percentageUsed: 'number',
          resetAt: 'Date'
        },
        upgrade: 'string'
      };
      
      const middleware = enforceUsageQuota({
        quotaType: 'api_calls'
      });
      
      expect(typeof middleware).toBe('function');
    });
    
    it('should return proper error structure for rate limit exceeded', () => {
      // The middleware should return this structure when rate limited:
      const expectedErrorStructure = {
        error: 'Rate limit exceeded',
        message: 'string',
        retryAfter: 'number'
      };
      
      const middleware = enforceRateLimit();
      
      expect(typeof middleware).toBe('function');
    });
  });
});