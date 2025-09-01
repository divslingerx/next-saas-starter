import type { BaseConnector } from './BaseConnector';
import type { ConnectionData } from '../types';
import type { ConnectionStorage } from '../storage/ConnectionStorage';
import { IntegrationError } from '../types';

export interface ConnectorConstructor {
  new (connection: ConnectionData, storage: ConnectionStorage): BaseConnector;
}

export interface ConnectorMetadata {
  name: string;
  description: string;
  icon?: string;
  authMethod: 'oauth2' | 'apikey' | 'basic' | 'custom';
  configSchema?: any; // Zod schema
  documentationUrl?: string;
  capabilities?: string[];
}

export class IntegrationRegistry {
  private static instance: IntegrationRegistry;
  private connectors = new Map<string, ConnectorConstructor>();
  private metadata = new Map<string, ConnectorMetadata>();

  private constructor() {}

  static getInstance(): IntegrationRegistry {
    if (!IntegrationRegistry.instance) {
      IntegrationRegistry.instance = new IntegrationRegistry();
    }
    return IntegrationRegistry.instance;
  }

  register(
    type: string,
    connector: ConnectorConstructor,
    metadata: ConnectorMetadata
  ): void {
    this.connectors.set(type.toLowerCase(), connector);
    this.metadata.set(type.toLowerCase(), metadata);
  }

  unregister(type: string): void {
    this.connectors.delete(type.toLowerCase());
    this.metadata.delete(type.toLowerCase());
  }

  create(
    type: string,
    connection: ConnectionData,
    storage: ConnectionStorage
  ): BaseConnector {
    const Connector = this.connectors.get(type.toLowerCase());
    if (!Connector) {
      throw new IntegrationError(
        `Unknown integration type: ${type}`,
        'UNKNOWN_INTEGRATION',
        400
      );
    }
    return new Connector(connection, storage);
  }

  getMetadata(type: string): ConnectorMetadata | undefined {
    return this.metadata.get(type.toLowerCase());
  }

  getAllMetadata(): Map<string, ConnectorMetadata> {
    return new Map(this.metadata);
  }

  listAvailable(): string[] {
    return Array.from(this.connectors.keys());
  }

  has(type: string): boolean {
    return this.connectors.has(type.toLowerCase());
  }

  // Helper method to auto-register connectors from a directory
  async autoRegister(connectorsPath: string): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    try {
      const files = await fs.readdir(connectorsPath);
      
      for (const file of files) {
        if (file.endsWith('Connector.ts') || file.endsWith('Connector.js')) {
          const filePath = path.join(connectorsPath, file);
          const module = await import(filePath);
          
          // Look for the default export or a named export matching the pattern
          const firstKey = Object.keys(module)[0];
          const ConnectorClass = module.default || (firstKey ? module[firstKey] : null);
          
          if (ConnectorClass && typeof ConnectorClass === 'function') {
            // Extract type from filename (e.g., 'HubSpotConnector.ts' -> 'hubspot')
            const type = file
              .replace(/Connector\.(ts|js)$/, '')
              .replace(/([A-Z])/g, (match, p1, offset) => 
                offset > 0 ? '-' + p1.toLowerCase() : p1.toLowerCase()
              );
            
            // Try to get metadata from static property
            const metadata: ConnectorMetadata = ConnectorClass.metadata || {
              name: type,
              description: `${type} integration`,
              authMethod: 'oauth2',
            };
            
            this.register(type, ConnectorClass, metadata);
          }
        }
      }
    } catch (error) {
      console.error('Error auto-registering connectors:', error);
    }
  }
}

// Export singleton instance
export const integrationRegistry = IntegrationRegistry.getInstance();