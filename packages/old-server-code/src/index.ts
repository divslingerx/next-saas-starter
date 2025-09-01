console.log("[STARTUP] Loading imports...");
import { Hono } from "hono";
import { cors } from "hono/cors";
import type {
  ApiResponse,
  AnalyzeUrlRequest,
  AnalyzeUrlResponse,
  AnalyzeMultipleUrlsRequest,
  AnalyzeMultipleUrlsResponse,
  WappalyzerResult,
  Technology,
  AnalysisStatus,
} from "shared/dist";

// Import Better Auth
import { auth } from "./lib/auth";
import { createSiteAnalyzerModule, SiteAnalyzerService } from "./modules/site-analyzer";
import { createDomainsModule, DomainsService } from "./modules/domains";
import { createFilesModule } from "./modules/files";
import { platformRoutes } from "./modules/platform";
import { api } from "./api";

// Import our new middleware
import { globalContextMiddleware } from "./core/middleware/global-context.middleware";
import { errorHandlerMiddleware } from "./core/middleware/error-handler.middleware";
import { performanceMonitorMiddleware, getPerformanceStats } from "./core/middleware/performance-monitor.middleware";

// Import database and storage
console.log("[STARTUP] Loading database...");
import { db } from "./db/index";
import { s3Storage } from "./lib/storage/s3-storage";
console.log("[STARTUP] Database loaded");

// Import OAuth integration system
import { setupIntegrationSystem } from "./lib/oauth";

// Initialize services
const siteAnalyzerService = new SiteAnalyzerService();
const domainsService = new DomainsService();

// Initialize the integration system
const integrationSystem = setupIntegrationSystem({
  enableWebhooks: true,
  autoRegisterConnectors: true,
});

// Initialize S3 storage (creates buckets if they don't exist)
console.log("[STARTUP] Initializing S3 storage...");
s3Storage.initialize().then(() => {
  console.log("[STARTUP] ✅ S3 storage initialized");
}).catch((error) => {
  console.error("[STARTUP] ❌ Failed to initialize S3 storage:", error);
});

export const app = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
    organizationId: string;
    userId: string;
  };
}>()
  .use(
    cors({
      origin: [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
      ],
      credentials: true,
    })
  )
  .use("*", async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });

    if (!session) {
      c.set("user", null);
      c.set("session", null);
      return next();
    }

    c.set("user", session.user);
    c.set("session", session.session);
    
    // Set organizationId and userId for platform routes
    // TODO: Get actual organizationId from user's membership
    c.set("organizationId", "default-org"); // Placeholder for now
    c.set("userId", session.user.id);
    
    return next();
  })
  // Add performance monitoring (before other middleware)
  .use("*", performanceMonitorMiddleware)
  // Add global context and error handling middleware  
  .use("*", globalContextMiddleware)
  .use("*", errorHandlerMiddleware)
  // Better Auth handler
  .on(["POST", "GET"], "/api/auth/*", (c) => {
    return auth.handler(c.req.raw);
  })
  // New versioned API structure (preferred)
  .route("/api", api)
  
  // Legacy routes (for backward compatibility)
  .route("/api/site-analyzer", createSiteAnalyzerModule())
  .route("/api/domains", createDomainsModule())
  .route("/api/files", createFilesModule())
  .route("/api/platform", platformRoutes)
  
  // OAuth integrations (HubSpot, GA4, WordPress, etc.)
  .route("/integrations", integrationSystem.router)

  // Health check endpoint with performance stats
  .get("/health", async (c) => {
    try {
      // Test database connectivity
      await db.select().from((await import("./db/schema/auth")).user).limit(1);
      
      return c.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || "unknown",
        performance: getPerformanceStats(),
        services: {
          database: "connected",
          auth: "active",
          browserPool: "initialized"
        }
      });
    } catch (error) {
      return c.json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
        performance: getPerformanceStats()
      }, 503);
    }
  })

  // Test endpoint to check URL connectivity
  .get("/test-url", async (c) => {
    const url = c.req.query("url") || "https://example.com";

    try {
      console.log(`[TEST] Attempting to fetch: ${url}`);
      const response = await fetch(url, {
        method: "HEAD",
        redirect: "follow",
        signal: AbortSignal.timeout(10000),
      });

      console.log(`[TEST] Response status: ${response.status}`);
      console.log(`[TEST] Response URL: ${response.url}`);
      console.log(
        `[TEST] Response headers:`,
        Object.fromEntries(response.headers.entries())
      );

      return c.json({
        success: true,
        originalUrl: url,
        finalUrl: response.url,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      });
    } catch (error: any) {
      console.error(`[TEST] Error fetching ${url}:`, error);
      return c.json({
        success: false,
        originalUrl: url,
        error: error?.message || String(error),
        code: error?.code,
        errno: error?.errno,
        syscall: error?.syscall,
      });
    }
  })

  // Main analyze endpoint - now uses the new Site Analyzer module
  .post("/analyze-url", async (c) => {
    try {
      const body = await c.req.json<AnalyzeUrlRequest & { force?: boolean }>();

      if (!body.url) {
        const response: AnalyzeUrlResponse = {
          success: false,
          error: "URL is required",
        };
        return c.json(response, { status: 400 });
      }

      // Use the new Site Analyzer service
      const result = await siteAnalyzerService.analyzeSite({
        url: body.url,
        force: body.force,
        includeAccessibility: true, // Always include for backward compatibility
        includeLighthouse: true,    // Always include for backward compatibility
        includeDns: false,          // DNS was optional in the old version
        maxPages: 10,
      });

      // Transform to match the old response format
      const response: AnalyzeUrlResponse = {
        success: true,
        data: {
          id: result.id,
          url: result.url,
          technologies: result.technologies?.map(tech => ({
            name: tech.name,
            categories: tech.categories.map(cat => cat.name),
            confidence: tech.confidence,
            version: tech.version,
            icon: tech.icon,
            website: tech.website,
          })) || [],
          is_wordpress: result.isWordpress || false,
          is_hubspot: result.isHubspot || false,
          analyzed_at: result.lastAnalyzedAt || new Date(),
        },
      };

      return c.json(response);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to analyze URL";

      // Check if it's a domain not found error
      if (
        errorMessage.includes("Domain not found") ||
        errorMessage.includes("ENOTFOUND") ||
        errorMessage.includes("DNSException")
      ) {
        const response: AnalyzeUrlResponse = {
          success: false,
          error: `Domain not reachable. Please verify the domain exists and is accessible.`,
        };
        return c.json(response, { status: 404 });
      }

      console.error("Error analyzing URL:", error);
      const response: AnalyzeUrlResponse = {
        success: false,
        error: errorMessage,
      };
      return c.json(response, { status: 500 });
    }
  })

  .post("/analyze-urls", async (c) => {
    try {
      const body = await c.req.json<AnalyzeMultipleUrlsRequest>();

      if (!body.urls || body.urls.length === 0) {
        const response: AnalyzeMultipleUrlsResponse = {
          success: false,
          error: "URLs array is required and must not be empty",
        };
        return c.json(response, { status: 400 });
      }

      // Use the new Site Analyzer service for bulk analysis
      const bulkResult = await siteAnalyzerService.bulkAnalyze({
        urls: body.urls,
        force: false,
        includeAccessibility: true,
        includeLighthouse: true,
      });

      // Transform to match the old response format
      const results = bulkResult.results.map(r => {
        if (r.success && r.data) {
          return {
            id: r.data.id,
            url: r.data.url,
            technologies: r.data.technologies?.map(tech => ({
              name: tech.name,
              categories: tech.categories.map(cat => cat.name),
              confidence: tech.confidence,
              version: tech.version,
              icon: tech.icon,
              website: tech.website,
            })) || [],
            is_wordpress: r.data.isWordpress || false,
            is_hubspot: r.data.isHubspot || false,
            analyzed_at: r.data.analyzedAt || new Date(),
          };
        } else {
          return {
            url: r.url,
            technologies: [],
            is_wordpress: false,
            is_hubspot: false,
            analyzed_at: new Date(),
            error: r.error || "Failed to analyze",
          };
        }
      });

      const response: AnalyzeMultipleUrlsResponse = {
        success: true,
        data: results,
      };

      return c.json(response);
    } catch (error) {
      console.error("Error analyzing URLs:", error);
      const response: AnalyzeMultipleUrlsResponse = {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to analyze URLs",
      };
      return c.json(response, { status: 500 });
    }
  })

  // DNS records endpoint - now uses the new DNS service
  .get("/dns/:domain", async (c) => {
    try {
      const domain = c.req.param("domain");
      console.log(`[DNS] Fetching DNS records for domain: ${domain}`);

      // Clean the domain (remove protocol, path, etc.)
      let cleanDomain = domain;
      if (domain.includes("://")) {
        cleanDomain = new URL(domain).hostname;
      }

      // Use the new Site Analyzer service to get DNS records
      const dnsService = new (await import("./modules/site-analyzer")).DnsService();
      const dnsRecords = await dnsService.analyzeDns({ url: cleanDomain });

      console.log(
        `[DNS] Found records for ${cleanDomain}`
      );

      return c.json({
        success: true,
        data: {
          domain: cleanDomain,
          records: dnsRecords,
          fetchedAt: new Date(),
        },
      });
    } catch (error) {
      console.error("Error fetching DNS records:", error);
      return c.json(
        {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to fetch DNS records",
        },
        { status: 500 }
      );
    }
  })

  // TODO: Reimplement results endpoint using new unified audit system
  // Results endpoint - this needs database access
  .get("/results", async (c) => {
    // This endpoint is temporarily disabled due to schema refactor
    return c.json({ error: "Results endpoint temporarily disabled during schema refactor" }, 503);
    
    /*
    try {
      // This endpoint directly queries the database
      // We'll keep this as-is for now since it's a special case
      const { sites, technologies, siteTechnologies, categories, technologyCategories, analysisResults } = await import("./db/schema");
      const { eq, desc } = await import("drizzle-orm");
      
      // Get all sites with their technologies
      const sitesWithTech = await db
        .select({
          site: sites,
          technology: technologies,
          version: siteTechnologies.version,
          confidence: siteTechnologies.confidence,
        })
        .from(sites)
        .leftJoin(siteTechnologies, eq(sites.id, siteTechnologies.site_id))
        .leftJoin(
          technologies,
          eq(siteTechnologies.technology_id, technologies.id)
        )
        .orderBy(desc(sites.created_at));
      
      // Get latest analysis results for all sites
      const allAnalysisResults = await db
        .select()
        .from(analysisResults)
        .orderBy(desc(analysisResults.createdAt));

      // Group by site
      const siteMap = new Map<number, WappalyzerResult>();

      for (const row of sitesWithTech) {
        if (!siteMap.has(row.site.id)) {
          // Find latest analysis results for this site
          const siteAnalysisResults = allAnalysisResults.filter(
            (ar) => ar.siteId === row.site.id
          );
          
          // Get latest result for each analysis type
          const latestAxe = siteAnalysisResults
            .filter((ar) => ar.analysisType === "axe" && ar.status === "complete")
            .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))[0];
          
          const latestLighthouse = siteAnalysisResults
            .filter((ar) => ar.analysisType === "lighthouse" && ar.status === "complete")
            .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))[0];
          
          const latestWappalyzer = siteAnalysisResults
            .filter((ar) => ar.analysisType === "wappalyzer" && ar.status === "complete")
            .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))[0];
          
          // Extract scores
          let axe_score = latestAxe?.score || null;
          let lighthouse_performance = null;
          let lighthouse_accessibility = null;
          let lighthouse_seo = null;
          
          if (latestLighthouse?.summary) {
            const summary = latestLighthouse.summary as any;
            lighthouse_performance = summary.scores?.performance || null;
            lighthouse_accessibility = summary.scores?.accessibility || null;
            lighthouse_seo = summary.scores?.seo || null;
          }
          
          // Get analysis statuses
          const wappalyzer_status = latestWappalyzer?.status || null;
          const axe_status = latestAxe?.status || null;
          const lighthouse_status = latestLighthouse?.status || null;

          siteMap.set(row.site.id, {
            id: row.site.id,
            url: row.site.url,
            display_name: row.site.display_name || row.site.url,
            technologies: [],
            is_wordpress: false,
            is_hubspot: false,
            last_crawled_at: row.site.last_crawled_at || undefined,
            analyzed_at: latestWappalyzer?.createdAt || row.site.created_at,
            axe_score,
            lighthouse_performance,
            lighthouse_accessibility,
            lighthouse_seo,
            // Include status fields
            wappalyzer_status: wappalyzer_status as AnalysisStatus | undefined,
            axe_status: axe_status as AnalysisStatus | undefined,
            lighthouse_status: lighthouse_status as AnalysisStatus | undefined,
            crawl_status: row.site.crawl_status as AnalysisStatus | undefined,
          });
        }

        const siteResult = siteMap.get(row.site.id)!;

        if (row.technology) {
          // Get categories for this technology
          const techCategories = await db
            .select({ name: categories.name })
            .from(technologyCategories)
            .innerJoin(
              categories,
              eq(technologyCategories.category_id, categories.id)
            )
            .where(eq(technologyCategories.technology_id, row.technology.id));

          siteResult.technologies.push({
            name: row.technology.name,
            categories: techCategories.map((c) => c.name),
            confidence: row.confidence || 100,
            version: row.version ?? "",
            website: row.technology.website ?? "",
          });

          // Check for WordPress and HubSpot
          if (row.technology.name.toLowerCase() === "wordpress") {
            siteResult.is_wordpress = true;
          }
          if (row.technology.name.toLowerCase().includes("hubspot")) {
            siteResult.is_hubspot = true;
          }
        }
      }

      return c.json({
        success: true,
        data: Array.from(siteMap.values()),
      });
    } catch (error) {
      console.error("Error fetching results:", error);
      return c.json(
        {
          success: false,
          error: "Failed to fetch results",
        },
        { status: 500 }
      );
    }
    */
  });

console.log(`🚀 Server starting...`);

// Export AppType for RPC client usage (legacy routes)
export type AppType = typeof app;

// Export V1 API type for new RPC clients  
export type V1ApiType = typeof api;

// Export individual module types for granular RPC usage
export type { PlatformAppType } from "./modules/platform";

export default app;