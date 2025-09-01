/**
 * Site Analyzer Service
 * Main orchestrator service that coordinates all analysis services
 */

import { WappalyzerService } from "./wappalyzer.service";
import { CrawlerService } from "./crawler.service";
import { AccessibilityService } from "./accessibility.service";
import { LighthouseService } from "./lighthouse.service";
import { DnsService } from "./dns.service";
import { SiteAnalyzerRepository } from "../repositories/site-analyzer.repository";
import { withCancellation } from "@/core/utils/cancellation";
import { URLUtils } from "@/core/utils/url-utils";
import { parallelLimit } from "@/core/utils/semaphore";
import type { ServiceOptions } from "@/core/types/service-options";
import { globalContext } from "@/core/context/global-context";
import type {
  AnalyzeSiteDto,
  SiteResponseDto,
  BulkAnalyzeDto,
  BulkAnalysisResultDto,
  CrawlSiteDto,
  CrawlResultDto,
  BulkCrawlDto,
  BulkCrawlResultDto,
  SiteSearchDto,
  SiteStatsDto,
  TechnologyStatsDto,
} from "../dto/site-analyzer.dto";
import { BusinessException } from "@/core/exceptions/base.exception";

export class SiteAnalyzerService {
  private wappalyzerService: WappalyzerService;
  private crawlerService: CrawlerService;
  private accessibilityService: AccessibilityService;
  private lighthouseService: LighthouseService;
  private dnsService: DnsService;
  private repository: SiteAnalyzerRepository;
  
  private readonly DEFAULT_TIMEOUT = 30000; // 30 seconds for site analysis
  private readonly BULK_TIMEOUT = 60000;    // 60 seconds for bulk operations
  private readonly MAX_CONCURRENT_ANALYSIS = 3; // Limit concurrent analysis operations

  constructor() {
    this.wappalyzerService = new WappalyzerService();
    this.crawlerService = new CrawlerService();
    this.accessibilityService = new AccessibilityService();
    this.lighthouseService = new LighthouseService();
    this.dnsService = new DnsService();
    this.repository = new SiteAnalyzerRepository();
  }

  /**
   * Analyze a single site
   */
  async analyzeSite(dto: AnalyzeSiteDto, options?: ServiceOptions): Promise<SiteResponseDto> {
    const signal = options?.signal || globalContext.signal;
    const timeout = options?.timeout || this.DEFAULT_TIMEOUT;
    const organizationId = globalContext.organizationId;
    const { 
      url, 
      force = false, 
      includeAccessibility = false,
      includeLighthouse = false,
      includeDns = false,
      maxPages = 10
    } = dto;

    try {
      console.log(`[SITE-ANALYZER] Starting analysis of ${url}`);

      // Check if we should skip based on existing data
      if (!force) {
        const existingDomain = await this.repository.findDomainRecord(new URL(url).hostname, organizationId);
        if (existingDomain) {
          const latestAudit = await this.repository.getLatestAuditResult(existingDomain.id, 'site-analysis');
          if (latestAudit && this.isRecentAnalysis(latestAudit.createdAt)) {
            console.log(`[SITE-ANALYZER] Using cached analysis for ${url}`);
            return latestAudit.results as SiteResponseDto;
          }
        }
      }

      // Normalize URL and extract domain info
      const normalizedUrl = URLUtils.normalize(url);
      const domain = URLUtils.extractDomain(normalizedUrl);

      // Create or update domain record
      const domainRecord = await this.repository.upsertDomainRecord({
        domain,
        name: URLUtils.generateDisplayName(normalizedUrl),
        organizationId,
      });

      if (!domainRecord || !domainRecord.id) {
        throw new BusinessException('Failed to create domain record');
      }

      // Run all analyses in parallel
      const analysisPromises: Promise<any>[] = [];

      // Technology detection (always run)
      analysisPromises.push(
        this.wappalyzerService.analyzeWithFallback({ url: normalizedUrl })
          .then(async (result) => {
            await this.repository.createAuditResult({
              domainRecordId: domainRecord.id!,
              url: normalizedUrl,
              auditType: 'technology-detection',
              status: 'completed',
              results: result,
              metadata: {
                isWordpress: result.isWordpress,
                isHubspot: result.isHubspot,
              },
            });
            return { technologies: result };
          })
          .catch((error) => {
            console.error(`[SITE-ANALYZER] Technology detection failed: ${error}`);
            return { technologies: null };
          })
      );

      // Crawling (limited pages)
      if (maxPages > 0) {
        analysisPromises.push(
          this.crawlerService.crawl({ startUrl: normalizedUrl, options: { 
            maxPages, 
            discoveryMode: true,
            includeMetadata: true 
          }})
            .then(async (result) => {
              // Save discovered domains as audit result
              if (result.discoveredDomains.length > 0) {
                await this.repository.createAuditResult({
                  domainRecordId: domainRecord.id!,
                  url: normalizedUrl,
                  auditType: 'domain-discovery',
                  status: 'completed',
                  score: result.discoveredDomains.length,
                  results: result.discoveredDomains,
                  metadata: { crawledPages: result.pages?.length || 0 },
                });
              }
              return { crawl: result };
            })
            .catch((error) => {
              console.error(`[SITE-ANALYZER] Crawling failed: ${error}`);
              return { crawl: null };
            })
        );
      }

      // Accessibility analysis
      if (includeAccessibility) {
        analysisPromises.push(
          this.accessibilityService.analyzeWithFallback(normalizedUrl)
            .then(async (result) => {
              await this.repository.createAuditResult({
                domainRecordId: domainRecord.id,
                url: normalizedUrl,
                auditType: 'accessibility',
                status: 'completed',
                results: result,
              });
              return { accessibility: result };
            })
            .catch((error) => {
              console.error(`[SITE-ANALYZER] Accessibility analysis failed: ${error}`);
              return { accessibility: null };
            })
        );
      }

      // Lighthouse analysis
      if (includeLighthouse) {
        analysisPromises.push(
          this.lighthouseService.analyzeWithFallback(normalizedUrl)
            .then(async (result) => {
              await this.repository.createAuditResult({
                domainRecordId: domainRecord.id!,
                url: normalizedUrl,
                auditType: 'lighthouse',
                status: 'completed',
                results: result,
              });
              return { lighthouse: result };
            })
            .catch((error) => {
              console.error(`[SITE-ANALYZER] Lighthouse analysis failed: ${error}`);
              return { lighthouse: null };
            })
        );
      }

      // DNS analysis
      if (includeDns) {
        analysisPromises.push(
          this.dnsService.analyzeWithFallback({ url: normalizedUrl })
            .then(async (result) => {
              await this.repository.createAuditResult({
                domainRecordId: domainRecord.id!,
                url: normalizedUrl,
                auditType: 'dns',
                status: 'completed',
                results: result,
              });
              return { dns: result };
            })
            .catch((error) => {
              console.error(`[SITE-ANALYZER] DNS analysis failed: ${error}`);
              return { dns: null };
            })
        );
      }

      // Wait for all analyses to complete with cancellation support
      const results = await withCancellation(
        Promise.allSettled(analysisPromises),
        signal,
        timeout
      );
      
      // Combine results
      const analysisData: any = {};
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          Object.assign(analysisData, result.value);
        }
      });

      // Create final site analysis audit result
      const finalAuditResult = await this.repository.createAuditResult({
        domainRecordId: domainRecord.id!,
        url: normalizedUrl,
        auditType: 'site-analysis',
        status: 'completed',
        results: analysisData,
        metadata: {
          analysisTimestamp: new Date(),
          includedServices: {
            accessibility: includeAccessibility,
            lighthouse: includeLighthouse,
            dns: includeDns,
            maxPages
          }
        },
      });
      
      if (!finalAuditResult) {
        throw new BusinessException('Failed to create audit result');
      }
      
      console.log(`[SITE-ANALYZER] Completed analysis of ${url}`);
      return finalAuditResult.results as SiteResponseDto;
    } catch (error) {
      console.error(`[SITE-ANALYZER] Error analyzing ${url}:`, error);
      throw error;
    }
  }

  /**
   * Bulk analyze multiple sites
   */
  async bulkAnalyze(dto: BulkAnalyzeDto, options?: ServiceOptions): Promise<BulkAnalysisResultDto> {
    const signal = options?.signal || globalContext.signal;
    const timeout = options?.timeout || this.BULK_TIMEOUT;
    const { urls, force = false, includeAccessibility = false, includeLighthouse = false } = dto;

    const analysisPromises = urls.map(url => 
      this.analyzeSite({
        url,
        force,
        includeAccessibility,
        includeLighthouse,
      }, { signal, timeout: this.DEFAULT_TIMEOUT })
    );

    const results = await withCancellation(
      parallelLimit(analysisPromises, this.MAX_CONCURRENT_ANALYSIS, async (promise) => {
        try {
          const result = await promise;
          return { status: 'fulfilled' as const, value: result };
        } catch (error) {
          return { status: 'rejected' as const, reason: error };
        }
      }),
      signal,
      timeout
    );

    const processed = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return {
      success: true,
      message: `Analyzed ${processed} sites successfully, ${failed} failed`,
      processed,
      failed,
      results: results.map((r, index) => ({
        url: urls[index] || '',
        success: r.status === 'fulfilled',
        error: r.status === 'rejected' ? (r.reason as any)?.message || String(r.reason) : undefined,
        data: r.status === 'fulfilled' ? (r.value as any) : undefined,
      })),
    };
  }

  /**
   * Crawl a site for discovery
   */
  async crawlSite(dto: CrawlSiteDto, options?: ServiceOptions): Promise<CrawlResultDto> {
    const signal = options?.signal || globalContext.signal;
    const timeout = options?.timeout || this.DEFAULT_TIMEOUT;
    const organizationId = globalContext.organizationId;
    const { url, maxPages = 100, followExternalLinks = false, discoveryMode = true } = dto;

    try {
      console.log(`[SITE-ANALYZER] Starting crawl of ${url}`);

      const result = await this.crawlerService.crawl({ startUrl: url, options: {
        maxPages,
        followExternalLinks,
        discoveryMode,
        includeMetadata: true,
      }});

      // Also run technology detection on the main URL
      let technologies: any[] = [];
      try {
        const techResult = await this.wappalyzerService.analyzeWithFallback({ url });
        technologies = techResult.technologies;
        
        // Create or update domain record
        const normalizedUrl = URLUtils.normalize(url);
        const domain = URLUtils.extractDomain(normalizedUrl);
        const domainRecord = await this.repository.upsertDomainRecord({
          domain,
          name: URLUtils.generateDisplayName(normalizedUrl),
          organizationId,
        });
        
        if (domainRecord?.id) {
          // Save technology detection results
          await this.repository.createAuditResult({
            domainRecordId: domainRecord.id,
            url,
            auditType: 'technology-detection',
            status: 'completed',
            results: techResult,
            metadata: {
              isWordpress: techResult.isWordpress,
              isHubspot: techResult.isHubspot,
            },
          });
          
          // Save discovered domains if any
          if (result.discoveredDomains.length > 0) {
            await this.repository.createAuditResult({
              domainRecordId: domainRecord.id,
              url,
              auditType: 'domain-discovery',
              status: 'completed',
              score: result.discoveredDomains.length,
              results: result.discoveredDomains,
              metadata: { crawledPages: result.pages?.length || 0 },
            });
          }
        }
      } catch (error) {
        console.error(`[SITE-ANALYZER] Technology detection failed during crawl: ${error}`);
      }

      return {
        url,
        success: true,
        pagesAnalyzed: result.pagesAnalyzed,
        discoveredDomains: result.discoveredDomains,
        technologies: technologies as any[],
        duration: result.duration,
      };
    } catch (error: any) {
      console.error(`[SITE-ANALYZER] Crawl failed for ${url}:`, error);
      return {
        url,
        success: false,
        pagesAnalyzed: 0,
        discoveredDomains: [],
        error: error?.message || 'Crawl failed',
      };
    }
  }

  /**
   * Bulk crawl multiple sites
   */
  async bulkCrawl(dto: BulkCrawlDto, organizationId: string): Promise<BulkCrawlResultDto> {
    const { urls, maxPages = 100, followExternalLinks = false } = dto;

    const results = await Promise.allSettled(
      urls.map((url) =>
        this.crawlSite({
          url,
          maxPages,
          followExternalLinks,
          discoveryMode: true,
        })
      )
    );

    const processed = results.filter(
      (r) => r.status === 'fulfilled' && r.value.success
    ).length;
    const failed = results.filter(
      (r) => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)
    ).length;

    return {
      success: true,
      message: `Crawled ${processed} sites successfully, ${failed} failed`,
      processed,
      failed,
      results: results.map((r) =>
        r.status === 'fulfilled' ? r.value : { 
          url: '',
          success: false,
          pagesAnalyzed: 0,
          discoveredDomains: [],
          error: 'Failed to crawl'
        }
      ),
    };
  }

  /**
   * Search for sites
   */
  async searchSites(dto: SiteSearchDto, organizationId: string): Promise<SiteResponseDto[]> {
    // Map old search filters to new audit-based system
    const filters: any = {};
    
    if (dto.query) {
      filters.domain = dto.query;
    }
    
    const results = await this.repository.searchDomainsWithAudits(organizationId, filters);
    
    // Transform results to match expected format
    return results.map((result: any) => ({
      id: result.domainRecord.id,
      url: `https://${result.domainRecord.properties?.domain || ''}`,
      domain: result.domainRecord.properties?.domain || '',
      displayName: result.domainRecord.displayName || '',
      lastAnalyzedAt: result.latestAudit?.createdAt,
      status: result.latestAudit?.status === 'completed' ? 200 : 500,
      technologies: result.latestAudit?.results?.technologies || [],
    }));
  }

  /**
   * Get site statistics
   */
  async getSiteStats(organizationId: string): Promise<SiteStatsDto> {
    // Get basic domain count statistics from audit results
    const today = new Date();
    const last24Hours = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // For now, return basic stats - this would need to be implemented with proper queries
    return {
      totalSites: 0,
      analyzedLast24Hours: 0,
      analyzedLast7Days: 0,
      wordpressSites: 0,
      hubspotSites: 0,
      totalTechnologies: 0,
      topTechnologies: [],
      topCategories: [],
    };
  }

  /**
   * Get technology statistics
   */
  async getTechnologyStats(technologyName: string, organizationId: string): Promise<TechnologyStatsDto> {
    // For now, return basic stats - this would need to be implemented with proper queries
    return {
      technologyName,
      totalSites: 0,
      averageConfidence: 0,
      categories: [],
      versions: [],
      recentSites: [],
    };
  }

  /**
   * Check if analysis is recent (within 24 hours)
   */
  private isRecentAnalysis(date?: Date): boolean {
    if (!date) return false;
    const hoursSinceAnalysis = (Date.now() - date.getTime()) / (1000 * 60 * 60);
    return hoursSinceAnalysis < 24;
  }

}