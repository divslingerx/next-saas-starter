/**
 * Wappalyzer Service
 * Handles technology detection for websites
 */

import { getWappalyzer, wappalyzerOptions, createWappalyzerInstance } from "../lib/wappalyzer";
import type { TechnologyDto, CategoryDto } from "../dto/site-analyzer.dto";
import { ValidationException } from "@/core/exceptions/base.exception";
import { config } from "@/core/config";
import { EnvironmentFlags } from "@/core/flags";
import { withCancellation } from "@/core/utils/cancellation";
import { globalContext } from "@/core/context/global-context";
import type { ServiceOptions } from "@/core/types/service-options";

export class WappalyzerService {
  private readonly DEFAULT_TIMEOUT = 30000; // 30 seconds for technology analysis
  private wappalyzer: any = null;
  private site: any = null;

  /**
   * Analyze a single URL for technologies
   */
  async analyzeTechnologies(
    dto: { url: string },
    options?: ServiceOptions
  ): Promise<{
    technologies: TechnologyDto[];
    isWordpress: boolean;
    isHubspot: boolean;
  }> {
    const signal = options?.signal || globalContext.signal;
    const timeout = options?.timeout || this.DEFAULT_TIMEOUT;
    const { url } = dto;

    return withCancellation(
      this.performTechnologyAnalysis(url),
      signal,
      timeout
    );
  }

  /**
   * Internal technology analysis implementation
   */
  private async performTechnologyAnalysis(url: string): Promise<{
    technologies: TechnologyDto[];
    isWordpress: boolean;
    isHubspot: boolean;
  }> {
    // Check if service is enabled
    if (!EnvironmentFlags.isServiceEnabled('wappalyzer')) {
      throw new ValidationException('Wappalyzer service is currently disabled');
    }

    try {
      // Validate URL
      this.validateUrl(url);

      // Initialize Wappalyzer using config-aware factory
      this.wappalyzer = await createWappalyzerInstance();

      // Open and analyze the site
      console.log(`[WAPPALYZER] Analyzing ${url}`);
      this.site = await this.openSite(url);
      const results = await this.analyzeSite();

      // Process technologies
      const technologies = this.processTechnologies(results.technologies || []);
      
      // Check for specific platforms
      const isWordpress = this.checkForPlatform(technologies, 'wordpress');
      const isHubspot = this.checkForPlatform(technologies, 'hubspot');

      return {
        technologies,
        isWordpress,
        isHubspot,
      };
    } catch (error) {
      console.error(`[WAPPALYZER] Error analyzing ${url}:`, error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Open site with timeout
   */
  private async openSite(url: string, timeoutMs: number = 15000): Promise<any> {
    const openPromise = this.wappalyzer.open(url);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout opening site after ${timeoutMs}ms`)), timeoutMs)
    );

    try {
      const site = await Promise.race([openPromise, timeoutPromise]);
      
      // Set up error handler
      if (site && typeof site.on === 'function') {
        site.on('error', (error: any) => {
          const errorMessage = String(error?.message || error || 'Unknown error');
          
          // Only log non-probe errors
          if (
            !errorMessage.includes('Probe failed') &&
            !errorMessage.includes('queryTxt') &&
            !errorMessage.includes('queryCname') &&
            !errorMessage.includes('ETIMEOUT')
          ) {
            console.log(`[WAPPALYZER] Non-critical error for ${url}: ${errorMessage}`);
          }
        });
      }

      return site;
    } catch (error: any) {
      const errorMessage = String(error?.message || error || 'Failed to open site');
      console.log(`[WAPPALYZER] Failed to open ${url}: ${errorMessage}`);
      throw new Error(`Failed to open site: ${errorMessage}`);
    }
  }

  /**
   * Analyze site with timeout
   */
  private async analyzeSite(timeoutMs: number = 20000): Promise<any> {
    const analysisPromise = this.site.analyze();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Analysis timeout after ${timeoutMs}ms`)), timeoutMs)
    );

    try {
      return await Promise.race([analysisPromise, timeoutPromise]);
    } catch (error: any) {
      console.log(`[WAPPALYZER] Analysis error: ${error.message}`);
      // Return empty results on analysis failure
      return { technologies: [] };
    }
  }

  /**
   * Process raw technology data into DTOs
   */
  private processTechnologies(rawTechnologies: any[]): TechnologyDto[] {
    return rawTechnologies.map((tech: any) => ({
      slug: tech.slug || this.generateSlug(tech.name),
      name: tech.name,
      confidence: tech.confidence || 100,
      version: tech.version || undefined,
      website: tech.website || undefined,
      description: tech.description || undefined,
      cpe: tech.cpe || undefined,
      icon: tech.icon || undefined,
      categories: this.processCategories(tech.categories || []),
    }));
  }

  /**
   * Process raw category data into DTOs
   */
  private processCategories(rawCategories: any[]): CategoryDto[] {
    return rawCategories.map((cat: any) => ({
      id: cat.id || 0,
      slug: cat.slug || this.generateSlug(cat.name),
      name: cat.name,
    }));
  }

  /**
   * Check if a specific platform is detected
   */
  private checkForPlatform(technologies: TechnologyDto[], platform: string): boolean {
    return technologies.some((tech) => 
      tech.name.toLowerCase() === platform ||
      tech.name.toLowerCase().includes(platform)
    );
  }

  /**
   * Generate slug from name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
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

  /**
   * Clean up Wappalyzer resources
   */
  private async cleanup(): Promise<void> {
    // Clean up site listeners
    if (this.site) {
      try {
        if (typeof this.site.removeAllListeners === 'function') {
          this.site.removeAllListeners();
        } else if (typeof this.site.off === 'function') {
          this.site.off('error');
        }
      } catch (e) {
        // Silently ignore listener removal errors
      }
      this.site = null;
    }

    // Destroy Wappalyzer instance
    if (this.wappalyzer) {
      try {
        await this.wappalyzer.destroy();
      } catch (destroyError) {
        // Silently ignore destroy errors
      }
      this.wappalyzer = null;
    }
  }

  /**
   * Try URL with www fallback for DNS failures
   */
  async analyzeWithFallback(
    dto: { url: string },
    options?: ServiceOptions
  ): Promise<{
    technologies: TechnologyDto[];
    isWordpress: boolean;
    isHubspot: boolean;
    finalUrl: string;
  }> {
    const signal = options?.signal || globalContext.signal;
    const timeout = options?.timeout || this.DEFAULT_TIMEOUT * 1.5; // Extended timeout for fallback
    const { url } = dto;

    return withCancellation(
      this.performAnalysisWithFallback(url),
      signal,
      timeout
    );
  }

  /**
   * Internal analysis with fallback implementation
   */
  private async performAnalysisWithFallback(url: string): Promise<{
    technologies: TechnologyDto[];
    isWordpress: boolean;
    isHubspot: boolean;
    finalUrl: string;
  }> {
    let lastError: any = null;
    const attempts: string[] = [];

    try {
      // Try the URL as-is first
      attempts.push(url);
      const result = await this.performTechnologyAnalysis(url);
      return { ...result, finalUrl: url };
    } catch (error: any) {
      lastError = error;
      const errorMessage = String(error?.message || error || 'Unknown error');
      console.log(`[WAPPALYZER] Initial attempt failed for ${url}: ${errorMessage}`);

      // Check if it's a DNS error
      const isDnsError =
        errorMessage.includes('ENOTFOUND') ||
        errorMessage.includes('getaddrinfo') ||
        errorMessage.includes('DNSException') ||
        errorMessage.includes('ERR_NAME_NOT_RESOLVED') ||
        errorMessage.includes('queryCname');

      if (isDnsError) {
        const urlObj = new URL(url);

        // Try with/without www
        let alternateUrl: string | null = null;
        
        if (!urlObj.hostname.startsWith('www.')) {
          alternateUrl = `${urlObj.protocol}//www.${urlObj.hostname}${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
          console.log(`[WAPPALYZER] DNS failed for ${url}, trying with www: ${alternateUrl}`);
        } else if (urlObj.hostname.startsWith('www.')) {
          alternateUrl = `${urlObj.protocol}//${urlObj.hostname.substring(4)}${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
          console.log(`[WAPPALYZER] DNS failed for ${url}, trying without www: ${alternateUrl}`);
        }

        if (alternateUrl) {
          attempts.push(alternateUrl);
          try {
            const result = await this.performTechnologyAnalysis(alternateUrl);
            console.log(`[WAPPALYZER] Success with alternate URL for ${url}`);
            return { ...result, finalUrl: alternateUrl };
          } catch (altError: any) {
            lastError = altError;
            console.log(`[WAPPALYZER] Alternate URL also failed: ${altError?.message}`);
          }
        }
      }
    }

    // All attempts failed - return empty results
    const attemptsList = attempts.join(', ');
    console.error(`[WAPPALYZER] All attempts failed for ${url}. Tried: ${attemptsList}`);
    
    return {
      technologies: [],
      isWordpress: false,
      isHubspot: false,
      finalUrl: url,
    };
  }
}