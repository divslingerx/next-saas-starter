import type { Plugin, PluginDefinition } from '../types/plugin';

/**
 * Helper function to define a plugin with proper typing
 */
export function definePlugin<TConfig = any>(
  definition: Plugin | ((config?: TConfig) => Plugin)
): PluginDefinition<TConfig> {
  if (typeof definition === 'function') {
    return definition as PluginDefinition<TConfig>;
  }
  
  return () => definition;
}