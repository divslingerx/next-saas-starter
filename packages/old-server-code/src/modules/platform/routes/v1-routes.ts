/**
 * Platform API v1 Routes
 * RESTful API endpoints for platform object management
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { ClientController } from "../controllers/client-controller";
import { OrganizationSchemaController } from "../controllers/organization-schema-controller";
import { requireAuth } from "../../../core/middleware/requireAuth";
import { globalContextMiddleware } from "../../../core/middleware/global-context.middleware";
// import { platformDocsRoutes } from "./v1-docs";
import {
  clientSearchSchema,
  lifecycleStageParamSchema,
  leadStatusParamSchema,
  recentClientsQuerySchema,
  clientIdParamSchema,
  markUnqualifiedSchema,
  bulkUpdateLifecycleSchema,
  importClientsSchema,
  paginationQuerySchema
} from "./v1-schemas";

const app = new Hono();

// Apply middleware
app.use('*', requireAuth, globalContextMiddleware);

// Controllers will be instantiated lazily within route handlers

/**
 * Generic Platform Objects
 * /api/v1/objects/{objectType}
 * 
 * Note: These routes will be implemented when we create concrete controllers
 * for each object type. For now, we start with client-specific routes.
 */

// TODO: Implement generic object routes when we create concrete controllers
// app.get('/objects/:objectType', ...);
// app.post('/objects/:objectType', ...);
// etc.

/**
 * Schema Management Routes
 * /api/v1/schema
 */
app.get('/schema/:objectType', OrganizationSchemaController.getMergedSchema);
app.post('/schema/:objectType/properties', OrganizationSchemaController.addCustomProperty);
app.put('/schema/:objectType/properties/:propertyName', OrganizationSchemaController.overrideProperty);
app.post('/schema/initialize', OrganizationSchemaController.initializeSchemas);

/**
 * Client-specific routes
 * /api/v1/clients
 */

// Client search and filtering  
app.post('/clients/search', 
  zValidator('json', clientSearchSchema),
  zValidator('query', paginationQuerySchema),
  async (c) => {
    const clientController = new ClientController();
    return clientController.searchBusiness(c);
  }
);

app.get('/clients/lifecycle/:stage', 
  zValidator('param', lifecycleStageParamSchema),
  zValidator('query', paginationQuerySchema),
  async (c) => {
    const clientController = new ClientController();
    return clientController.getByLifecycleStage(c);
  }
);

app.get('/clients/lead-status/:status', 
  zValidator('param', leadStatusParamSchema),
  zValidator('query', paginationQuerySchema),
  async (c) => {
    const clientController = new ClientController();
    return clientController.getByLeadStatus(c);
  }
);

app.get('/clients/recent', 
  zValidator('query', recentClientsQuerySchema),
  async (c) => {
    const clientController = new ClientController();
    return clientController.getRecent(c);
  }
);

// Client lifecycle management
app.post('/clients/:clientId/advance-stage', 
  zValidator('param', clientIdParamSchema),
  async (c) => {
    const clientController = new ClientController();
    return clientController.advanceLifecycleStage(c);
  }
);

app.post('/clients/:clientId/convert-to-customer', 
  zValidator('param', clientIdParamSchema),
  async (c) => {
    const clientController = new ClientController();
    return clientController.convertToCustomer(c);
  }
);

app.post('/clients/:clientId/mark-unqualified', 
  zValidator('param', clientIdParamSchema),
  zValidator('json', markUnqualifiedSchema),
  async (c) => {
    const clientController = new ClientController();
    return clientController.markUnqualified(c);
  }
);

// Client bulk operations
app.post('/clients/bulk/update-lifecycle', 
  zValidator('json', bulkUpdateLifecycleSchema),
  async (c) => {
    const clientController = new ClientController();
    return clientController.bulkUpdateLifecycleStage(c);
  }
);

app.post('/clients/bulk/import', 
  zValidator('json', importClientsSchema),
  async (c) => {
    const clientController = new ClientController();
    return clientController.importClients(c);
  }
);

// Client analytics
app.get('/clients/stats', async (c) => {
  const clientController = new ClientController();
  return clientController.getStats(c);
});

// Note: Basic CRUD operations (GET, POST, PATCH, DELETE /clients) 
// are inherited from PlatformController and would need specific route handlers

/**
 * API Documentation
 */
// TODO: Temporarily disabled to debug imports
// app.route('/docs', platformDocsRoutes);

export { app as platformV1Routes };

// Export route type for RPC clients
export type PlatformV1Routes = typeof app;