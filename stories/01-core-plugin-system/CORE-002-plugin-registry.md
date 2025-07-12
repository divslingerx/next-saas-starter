# CORE-002: Plugin Registry

## Story
**As a** plugin developer  
**I want** a central registry for plugin capabilities  
**So that** plugins can discover and use each other's functionality

## Acceptance Criteria
- [ ] Register plugin exports (queries, components, services)
- [ ] Type-safe plugin communication
- [ ] Runtime capability checking
- [ ] Version compatibility validation
- [ ] Lazy loading of plugin exports
- [ ] Registry introspection API

## Technical Notes
```typescript
class PluginRegistry {
  register(pluginId: string, exports: PluginExports): void
  get<T>(pluginId: string, exportName: string): T
  has(pluginId: string, capability: string): boolean
  listPlugins(): PluginInfo[]
}
```

## Dependencies
- CORE-001: Plugin Loader System

## Estimated Points
5