/**
 * Domains Module
 * Main export file for the domains module
 */

// Controllers
export { DomainsController } from "./controllers/domains.controller";

// Services
export { DomainsService } from "./services/domains.service";

// Repository
export { DomainsRepository } from "./repositories/domains.repository";

// DTOs
export * from "./dto/domains.dto";

// Module initialization
import { DomainsController } from "./controllers/domains.controller";

export const createDomainsModule = () => {
  const controller = new DomainsController();
  return controller.router;
};