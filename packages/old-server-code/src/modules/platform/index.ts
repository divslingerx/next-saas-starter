/**
 * Platform Module Entry Point
 * Exports all platform functionality including routes, services, and types
 */

// Routes (both legacy RPC and new versioned API)
export { platformRoutes, platformV1Routes, type PlatformAppType } from "./routes/index";

// Controllers
export { ClientController } from "./controllers/client-controller";
export { PlatformController } from "./controllers/platform-controller";

// Services  
export { ClientService } from "./services/client-service";
export { PlatformService } from "./services/platform-service";

// Repositories
export { ClientRepository } from "./repositories/client-repository";
export { PlatformRepository } from "./repositories/platform-repository";

// Module factory function for easy integration
import { platformRoutes as routes, platformV1Routes as v1Routes } from "./routes/index";

export function createPlatformModule() {
  return {
    routes,
    v1Routes,
    // Add other module exports as needed
  };
}