/**
 * Accessibility Service
 * Handles website accessibility analysis using Axe-core
 */

import puppeteer from "puppeteer";
import { browserPool } from "@/core/utils/browser-pool";
import type { AccessibilityResultDto, AccessibilityViolationDto } from "../dto/site-analyzer.dto";
import { ValidationException } from "@/core/exceptions/base.exception";

export interface AccessibilityOptions {
  timeout?: number;
  userAgent?: string;
  runOnly?: string[]; // Specific rules to run
  rules?: Record<string, { enabled: boolean }>; // Rule configuration
}

export class AccessibilityService {
  /**
   * Analyze accessibility for a URL
   */
  async analyzeAccessibility(
    url: string,
    options: AccessibilityOptions = {}
  ): Promise<AccessibilityResultDto> {
    let page: any = null;
    
    try {
      this.validateUrl(url);

      const {
        timeout = 30000,
        userAgent = 'Mozilla/5.0 (compatible; AccessibilityAnalyzer/1.0)',
        runOnly,
        rules,
      } = options;

      // Get browser from pool
      const browser = await browserPool.getBrowser();
      page = await browser.newPage();
      await page.setUserAgent(userAgent);

      // Navigate to URL
      console.log(`[ACCESSIBILITY] Analyzing ${url}`);
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout,
      });

      // Inject axe-core
      await page.addScriptTag({
        path: require.resolve('axe-core'),
      });

      // Run accessibility analysis
      const results = await page.evaluate(
        (runOnly: any, rules: any) => {
          const axeConfig: any = {};
          if (runOnly) axeConfig.runOnly = runOnly;
          if (rules) axeConfig.rules = rules;

          return (globalThis as any).axe.run((globalThis as any).document, axeConfig);
        },
        runOnly,
        rules
      );

      // Process results
      return this.processResults(results);
    } catch (error) {
      console.error(`[ACCESSIBILITY] Error analyzing ${url}:`, error);
      throw error;
    } finally {
      // Clean up the page (browser is managed by pool)
      if (page) {
        try {
          await page.close();
        } catch (e) {
          // Ignore close errors
        }
      }
    }
  }

  /**
   * Process axe-core results into DTO
   */
  private processResults(axeResults: any): AccessibilityResultDto {
    const violations = axeResults.violations || [];
    
    // Count violations by impact
    let criticalCount = 0;
    let seriousCount = 0;
    let moderateCount = 0;
    let minorCount = 0;

    const processedViolations: AccessibilityViolationDto[] = violations.map((violation: any) => {
      const impact = violation.impact as 'critical' | 'serious' | 'moderate' | 'minor';
      const nodeCount = violation.nodes?.length || 0;

      // Count by impact
      switch (impact) {
        case 'critical':
          criticalCount += nodeCount;
          break;
        case 'serious':
          seriousCount += nodeCount;
          break;
        case 'moderate':
          moderateCount += nodeCount;
          break;
        case 'minor':
          minorCount += nodeCount;
          break;
      }

      return {
        id: violation.id,
        impact,
        description: violation.description,
        help: violation.help,
        helpUrl: violation.helpUrl,
        nodes: nodeCount,
        tags: violation.tags || [],
      };
    });

    // Calculate score (100 - weighted violations)
    const weightedViolations = 
      criticalCount * 10 +
      seriousCount * 5 +
      moderateCount * 2 +
      minorCount * 1;
    
    const score = Math.max(0, 100 - weightedViolations);

    return {
      score,
      totalViolations: violations.length,
      criticalViolations: criticalCount,
      seriousViolations: seriousCount,
      moderateViolations: moderateCount,
      minorViolations: minorCount,
      violations: processedViolations,
      analyzedAt: new Date(),
    };
  }

  /**
   * Analyze with fallback for DNS failures
   */
  async analyzeWithFallback(
    url: string,
    options: AccessibilityOptions = {}
  ): Promise<AccessibilityResultDto & { finalUrl: string }> {
    try {
      const result = await this.analyzeAccessibility(url, options);
      return { ...result, finalUrl: url };
    } catch (error: any) {
      const errorMessage = String(error?.message || error || 'Unknown error');
      console.log(`[ACCESSIBILITY] Initial attempt failed for ${url}: ${errorMessage}`);

      // Check if it's a DNS error
      const isDnsError =
        errorMessage.includes('ENOTFOUND') ||
        errorMessage.includes('getaddrinfo') ||
        errorMessage.includes('ERR_NAME_NOT_RESOLVED');

      if (isDnsError) {
        const urlObj = new URL(url);
        let alternateUrl: string | null = null;

        if (!urlObj.hostname.startsWith('www.')) {
          alternateUrl = `${urlObj.protocol}//www.${urlObj.hostname}${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
        } else if (urlObj.hostname.startsWith('www.')) {
          alternateUrl = `${urlObj.protocol}//${urlObj.hostname.substring(4)}${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
        }

        if (alternateUrl) {
          console.log(`[ACCESSIBILITY] Trying alternate URL: ${alternateUrl}`);
          try {
            const result = await this.analyzeAccessibility(alternateUrl, options);
            return { ...result, finalUrl: alternateUrl };
          } catch (altError) {
            console.log(`[ACCESSIBILITY] Alternate URL also failed: ${altError}`);
          }
        }
      }

      // Return empty result on failure
      return {
        score: 0,
        totalViolations: 0,
        criticalViolations: 0,
        seriousViolations: 0,
        moderateViolations: 0,
        minorViolations: 0,
        violations: [],
        analyzedAt: new Date(),
        finalUrl: url,
      };
    }
  }

  /**
   * Validate URL format
   */
  private validateUrl(url: string): void {
    try {
      new URL(url);
    } catch {
      throw new ValidationException(`Invalid URL format: ${url}`);
    }
  }

  // Browser and page cleanup is now handled by the browser pool
}