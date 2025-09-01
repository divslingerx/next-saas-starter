/**
 * Usage Limits Middleware
 * Enforces API usage quotas and rate limiting
 */

import type { Context, Next } from 'hono';
import { UsageTrackingService } from '@/modules/usage/services/usage-tracking.service';
import type { PlanType } from '@/core/flags/plan-features';

const usageTrackingService = new UsageTrackingService();

export interface UsageLimitOptions {
  quotaType: 'api_calls' | 'domains' | 'scans' | 'emails';
  eventType?: 'api_call' | 'domain_scan' | 'lighthouse_scan' | 'axe_scan' | 'dns_lookup' | 'email_sent';
  skipTracking?: boolean;
}

export interface RateLimitOptions {
  windowSeconds?: number;
  maxRequests?: number;
  identifier?: 'user' | 'ip';
}

/**
 * Middleware to check and enforce usage quotas
 */
export function enforceUsageQuota(options: UsageLimitOptions) {
  return async (c: Context, next: Next) => {
    const user = c.get('user');
    
    if (!user) {
      return c.json({ error: 'Authentication required' }, 401);
    }
    
    // Check quota
    const quotaCheck = await usageTrackingService.checkQuota(
      user.id,
      options.quotaType,
      user.plan as PlanType
    );
    
    if (!quotaCheck.allowed) {
      return c.json({
        error: 'Quota exceeded',
        message: quotaCheck.message,
        quota: {
          used: quotaCheck.currentUsage,
          limit: quotaCheck.limit,
          remaining: quotaCheck.remaining,
          percentageUsed: quotaCheck.percentageUsed,
          resetAt: quotaCheck.resetAt
        },
        upgrade: 'Please upgrade your plan for higher limits'
      }, 429);
    }
    
    // Track usage if not skipped
    if (!options.skipTracking && options.eventType) {
      await usageTrackingService.trackUsage({
        userId: user.id,
        organizationId: user.organizationId,
        eventType: options.eventType
      });
    }
    
    // Add quota info to response headers
    c.header('X-Quota-Limit', String(quotaCheck.limit));
    c.header('X-Quota-Remaining', String(quotaCheck.remaining));
    c.header('X-Quota-Reset', quotaCheck.resetAt?.toISOString() || '');
    
    await next();
  };
}

/**
 * Middleware to enforce rate limiting
 */
export function enforceRateLimit(options?: RateLimitOptions) {
  const windowSeconds = options?.windowSeconds || 60;
  const maxRequests = options?.maxRequests || 60;
  const identifierType = options?.identifier || 'user';
  
  return async (c: Context, next: Next) => {
    // Get identifier based on type
    let identifier: string;
    
    if (identifierType === 'user') {
      const user = c.get('user');
      if (!user) {
        return c.json({ error: 'Authentication required' }, 401);
      }
      identifier = user.id;
    } else {
      // Use IP address
      identifier = c.req.header('x-forwarded-for') || 
                   c.req.header('x-real-ip') || 
                   c.env?.remoteAddr || 
                   'unknown';
    }
    
    // Check rate limit
    const rateLimitCheck = await usageTrackingService.checkRateLimit({
      identifier,
      identifierType,
      windowSizeSeconds: windowSeconds,
      maxRequests
    });
    
    if (!rateLimitCheck.allowed) {
      c.header('Retry-After', String(rateLimitCheck.retryAfter || windowSeconds));
      
      return c.json({
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.',
        retryAfter: rateLimitCheck.retryAfter
      }, 429);
    }
    
    // Add rate limit info to response headers
    c.header('X-RateLimit-Limit', String(maxRequests));
    c.header('X-RateLimit-Window', String(windowSeconds));
    
    await next();
  };
}

/**
 * Combined middleware for both quota and rate limiting
 */
export function enforceUsageLimits(
  quotaOptions: UsageLimitOptions,
  rateLimitOptions?: RateLimitOptions
) {
  return async (c: Context, next: Next) => {
    // First check rate limit
    const rateLimitMiddleware = enforceRateLimit(rateLimitOptions);
    await rateLimitMiddleware(c, async () => {
      // Then check quota
      const quotaMiddleware = enforceUsageQuota(quotaOptions);
      await quotaMiddleware(c, next);
    });
  };
}

/**
 * Track API usage without enforcing limits
 */
export function trackUsage(eventType: UsageLimitOptions['eventType']) {
  return async (c: Context, next: Next) => {
    const user = c.get('user');
    
    if (user && eventType) {
      // Track asynchronously, don't wait
      usageTrackingService.trackUsage({
        userId: user.id,
        organizationId: user.organizationId,
        eventType,
        metadata: {
          endpoint: c.req.path,
          method: c.req.method
        }
      }).catch(err => {
        console.error('Failed to track usage:', err);
      });
    }
    
    await next();
  };
}