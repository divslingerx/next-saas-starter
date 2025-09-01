/**
 * Domains DTOs
 * Data transfer objects for domain management operations
 */

// Domain Management DTOs
export interface DomainDto {
  id?: number;
  domain: string;
  sourceUrl?: string;
  sourceSiteId?: number;
  status: 'pending' | 'approved' | 'blocked' | 'processing' | 'completed' | 'failed';
  discoveredAt: Date;
  approvedAt?: Date;
  blockedAt?: Date;
  blockedUntil?: Date;
  blockReason?: string;
  processAfter?: Date;
  metadata?: Record<string, any>;
}

export interface DiscoveredDomainDto {
  domain: string;
  sourceUrl: string;
  discoveredAt: Date;
  isInternal: boolean;
  isApproved?: boolean;
  isBlocked?: boolean;
}

export interface IgnoredDomainDto {
  id?: number;
  domain: string;
  reason: string;
  createdAt: Date;
  expiresAt?: Date;
}

// Domain Operations DTOs
export interface ApproveDomainDto {
  domain: string;
  processAfter?: Date;
}

export interface BlockDomainDto {
  domain: string;
  reason: string;
  blockUntil?: Date;
}

export interface BulkDomainOperationDto {
  domains: string[];
  processAfter?: Date;
  reason?: string;
  blockUntil?: Date;
}

// Domain Processing DTOs
export interface ProcessingQueueDto {
  id?: number;
  domain: string;
  url?: string;
  priority: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  lastAttemptAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
  scheduledFor?: Date;
}

export interface QueueStatusDto {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  recentlyProcessed: ProcessingQueueDto[];
}

// Domain Relationship DTOs
export interface DomainRelationshipDto {
  id?: number;
  sourceDomain: string;
  targetDomain: string;
  linkCount: number;
  firstSeenAt: Date;
  lastSeenAt: Date;
}

export interface DomainNetworkDto {
  domain: string;
  linkedTo: DomainRelationshipDto[];
  linkedFrom: DomainRelationshipDto[];
  totalOutgoing: number;
  totalIncoming: number;
}

export interface DomainGraphDto {
  nodes: Array<{
    id: string;
    domain: string;
    type: 'source' | 'target' | 'both';
    linkCount: number;
  }>;
  edges: Array<{
    source: string;
    target: string;
    weight: number;
  }>;
}

// Domain Search/Filter DTOs
export interface DomainSearchDto {
  query?: string;
  status?: DomainDto['status'][];
  sourceUrl?: string;
  discoveredAfter?: Date;
  discoveredBefore?: Date;
  limit?: number;
  offset?: number;
}

export interface RelatedDomainsDto {
  current: string;
  baseDomain: string;
  parent?: {
    domain: string;
    url: string;
    lastAnalyzedAt?: Date;
  };
  subdomains: Array<{
    domain: string;
    url: string;
    lastAnalyzedAt?: Date;
  }>;
  total: number;
}

// Domain Statistics DTOs
export interface DomainStatsDto {
  totalDiscovered: number;
  pending: number;
  approved: number;
  blocked: number;
  processed: number;
  discoveredLast24h: number;
  discoveredLast7d: number;
  topSources: Array<{
    sourceUrl: string;
    count: number;
  }>;
  topBlocked: Array<{
    domain: string;
    reason: string;
  }>;
}

export interface DomainComparisonDto {
  domain1: string;
  domain2: string;
  commonLinkedDomains: string[];
  domain1UniqueLinks: string[];
  domain2UniqueLinks: string[];
  similarity: number;
}

export interface PopularDomainDto {
  domain: string;
  incomingLinks: number;
  uniqueSources: number;
  firstSeen: Date;
  lastSeen: Date;
}

// Bulk Operation Results
export interface BulkOperationResultDto {
  success: boolean;
  message: string;
  details: {
    succeeded: number;
    failed: number;
    total: number;
  };
  errors?: Array<{
    domain: string;
    error: string;
  }>;
}

// Domain Discovery DTOs
export interface DomainSaveResultDto {
  new: number;
  existing: number;
  ignored: number;
  errors: string[];
}

export interface ExtractDomainsDto {
  url: string;
  html?: string;
  maxPages?: number;
  followExternalLinks?: boolean;
}

export interface CrawlDomainsDto {
  url: string;
  extractDomains: boolean;
  maxPages?: number;
}

export interface CrawlResultDto {
  url: string;
  finalUrl: string;
  domainsFound: number;
  domainStats: DomainSaveResultDto;
  technologies?: number;
  analysis?: {
    wappalyzer: boolean;
    axe: boolean;
    lighthouse: boolean;
  };
}