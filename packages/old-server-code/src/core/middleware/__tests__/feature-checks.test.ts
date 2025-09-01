/**
 * Feature Checks Middleware Tests
 */

import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { Hono } from 'hono';
import { requireFeature, checkRateLimit, requireFeatures } from '../feature-checks';
import { createMockUserWithPlan } from '../../../test/utils/shared-mocks';

// Type matching the main app's Variables type
type AppVariables = {
  user: {
    id: string;
    email: string;
    name: string;
    emailVerified: boolean;
    image?: string | null;
    plan?: string;
  } | null;
  session: {
    id: string;
    expiresAt: Date;
  } | null;
  organizationId: string;
  userId: string;
};

describe('Feature Checks Middleware', () => {
  let app: Hono<{ Variables: AppVariables }>;
  
  beforeEach(() => {
    app = new Hono<{ Variables: AppVariables }>();
  });
  
  describe('requireFeature', () => {
    it('should block access when user is not authenticated', async () => {
      app.use('/test', requireFeature('lighthouseAnalysis'));
      app.get('/test', (c) => c.json({ success: true }));
      
      const res = await app.request('/test');
      const body = await res.json() as { code?: string };
      
      expect(res.status).toBe(401);
      expect(body.code).toBe('AUTH_REQUIRED');
    });
    
    it('should block access for FREELANCER plan to TEAM features', async () => {
      app.use('*', (c, next) => {
        const user = createMockUserWithPlan({ plan: 'freelancer' });
        c.set('user', user);
        return next();
      });
      
      app.use('/test', requireFeature('lighthouseAnalysis'));
      app.get('/test', (c) => c.json({ success: true }));
      
      const res = await app.request('/test');
      const body = await res.json() as any;
      
      expect(res.status).toBe(403);
      expect(body.code).toBe('FEATURE_UNAVAILABLE');
      expect(body.requiredPlan).toBe('team');
    });
    
    it('should allow access for TEAM plan to TEAM features', async () => {
      app.use('*', (c, next) => {
        const user = createMockUserWithPlan({ plan: 'team' });
        c.set('user', user);
        return next();
      });
      
      app.use('/test', requireFeature('lighthouseAnalysis'));
      app.get('/test', (c) => c.json({ success: true }));
      
      const res = await app.request('/test');
      const body = await res.json() as any;
      
      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
    });
    
    it('should allow AGENCY plan access to all features', async () => {
      app.use('*', (c, next) => {
        const user = createMockUserWithPlan({ plan: 'agency' });
        c.set('user', user);
        return next();
      });
      
      app.use('/test', requireFeature('automationWorkflows'));
      app.get('/test', (c) => c.json({ success: true }));
      
      const res = await app.request('/test');
      const body = await res.json() as any;
      
      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
    });
  });
  
  describe('checkRateLimit', () => {
    it('should check rate limits for features', async () => {
      app.use('*', (c, next) => {
        const user = createMockUserWithPlan({ plan: 'freelancer' });
        c.set('user', user);
        return next();
      });
      
      app.use('/test', checkRateLimit('maxSitesPerMonth'));
      app.get('/test', (c) => c.json({ success: true }));
      
      const res = await app.request('/test');
      const body = await res.json() as any;
      
      // Should pass since getCurrentUsage returns 0 in our mock
      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
    });
  });
  
  describe('requireFeatures', () => {
    it('should require multiple features', async () => {
      app.use('*', (c, next) => {
        const user = createMockUserWithPlan({ plan: 'freelancer' });
        c.set('user', user);
        return next();
      });
      
      app.use('/test', requireFeatures('lighthouseAnalysis', 'bulkOperations'));
      app.get('/test', (c) => c.json({ success: true }));
      
      const res = await app.request('/test');
      const body = await res.json() as any;
      
      expect(res.status).toBe(403);
      expect(body.code).toBe('FEATURE_UNAVAILABLE');
      expect(body.missingFeature).toBeDefined();
    });
    
    it('should pass when user has all required features', async () => {
      app.use('*', (c, next) => {
        const user = createMockUserWithPlan({ plan: 'agency' });
        c.set('user', user);
        return next();
      });
      
      app.use('/test', requireFeatures('lighthouseAnalysis', 'bulkOperations', 'automationWorkflows'));
      app.get('/test', (c) => c.json({ success: true }));
      
      const res = await app.request('/test');
      const body = await res.json() as any;
      
      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
    });
  });
  
  describe('upgrade messages', () => {
    it('should provide helpful upgrade message', async () => {
      app.use('*', (c, next) => {
        const user = createMockUserWithPlan({ plan: 'freelancer' });
        c.set('user', user);
        return next();
      });
      
      app.use('/test', requireFeature('automationWorkflows'));
      app.get('/test', (c) => c.json({ success: true }));
      
      const res = await app.request('/test');
      const body = await res.json() as any;
      
      expect(res.status).toBe(403);
      expect(body.message).toContain('Upgrade to');
      expect(body.upgradeUrl).toBe('/upgrade');
    });
  });
});