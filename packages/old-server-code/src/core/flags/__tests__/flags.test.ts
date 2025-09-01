/**
 * Feature Flag System Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { EnvironmentFlags } from '../environment-flags';
import { PlanFeatures, PLAN_FEATURES } from '../plan-features';
import { FeatureCheck } from '../index';

describe('EnvironmentFlags', () => {
  const originalEnv = { ...process.env };
  
  beforeEach(() => {
    // Clear module cache
    delete require.cache[require.resolve('../../config')];
    delete require.cache[require.resolve('../environment-flags')];
  });
  
  afterEach(() => {
    process.env = originalEnv;
  });
  
  it('should detect maintenance mode', () => {
    process.env.FEATURE_MAINTENANCE = 'true';
    const { EnvironmentFlags: EF } = require('../environment-flags');
    
    expect(EF.isMaintenanceMode()).toBe(true);
  });
  
  it('should detect debug mode', () => {
    process.env.FEATURE_DEBUG = 'true';
    const { EnvironmentFlags: EF } = require('../environment-flags');
    
    expect(EF.isDebugMode()).toBe(true);
  });
  
  it('should check if services are enabled', () => {
    process.env.WAPPALYZER_ENABLED = 'true';
    process.env.LIGHTHOUSE_ENABLED = 'false';
    
    const { EnvironmentFlags: EF } = require('../environment-flags');
    
    expect(EF.isServiceEnabled('wappalyzer')).toBe(true);
    expect(EF.isServiceEnabled('lighthouse')).toBe(false);
  });
});

describe('PlanFeatures', () => {
  describe('hasFeature', () => {
    it('should correctly identify features for freelancer plan', () => {
      expect(PlanFeatures.hasFeature('freelancer', 'siteAnalysis')).toBe(true);
      expect(PlanFeatures.hasFeature('freelancer', 'wappalyzerAnalysis')).toBe(true);
      expect(PlanFeatures.hasFeature('freelancer', 'lighthouseAnalysis')).toBe(false);
      expect(PlanFeatures.hasFeature('freelancer', 'automationWorkflows')).toBe(false);
    });
    
    it('should correctly identify features for team plan', () => {
      expect(PlanFeatures.hasFeature('team', 'siteAnalysis')).toBe(true);
      expect(PlanFeatures.hasFeature('team', 'lighthouseAnalysis')).toBe(true);
      expect(PlanFeatures.hasFeature('team', 'automationWorkflows')).toBe(true);
      expect(PlanFeatures.hasFeature('team', 'whitelabelReports')).toBe(false);
    });
    
    it('should correctly identify features for agency plan', () => {
      expect(PlanFeatures.hasFeature('agency', 'siteAnalysis')).toBe(true);
      expect(PlanFeatures.hasFeature('agency', 'lighthouseAnalysis')).toBe(true);
      expect(PlanFeatures.hasFeature('agency', 'automationWorkflows')).toBe(true);
      expect(PlanFeatures.hasFeature('agency', 'whitelabelReports')).toBe(true);
      expect(PlanFeatures.hasFeature('agency', 'dedicatedSupport')).toBe(true);
    });
  });
  
  describe('getLimit', () => {
    it('should return correct limits for freelancer plan', () => {
      expect(PlanFeatures.getLimit('freelancer', 'maxSitesPerMonth')).toBe(10);
      expect(PlanFeatures.getLimit('freelancer', 'maxDomainsTracked')).toBe(5);
      expect(PlanFeatures.getLimit('freelancer', 'teamMembers')).toBe(1);
    });
    
    it('should return correct limits for team plan', () => {
      expect(PlanFeatures.getLimit('team', 'maxSitesPerMonth')).toBe(100);
      expect(PlanFeatures.getLimit('team', 'maxDomainsTracked')).toBe(50);
      expect(PlanFeatures.getLimit('team', 'teamMembers')).toBe(5);
    });
    
    it('should return -1 for unlimited in agency plan', () => {
      expect(PlanFeatures.getLimit('agency', 'maxSitesPerMonth')).toBe(-1);
      expect(PlanFeatures.getLimit('agency', 'maxDomainsTracked')).toBe(-1);
      expect(PlanFeatures.getLimit('agency', 'maxCrawlPages')).toBe(-1);
    });
    
    it('should return 0 for boolean features', () => {
      expect(PlanFeatures.getLimit('freelancer', 'automationWorkflows')).toBe(0);
      expect(PlanFeatures.getLimit('freelancer', 'apiAccess')).toBe(0);
    });
  });
  
  describe('isWithinLimit', () => {
    it('should correctly check if within limits', () => {
      expect(PlanFeatures.isWithinLimit('freelancer', 'maxSitesPerMonth', 5)).toBe(true);
      expect(PlanFeatures.isWithinLimit('freelancer', 'maxSitesPerMonth', 10)).toBe(false);
      expect(PlanFeatures.isWithinLimit('freelancer', 'maxSitesPerMonth', 15)).toBe(false);
    });
    
    it('should handle unlimited correctly', () => {
      expect(PlanFeatures.isWithinLimit('agency', 'maxSitesPerMonth', 1000)).toBe(true);
      expect(PlanFeatures.isWithinLimit('agency', 'maxSitesPerMonth', 10000)).toBe(true);
    });
    
    it('should handle features not available', () => {
      expect(PlanFeatures.isWithinLimit('freelancer', 'automationWorkflows', 0)).toBe(false);
    });
  });
  
  describe('getRemainingUsage', () => {
    it('should calculate remaining usage correctly', () => {
      expect(PlanFeatures.getRemainingUsage('freelancer', 'maxSitesPerMonth', 3)).toBe(7);
      expect(PlanFeatures.getRemainingUsage('freelancer', 'maxSitesPerMonth', 10)).toBe(0);
      expect(PlanFeatures.getRemainingUsage('freelancer', 'maxSitesPerMonth', 15)).toBe(0);
    });
    
    it('should return unlimited for agency plan', () => {
      expect(PlanFeatures.getRemainingUsage('agency', 'maxSitesPerMonth', 1000)).toBe('unlimited');
    });
    
    it('should return not_available for unavailable features', () => {
      expect(PlanFeatures.getRemainingUsage('freelancer', 'automationWorkflows', 0)).toBe('not_available');
    });
  });
  
  describe('getPlansWithFeature', () => {
    it('should return plans that have a specific feature', () => {
      const plansWithAutomation = PlanFeatures.getPlansWithFeature('automationWorkflows');
      expect(plansWithAutomation).toEqual(['team', 'agency']);
      
      const plansWithWhitelabel = PlanFeatures.getPlansWithFeature('whitelabelReports');
      expect(plansWithWhitelabel).toEqual(['agency']);
      
      const plansWithSiteAnalysis = PlanFeatures.getPlansWithFeature('siteAnalysis');
      expect(plansWithSiteAnalysis).toEqual(['freelancer', 'team', 'agency']);
    });
  });
  
  describe('comparePlans', () => {
    it('should correctly compare freelancer to team', () => {
      const comparison = PlanFeatures.comparePlans('freelancer', 'team');
      
      expect(comparison.automationWorkflows?.upgraded).toBe(true);
      expect(comparison.lighthouseAnalysis?.upgraded).toBe(true);
      expect(comparison.maxSitesPerMonth?.upgraded).toBe(true);
      expect(comparison.siteAnalysis?.upgraded).toBe(false); // Both have it
    });
    
    it('should correctly compare team to agency', () => {
      const comparison = PlanFeatures.comparePlans('team', 'agency');
      
      expect(comparison.whitelabelReports?.upgraded).toBe(true);
      expect(comparison.dedicatedSupport?.upgraded).toBe(true);
      expect(comparison.maxSitesPerMonth?.upgraded).toBe(true); // 100 to unlimited
      expect(comparison.automationWorkflows?.upgraded).toBe(false); // Both have it
    });
  });
  
  describe('getUpgradeMessage', () => {
    it('should generate appropriate upgrade messages', () => {
      const message1 = PlanFeatures.getUpgradeMessage('freelancer', 'automationWorkflows');
      expect(message1).toContain('Upgrade to team or agency');
      
      const message2 = PlanFeatures.getUpgradeMessage('freelancer', 'maxSitesPerMonth');
      expect(message2).toContain('Current limit: 10');
      
      const message3 = PlanFeatures.getUpgradeMessage('team', 'whitelabelReports');
      expect(message3).toContain('Upgrade to agency');
    });
  });
});

describe('FeatureCheck', () => {
  it('should check user features correctly', () => {
    const userFreelancer = { id: '1', plan: 'freelancer' };
    const userTeam = { id: '2', plan: 'team' };
    const userAgency = { id: '3', plan: 'agency' };
    
    expect(FeatureCheck.userHasFeature(userFreelancer, 'automationWorkflows')).toBe(false);
    expect(FeatureCheck.userHasFeature(userTeam, 'automationWorkflows')).toBe(true);
    expect(FeatureCheck.userHasFeature(userAgency, 'automationWorkflows')).toBe(true);
    
    expect(FeatureCheck.userHasFeature(null, 'siteAnalysis')).toBe(false);
  });
  
  it('should check combined features correctly', () => {
    const user = { id: '1', plan: 'team' };
    
    // Both checks pass
    process.env.FEATURE_API_DOCS = 'true';
    
    // Clear cache and reload modules to pick up env change
    delete require.cache[require.resolve('../../config')];
    delete require.cache[require.resolve('../environment-flags')];
    delete require.cache[require.resolve('../index')];
    
    const { FeatureCheck: FC1 } = require('../index');
    const result1 = FC1.isFeatureAvailable(user, 'apiAccess', 'apiDocs');
    expect(result1).toBe(true);
    
    // Environment check fails
    process.env.FEATURE_API_DOCS = 'false';
    
    // Clear cache and reload modules again
    delete require.cache[require.resolve('../../config')];
    delete require.cache[require.resolve('../environment-flags')];
    delete require.cache[require.resolve('../index')];
    
    const { FeatureCheck: FC2 } = require('../index');
    const result2 = FC2.isFeatureAvailable(user, 'apiAccess', 'apiDocs');
    expect(result2).toBe(false);
  });
});