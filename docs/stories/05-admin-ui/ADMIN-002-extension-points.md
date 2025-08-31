# ADMIN-002: UI Extension Points

## Status: DEFERRED TO V2

## Original Story
**As a** plugin developer  
**I want** defined UI extension points  
**So that** plugins can add UI components

## Reason for Deferral
This story is entirely dependent on the plugin system. Without runtime plugin loading, there's no need for dynamic UI extension points. All admin features will be built directly into the application for V1.

## V1 Alternative
For V1, all admin features are implemented directly:
- Static menu items defined in code
- All page sections known at build time
- Feature flags for enabling/disabling sections
- Direct component imports

## Future Considerations
If we implement plugins in V2:
1. Component registry for UI extensions
2. React lazy loading for plugin components
3. Extension point provider pattern
4. Plugin UI isolation (iframes or shadow DOM)

## Dependencies
- CORE-001: Plugin Loader System (deferred)
- CORE-002: Plugin Registry (deferred)
- ADMIN-001: Admin Shell Layout (which works fine without this)