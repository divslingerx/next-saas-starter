/**
 * Domains Controller
 * Handles HTTP requests for domain management operations
 */

import { Hono } from "hono";
import { DomainsService } from "../services/domains.service";
import type {
  ApproveDomainDto,
  BlockDomainDto,
  BulkDomainOperationDto,
} from "../dto/domains.dto";
import { handleError } from "@/core/exceptions/error-handler";
import { ValidationException } from "@/core/exceptions/base.exception";

export class DomainsController {
  private service: DomainsService;
  public router: Hono;

  constructor() {
    this.service = new DomainsService();
    this.router = new Hono();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Get pending domains
    this.router.get("/pending", async (c) => {
      try {
        const limit = parseInt(c.req.query("limit") || "50");
        const domains = await this.service.getPendingDomains({ limit });

        return c.json({
          success: true,
          data: domains,
        });
      } catch (error) {
        return handleError(c, error);
      }
    });

    // Get domains ready for processing
    this.router.get("/ready", async (c) => {
      try {
        const limit = parseInt(c.req.query("limit") || "10");
        const domains = await this.service.getDomainsReadyForProcessing({ limit });

        return c.json({
          success: true,
          data: domains,
        });
      } catch (error) {
        return handleError(c, error);
      }
    });

    // Approve a domain
    this.router.post("/approve", async (c) => {
      try {
        const body = await c.req.json<ApproveDomainDto>();

        if (!body.domain) {
          throw new ValidationException("Domain is required");
        }

        await this.service.approveDomain(body);

        return c.json({
          success: true,
          message: `Domain ${body.domain} approved for processing`,
        });
      } catch (error) {
        return handleError(c, error);
      }
    });

    // Block a domain
    this.router.post("/block", async (c) => {
      try {
        const body = await c.req.json<BlockDomainDto>();

        if (!body.domain) {
          throw new ValidationException("Domain is required");
        }

        if (!body.reason) {
          throw new ValidationException("Reason is required");
        }

        await this.service.blockDomain(body);

        return c.json({
          success: true,
          message: `Domain ${body.domain} blocked`,
        });
      } catch (error) {
        return handleError(c, error);
      }
    });

    // Delete a domain
    this.router.delete("/delete", async (c) => {
      try {
        const { domain } = await c.req.json<{ domain: string }>();

        if (!domain) {
          throw new ValidationException("Domain is required");
        }

        await this.service.deleteDomain({ domain });

        return c.json({
          success: true,
          message: `Domain ${domain} has been deleted`,
        });
      } catch (error) {
        return handleError(c, error);
      }
    });

    // Bulk approve domains
    this.router.post("/bulk-approve", async (c) => {
      try {
        const body = await c.req.json<BulkDomainOperationDto>();

        if (!body.domains || body.domains.length === 0) {
          throw new ValidationException("Domains array is required and must not be empty");
        }

        const result = await this.service.bulkApproveDomains(body);

        return c.json(result);
      } catch (error) {
        return handleError(c, error);
      }
    });

    // Bulk block domains
    this.router.post("/bulk-block", async (c) => {
      try {
        const body = await c.req.json<BulkDomainOperationDto>();

        if (!body.domains || body.domains.length === 0) {
          throw new ValidationException("Domains array is required and must not be empty");
        }

        if (!body.reason) {
          throw new ValidationException("Reason is required for blocking");
        }

        const result = await this.service.bulkBlockDomains(body);

        return c.json(result);
      } catch (error) {
        return handleError(c, error);
      }
    });

    // Bulk delete domains
    this.router.post("/bulk-delete", async (c) => {
      try {
        const { domains } = await c.req.json<{ domains: string[] }>();

        if (!domains || domains.length === 0) {
          throw new ValidationException("Domains array is required and must not be empty");
        }

        const result = await this.service.bulkDeleteDomains(domains);

        return c.json(result);
      } catch (error) {
        return handleError(c, error);
      }
    });

    // Get domain relationships
    this.router.get("/relationships/:domain", async (c) => {
      try {
        const domain = c.req.param("domain");

        if (!domain) {
          throw new ValidationException("Domain is required");
        }

        const relationships = await this.service.getDomainRelationships({ domain });

        return c.json({
          success: true,
          data: relationships,
        });
      } catch (error) {
        return handleError(c, error);
      }
    });

    // Get domain network graph
    this.router.get("/network/:domain", async (c) => {
      try {
        const domain = c.req.param("domain");
        const depth = parseInt(c.req.query("depth") || "1");
        const limit = parseInt(c.req.query("limit") || "50");

        if (!domain) {
          throw new ValidationException("Domain is required");
        }

        const network = await this.service.getDomainNetworkGraph(domain, depth, limit);

        return c.json({
          success: true,
          data: network,
        });
      } catch (error) {
        return handleError(c, error);
      }
    });

    // Get related domains (subdomains)
    this.router.get("/related/:domain", async (c) => {
      try {
        const domain = c.req.param("domain");

        if (!domain) {
          throw new ValidationException("Domain is required");
        }

        const related = await this.service.getRelatedDomains(domain);

        return c.json({
          success: true,
          data: related,
        });
      } catch (error) {
        return handleError(c, error);
      }
    });

    // Compare two domains
    this.router.post("/compare", async (c) => {
      try {
        const { domain1, domain2 } = await c.req.json<{
          domain1: string;
          domain2: string;
        }>();

        if (!domain1 || !domain2) {
          throw new ValidationException("Both domain1 and domain2 are required");
        }

        const comparison = await this.service.compareDomains(domain1, domain2);

        return c.json({
          success: true,
          data: comparison,
        });
      } catch (error) {
        return handleError(c, error);
      }
    });

    // Get popular domains
    this.router.get("/popular", async (c) => {
      try {
        const limit = parseInt(c.req.query("limit") || "20");
        const popular = await this.service.getPopularDomains(limit);

        return c.json({
          success: true,
          data: popular,
        });
      } catch (error) {
        return handleError(c, error);
      }
    });

    // Find domains linking to multiple targets
    this.router.post("/find-linking-to-multiple", async (c) => {
      try {
        const { domains, minLinks } = await c.req.json<{
          domains: string[];
          minLinks?: number;
        }>();

        if (!domains || domains.length === 0) {
          throw new ValidationException("Domains array is required");
        }

        const results = await this.service.findDomainsLinkingToMultiple(
          domains,
          minLinks || 2
        );

        return c.json({
          success: true,
          data: results,
        });
      } catch (error) {
        return handleError(c, error);
      }
    });

    // Get domain statistics
    this.router.get("/stats", async (c) => {
      try {
        const stats = await this.service.getDomainStats({});

        return c.json({
          success: true,
          data: stats,
        });
      } catch (error) {
        return handleError(c, error);
      }
    });

    // Get processing status
    this.router.get("/processing-status", async (c) => {
      try {
        const status = await this.service.getProcessingStatus();

        return c.json({
          success: true,
          data: status,
        });
      } catch (error) {
        return handleError(c, error);
      }
    });

    // Process next domain in queue
    this.router.post("/process-next", async (c) => {
      try {
        const queueItem = await this.service.processNextDomain();

        if (!queueItem) {
          return c.json({
            success: true,
            message: "No domains ready for processing",
            data: null,
          });
        }

        return c.json({
          success: true,
          data: queueItem,
        });
      } catch (error) {
        return handleError(c, error);
      }
    });

    // Health check
    this.router.get("/health", (c) => {
      return c.json({
        success: true,
        message: "Domains module is healthy",
        timestamp: new Date().toISOString(),
      });
    });
  }
}