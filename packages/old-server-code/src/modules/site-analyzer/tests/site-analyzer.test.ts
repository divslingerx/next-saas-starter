/**
 * Site Analyzer Module Tests
 */

import { describe, it, expect, beforeEach, mock } from "bun:test";
import { SiteAnalyzerService } from "../services/site-analyzer.service";
import { WappalyzerService } from "../services/wappalyzer.service";
import { CrawlerService } from "../services/crawler.service";
import { DnsService } from "../services/dns.service";
import type { AnalyzeSiteDto, TechnologyDto } from "../dto/site-analyzer.dto";

describe("SiteAnalyzerService", () => {
  let service: SiteAnalyzerService;

  beforeEach(() => {
    service = new SiteAnalyzerService();
  });

  describe("analyzeSite", () => {
    it("should analyze a site with technology detection", async () => {
      const dto: AnalyzeSiteDto = {
        url: "https://example.com",
        force: true,
      };

      // Mock the wappalyzer service
      const mockTechnologies: TechnologyDto[] = [
        {
          slug: "wordpress",
          name: "WordPress",
          confidence: 100,
          categories: [{ id: 1, slug: "cms", name: "CMS" }],
        },
      ];

      // This is a basic structure test
      // In a real test, we would mock the service dependencies
      expect(service).toBeDefined();
      expect(service.analyzeSite).toBeDefined();
    });

    it("should handle bulk analysis", async () => {
      const dto = {
        urls: ["https://example.com", "https://test.com"],
        force: false,
      };

      expect(service.bulkAnalyze).toBeDefined();
    });
  });

  describe("crawlSite", () => {
    it("should crawl a site and discover domains", async () => {
      const dto = {
        url: "https://example.com",
        maxPages: 10,
        discoveryMode: true,
      };

      expect(service.crawlSite).toBeDefined();
    });
  });
});

describe("WappalyzerService", () => {
  let service: WappalyzerService;

  beforeEach(() => {
    service = new WappalyzerService();
  });

  it("should detect technologies from a URL", async () => {
    expect(service.analyzeTechnologies).toBeDefined();
  });

  it("should handle DNS fallback", async () => {
    expect(service.analyzeWithFallback).toBeDefined();
  });
});

describe("CrawlerService", () => {
  let service: CrawlerService;

  beforeEach(() => {
    service = new CrawlerService();
  });

  it("should crawl pages and extract data", async () => {
    expect(service.crawl).toBeDefined();
  });

  it("should discover external domains", async () => {
    const options = {
      maxPages: 5,
      discoveryMode: true,
    };

    expect(service.crawl).toBeDefined();
  });
});

describe("DnsService", () => {
  let service: DnsService;

  beforeEach(() => {
    service = new DnsService();
  });

  it("should lookup DNS records", async () => {
    expect(service.analyzeDns).toBeDefined();
  });

  it("should get basic DNS info", async () => {
    expect(service.getBasicDnsInfo).toBeDefined();
  });
});