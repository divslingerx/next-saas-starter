/**
 * Site Analyzer Module
 * Main export file for the site analyzer module
 */

// Controllers
export { SiteAnalyzerController } from "./controllers/site-analyzer.controller";

// Services
export { SiteAnalyzerService } from "./services/site-analyzer.service";
export { WappalyzerService } from "./services/wappalyzer.service";
export { CrawlerService } from "./services/crawler.service";
export { AccessibilityService } from "./services/accessibility.service";
export { LighthouseService } from "./services/lighthouse.service";
export { DnsService } from "./services/dns.service";

// Repository
export { SiteAnalyzerRepository } from "./repositories/site-analyzer.repository";

// DTOs
export * from "./dto/site-analyzer.dto";

// Module initialization
import { SiteAnalyzerController } from "./controllers/site-analyzer.controller";

export const createSiteAnalyzerModule = () => {
  const controller = new SiteAnalyzerController();
  return controller.router;
};