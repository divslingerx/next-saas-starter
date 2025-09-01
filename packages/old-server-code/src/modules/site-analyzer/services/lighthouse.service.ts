/**
 * Lighthouse Service
 * Handles website performance analysis using Lighthouse
 */

import puppeteer from "puppeteer";
import lighthouse from "lighthouse";
import { browserPool } from "@/core/utils/browser-pool";
import type { LighthouseResultDto, LighthouseMetricsDto } from "../dto/site-analyzer.dto";
import { ValidationException } from "@/core/exceptions/base.exception";

export interface LighthouseOptions {
  timeout?: number;
  categories?: string[]; // Which categories to run
  throttling?: {
    cpuSlowdownMultiplier?: number;
    rttMs?: number;
    throughputKbps?: number;
  };
  emulatedFormFactor?: 'mobile' | 'desktop' | 'none';
}

export class LighthouseService {
  /**
   * Analyze performance with Lighthouse
   */
  async analyzeLighthouse(
    url: string,
    options: LighthouseOptions = {}
  ): Promise<LighthouseResultDto> {
    try {
      this.validateUrl(url);

      const {
        timeout = 60000,
        categories = ['performance', 'accessibility', 'best-practices', 'seo', 'pwa'],
        throttling,
        emulatedFormFactor = 'desktop',
      } = options;

      // Get browser from pool
      const browser = await browserPool.getBrowser();

      // Get browser endpoint
      const browserWSEndpoint = browser.wsEndpoint();
      const browserURL = new URL(browserWSEndpoint);
      const port = browserURL.port;

      console.log(`[LIGHTHOUSE] Analyzing ${url}`);

      // Configure Lighthouse
      const lighthouseConfig: any = {
        logLevel: 'error',
        output: 'json',
        onlyCategories: categories,
        port,
        formFactor: emulatedFormFactor,
        screenEmulation: {
          disabled: emulatedFormFactor === 'none',
        },
      };

      if (throttling) {
        lighthouseConfig.throttling = throttling;
      }

      // Run Lighthouse
      const runnerResult = await lighthouse(url, lighthouseConfig);
      
      if (!runnerResult || !runnerResult.lhr) {
        throw new Error('Lighthouse returned no results');
      }

      const lhr = runnerResult.lhr;

      // Process results
      return this.processResults(lhr);
    } catch (error) {
      console.error(`[LIGHTHOUSE] Error analyzing ${url}:`, error);
      throw error;
    }
    // Browser is managed by the pool, no cleanup needed
  }

  /**
   * Process Lighthouse results into DTO
   */
  private processResults(lhr: any): LighthouseResultDto {
    // Extract scores (0-1 scale, convert to 0-100)
    const getScore = (category: string): number => {
      const cat = lhr.categories?.[category];
      return cat ? Math.round(cat.score * 100) : 0;
    };

    // Extract metrics
    const metrics = lhr.audits || {};
    const getMetricValue = (key: string): number => {
      return metrics[key]?.numericValue || 0;
    };

    const lighthouseMetrics: LighthouseMetricsDto = {
      firstContentfulPaint: getMetricValue('first-contentful-paint'),
      speedIndex: getMetricValue('speed-index'),
      largestContentfulPaint: getMetricValue('largest-contentful-paint'),
      timeToInteractive: getMetricValue('interactive'),
      totalBlockingTime: getMetricValue('total-blocking-time'),
      cumulativeLayoutShift: getMetricValue('cumulative-layout-shift'),
      firstMeaningfulPaint: getMetricValue('first-meaningful-paint'),
      timeToFirstByte: getMetricValue('server-response-time'),
    };

    return {
      performanceScore: getScore('performance'),
      accessibilityScore: getScore('accessibility'),
      bestPracticesScore: getScore('best-practices'),
      seoScore: getScore('seo'),
      pwaScore: getScore('pwa'),
      metrics: lighthouseMetrics,
      analyzedAt: new Date(),
    };
  }

  /**
   * Analyze with fallback for DNS failures
   */
  async analyzeWithFallback(
    url: string,
    options: LighthouseOptions = {}
  ): Promise<LighthouseResultDto & { finalUrl: string }> {
    try {
      const result = await this.analyzeLighthouse(url, options);
      return { ...result, finalUrl: url };
    } catch (error: any) {
      const errorMessage = String(error?.message || error || 'Unknown error');
      console.log(`[LIGHTHOUSE] Initial attempt failed for ${url}: ${errorMessage}`);

      // Check if it's a DNS error
      const isDnsError =
        errorMessage.includes('ENOTFOUND') ||
        errorMessage.includes('getaddrinfo') ||
        errorMessage.includes('ERR_NAME_NOT_RESOLVED') ||
        errorMessage.includes('DNS');

      if (isDnsError) {
        const urlObj = new URL(url);
        let alternateUrl: string | null = null;

        if (!urlObj.hostname.startsWith('www.')) {
          alternateUrl = `${urlObj.protocol}//www.${urlObj.hostname}${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
        } else if (urlObj.hostname.startsWith('www.')) {
          alternateUrl = `${urlObj.protocol}//${urlObj.hostname.substring(4)}${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
        }

        if (alternateUrl) {
          console.log(`[LIGHTHOUSE] Trying alternate URL: ${alternateUrl}`);
          try {
            const result = await this.analyzeLighthouse(alternateUrl, options);
            return { ...result, finalUrl: alternateUrl };
          } catch (altError) {
            console.log(`[LIGHTHOUSE] Alternate URL also failed: ${altError}`);
          }
        }
      }

      // Return empty result on failure
      return {
        performanceScore: 0,
        accessibilityScore: 0,
        bestPracticesScore: 0,
        seoScore: 0,
        pwaScore: 0,
        metrics: {
          firstContentfulPaint: 0,
          speedIndex: 0,
          largestContentfulPaint: 0,
          timeToInteractive: 0,
          totalBlockingTime: 0,
          cumulativeLayoutShift: 0,
        },
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

  // Browser cleanup is now handled by the browser pool
}