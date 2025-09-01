/**
 * Plan-Based Feature Flags
 * Defines what features are available for each subscription plan
 */

/**
 * Features available in each plan
 * This defines what features each subscription tier has access to
 */
export const PLAN_FEATURES = {
  freelancer: {
    // Basic features
    siteAnalysis: true,
    maxSitesPerMonth: 10,
    maxDomainsTracked: 5,
    maxCrawlPages: 10,
    
    // Analysis features
    wappalyzerAnalysis: true,
    lighthouseAnalysis: false,
    axeAccessibility: false,
    dnsAnalysis: false,
    
    // Advanced features
    automationWorkflows: false,
    apiAccess: false,
    customIntegrations: false,
    webhooks: false,
    bulkOperations: false,
    
    // Team features
    teamMembers: 1,
    roleBasedAccess: false,
    ssoLogin: false,
    
    // Reports
    basicReports: true,
    advancedReports: false,
    whitelabelReports: false,
    exportReports: false,
    scheduledReports: false,
    
    // Data retention
    dataRetentionDays: 30,
    historyTracking: false,
    
    // Support
    emailSupport: true,
    prioritySupport: false,
    dedicatedSupport: false,
  },
  
  team: {
    // Basic features
    siteAnalysis: true,
    maxSitesPerMonth: 100,
    maxDomainsTracked: 50,
    maxCrawlPages: 100,
    
    // Analysis features
    wappalyzerAnalysis: true,
    lighthouseAnalysis: true,
    axeAccessibility: true,
    dnsAnalysis: true,
    
    // Advanced features
    automationWorkflows: true,
    apiAccess: true,
    customIntegrations: false,
    webhooks: true,
    bulkOperations: true,
    
    // Team features
    teamMembers: 5,
    roleBasedAccess: true,
    ssoLogin: false,
    
    // Reports
    basicReports: true,
    advancedReports: true,
    whitelabelReports: false,
    exportReports: true,
    scheduledReports: true,
    
    // Data retention
    dataRetentionDays: 90,
    historyTracking: true,
    
    // Support
    emailSupport: true,
    prioritySupport: true,
    dedicatedSupport: false,
  },
  
  agency: {
    // Basic features
    siteAnalysis: true,
    maxSitesPerMonth: -1, // unlimited
    maxDomainsTracked: -1, // unlimited
    maxCrawlPages: -1, // unlimited
    
    // Analysis features
    wappalyzerAnalysis: true,
    lighthouseAnalysis: true,
    axeAccessibility: true,
    dnsAnalysis: true,
    
    // Advanced features
    automationWorkflows: true,
    apiAccess: true,
    customIntegrations: true,
    webhooks: true,
    bulkOperations: true,
    
    // Team features
    teamMembers: 25,
    roleBasedAccess: true,
    ssoLogin: true,
    
    // Reports
    basicReports: true,
    advancedReports: true,
    whitelabelReports: true,
    exportReports: true,
    scheduledReports: true,
    
    // Data retention
    dataRetentionDays: 365,
    historyTracking: true,
    
    // Support
    emailSupport: true,
    prioritySupport: true,
    dedicatedSupport: true,
  },
} as const;

export type PlanType = keyof typeof PLAN_FEATURES;
export type FeatureName = keyof typeof PLAN_FEATURES.freelancer;
export type FeatureValue = boolean | number;

/**
 * Plan-based feature flag service
 * Checks if a user's plan has access to specific features
 */
export class PlanFeatures {
  /**
   * Check if a plan has access to a feature
   */
  static hasFeature(plan: PlanType, feature: FeatureName): boolean {
    const value = PLAN_FEATURES[plan]?.[feature];
    
    // For boolean features, return the value
    if (typeof value === 'boolean') {
      return value;
    }
    
    // For numeric features, return true if > 0 or -1 (unlimited)
    if (typeof value === 'number') {
      return value === -1 || value > 0;
    }
    
    return false;
  }
  
  /**
   * Get feature value for a plan
   * Returns the actual value (boolean or number)
   */
  static getFeatureValue(plan: PlanType, feature: FeatureName): FeatureValue {
    return PLAN_FEATURES[plan]?.[feature] ?? false;
  }
  
  /**
   * Get feature limit for a plan (returns -1 for unlimited)
   */
  static getLimit(plan: PlanType, feature: FeatureName): number {
    const value = PLAN_FEATURES[plan]?.[feature];
    
    if (typeof value === 'number') {
      return value;
    }
    
    // Boolean features don't have limits
    return 0;
  }
  
  /**
   * Check if user is within their plan limits
   */
  static isWithinLimit(
    plan: PlanType, 
    feature: FeatureName,
    currentUsage: number
  ): boolean {
    const limit = this.getLimit(plan, feature);
    
    // -1 means unlimited
    if (limit === -1) return true;
    
    // 0 means feature not available (for numeric features)
    if (limit === 0) return false;
    
    // Check if under limit
    return currentUsage < limit;
  }
  
  /**
   * Get remaining usage for a feature
   */
  static getRemainingUsage(
    plan: PlanType,
    feature: FeatureName,
    currentUsage: number
  ): number | 'unlimited' | 'not_available' {
    const limit = this.getLimit(plan, feature);
    
    if (limit === -1) return 'unlimited';
    if (limit === 0) return 'not_available';
    
    const remaining = limit - currentUsage;
    return Math.max(0, remaining);
  }
  
  /**
   * Get all features for a plan
   */
  static getPlanFeatures(plan: PlanType) {
    return PLAN_FEATURES[plan];
  }
  
  /**
   * Get list of plans that have a specific feature
   */
  static getPlansWithFeature(feature: FeatureName): PlanType[] {
    const plans: PlanType[] = [];
    
    for (const plan of Object.keys(PLAN_FEATURES) as PlanType[]) {
      if (this.hasFeature(plan, feature)) {
        plans.push(plan);
      }
    }
    
    return plans;
  }
  
  /**
   * Compare two plans
   */
  static comparePlans(plan1: PlanType, plan2: PlanType) {
    const features1 = PLAN_FEATURES[plan1];
    const features2 = PLAN_FEATURES[plan2];
    
    const comparison: Record<string, { 
      plan1: FeatureValue; 
      plan2: FeatureValue; 
      upgraded: boolean;
    }> = {};
    
    for (const key in features1) {
      const feature = key as FeatureName;
      const value1 = features1[feature];
      const value2 = features2[feature];
      
      let upgraded = false;
      
      if (typeof value1 === 'boolean' && typeof value2 === 'boolean') {
        upgraded = !value1 && value2; // false to true is an upgrade
      } else if (typeof value1 === 'number' && typeof value2 === 'number') {
        if (value1 === -1) {
          upgraded = false; // already unlimited
        } else if (value2 === -1) {
          upgraded = true; // upgraded to unlimited
        } else {
          upgraded = value2 > value1; // higher limit is an upgrade
        }
      }
      
      comparison[feature] = {
        plan1: value1,
        plan2: value2,
        upgraded,
      };
    }
    
    return comparison;
  }
  
  /**
   * Get upgrade message for a feature
   */
  static getUpgradeMessage(currentPlan: PlanType, feature: FeatureName): string {
    const plansWithFeature = this.getPlansWithFeature(feature);
    const upgradeOptions = plansWithFeature.filter(p => p !== currentPlan);
    
    if (upgradeOptions.length === 0) {
      return `This feature is not available in any plan.`;
    }
    
    const currentValue = this.getFeatureValue(currentPlan, feature);
    
    if (typeof currentValue === 'boolean' && !currentValue) {
      return `Upgrade to ${upgradeOptions.join(' or ')} to access ${feature}.`;
    }
    
    if (typeof currentValue === 'number' && currentValue >= 0) {
      const upgradeLimits = upgradeOptions.map(p => {
        const limit = this.getLimit(p, feature);
        return limit === -1 ? `${p} (unlimited)` : `${p} (${limit})`;
      });
      
      return `Current limit: ${currentValue}. Upgrade to ${upgradeLimits.join(' or ')} for higher limits.`;
    }
    
    return `Upgrade to ${upgradeOptions.join(' or ')} for enhanced ${feature}.`;
  }
  
  /**
   * Get the minimum required plan for a feature
   */
  static getRequiredPlan(feature: FeatureName): PlanType | null {
    const plansWithFeature = this.getPlansWithFeature(feature);
    
    if (plansWithFeature.length === 0) {
      return null;
    }
    
    // Return the lowest plan that has this feature
    // Plans are ordered: freelancer < team < agency
    if (plansWithFeature.includes('freelancer')) {
      return 'freelancer';
    }
    if (plansWithFeature.includes('team')) {
      return 'team';
    }
    if (plansWithFeature.includes('agency')) {
      return 'agency';
    }
    
    return null;
  }
}