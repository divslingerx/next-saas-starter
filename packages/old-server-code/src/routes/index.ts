/**
 * Main Routes Configuration
 * Integrates all module routers into the main application
 * 
 * NOTE: This file is deprecated in favor of direct module imports in index.ts
 * and the new versioned API structure in /api/v1/
 */

import { Hono } from "hono";

// Import modular routers
// Note: User and organization functionality is now handled by Better Auth
import { createSiteAnalyzerModule } from "@/modules/site-analyzer";
import { createDomainsModule } from "@/modules/domains";
import { createPlatformModule } from "@/modules/platform";

/**
 * Setup all application routes (Legacy)
 * @deprecated Use the new API structure in /api/v1/ instead
 */
export function setupRoutes(app: Hono) {
  // Legacy API Routes - Modular Architecture
  // Note: Auth is handled by Better Auth handler in main index.ts
  app.route("/api/site-analyzer", createSiteAnalyzerModule());
  app.route("/api/domains", createDomainsModule());
  app.route("/api/platform", createPlatformModule().routes);

  return app;
}

// Re-export module factories for direct use
export { createSiteAnalyzerModule, createDomainsModule, createPlatformModule };

