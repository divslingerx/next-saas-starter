import type { ConnectionData } from '../types';

// Re-export for DrizzleStorage
export type { ConnectionData };

export interface ConnectionStorage {
  // Basic CRUD operations
  getConnection(id: string | number): Promise<ConnectionData | null>;
  getConnectionsByProperty(propertyId: string | number): Promise<ConnectionData[]>;
  getConnectionsByType(integrationType: string): Promise<ConnectionData[]>;
  saveConnection(connection: ConnectionData): Promise<ConnectionData>;
  updateConnection(id: string | number, updates: Partial<ConnectionData>): Promise<ConnectionData>;
  deleteConnection(id: string | number): Promise<void>;
  
  // Bulk operations
  bulkSave(connections: ConnectionData[]): Promise<ConnectionData[]>;
  bulkDelete(ids: (string | number)[]): Promise<void>;
  
  // Query operations
  findConnections(criteria: Partial<ConnectionData>): Promise<ConnectionData[]>;
  countConnections(criteria?: Partial<ConnectionData>): Promise<number>;
  
  // Token management
  updateTokens(
    id: string | number,
    tokens: {
      accessToken?: string;
      refreshToken?: string;
      expiresAt?: Date;
    }
  ): Promise<void>;
  
  // Metadata operations
  updateMetadata(id: string | number, metadata: any): Promise<void>;
  
  // Encryption (optional, can be implemented by storage providers)
  encryptSensitiveData?(data: string): Promise<string>;
  decryptSensitiveData?(encryptedData: string): Promise<string>;
}