/**
 * Main API Router
 * Handles API versioning and routing
 */

import { Hono } from "hono";
import { v1 } from "./v1";

const api = new Hono();

// Version 1 routes
api.route('/v1', v1);

// Default to latest version (v1 for now)
api.route('/', v1);

// API root info
api.get('/', (c) => {
  return c.json({
    name: 'ATK Platform API',
    description: 'Web Crawler and Site Analysis Platform API',
    versions: {
      v1: {
        status: 'stable',
        path: '/api/v1',
        documentation: '/api/v1/docs',
        features: [
          'Platform Objects (clients, contacts, projects, etc.)',
          'Zod validation for type safety',
          'Hono RPC compatibility',
          'HubSpot-inspired CRM endpoints'
        ]
      }
    },
    latest: 'v1',
    health: '/api/health',
    legacy: {
      note: 'Legacy endpoints available for backward compatibility',
      endpoints: {
        'site-analyzer': '/api/site-analyzer',
        'domains': '/api/domains', 
        'platform': '/api/platform'
      }
    }
  });
});

// Global health check
api.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: 'latest',
    uptime: process.uptime()
  });
});

export { api };