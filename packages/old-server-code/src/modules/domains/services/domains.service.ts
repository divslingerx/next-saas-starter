/**
 * Domains Service
 * Business logic for domain management and processing
 */

import { DomainsRepository } from "../repositories/domains.repository";
import type {
  DomainDto,
  DiscoveredDomainDto,
  ApproveDomainDto,
  BlockDomainDto,
  BulkDomainOperationDto,
  ProcessingQueueDto,
  QueueStatusDto,
  DomainNetworkDto,
  DomainGraphDto,
  DomainSearchDto,
  RelatedDomainsDto,
  DomainStatsDto,
  DomainComparisonDto,
  PopularDomainDto,
  BulkOperationResultDto,
  DomainSaveResultDto,
  ExtractDomainsDto,
  CrawlDomainsDto,
  CrawlResultDto,
} from "../dto/domains.dto";
import { BusinessException, ValidationException } from "@/core/exceptions/base.exception";
import { withCancellation } from "@/core/utils/cancellation";
import { globalContext } from "@/core/context/global-context";
import type { ServiceOptions } from "@/core/types/service-options";

export class DomainsService {
  private readonly repository: DomainsRepository;
  private readonly DEFAULT_TIMEOUT = 20000; // 20 seconds for domain operations

  constructor() {
    this.repository = new DomainsRepository();
  }

  /**
   * Get pending domains awaiting approval
   */
  async getPendingDomains(dto: { limit?: number }, options?: ServiceOptions): Promise<DiscoveredDomainDto[]> {
    const signal = options?.signal || globalContext.signal;
    const timeout = options?.timeout || this.DEFAULT_TIMEOUT;
    const { limit = 50 } = dto;

    return withCancellation(
      this.repository.getPendingDomains(limit),
      signal,
      timeout
    );
  }

  /**
   * Get domains ready for processing
   */
  async getDomainsReadyForProcessing(dto: { limit?: number }, options?: ServiceOptions): Promise<ProcessingQueueDto[]> {
    const signal = options?.signal || globalContext.signal;
    const timeout = options?.timeout || this.DEFAULT_TIMEOUT;
    const { limit = 10 } = dto;

    return withCancellation(
      this.repository.getDomainsReadyForProcessing(limit),
      signal,
      timeout
    );
  }

  /**
   * Approve a single domain
   */
  async approveDomain(dto: ApproveDomainDto, options?: ServiceOptions): Promise<void> {
    const signal = options?.signal || globalContext.signal;
    const timeout = options?.timeout || this.DEFAULT_TIMEOUT;

    if (!dto.domain) {
      throw new ValidationException("Domain is required");
    }

    return withCancellation(
      this.repository.approveDomain(dto.domain, dto.processAfter),
      signal,
      timeout
    );
  }

  /**
   * Block a single domain
   */
  async blockDomain(dto: BlockDomainDto, options?: ServiceOptions): Promise<void> {
    const signal = options?.signal || globalContext.signal;
    const timeout = options?.timeout || this.DEFAULT_TIMEOUT;

    if (!dto.domain) {
      throw new ValidationException("Domain is required");
    }

    if (!dto.reason) {
      throw new ValidationException("Reason is required for blocking");
    }

    return withCancellation(
      this.repository.blockDomain(dto.domain, dto.reason, dto.blockUntil),
      signal,
      timeout
    );
  }

  /**
   * Delete a single domain
   */
  async deleteDomain(dto: { domain: string }, options?: ServiceOptions): Promise<void> {
    const signal = options?.signal || globalContext.signal;
    const timeout = options?.timeout || this.DEFAULT_TIMEOUT;
    const { domain } = dto;

    if (!domain) {
      throw new ValidationException("Domain is required");
    }

    const deleted = await withCancellation(
      this.repository.deleteDomains([domain]),
      signal,
      timeout
    );
    
    if (deleted === 0) {
      throw new BusinessException(`Domain ${domain} not found`);
    }
  }

  /**
   * Bulk approve domains with concurrency control
   */
  async bulkApproveDomains(dto: BulkDomainOperationDto, options?: ServiceOptions): Promise<BulkOperationResultDto> {
    const signal = options?.signal || globalContext.signal;
    const timeout = options?.timeout || this.DEFAULT_TIMEOUT * 2; // Double timeout for bulk operations

    if (!dto.domains || dto.domains.length === 0) {
      throw new ValidationException("Domains array is required and must not be empty");
    }

    // Use concurrency control for large batches
    const { Semaphore } = await import('@/core/utils/semaphore');
    const semaphore = new Semaphore(5); // Limit to 5 concurrent operations
    
    const wrappedOperation = async (domain: string) => {
      return semaphore.execute(() => {
        return this.repository.approveDomain(domain, dto.processAfter);
      });
    };

    const results = await withCancellation(
      Promise.allSettled(dto.domains.map(wrappedOperation)),
      signal,
      timeout
    );

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    const errors = results
      .map((r, index) => {
        if (r.status === "rejected") {
          return {
            domain: dto.domains[index],
            error: r.reason?.message || "Unknown error",
          };
        }
        return null;
      })
      .filter(Boolean) as Array<{ domain: string; error: string }>;

    return {
      success: succeeded > 0,
      message: `Bulk operation complete: ${succeeded} succeeded, ${failed} failed`,
      details: {
        succeeded,
        failed,
        total: dto.domains.length,
      },
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Bulk block domains
   */
  async bulkBlockDomains(dto: BulkDomainOperationDto): Promise<BulkOperationResultDto> {
    if (!dto.domains || dto.domains.length === 0) {
      throw new ValidationException("Domains array is required and must not be empty");
    }

    if (!dto.reason) {
      throw new ValidationException("Reason is required for blocking");
    }

    const results = await Promise.allSettled(
      dto.domains.map((domain) =>
        this.repository.blockDomain(domain, dto.reason!, dto.blockUntil)
      )
    );

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    const errors = results
      .map((r, index) => {
        if (r.status === "rejected") {
          return {
            domain: dto.domains[index],
            error: r.reason?.message || "Unknown error",
          };
        }
        return null;
      })
      .filter(Boolean) as Array<{ domain: string; error: string }>;

    return {
      success: succeeded > 0,
      message: `Bulk operation complete: ${succeeded} succeeded, ${failed} failed`,
      details: {
        succeeded,
        failed,
        total: dto.domains.length,
      },
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Bulk delete domains
   */
  async bulkDeleteDomains(domains: string[]): Promise<BulkOperationResultDto> {
    if (!domains || domains.length === 0) {
      throw new ValidationException("Domains array is required and must not be empty");
    }

    const deleted = await this.repository.deleteDomains(domains);

    return {
      success: true,
      message: `${deleted} domains have been deleted`,
      details: {
        succeeded: deleted,
        failed: domains.length - deleted,
        total: domains.length,
      },
    };
  }

  /**
   * Get domain relationships
   */
  async getDomainRelationships(dto: { domain: string }, options?: ServiceOptions): Promise<DomainNetworkDto> {
    const signal = options?.signal || globalContext.signal;
    const timeout = options?.timeout || this.DEFAULT_TIMEOUT;
    const { domain } = dto;

    if (!domain) {
      throw new ValidationException("Domain is required");
    }

    return withCancellation(
      this.repository.getDomainRelationships(domain),
      signal,
      timeout
    );
  }

  /**
   * Get domain network graph
   */
  async getDomainNetworkGraph(
    domain: string,
    depth: number = 1,
    limit: number = 50
  ): Promise<DomainGraphDto> {
    if (!domain) {
      throw new ValidationException("Domain is required");
    }

    // Get initial relationships
    const network = await this.repository.getDomainRelationships(domain);
    
    const nodes = new Map<string, { type: 'source' | 'target' | 'both'; linkCount: number }>();
    const edges: Array<{ source: string; target: string; weight: number }> = [];

    // Add central node
    nodes.set(domain, { type: 'both', linkCount: network.totalIncoming + network.totalOutgoing });

    // Add outgoing links
    network.linkedTo.slice(0, limit).forEach((rel) => {
      const existing = nodes.get(rel.targetDomain);
      nodes.set(rel.targetDomain, {
        type: existing?.type === 'source' ? 'both' : 'target',
        linkCount: (existing?.linkCount || 0) + rel.linkCount,
      });
      edges.push({
        source: domain,
        target: rel.targetDomain,
        weight: rel.linkCount,
      });
    });

    // Add incoming links
    network.linkedFrom.slice(0, limit).forEach((rel) => {
      const existing = nodes.get(rel.sourceDomain);
      nodes.set(rel.sourceDomain, {
        type: existing?.type === 'target' ? 'both' : 'source',
        linkCount: (existing?.linkCount || 0) + rel.linkCount,
      });
      edges.push({
        source: rel.sourceDomain,
        target: domain,
        weight: rel.linkCount,
      });
    });

    // If depth > 1, fetch additional levels (simplified for now)
    // This could be expanded to fetch multiple levels of relationships

    return {
      nodes: Array.from(nodes.entries()).map(([domain, data]) => ({
        id: domain,
        domain,
        type: data.type,
        linkCount: data.linkCount,
      })),
      edges,
    };
  }

  /**
   * Get related domains (subdomains)
   */
  async getRelatedDomains(domain: string): Promise<RelatedDomainsDto> {
    if (!domain) {
      throw new ValidationException("Domain is required");
    }

    return this.repository.getRelatedDomains(domain);
  }

  /**
   * Get domain statistics
   */
  async getDomainStats(dto: {}, options?: ServiceOptions): Promise<DomainStatsDto> {
    const signal = options?.signal || globalContext.signal;
    const timeout = options?.timeout || this.DEFAULT_TIMEOUT;

    return withCancellation(
      this.repository.getDomainStats(),
      signal,
      timeout
    );
  }

  /**
   * Get processing queue status
   */
  async getProcessingStatus(): Promise<QueueStatusDto> {
    const stats = await this.repository.getDomainStats();
    const recentlyProcessed = await this.repository.getDomainsReadyForProcessing(10);

    return {
      pending: stats.pending,
      processing: 0, // Could be tracked separately
      completed: stats.processed,
      failed: 0, // Could be tracked separately
      recentlyProcessed,
    };
  }

  /**
   * Compare two domains
   */
  async compareDomains(domain1: string, domain2: string): Promise<DomainComparisonDto> {
    if (!domain1 || !domain2) {
      throw new ValidationException("Both domain1 and domain2 are required");
    }

    const results = await this.repository.findCommonLinkedDomains(domain1, domain2);
    
    // Return a single comparison result, or a default structure if no results
    return results[0] || {
      domain1,
      domain2,
      commonLinkedDomains: [],
      domain1UniqueLinks: [],
      domain2UniqueLinks: [],
      similarity: 0
    };
  }

  /**
   * Get most popular domains
   */
  async getPopularDomains(limit: number = 20): Promise<PopularDomainDto[]> {
    return this.repository.getMostLinkedDomains(limit);
  }

  /**
   * Find domains linking to multiple targets
   */
  async findDomainsLinkingToMultiple(
    domains: string[],
    minLinks: number = 2
  ): Promise<DomainNetworkDto[]> {
    if (!domains || domains.length === 0) {
      throw new ValidationException("Domains array is required");
    }

    // Get relationships for each domain and find overlaps
    const networks = await Promise.all(
      domains.map((domain) => this.repository.getDomainRelationships(domain))
    );

    // This is simplified - could be expanded to find actual overlapping sources
    return networks.filter((n) => n.totalIncoming >= minLinks);
  }

  /**
   * Process next domain in queue
   */
  async processNextDomain(): Promise<ProcessingQueueDto | null> {
    const queueItem = await this.repository.getNextQueueItem();
    
    if (!queueItem) {
      return null;
    }

    // Processing logic would go here
    // For now, just return the item
    // In a real implementation, this would trigger analysis
    
    return queueItem;
  }

  /**
   * Mark queue item as complete
   */
  async markQueueItemComplete(id: number): Promise<void> {
    await this.repository.markQueueItemComplete(id);
  }

  /**
   * Mark queue item as failed
   */
  async markQueueItemFailed(id: number, error: string): Promise<void> {
    await this.repository.markQueueItemFailed(id, error);
  }

  /**
   * Save discovered domains from crawling
   */
  async saveDiscoveredDomains(
    dto: { siteId: number; domains: Set<string> },
    options?: ServiceOptions
  ): Promise<DomainSaveResultDto> {
    const signal = options?.signal || globalContext.signal;
    const timeout = options?.timeout || this.DEFAULT_TIMEOUT;
    const { siteId, domains } = dto;

    return withCancellation(
      this.repository.saveDiscoveredDomains(siteId, Array.from(domains)),
      signal,
      timeout
    );
  }

  /**
   * Extract domains from HTML content
   */
  extractDomainsFromHtml(html: string): Set<string> {
    const domains = new Set<string>();
    
    // Extract URLs from href attributes
    const hrefRegex = /href=["']([^"']+)["']/gi;
    let match;
    
    while ((match = hrefRegex.exec(html)) !== null) {
      try {
        const url = match[1];
        if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
          const domain = new URL(url).hostname.toLowerCase();
          domains.add(domain);
        }
      } catch {
        // Ignore invalid URLs
      }
    }

    // Extract URLs from src attributes
    const srcRegex = /src=["']([^"']+)["']/gi;
    while ((match = srcRegex.exec(html)) !== null) {
      try {
        const url = match[1];
        if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
          const domain = new URL(url).hostname.toLowerCase();
          domains.add(domain);
        }
      } catch {
        // Ignore invalid URLs
      }
    }

    return domains;
  }

  /**
   * Check if domain needs reanalysis
   */
  async checkIfDomainNeedsReanalysis(
    domain: string,
    hoursThreshold: number = 24
  ): Promise<boolean> {
    // This would check last analysis time
    // For now, return true to allow reanalysis
    return true;
  }
}