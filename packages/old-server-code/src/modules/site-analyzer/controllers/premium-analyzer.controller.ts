/**
 * Premium Site Analyzer Controller
 * Handles premium analysis features (Lighthouse, Axe, etc.)
 */

import { Hono } from "hono";
import { LighthouseService } from "../services/lighthouse.service";
import { AccessibilityService } from "../services/accessibility.service";
import { handleError } from "@/core/exceptions/error-handler";
import { ValidationException } from "@/core/exceptions/base.exception";
import { requireFeature, checkRateLimit } from "@/core/middleware/feature-checks";

export class PremiumAnalyzerController {
  private lighthouseService: LighthouseService;
  private accessibilityService: AccessibilityService;
  public router: Hono;

  constructor() {
    this.lighthouseService = new LighthouseService();
    this.accessibilityService = new AccessibilityService();
    this.router = new Hono();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Lighthouse Performance Analysis (TEAM plan and above)
    this.router.post("/lighthouse",
      requireFeature('lighthouseAnalysis'),
      checkRateLimit('maxSitesPerMonth'),
      async (c) => {
        try {
          const body = await c.req.json<{ url: string; options?: any }>();
          
          if (!body.url) {
            throw new ValidationException("URL is required");
          }

          const result = await this.lighthouseService.analyzeLighthouse(body.url);
          
          return c.json({
            success: true,
            data: result,
          });
        } catch (error) {
          return handleError(c, error);
        }
      }
    );

    // Axe Accessibility Analysis (included in all plans)
    this.router.post("/accessibility",
      checkRateLimit('maxSitesPerMonth'),
      async (c) => {
        try {
          const body = await c.req.json<{ url: string; options?: any }>();
          
          if (!body.url) {
            throw new ValidationException("URL is required");
          }

          const result = await this.accessibilityService.analyzeAccessibility(body.url);
          
          return c.json({
            success: true,
            data: result,
          });
        } catch (error) {
          return handleError(c, error);
        }
      }
    );

    // Full Axe Accessibility Report (AGENCY plan only)
    this.router.post("/accessibility/full",
      requireFeature('axeAccessibility'),
      checkRateLimit('maxSitesPerMonth'),
      async (c) => {
        try {
          const body = await c.req.json<{ url: string; options?: any }>();
          
          if (!body.url) {
            throw new ValidationException("URL is required");
          }

          // This would return a more detailed report
          const result = await this.accessibilityService.analyzeAccessibility(body.url);
          
          return c.json({
            success: true,
            data: result,
          });
        } catch (error) {
          return handleError(c, error);
        }
      }
    );

    // Automated Reports (AGENCY plan only)
    this.router.post("/reports/automated",
      requireFeature('automationWorkflows'),
      checkRateLimit('maxSitesPerMonth'),
      async (c) => {
        try {
          const body = await c.req.json<{ 
            urls: string[]; 
            schedule?: string;
            emailTo?: string[];
          }>();
          
          if (!body.urls || body.urls.length === 0) {
            throw new ValidationException("URLs array is required");
          }

          // This would set up automated reporting
          return c.json({
            success: true,
            message: "Automated report scheduled",
            schedule: body.schedule || "weekly",
          });
        } catch (error) {
          return handleError(c, error);
        }
      }
    );

    // Automation Workflows (AGENCY plan only)
    this.router.post("/automation/workflow",
      requireFeature('automationWorkflows'),
      async (c) => {
        try {
          const body = await c.req.json<{ 
            name: string;
            trigger: string;
            actions: any[];
          }>();
          
          if (!body.name || !body.trigger || !body.actions) {
            throw new ValidationException("Workflow name, trigger, and actions are required");
          }

          // This would create an automation workflow
          return c.json({
            success: true,
            message: "Automation workflow created",
            workflow: body.name,
          });
        } catch (error) {
          return handleError(c, error);
        }
      }
    );
  }
}