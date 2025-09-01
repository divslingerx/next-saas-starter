/**
 * Feature Check Middleware
 * Middleware to enforce plan-based feature access
 */

import type { Context, Next } from "hono";
import { PLAN_FEATURES, PlanFeatures } from "@/core/flags";
import type { PlanType } from "@/core/flags/plan-features";

/**
 * Middleware to require a specific feature for a route
 */
export function requireFeature(featureName: keyof typeof PLAN_FEATURES['freelancer']) {
  return async (c: Context, next: Next) => {
    // Get user from context (set by auth middleware)
    const user = c.get('user');
    
    if (!user) {
      return c.json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED' 
      }, 401);
    }
    
    // Get user's plan from database or session
    // For now, we'll use a default plan from the user object
    // Convert to lowercase to match PLAN_FEATURES keys
    const userPlan = (user.plan || 'freelancer').toLowerCase() as PlanType;
    
    // Check if user has access to this feature
    if (!PlanFeatures.hasFeature(userPlan, featureName)) {
      const upgradeMessage = PlanFeatures.getUpgradeMessage(userPlan, featureName);
      
      return c.json({ 
        error: 'Feature not available in your plan',
        code: 'FEATURE_UNAVAILABLE',
        requiredPlan: PlanFeatures.getRequiredPlan(featureName),
        message: upgradeMessage,
        upgradeUrl: '/upgrade'
      }, 403);
    }
    
    await next();
  };
}

/**
 * Middleware to check rate limits for a feature
 */
export function checkRateLimit(limitName: keyof typeof PLAN_FEATURES['freelancer']) {
  return async (c: Context, next: Next) => {
    // Get user from context
    const user = c.get('user');
    
    if (!user) {
      return c.json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED' 
      }, 401);
    }
    
    const userPlan = (user.plan || 'freelancer').toLowerCase() as PlanType;
    const limit = PlanFeatures.getLimit(userPlan, limitName);
    
    // Get current usage from database or cache
    // This is a placeholder - you would implement actual usage tracking
    const currentUsage = await getCurrentUsage(user.id, limitName);
    
    if (!PlanFeatures.isWithinLimit(userPlan, limitName, currentUsage)) {
      return c.json({ 
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        limit,
        current: currentUsage,
        limitName,
        message: `You have reached your plan limit of ${limit} for ${limitName}`,
        upgradeUrl: '/upgrade'
      }, 429);
    }
    
    // Increment usage counter (would be implemented with proper tracking)
    await incrementUsage(user.id, limitName);
    
    await next();
  };
}

/**
 * Middleware to check multiple features at once
 */
export function requireFeatures(...features: Array<keyof typeof PLAN_FEATURES['freelancer']>) {
  return async (c: Context, next: Next) => {
    const user = c.get('user');
    
    if (!user) {
      return c.json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED' 
      }, 401);
    }
    
    const userPlan = (user.plan || 'freelancer').toLowerCase() as PlanType;
    
    for (const feature of features) {
      if (!PlanFeatures.hasFeature(userPlan, feature)) {
        const upgradeMessage = PlanFeatures.getUpgradeMessage(userPlan, feature);
        
        return c.json({ 
          error: 'Feature not available in your plan',
          code: 'FEATURE_UNAVAILABLE',
          missingFeature: feature,
          requiredPlan: PlanFeatures.getRequiredPlan(feature),
          message: upgradeMessage,
          upgradeUrl: '/upgrade'
        }, 403);
      }
    }
    
    await next();
  };
}

// Helper functions for usage tracking
async function getCurrentUsage(userId: string, limitName: string): Promise<number> {
  // Usage tracking is now implemented in UsageTrackingService
  // For now return 0 to maintain backward compatibility
  // Can be integrated with UsageTrackingService when needed
  return 0;
}

async function incrementUsage(userId: string, limitName: string): Promise<void> {
  // Usage tracking is now implemented in UsageTrackingService
  // Can be integrated with UsageTrackingService when needed
}