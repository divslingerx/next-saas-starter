/**
 * Usage Tracking Service
 * Tracks API usage, enforces quotas, and manages rate limits
 */

import { db } from "@/db";
import { usageMetrics, rateLimits, usageEvents, quotaAlerts } from "@/db/schema/usage";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { PlanFeatures } from "@/core/flags/plan-features";
import type { PlanType } from "@/core/flags/plan-features";

export interface UsageTrackingOptions {
  userId: string;
  organizationId?: string;
  eventType: 'api_call' | 'domain_scan' | 'lighthouse_scan' | 'axe_scan' | 'dns_lookup' | 'email_sent';
  resourceId?: string;
  resourceType?: string;
  metadata?: Record<string, any>;
}

export interface RateLimitOptions {
  identifier: string;
  identifierType: 'user' | 'ip';
  windowSizeSeconds: number;
  maxRequests: number;
}

export interface QuotaCheckResult {
  allowed: boolean;
  currentUsage: number;
  limit: number;
  remaining: number;
  percentageUsed: number;
  resetAt?: Date;
  message?: string;
}

export class UsageTrackingService {
  /**
   * Track a usage event
   */
  async trackUsage(options: UsageTrackingOptions): Promise<void> {
    const { userId, organizationId, eventType, resourceId, resourceType, metadata } = options;
    
    // Record the event
    await this.recordEvent({
      userId,
      organizationId,
      eventType,
      resourceId,
      resourceType,
      metadata
    });
    
    // Update metrics
    await this.updateMetrics({
      userId,
      organizationId,
      eventType
    });
    
    // Check quotas and create alerts if needed
    await this.checkAndAlertQuotas({
      userId,
      organizationId
    });
  }
  
  /**
   * Check if a user can perform an action based on their quota
   */
  async checkQuota(
    userId: string,
    quotaType: 'api_calls' | 'domains' | 'scans' | 'emails',
    planName?: PlanType
  ): Promise<QuotaCheckResult> {
    // Get current period metrics
    const metrics = await this.getCurrentPeriodMetrics(userId, 'monthly');
    
    // Get plan limits
    const plan = planName || metrics?.planName || 'freelancer';
    const limits = this.getPlanLimits(plan as PlanType);
    
    // Map quota type to metric field and limit
    const { currentUsage, limit } = this.mapQuotaToMetrics(quotaType, metrics, limits);
    
    const remaining = Math.max(0, limit - currentUsage);
    const percentageUsed = limit > 0 ? Math.round((currentUsage / limit) * 100) : 0;
    const allowed = currentUsage < limit;
    
    // Get period end for reset time
    const resetAt = metrics?.periodEnd || this.getMonthEnd();
    
    return {
      allowed,
      currentUsage,
      limit,
      remaining,
      percentageUsed,
      resetAt,
      message: allowed ? undefined : `${quotaType} quota exceeded. Upgrade your plan for more.`
    };
  }
  
  /**
   * Check rate limit
   */
  async checkRateLimit(options: RateLimitOptions): Promise<{ allowed: boolean; retryAfter?: number }> {
    const { identifier, identifierType, windowSizeSeconds, maxRequests } = options;
    
    const now = new Date();
    const windowStart = new Date(now.getTime() - windowSizeSeconds * 1000);
    
    // Check if blocked
    const [blocked] = await db
      .select()
      .from(rateLimits)
      .where(
        and(
          eq(rateLimits.identifier, identifier),
          eq(rateLimits.isBlocked, true),
          gte(rateLimits.blockedUntil, now)
        )
      )
      .limit(1);
    
    if (blocked) {
      const retryAfter = Math.ceil((blocked.blockedUntil!.getTime() - now.getTime()) / 1000);
      return { allowed: false, retryAfter };
    }
    
    // Get or create rate limit window
    const [rateLimit] = await db
      .select()
      .from(rateLimits)
      .where(
        and(
          eq(rateLimits.identifier, identifier),
          gte(rateLimits.windowEnd, now)
        )
      )
      .limit(1);
    
    if (rateLimit) {
      // Update existing window
      if (rateLimit.requestCount >= maxRequests) {
        // Block the user
        await db
          .update(rateLimits)
          .set({
            isBlocked: true,
            blockedUntil: new Date(now.getTime() + windowSizeSeconds * 1000),
            blockReason: 'Rate limit exceeded'
          })
          .where(eq(rateLimits.id, rateLimit.id));
        
        return { allowed: false, retryAfter: windowSizeSeconds };
      }
      
      // Increment request count
      await db
        .update(rateLimits)
        .set({
          requestCount: rateLimit.requestCount + 1,
          lastRequestAt: now
        })
        .where(eq(rateLimits.id, rateLimit.id));
      
      return { allowed: true };
    }
    
    // Create new window
    await db.insert(rateLimits).values({
      id: nanoid(),
      identifier,
      identifierType,
      windowStart,
      windowEnd: new Date(windowStart.getTime() + windowSizeSeconds * 1000),
      windowSize: windowSizeSeconds,
      requestCount: 1,
      maxRequests,
      lastRequestAt: now
    });
    
    return { allowed: true };
  }
  
  /**
   * Get usage statistics for a user
   */
  async getUsageStats(userId: string, period: 'daily' | 'monthly' = 'monthly') {
    const metrics = await this.getCurrentPeriodMetrics(userId, period);
    
    if (!metrics) {
      return {
        period,
        usage: {
          apiCalls: 0,
          domainsAnalyzed: 0,
          lighthouseScans: 0,
          axeScans: 0,
          dnsLookups: 0,
          emailsSent: 0,
          storageUsedMb: 0
        },
        limits: this.getPlanLimits('freelancer'),
        percentages: {}
      };
    }
    
    const limits = this.getPlanLimits(metrics.planName as PlanType);
    
    return {
      period,
      periodStart: metrics.periodStart,
      periodEnd: metrics.periodEnd,
      usage: {
        apiCalls: metrics.apiCalls,
        domainsAnalyzed: metrics.domainsAnalyzed,
        lighthouseScans: metrics.lighthouseScans,
        axeScans: metrics.axeScans,
        dnsLookups: metrics.dnsLookups,
        emailsSent: metrics.emailsSent,
        storageUsedMb: metrics.storageUsedMb
      },
      limits,
      percentages: {
        apiCalls: this.calculatePercentage(metrics.apiCalls, limits.apiCalls),
        domains: this.calculatePercentage(metrics.domainsAnalyzed, limits.domains),
        scans: this.calculatePercentage(
          metrics.lighthouseScans + metrics.axeScans,
          limits.scans
        ),
        emails: this.calculatePercentage(metrics.emailsSent, limits.emails)
      }
    };
  }
  
  /**
   * Reset usage metrics for a new period
   */
  async resetPeriodMetrics(userId: string, period: 'daily' | 'monthly') {
    const { periodStart, periodEnd } = this.getPeriodDates(period);
    
    // Archive old metrics (optional - for historical data)
    // Could move to a separate archive table
    
    // Create new period metrics
    const user = await this.getUserPlan(userId);
    const limits = this.getPlanLimits(user.plan);
    
    await db.insert(usageMetrics).values({
      id: nanoid(),
      userId,
      organizationId: user.organizationId,
      period,
      periodStart,
      periodEnd,
      planName: user.plan,
      apiCallLimit: limits.apiCalls,
      domainLimit: limits.domains,
      scanLimit: limits.scans
    });
  }
  
  // Private helper methods
  
  private async recordEvent(options: {
    userId: string;
    organizationId?: string;
    eventType: string;
    resourceId?: string;
    resourceType?: string;
    metadata?: Record<string, any>;
  }) {
    const eventCategory = this.getEventCategory(options.eventType);
    
    await db.insert(usageEvents).values({
      id: nanoid(),
      userId: options.userId,
      organizationId: options.organizationId,
      eventType: options.eventType,
      eventCategory,
      eventName: options.eventType,
      resourceId: options.resourceId,
      resourceType: options.resourceType,
      metadata: options.metadata as any,
      success: true
    });
  }
  
  private async updateMetrics(options: {
    userId: string;
    organizationId?: string;
    eventType: string;
  }) {
    const metrics = await this.getCurrentPeriodMetrics(options.userId, 'monthly');
    
    if (!metrics) {
      // Create new metrics if not exists
      await this.resetPeriodMetrics(options.userId, 'monthly');
      return;
    }
    
    // Update based on event type
    const updates: Partial<typeof usageMetrics.$inferInsert> = {
      updatedAt: new Date()
    };
    
    switch (options.eventType) {
      case 'api_call':
        updates.apiCalls = metrics.apiCalls + 1;
        break;
      case 'domain_scan':
        updates.domainsAnalyzed = metrics.domainsAnalyzed + 1;
        break;
      case 'lighthouse_scan':
        updates.lighthouseScans = metrics.lighthouseScans + 1;
        break;
      case 'axe_scan':
        updates.axeScans = metrics.axeScans + 1;
        break;
      case 'dns_lookup':
        updates.dnsLookups = metrics.dnsLookups + 1;
        break;
      case 'email_sent':
        updates.emailsSent = metrics.emailsSent + 1;
        break;
    }
    
    await db
      .update(usageMetrics)
      .set(updates)
      .where(eq(usageMetrics.id, metrics.id));
  }
  
  private async checkAndAlertQuotas(options: {
    userId: string;
    organizationId?: string;
  }) {
    const metrics = await this.getCurrentPeriodMetrics(options.userId, 'monthly');
    if (!metrics) return;
    
    const checks = [
      { type: 'api_calls', current: metrics.apiCalls, limit: metrics.apiCallLimit },
      { type: 'domains', current: metrics.domainsAnalyzed, limit: metrics.domainLimit },
      { type: 'scans', current: metrics.lighthouseScans + metrics.axeScans, limit: metrics.scanLimit }
    ];
    
    for (const check of checks) {
      const percentage = this.calculatePercentage(check.current, check.limit);
      
      // Create alerts at 80%, 90%, and 100%
      if (percentage >= 80) {
        const alertType = percentage >= 100 ? 'limit_reached' : 'warning';
        
        // Check if alert already exists
        const existingAlert = await db
          .select()
          .from(quotaAlerts)
          .where(
            and(
              eq(quotaAlerts.userId, options.userId),
              eq(quotaAlerts.quotaType, check.type),
              eq(quotaAlerts.alertType, alertType),
              gte(quotaAlerts.createdAt, metrics.periodStart)
            )
          )
          .limit(1);
        
        if (!existingAlert.length) {
          await db.insert(quotaAlerts).values({
            id: nanoid(),
            userId: options.userId,
            organizationId: options.organizationId,
            alertType,
            quotaType: check.type,
            currentUsage: check.current,
            quotaLimit: check.limit,
            percentageUsed: percentage
          });
        }
      }
    }
  }
  
  private async getCurrentPeriodMetrics(userId: string, period: 'daily' | 'monthly') {
    const { periodStart, periodEnd } = this.getPeriodDates(period);
    
    const [metrics] = await db
      .select()
      .from(usageMetrics)
      .where(
        and(
          eq(usageMetrics.userId, userId),
          eq(usageMetrics.period, period),
          lte(usageMetrics.periodStart, periodStart),
          gte(usageMetrics.periodEnd, periodEnd)
        )
      )
      .limit(1);
    
    return metrics;
  }
  
  private getPeriodDates(period: 'daily' | 'monthly') {
    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date;
    
    if (period === 'daily') {
      periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      periodEnd = new Date(periodStart.getTime() + 24 * 60 * 60 * 1000 - 1);
    } else {
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }
    
    return { periodStart, periodEnd };
  }
  
  private getMonthEnd(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }
  
  private getPlanLimits(plan: PlanType) {
    const features = PlanFeatures.getPlanFeatures(plan);
    
    return {
      apiCalls: (features as any).apiRateLimit || 1000,
      domains: features.maxDomainsTracked || 10,
      scans: features.maxSitesPerMonth || 100,
      emails: (features as any).emailAlerts ? 100 : 0,
      storage: features.dataRetentionDays ? 1000 : 100
    };
  }
  
  private mapQuotaToMetrics(
    quotaType: string,
    metrics: any,
    limits: any
  ) {
    switch (quotaType) {
      case 'api_calls':
        return {
          currentUsage: metrics?.apiCalls || 0,
          limit: limits.apiCalls
        };
      case 'domains':
        return {
          currentUsage: metrics?.domainsAnalyzed || 0,
          limit: limits.domains
        };
      case 'scans':
        return {
          currentUsage: (metrics?.lighthouseScans || 0) + (metrics?.axeScans || 0),
          limit: limits.scans
        };
      case 'emails':
        return {
          currentUsage: metrics?.emailsSent || 0,
          limit: limits.emails
        };
      default:
        return { currentUsage: 0, limit: 0 };
    }
  }
  
  private getEventCategory(eventType: string): string {
    const categoryMap: Record<string, string> = {
      api_call: 'api',
      domain_scan: 'analysis',
      lighthouse_scan: 'analysis',
      axe_scan: 'analysis',
      dns_lookup: 'analysis',
      email_sent: 'notification'
    };
    
    return categoryMap[eventType] || 'other';
  }
  
  private calculatePercentage(current: number, limit: number): number {
    if (limit === 0) return 0;
    return Math.round((current / limit) * 100);
  }
  
  private async getUserPlan(userId: string): Promise<{ plan: PlanType; organizationId?: string }> {
    // This would typically fetch from the user table
    // For now, return default
    return {
      plan: 'freelancer',
      organizationId: undefined
    };
  }
}