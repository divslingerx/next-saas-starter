/**
 * Site Analyzer DTOs
 * Data transfer objects for site analysis operations
 */

// Analysis Request DTOs
export interface AnalyzeSiteDto {
  url: string;
  force?: boolean;
  includeAccessibility?: boolean;
  includeLighthouse?: boolean;
  includeDns?: boolean;
  maxPages?: number;
}

export interface BulkAnalyzeDto {
  urls: string[];
  force?: boolean;
  includeAccessibility?: boolean;
  includeLighthouse?: boolean;
}

export interface CrawlSiteDto {
  url: string;
  maxPages?: number;
  followExternalLinks?: boolean;
  discoveryMode?: boolean;
}

export interface BulkCrawlDto {
  urls: string[];
  maxPages?: number;
  followExternalLinks?: boolean;
}

// Technology DTOs
export interface TechnologyDto {
  slug: string;
  name: string;
  confidence: number;
  version?: string;
  website?: string;
  description?: string;
  cpe?: string;
  icon?: string;
  categories: CategoryDto[];
}

export interface CategoryDto {
  id: number;
  slug: string;
  name: string;
}

// Site DTOs
export interface SiteDto {
  id?: number;
  url: string;
  domain: string;
  displayName: string;
  lastAnalyzedAt?: Date;
  status?: number;
  error?: string;
  isWordpress?: boolean;
  isHubspot?: boolean;
}

export interface SiteResponseDto extends SiteDto {
  technologies?: TechnologyDto[];
  crawledPages?: number;
  discoveredDomains?: string[];
  accessibility?: AccessibilityResultDto;
  lighthouse?: LighthouseResultDto;
  dns?: DnsRecordsDto;
}

export interface SiteSearchDto {
  query?: string;
  limit?: number;
  offset?: number;
  technologyFilter?: string[];
  categoryFilter?: string[];
  isWordpress?: boolean;
  isHubspot?: boolean;
}

// Analysis Result DTOs
export interface AnalysisResultDto {
  id?: number;
  siteId: number;
  url: string;
  status: number;
  analyzedAt: Date;
  technologies: TechnologyDto[];
  isWordpress: boolean;
  isHubspot: boolean;
  error?: string;
}

export interface AccessibilityResultDto {
  score: number;
  totalViolations: number;
  criticalViolations: number;
  seriousViolations: number;
  moderateViolations: number;
  minorViolations: number;
  violations: AccessibilityViolationDto[];
  analyzedAt: Date;
}

export interface AccessibilityViolationDto {
  id: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  description: string;
  help: string;
  helpUrl: string;
  nodes: number;
  tags: string[];
}

export interface LighthouseResultDto {
  performanceScore: number;
  accessibilityScore: number;
  bestPracticesScore: number;
  seoScore: number;
  pwaScore: number;
  metrics: LighthouseMetricsDto;
  analyzedAt: Date;
}

export interface LighthouseMetricsDto {
  firstContentfulPaint: number;
  speedIndex: number;
  largestContentfulPaint: number;
  timeToInteractive: number;
  totalBlockingTime: number;
  cumulativeLayoutShift: number;
  firstMeaningfulPaint?: number;
  timeToFirstByte?: number;
}

export interface DnsRecordsDto {
  a?: string[];
  aaaa?: string[];
  mx?: Array<{ priority: number; exchange: string }>;
  txt?: string[];
  ns?: string[];
  cname?: string;
  soa?: {
    nsname: string;
    hostmaster: string;
    serial: number;
    refresh: number;
    retry: number;
    expire: number;
    minttl: number;
  };
}

// Crawl Result DTOs
export interface CrawlResultDto {
  url: string;
  success: boolean;
  pagesAnalyzed: number;
  discoveredDomains: DiscoveredDomainDto[];
  technologies?: TechnologyDto[];
  error?: string;
  duration?: number;
}

export interface DiscoveredDomainDto {
  domain: string;
  sourceUrl: string;
  discoveredAt: Date;
  isInternal: boolean;
  isApproved?: boolean;
  isBlocked?: boolean;
}

// Statistics DTOs
export interface SiteStatsDto {
  totalSites: number;
  analyzedLast24Hours: number;
  analyzedLast7Days: number;
  wordpressSites: number;
  hubspotSites: number;
  totalTechnologies: number;
  topTechnologies: Array<{
    name: string;
    count: number;
    confidence: number;
  }>;
  topCategories: Array<{
    name: string;
    count: number;
  }>;
}

export interface TechnologyStatsDto {
  technologyName: string;
  totalSites: number;
  averageConfidence: number;
  categories: string[];
  versions: Array<{
    version: string;
    count: number;
  }>;
  recentSites: SiteDto[];
}

// Bulk Operation Results
export interface BulkAnalysisResultDto {
  success: boolean;
  message: string;
  processed: number;
  failed: number;
  results: Array<{
    url: string;
    success: boolean;
    error?: string;
    data?: AnalysisResultDto;
  }>;
}

export interface BulkCrawlResultDto {
  success: boolean;
  message: string;
  processed: number;
  failed: number;
  results: CrawlResultDto[];
}

// Filter/Query DTOs
export interface TechnologyFilterDto {
  technologies?: string[];
  categories?: string[];
  minConfidence?: number;
  analyzedAfter?: Date;
  analyzedBefore?: Date;
  limit?: number;
  offset?: number;
}

export interface SiteFilterDto {
  domain?: string;
  url?: string;
  isWordpress?: boolean;
  isHubspot?: boolean;
  hasError?: boolean;
  analyzedAfter?: Date;
  analyzedBefore?: Date;
  status?: number;
  limit?: number;
  offset?: number;
}