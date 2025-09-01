/**
 * Site Analyzer Controller
 * Handles HTTP requests for site analysis operations
 */

import { Hono } from "hono";
import { SiteAnalyzerService } from "../services/site-analyzer.service";
import { auth } from "@/lib/auth";
import type {
  AnalyzeSiteDto,
  BulkAnalyzeDto,
  CrawlSiteDto,
  BulkCrawlDto,
  SiteSearchDto,
} from "../dto/site-analyzer.dto";
import { handleError } from "@/core/exceptions/error-handler";
import { ValidationException } from "@/core/exceptions/base.exception";
import { requireFeature, checkRateLimit } from "@/core/middleware/feature-checks";

export class SiteAnalyzerController {
  private service: SiteAnalyzerService;
  public router: Hono<{
    Variables: {
      user: typeof auth.$Infer.Session.user | null;
      session: typeof auth.$Infer.Session.session | null;
      organizationId: string;
      userId: string;
    };
  }>;

  constructor() {
    this.service = new SiteAnalyzerService();
    this.router = new Hono<{
      Variables: {
        user: typeof auth.$Infer.Session.user | null;
        session: typeof auth.$Infer.Session.session | null;
        organizationId: string;
        userId: string;
      };
    }>();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Analyze single site
    this.router.post("/analyze",
      checkRateLimit('maxSitesPerMonth'),
      async (c) => {
      try {
        const body = await c.req.json<AnalyzeSiteDto>();
        
        if (!body.url) {
          throw new ValidationException("URL is required");
        }

        const organizationId = c.get('organizationId') as string;
        const result = await this.service.analyzeSite(body);
        
        return c.json({
          success: true,
          data: result,
        });
      } catch (error) {
        return handleError(c, error);
      }
    });

    // Bulk analyze sites (requires TEAM plan or higher)
    this.router.post("/bulk-analyze",
      requireFeature('bulkOperations'),
      checkRateLimit('maxSitesPerMonth'),
      async (c) => {
      try {
        const body = await c.req.json<BulkAnalyzeDto>();
        
        if (!body.urls || body.urls.length === 0) {
          throw new ValidationException("URLs array is required and must not be empty");
        }

        const organizationId = c.get('organizationId') as string;
        const result = await this.service.bulkAnalyze(body);
        
        return c.json(result);
      } catch (error) {
        return handleError(c, error);
      }
    });

    // Crawl single site
    this.router.post("/crawl",
      checkRateLimit('maxSitesPerMonth'),
      async (c) => {
      try {
        const body = await c.req.json<CrawlSiteDto>();
        
        if (!body.url) {
          throw new ValidationException("URL is required");
        }

        const organizationId = c.get('organizationId') as string;
        const result = await this.service.crawlSite(body);
        
        return c.json({
          success: true,
          data: result,
        });
      } catch (error) {
        return handleError(c, error);
      }
    });

    // Bulk crawl sites (requires TEAM plan or higher)
    this.router.post("/bulk-crawl",
      requireFeature('bulkOperations'),
      checkRateLimit('maxSitesPerMonth'),
      async (c) => {
      try {
        const body = await c.req.json<BulkCrawlDto>();
        
        if (!body.urls || body.urls.length === 0) {
          throw new ValidationException("URLs array is required and must not be empty");
        }

        const organizationId = c.get('organizationId') as string;
        const result = await this.service.bulkCrawl(body, organizationId);
        
        return c.json(result);
      } catch (error) {
        return handleError(c, error);
      }
    });

    // Search sites
    this.router.get("/search", async (c) => {
      try {
        const query = c.req.query("q");
        const limit = parseInt(c.req.query("limit") || "10");
        const offset = parseInt(c.req.query("offset") || "0");
        const technologyFilter = c.req.query("technologies")?.split(",");
        const categoryFilter = c.req.query("categories")?.split(",");
        const isWordpress = c.req.query("isWordpress") === "true";
        const isHubspot = c.req.query("isHubspot") === "true";

        const searchDto: SiteSearchDto = {
          query,
          limit,
          offset,
          technologyFilter,
          categoryFilter,
          isWordpress: isWordpress || undefined,
          isHubspot: isHubspot || undefined,
        };

        const organizationId = c.get('organizationId') as string;
        const results = await this.service.searchSites(searchDto, organizationId);
        
        return c.json({
          success: true,
          data: results,
        });
      } catch (error) {
        return handleError(c, error);
      }
    });

    // Get site by URL
    this.router.get("/site", async (c) => {
      try {
        const url = c.req.query("url");
        
        if (!url) {
          throw new ValidationException("URL parameter is required");
        }

        const organizationId = c.get('organizationId') as string;
        const result = await this.service.analyzeSite({ 
          url, 
          force: false // Use cached data if available
        });
        
        return c.json({
          success: true,
          data: result,
        });
      } catch (error) {
        return handleError(c, error);
      }
    });

    // Get site statistics
    this.router.get("/stats", async (c) => {
      try {
        const organizationId = c.get('organizationId') as string;
        const stats = await this.service.getSiteStats(organizationId);
        
        return c.json({
          success: true,
          data: stats,
        });
      } catch (error) {
        return handleError(c, error);
      }
    });

    // Get technology statistics
    this.router.get("/technology/:name/stats", async (c) => {
      try {
        const technologyName = c.req.param("name");
        
        if (!technologyName) {
          throw new ValidationException("Technology name is required");
        }

        const organizationId = c.get('organizationId') as string;
        const stats = await this.service.getTechnologyStats(technologyName, organizationId);
        
        return c.json({
          success: true,
          data: stats,
        });
      } catch (error) {
        return handleError(c, error);
      }
    });

    // Health check
    this.router.get("/health", (c) => {
      return c.json({
        success: true,
        message: "Site Analyzer module is healthy",
        timestamp: new Date().toISOString(),
      });
    });
  }
}