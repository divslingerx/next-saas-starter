import type { ConnectionStorage } from "./ConnectionStorage";
import type { ConnectionData } from "../types";

export class MemoryStorage implements ConnectionStorage {
  private store = new Map<string | number, ConnectionData>();
  private idCounter = 1;

  async getConnection(id: string | number): Promise<ConnectionData | null> {
    return this.store.get(id) || null;
  }

  async getConnectionsByProperty(propertyId: string | number): Promise<ConnectionData[]> {
    return Array.from(this.store.values()).filter(
      conn => conn.propertyId === propertyId
    );
  }

  async getConnectionsByType(integrationType: string): Promise<ConnectionData[]> {
    return Array.from(this.store.values()).filter(
      conn => conn.integrationType === integrationType
    );
  }

  async saveConnection(connection: ConnectionData): Promise<ConnectionData> {
    // Generate ID if not provided
    if (!connection.id) {
      connection.id = this.idCounter++;
    }
    
    // Set timestamps
    const now = new Date();
    if (!connection.createdAt) {
      connection.createdAt = now;
    }
    connection.updatedAt = now;
    
    this.store.set(connection.id, { ...connection });
    return { ...connection };
  }

  async updateConnection(
    id: string | number,
    updates: Partial<ConnectionData>
  ): Promise<ConnectionData> {
    const existing = this.store.get(id);
    if (!existing) {
      throw new Error('Connection not found');
    }

    const updated = {
      ...existing,
      ...updates,
      id: existing.id, // Preserve ID
      createdAt: existing.createdAt, // Preserve creation time
      updatedAt: new Date(),
    };

    this.store.set(id, updated);
    return { ...updated };
  }

  async deleteConnection(id: string | number): Promise<void> {
    this.store.delete(id);
  }

  async bulkSave(connections: ConnectionData[]): Promise<ConnectionData[]> {
    const saved: ConnectionData[] = [];
    for (const conn of connections) {
      saved.push(await this.saveConnection(conn));
    }
    return saved;
  }

  async bulkDelete(ids: (string | number)[]): Promise<void> {
    for (const id of ids) {
      this.store.delete(id);
    }
  }

  async findConnections(criteria: Partial<ConnectionData>): Promise<ConnectionData[]> {
    return Array.from(this.store.values()).filter(conn => {
      for (const [key, value] of Object.entries(criteria)) {
        if (conn[key as keyof ConnectionData] !== value) {
          return false;
        }
      }
      return true;
    });
  }

  async countConnections(criteria?: Partial<ConnectionData>): Promise<number> {
    if (!criteria) {
      return this.store.size;
    }
    
    const matches = await this.findConnections(criteria);
    return matches.length;
  }

  async updateTokens(
    id: string | number,
    tokens: {
      accessToken?: string;
      refreshToken?: string;
      expiresAt?: Date;
    }
  ): Promise<void> {
    const connection = this.store.get(id);
    if (!connection) {
      throw new Error('Connection not found');
    }

    if (tokens.accessToken !== undefined) {
      connection.oauthAccessToken = tokens.accessToken;
    }
    if (tokens.refreshToken !== undefined) {
      connection.oauthRefreshToken = tokens.refreshToken;
    }
    if (tokens.expiresAt !== undefined) {
      connection.oauthExpiresAt = tokens.expiresAt;
    }
    
    connection.updatedAt = new Date();
    this.store.set(id, connection);
  }

  async updateMetadata(id: string | number, metadata: any): Promise<void> {
    const connection = this.store.get(id);
    if (!connection) {
      throw new Error('Connection not found');
    }

    connection.metadata = metadata;
    connection.updatedAt = new Date();
    this.store.set(id, connection);
  }

  // Optional encryption methods (not implemented in memory storage)
  async encryptSensitiveData?(data: string): Promise<string> {
    // In production, implement actual encryption
    return Buffer.from(data).toString('base64');
  }

  async decryptSensitiveData?(encryptedData: string): Promise<string> {
    // In production, implement actual decryption
    return Buffer.from(encryptedData, 'base64').toString();
  }

  // Helper method for testing
  clear(): void {
    this.store.clear();
    this.idCounter = 1;
  }

  // Helper method for testing
  getAll(): ConnectionData[] {
    return Array.from(this.store.values());
  }
}