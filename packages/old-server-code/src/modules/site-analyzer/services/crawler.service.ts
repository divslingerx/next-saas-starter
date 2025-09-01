/**
 * Crawler Service
 * Handles web crawling and scraping functionality
 * Can be used for site analysis, domain discovery, and future scraping needs
 */

import type { DiscoveredDomainDto } from "../dto/site-analyzer.dto";
import { ValidationException } from "@/core/exceptions/base.exception";
import { withCancellation } from "@/core/utils/cancellation";
import { globalContext } from "@/core/context/global-context";
import type { ServiceOptions } from "@/core/types/service-options";

export interface CrawlOptions {
  maxPages?: number;
  followExternalLinks?: boolean;
  discoveryMode?: boolean;
  includeMetadata?: boolean;
  timeout?: number;
  userAgent?: string;
}

export interface PageData {
  url: string;
  title?: string;
  description?: string;
  keywords?: string[];
  headings?: {
    h1: string[];
    h2: string[];
    h3: string[];
  };
  links: {
    internal: string[];
    external: string[];
  };
  images?: string[];
  scripts?: string[];
  stylesheets?: string[];
  meta?: Record<string, string>;
  statusCode?: number;
  contentType?: string;
  html?: string; // Raw HTML if needed for scraping
}

export interface CrawlResult {
  startUrl: string;
  pagesAnalyzed: number;
  pages: PageData[];
  discoveredDomains: DiscoveredDomainDto[];
  errors: Array<{ url: string; error: string }>;
  duration: number;
}

export class CrawlerService {
  private readonly DEFAULT_TIMEOUT = 60000; // 60 seconds for crawl operations
  private visitedUrls: Set<string> = new Set();
  private discoveredDomains: Map<string, DiscoveredDomainDto> = new Map();
  private errors: Array<{ url: string; error: string }> = [];
  private startTime: number = 0;

  /**
   * Crawl a website starting from the given URL
   */
  async crawl(
    dto: { startUrl: string; options?: CrawlOptions },
    options?: ServiceOptions
  ): Promise<CrawlResult> {
    const signal = options?.signal || globalContext.signal;
    const timeout = options?.timeout || this.DEFAULT_TIMEOUT;
    const { startUrl, options: crawlOptions = {} } = dto;

    return withCancellation(
      this.performCrawl(startUrl, crawlOptions, signal),
      signal,
      timeout
    );
  }

  /**
   * Internal crawl implementation with signal support
   */
  private async performCrawl(
    startUrl: string,
    options: CrawlOptions = {},
    signal?: AbortSignal
  ): Promise<CrawlResult> {
    this.reset();
    this.startTime = Date.now();

    const {
      maxPages = 10,
      followExternalLinks = false,
      discoveryMode = false,
      includeMetadata = true,
      timeout = 30000,
      userAgent = 'Mozilla/5.0 (compatible; SiteAnalyzer/1.0)',
    } = options;

    // Validate and normalize start URL
    const normalizedUrl = this.normalizeUrl(startUrl);
    const baseUrl = new URL(normalizedUrl);
    const baseDomain = baseUrl.hostname;

    const pages: PageData[] = [];
    const urlQueue: string[] = [normalizedUrl];

    while (urlQueue.length > 0 && pages.length < maxPages) {
      const url = urlQueue.shift()!;

      if (this.visitedUrls.has(url)) {
        continue;
      }

      try {
        console.log(`[CRAWLER] Crawling page ${pages.length + 1}/${maxPages}: ${url}`);
        
        const pageData = await this.crawlPage(url, {
          timeout,
          userAgent,
          includeMetadata,
        }, signal);

        this.visitedUrls.add(url);
        pages.push(pageData);

        // Extract and process links
        const currentUrlObj = new URL(url);
        
        // Process internal links
        for (const link of pageData.links.internal) {
          const absoluteUrl = this.resolveUrl(link, url);
          if (absoluteUrl && !this.visitedUrls.has(absoluteUrl)) {
            const linkUrl = new URL(absoluteUrl);
            
            // Check if link is on same domain
            if (linkUrl.hostname === baseDomain) {
              urlQueue.push(absoluteUrl);
            }
          }
        }

        // Process external links for domain discovery
        if (discoveryMode || followExternalLinks) {
          for (const link of pageData.links.external) {
            const absoluteUrl = this.resolveUrl(link, url);
            if (absoluteUrl) {
              const linkUrl = new URL(absoluteUrl);
              const domain = linkUrl.hostname;

              if (!this.discoveredDomains.has(domain)) {
                this.discoveredDomains.set(domain, {
                  domain,
                  sourceUrl: url,
                  discoveredAt: new Date(),
                  isInternal: domain === baseDomain,
                });
              }

              if (followExternalLinks && !this.visitedUrls.has(absoluteUrl)) {
                urlQueue.push(absoluteUrl);
              }
            }
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[CRAWLER] Error crawling ${url}:`, errorMessage);
        this.errors.push({ url, error: errorMessage });
      }
    }

    const duration = Date.now() - this.startTime;

    return {
      startUrl,
      pagesAnalyzed: pages.length,
      pages,
      discoveredDomains: Array.from(this.discoveredDomains.values()),
      errors: this.errors,
      duration,
    };
  }

  /**
   * Crawl a single page and extract data
   */
  private async crawlPage(url: string, options: {
    timeout: number;
    userAgent: string;
    includeMetadata: boolean;
  }, signal?: AbortSignal): Promise<PageData> {
    // Use provided signal or create new one with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout);
    
    // If parent signal is aborted, abort this request too
    if (signal?.aborted) {
      throw new Error('Operation was cancelled');
    }
    
    const onParentAbort = () => controller.abort();
    signal?.addEventListener('abort', onParentAbort, { once: true });

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': options.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: controller.signal,
        redirect: 'follow',
      });

      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type') || '';
      
      // Only process HTML content
      if (!contentType.includes('text/html')) {
        return {
          url,
          links: { internal: [], external: [] },
          statusCode: response.status,
          contentType,
        };
      }

      const html = await response.text();
      
      // Parse HTML and extract data
      const pageData = this.parseHtml(html, url, options.includeMetadata);
      pageData.statusCode = response.status;
      pageData.contentType = contentType;

      return pageData;
    } catch (error) {
      clearTimeout(timeoutId);
      signal?.removeEventListener('abort', onParentAbort);
      
      if (error instanceof Error && error.name === 'AbortError') {
        if (signal?.aborted) {
          throw new Error('Operation was cancelled');
        }
        throw new Error(`Timeout after ${options.timeout}ms`);
      }
      
      throw error;
    } finally {
      signal?.removeEventListener('abort', onParentAbort);
    }
  }

  /**
   * Parse HTML and extract structured data
   */
  private parseHtml(html: string, pageUrl: string, includeMetadata: boolean): PageData {
    const pageData: PageData = {
      url: pageUrl,
      links: { internal: [], external: [] },
    };

    // Use regex for basic HTML parsing (consider using a proper HTML parser for production)
    
    // Extract title
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      pageData.title = this.cleanText(titleMatch[1]);
    }

    // Extract meta description
    const descMatch = html.match(/<meta\s+name=["']description["'][^>]*content=["']([^"']+)["']/i);
    if (descMatch && descMatch[1]) {
      pageData.description = this.cleanText(descMatch[1]);
    }

    // Extract meta keywords
    const keywordsMatch = html.match(/<meta\s+name=["']keywords["'][^>]*content=["']([^"']+)["']/i);
    if (keywordsMatch && keywordsMatch[1]) {
      pageData.keywords = keywordsMatch[1].split(',').map(k => k.trim());
    }

    if (includeMetadata) {
      // Extract headings
      pageData.headings = {
        h1: this.extractHeadings(html, 'h1'),
        h2: this.extractHeadings(html, 'h2'),
        h3: this.extractHeadings(html, 'h3'),
      };

      // Extract images
      pageData.images = this.extractAttributes(html, 'img', 'src');

      // Extract scripts
      pageData.scripts = this.extractAttributes(html, 'script', 'src');

      // Extract stylesheets
      const linkRegex = /<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/gi;
      const stylesheets: string[] = [];
      let linkMatch;
      while ((linkMatch = linkRegex.exec(html)) !== null) {
        if (linkMatch[1]) {
          stylesheets.push(linkMatch[1]);
        }
      }
      pageData.stylesheets = stylesheets;

      // Extract all meta tags
      pageData.meta = this.extractMetaTags(html);
    }

    // Extract links
    const linkRegex = /<a[^>]*href=["']([^"']+)["']/gi;
    let match;
    const pageUrlObj = new URL(pageUrl);

    while ((match = linkRegex.exec(html)) !== null) {
      const href = match[1];
      
      if (href && this.isValidUrl(href)) {
        try {
          const linkUrl = new URL(href, pageUrl);
          
          // Classify as internal or external
          if (linkUrl.hostname === pageUrlObj.hostname) {
            pageData.links.internal.push(linkUrl.href);
          } else {
            pageData.links.external.push(linkUrl.href);
          }
        } catch {
          // Skip invalid URLs
        }
      }
    }

    // Remove duplicates
    pageData.links.internal = [...new Set(pageData.links.internal)];
    pageData.links.external = [...new Set(pageData.links.external)];

    return pageData;
  }

  /**
   * Extract headings from HTML
   */
  private extractHeadings(html: string, tag: string): string[] {
    const regex = new RegExp(`<${tag}[^>]*>(.*?)<\/${tag}>`, 'gi');
    const headings: string[] = [];
    let match;

    while ((match = regex.exec(html)) !== null) {
      if (match[1]) {
        const text = this.cleanText(match[1]);
        if (text) {
          headings.push(text);
        }
      }
    }

    return headings;
  }

  /**
   * Extract attributes from HTML tags
   */
  private extractAttributes(html: string, tag: string, attribute: string): string[] {
    const regex = new RegExp(`<${tag}[^>]*${attribute}=["']([^"']+)["']`, 'gi');
    const values: string[] = [];
    let match;

    while ((match = regex.exec(html)) !== null) {
      if (match[1]) {
        values.push(match[1]);
      }
    }

    return [...new Set(values)];
  }

  /**
   * Extract meta tags
   */
  private extractMetaTags(html: string): Record<string, string> {
    const meta: Record<string, string> = {};
    const regex = /<meta\s+([^>]+)>/gi;
    let match;

    while ((match = regex.exec(html)) !== null) {
      if (match[1]) {
        const nameMatch = match[1].match(/name=["']([^"']+)["']/i);
        const propertyMatch = match[1].match(/property=["']([^"']+)["']/i);
        const contentMatch = match[1].match(/content=["']([^"']+)["']/i);

        if (contentMatch && contentMatch[1]) {
          const key = nameMatch?.[1] || propertyMatch?.[1];
          if (key) {
            meta[key] = contentMatch[1];
          }
        }
      }
    }

    return meta;
  }

  /**
   * Clean text by removing HTML tags and extra whitespace
   */
  private cleanText(text: string): string {
    return text
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Normalize URL
   */
  private normalizeUrl(url: string): string {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    const urlObj = new URL(url);
    // Remove trailing slash from path if it's just the root
    if (urlObj.pathname === '/') {
      return urlObj.origin;
    }
    
    return urlObj.href;
  }

  /**
   * Resolve relative URL to absolute
   */
  private resolveUrl(url: string, baseUrl: string): string | null {
    try {
      // Skip non-HTTP URLs
      if (url.startsWith('mailto:') || url.startsWith('tel:') || url.startsWith('javascript:')) {
        return null;
      }

      const resolved = new URL(url, baseUrl);
      return resolved.href;
    } catch {
      return null;
    }
  }

  /**
   * Check if string is a valid URL or path
   */
  private isValidUrl(url: string): boolean {
    if (!url || url.startsWith('#') || url.startsWith('javascript:') || 
        url.startsWith('mailto:') || url.startsWith('tel:')) {
      return false;
    }
    return true;
  }

  /**
   * Reset crawler state
   */
  private reset(): void {
    this.visitedUrls.clear();
    this.discoveredDomains.clear();
    this.errors = [];
    this.startTime = 0;
  }
}