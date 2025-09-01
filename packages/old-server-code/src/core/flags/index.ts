/**
 * Feature Flag System
 * Combines environment flags and plan-based features
 */

export { EnvironmentFlags } from './environment-flags';
export { PlanFeatures, PLAN_FEATURES, type PlanType, type FeatureName, type FeatureValue } from './plan-features';

import type { Context, Next } from 'hono';
import { EnvironmentFlags } from './environment-flags';
import { PlanFeatures, type FeatureName, type PlanType } from './plan-features';

/**
 * Middleware to check if a feature is available for the user's plan
 */
export function requireFeature(feature: FeatureName) {
  return async (c: Context, next: Next) => {
    // Check if in maintenance mode first
    if (EnvironmentFlags.isMaintenanceMode()) {
      return c.json({ 
        error: 'Service is currently under maintenance',
        maintenance: true 
      }, 503);
    }
    
    const user = c.get('user');
    
    // Check if user is authenticated
    if (!user) {
      return c.json({ 
        error: 'Authentication required',
        feature 
      }, 401);
    }
    
    // Get user's plan (default to freelancer if not set)
    const userPlan = (user.plan || 'freelancer') as PlanType;
    
    // Check if user's plan has the feature
    if (!PlanFeatures.hasFeature(userPlan, feature)) {
      const upgradeMessage = PlanFeatures.getUpgradeMessage(userPlan, feature);
      const requiredPlans = PlanFeatures.getPlansWithFeature(feature);
      
      return c.json({ 
        error: 'Feature not available in your plan',
        feature,
        currentPlan: userPlan,
        requiredPlans,
        message: upgradeMessage,
        upgradeUrl: '/pricing'
      }, 403);
    }
    
    await next();
  };
}

/**
 * Middleware to check rate limits for a feature
 */
export function checkRateLimit(feature: FeatureName) {
  return async (c: Context, next: Next) => {
    // Skip rate limiting if disabled
    if (!EnvironmentFlags.isRateLimitingEnabled()) {
      return next();
    }
    
    const user = c.get('user');
    
    if (!user) {
      return c.json({ 
        error: 'Authentication required' 
      }, 401);
    }
    
    const userPlan = (user.plan || 'freelancer') as PlanType;
    
    // Check if feature has numeric limits
    const limit = PlanFeatures.getLimit(userPlan, feature);
    
    // If limit is -1 (unlimited) or 0 (not available), skip rate limit check
    if (limit === -1) {
      return next();
    }
    
    if (limit === 0) {
      return c.json({ 
        error: 'Feature not available in your plan',
        feature,
        currentPlan: userPlan
      }, 403);
    }
    
    // Get current usage (this should be implemented based on your database)
    const currentUsage = await getCurrentUsage(user.id, feature);
    
    if (!PlanFeatures.isWithinLimit(userPlan, feature, currentUsage)) {
      const remaining = PlanFeatures.getRemainingUsage(userPlan, feature, currentUsage);
      
      return c.json({ 
        error: 'Rate limit exceeded',
        feature,
        limit,
        currentUsage,
        remaining,
        message: `You've reached your plan limit of ${limit} for ${feature}`,
        resetAt: getResetTime(feature), // Implement based on your needs
        upgradeUrl: '/pricing'
      }, 429);
    }
    
    // Add usage info to response headers
    c.header('X-RateLimit-Limit', String(limit));
    c.header('X-RateLimit-Remaining', String(limit - currentUsage));
    c.header('X-RateLimit-Reset', String(getResetTime(feature)));
    
    await next();
  };
}

/**
 * Middleware to check if an environment feature is enabled
 */
export function requireEnvironmentFeature(feature: Parameters<typeof EnvironmentFlags.isEnabled>[0]) {
  return async (c: Context, next: Next) => {
    if (!EnvironmentFlags.isEnabled(feature)) {
      return c.json({ 
        error: 'Feature is currently disabled',
        feature 
      }, 503);
    }
    
    await next();
  };
}

/**
 * Middleware to check if a service is enabled
 */
export function requireService(service: 'wappalyzer' | 'lighthouse' | 'axe') {
  return async (c: Context, next: Next) => {
    if (!EnvironmentFlags.isServiceEnabled(service)) {
      return c.json({ 
        error: `${service} service is currently disabled`,
        service 
      }, 503);
    }
    
    await next();
  };
}

/**
 * Helper function to get current usage for a feature
 * This should be implemented based on your database schema
 */
async function getCurrentUsage(userId: string, feature: FeatureName): Promise<number> {
  // TODO: Implement based on your database
  // This is a placeholder implementation
  
  // For now, return 0 to allow all requests
  // In production, this should query your database for actual usage
  
  switch (feature) {
    case 'maxSitesPerMonth':
      // Query sites analyzed this month by user
      return 0;
      
    case 'maxDomainsTracked':
      // Query domains tracked by user
      return 0;
      
    case 'maxCrawlPages':
      // Query pages crawled this month by user
      return 0;
      
    case 'teamMembers':
      // Query team members for user's organization
      return 0;
      
    default:
      return 0;
  }
}

/**
 * Helper function to get reset time for rate limits
 * This should be implemented based on your needs
 */
function getResetTime(feature: FeatureName): number {
  // For monthly limits, return first day of next month
  // For daily limits, return midnight
  // This is a placeholder implementation
  
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return Math.floor(nextMonth.getTime() / 1000);
}

/**
 * Helper to check features in route handlers
 */
export class FeatureCheck {
  /**
   * Check if user has access to a feature
   */
  static userHasFeature(user: any, feature: FeatureName): boolean {
    if (!user) return false;
    const plan = (user.plan || 'freelancer') as PlanType;
    return PlanFeatures.hasFeature(plan, feature);
  }
  
  /**
   * Check if environment feature is enabled
   */
  static environmentHasFeature(feature: Parameters<typeof EnvironmentFlags.isEnabled>[0]): boolean {
    return EnvironmentFlags.isEnabled(feature);
  }
  
  /**
   * Check both user plan and environment for a feature
   */
  static isFeatureAvailable(user: any, planFeature: FeatureName, envFeature?: Parameters<typeof EnvironmentFlags.isEnabled>[0]): boolean {
    // Check environment feature if provided
    if (envFeature && !this.environmentHasFeature(envFeature)) {
      return false;
    }
    
    // Check user plan feature
    return this.userHasFeature(user, planFeature);
  }
}