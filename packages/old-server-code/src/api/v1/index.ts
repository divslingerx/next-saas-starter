/**
 * API v1 Routes
 * Main router for all v1 API endpoints
 */

import { Hono } from "hono";
import { platformV1Routes } from "../../modules/platform/routes/v1-routes";
import { crmRouter } from "../../modules/crm";

const v1 = new Hono();

// Platform routes
v1.route('/', platformV1Routes);

// CRM routes  
v1.route('/crm', crmRouter);

// Health check for v1
v1.get('/health', (c) => {
  return c.json({
    version: 'v1',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      platform: 'active',
      database: 'connected'
    }
  });
});

// API info
v1.get('/', (c) => {
  return c.json({
    name: 'ATK Platform API',
    version: 'v1',
    documentation: '/api/v1/docs',
    endpoints: {
      platform: {
        objects: '/api/v1/objects/{objectType}',
        clients: '/api/v1/clients',
        search: '/api/v1/objects/{objectType}/search'
      },
      crm: {
        contacts: '/api/v1/crm/contacts',
        companies: '/api/v1/crm/companies'
      }
    }
  });
});

export { v1 };