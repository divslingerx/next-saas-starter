import type { z } from 'zod';

export interface Plugin {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  dependsOn?: Record<string, string>;
  priority?: number;
  init: (context: PluginContext) => Promise<void>;
  destroy?: () => Promise<void>;
}

export interface PluginContext {
  // Hook system
  hooks: {
    on: <T = any>(name: string, handler: HookHandler<T>) => void;
    emit: <T = any>(name: string, data: T) => Promise<T>;
    remove: (name: string, handler: HookHandler) => void;
  };

  // API registry
  api: {
    register: (namespace: string, methods: Record<string, Function>) => void;
    call: <T = any>(namespace: string, method: string, ...args: any[]) => Promise<T>;
  };

  // Database access
  db: {
    query: (sql: string, params?: any[]) => Promise<any>;
    insert: (table: string, data: any) => Promise<any>;
    update: (table: string, where: any, data: any) => Promise<any>;
    delete: (table: string, where: any) => Promise<any>;
  };

  // UI extension points
  ui: {
    registerMenuItem: (menu: MenuItemConfig) => void;
    registerExtension: (extensionPoint: string, extension: UIExtension) => void;
  };

  // Schema management
  schema: {
    register: (schema: SchemaDefinition) => void;
    extend: (tableName: string, extensions: SchemaExtension) => void;
  };

  // Plugin communication
  plugins: {
    get: (pluginId: string) => Plugin | undefined;
    has: (pluginId: string) => boolean;
    call: (pluginId: string, method: string, ...args: any[]) => Promise<any>;
  };

  // Configuration
  config: {
    get: <T = any>(key: string) => T | undefined;
    set: (key: string, value: any) => void;
  };

  // Events
  events: EventEmitter;
}

export type HookHandler<T = any> = (data: T) => Promise<T | void> | T | void;

export interface MenuItemConfig {
  id: string;
  label: string;
  path: string;
  icon?: string;
  parent?: string;
  position?: number;
  permissions?: string[];
}

export interface UIExtension {
  component: string | React.ComponentType;
  props?: Record<string, any>;
  position?: number;
  permissions?: string[];
}

export interface SchemaDefinition {
  tableName: string;
  columns: Record<string, ColumnDefinition>;
  indexes?: Record<string, IndexDefinition>;
  relations?: Record<string, RelationDefinition>;
}

export interface SchemaExtension {
  columns?: Record<string, ColumnDefinition>;
  indexes?: Record<string, IndexDefinition>;
  relations?: Record<string, RelationDefinition>;
}

export interface ColumnDefinition {
  type: 'string' | 'number' | 'boolean' | 'date' | 'json';
  required?: boolean;
  unique?: boolean;
  default?: any;
  references?: {
    table: string;
    column: string;
  };
}

export interface IndexDefinition {
  columns: string[];
  unique?: boolean;
}

export interface RelationDefinition {
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  target: string;
  through?: string;
}

export interface EventEmitter {
  on: (event: string, listener: Function) => void;
  off: (event: string, listener: Function) => void;
  emit: (event: string, ...args: any[]) => void;
  once: (event: string, listener: Function) => void;
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  license?: string;
  homepage?: string;
  repository?: string;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  main: string;
  files?: string[];
  keywords?: string[];
}

export type PluginDefinition<T = any> = (config?: T) => Plugin;