import { PluginManager } from '@/core/plugin-manager';
import type { Plugin, PluginContext } from '@/core/types';

/**
 * Test harness for isolated plugin testing
 */
export class PluginTestHarness {
  private pluginManager: PluginManager;
  private mockContext: PluginContext;
  private registeredHooks: Map<string, Function[]> = new Map();
  private emittedEvents: Array<{ name: string; data: any }> = [];

  constructor() {
    this.pluginManager = new PluginManager();
    this.mockContext = this.createMockContext();
  }

  private createMockContext(): PluginContext {
    return {
      // Mock hook system
      hooks: {
        on: (name: string, handler: Function) => {
          if (!this.registeredHooks.has(name)) {
            this.registeredHooks.set(name, []);
          }
          this.registeredHooks.get(name)!.push(handler);
        },
        emit: async (name: string, data: any) => {
          this.emittedEvents.push({ name, data });
          const handlers = this.registeredHooks.get(name) || [];
          for (const handler of handlers) {
            await handler(data);
          }
          return data;
        },
      },

      // Mock API registry
      api: {
        register: jest.fn(),
        call: jest.fn(),
      },

      // Mock database
      db: {
        query: jest.fn(),
        insert: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },

      // Mock UI registry
      ui: {
        registerMenuItem: jest.fn(),
        registerExtension: jest.fn(),
      },

      // Mock plugin communication
      plugins: {
        get: jest.fn(),
        has: jest.fn(),
        call: jest.fn(),
      },
    };
  }

  /**
   * Load a plugin for testing
   */
  async loadPlugin(plugin: Plugin): Promise<void> {
    await this.pluginManager.loadPlugin(plugin, this.mockContext);
  }

  /**
   * Trigger a hook and capture results
   */
  async triggerHook(hookName: string, data: any): Promise<any> {
    return await this.mockContext.hooks.emit(hookName, data);
  }

  /**
   * Get all emitted events
   */
  getEmittedEvents(): Array<{ name: string; data: any }> {
    return this.emittedEvents;
  }

  /**
   * Clear test state
   */
  reset(): void {
    this.registeredHooks.clear();
    this.emittedEvents = [];
    jest.clearAllMocks();
  }

  /**
   * Assert that a hook was registered
   */
  expectHookRegistered(hookName: string): void {
    expect(this.registeredHooks.has(hookName)).toBe(true);
  }

  /**
   * Assert that an event was emitted
   */
  expectEventEmitted(eventName: string, data?: any): void {
    const event = this.emittedEvents.find(e => e.name === eventName);
    expect(event).toBeDefined();
    if (data) {
      expect(event!.data).toMatchObject(data);
    }
  }

  /**
   * Get mock context for assertions
   */
  getContext(): PluginContext {
    return this.mockContext;
  }
}

// Helper to create test plugins
export function createTestPlugin(overrides: Partial<Plugin> = {}): Plugin {
  return {
    id: '@test/plugin',
    name: 'Test Plugin',
    version: '1.0.0',
    init: async (context) => {
      // Default empty init
    },
    ...overrides,
  };
}