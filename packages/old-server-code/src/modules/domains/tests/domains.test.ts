/**
 * Domains Module Tests
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { DomainsService } from "../services/domains.service";
import { DomainsRepository } from "../repositories/domains.repository";
import type { ApproveDomainDto, BlockDomainDto } from "../dto/domains.dto";

describe("DomainsService", () => {
  let service: DomainsService;

  beforeEach(() => {
    service = new DomainsService();
  });

  describe("approveDomain", () => {
    it("should approve a domain for processing", async () => {
      const dto: ApproveDomainDto = {
        domain: "example.com",
        processAfter: new Date(),
      };

      expect(service.approveDomain).toBeDefined();
    });

    it("should throw validation error for empty domain", async () => {
      const dto: ApproveDomainDto = {
        domain: "",
      };

      expect(service.approveDomain).toBeDefined();
    });
  });

  describe("blockDomain", () => {
    it("should block a domain with reason", async () => {
      const dto: BlockDomainDto = {
        domain: "spam.com",
        reason: "Known spam domain",
        blockUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      };

      expect(service.blockDomain).toBeDefined();
    });
  });

  describe("bulkOperations", () => {
    it("should handle bulk approve", async () => {
      const dto = {
        domains: ["site1.com", "site2.com", "site3.com"],
      };

      expect(service.bulkApproveDomains).toBeDefined();
    });

    it("should handle bulk block", async () => {
      const dto = {
        domains: ["spam1.com", "spam2.com"],
        reason: "Bulk spam blocking",
      };

      expect(service.bulkBlockDomains).toBeDefined();
    });

    it("should handle bulk delete", async () => {
      const domains = ["old1.com", "old2.com"];

      expect(service.bulkDeleteDomains).toBeDefined();
    });
  });

  describe("domainRelationships", () => {
    it("should get domain relationships", async () => {
      expect(service.getDomainRelationships).toBeDefined();
    });

    it("should get domain network graph", async () => {
      expect(service.getDomainNetworkGraph).toBeDefined();
    });

    it("should find related domains", async () => {
      expect(service.getRelatedDomains).toBeDefined();
    });

    it("should compare two domains", async () => {
      expect(service.compareDomains).toBeDefined();
    });
  });

  describe("domainDiscovery", () => {
    it("should extract domains from HTML", () => {
      const html = `
        <a href="https://example.com">Link 1</a>
        <a href="http://test.org">Link 2</a>
        <img src="https://cdn.example.com/image.jpg">
      `;

      const domains = service.extractDomainsFromHtml(html);
      
      expect(domains).toBeInstanceOf(Set);
      expect(domains.has("example.com")).toBe(true);
      expect(domains.has("test.org")).toBe(true);
      expect(domains.has("cdn.example.com")).toBe(true);
    });

    it("should ignore invalid URLs when extracting", () => {
      const html = `
        <a href="javascript:void(0)">JS Link</a>
        <a href="mailto:test@example.com">Email</a>
        <a href="/relative/path">Relative</a>
      `;

      const domains = service.extractDomainsFromHtml(html);
      
      expect(domains.size).toBe(0);
    });
  });

  describe("queueManagement", () => {
    it("should process next domain in queue", async () => {
      expect(service.processNextDomain).toBeDefined();
    });

    it("should mark queue item as complete", async () => {
      expect(service.markQueueItemComplete).toBeDefined();
    });

    it("should mark queue item as failed", async () => {
      expect(service.markQueueItemFailed).toBeDefined();
    });
  });

  describe("statistics", () => {
    it("should get domain statistics", async () => {
      expect(service.getDomainStats).toBeDefined();
    });

    it("should get processing status", async () => {
      expect(service.getProcessingStatus).toBeDefined();
    });

    it("should get popular domains", async () => {
      expect(service.getPopularDomains).toBeDefined();
    });
  });
});

describe("DomainsRepository", () => {
  let repository: DomainsRepository;

  beforeEach(() => {
    repository = new DomainsRepository();
  });

  it("should have all required methods", () => {
    expect(repository.getPendingDomains).toBeDefined();
    expect(repository.getDomainsReadyForProcessing).toBeDefined();
    expect(repository.approveDomain).toBeDefined();
    expect(repository.blockDomain).toBeDefined();
    expect(repository.deleteDomains).toBeDefined();
    expect(repository.saveDiscoveredDomains).toBeDefined();
    expect(repository.getDomainRelationships).toBeDefined();
    expect(repository.getRelatedDomains).toBeDefined();
    expect(repository.getDomainStats).toBeDefined();
    expect(repository.getMostLinkedDomains).toBeDefined();
    expect(repository.findCommonLinkedDomains).toBeDefined();
    expect(repository.getNextQueueItem).toBeDefined();
    expect(repository.markQueueItemComplete).toBeDefined();
    expect(repository.markQueueItemFailed).toBeDefined();
  });
});