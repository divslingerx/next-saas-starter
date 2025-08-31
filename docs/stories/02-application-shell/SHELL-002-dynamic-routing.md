# SHELL-002: Dynamic Route Registration

## Status: DEFERRED TO V2

## Original Story
**As a** plugin developer  
**I want** to register routes dynamically  
**So that** my plugin can expose new endpoints

## Reason for Deferral
This story is entirely dependent on the plugin system, which has been moved to V2. Next.js requires routes to be defined at build time, making dynamic route registration incompatible with the current architecture.

## V1 Alternative
For V1, all routes are defined statically:
- API routes via tRPC routers in `/packages/api`
- Page routes in `/apps/web/src/app`
- Use feature flags to enable/disable functionality

## Future Considerations
If we implement plugins in V2:
1. Build-time route generation from plugins
2. Separate API service for dynamic endpoints
3. Proxy pattern for plugin routes

## Dependencies
- CORE-001: Plugin Loader System (deferred)
- CORE-002: Plugin Registry (deferred)