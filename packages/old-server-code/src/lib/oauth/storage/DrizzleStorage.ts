import { db } from "../../../db";
import { connections } from "../../../db/schema/integrations";
import { eq, and, or, inArray } from "drizzle-orm";
import type { ConnectionStorage, ConnectionData } from "./ConnectionStorage";
import type { ConnectionData as TypedConnectionData } from "../types";
import { IntegrationError } from "../types";

export class DrizzleStorage implements ConnectionStorage {
  async getConnection(id: number): Promise<TypedConnectionData | null> {
    const results = await db
      .select()
      .from(connections)
      .where(eq(connections.id, id))
      .limit(1);

    const item = results[0];
    if (!item) return null;

    return this.mapToConnectionData(item);
  }

  async getConnectionsByProperty(propertyId: number): Promise<TypedConnectionData[]> {
    const results = await db
      .select()
      .from(connections)
      .where(eq(connections.propertyId, propertyId));

    return results.map(item => this.mapToConnectionData(item));
  }

  async getConnectionsByType(integrationType: string): Promise<TypedConnectionData[]> {
    const results = await db
      .select()
      .from(connections)
      .where(eq(connections.integrationTypeId, parseInt(integrationType)));

    return results.map(item => this.mapToConnectionData(item));
  }

  async saveConnection(connection: TypedConnectionData): Promise<TypedConnectionData> {
    const dbData = this.mapToDbFormat(connection);
    
    const results = await db
      .insert(connections)
      .values(dbData)
      .onConflictDoUpdate({
        target: connections.id,
        set: {
          ...dbData,
          updatedAt: new Date(),
        },
      })
      .returning();

    return this.mapToConnectionData(results[0]);
  }

  async updateConnection(
    id: number,
    updates: Partial<TypedConnectionData>
  ): Promise<TypedConnectionData> {
    const dbUpdates = this.mapToDbFormat(updates as TypedConnectionData, true);
    
    const results = await db
      .update(connections)
      .set({
        ...dbUpdates,
        updatedAt: new Date(),
      })
      .where(eq(connections.id, id))
      .returning();

    if (!results[0]) {
      throw new IntegrationError('Connection not found', 'NOT_FOUND', 404);
    }

    return this.mapToConnectionData(results[0]);
  }

  async deleteConnection(id: number): Promise<void> {
    await db.delete(connections).where(eq(connections.id, id));
  }

  async bulkSave(connectionList: TypedConnectionData[]): Promise<TypedConnectionData[]> {
    const dbDataList = connectionList.map(conn => this.mapToDbFormat(conn));
    
    const results = await db
      .insert(connections)
      .values(dbDataList)
      .returning();

    return results.map(item => this.mapToConnectionData(item));
  }

  async bulkDelete(ids: number[]): Promise<void> {
    await db.delete(connections).where(inArray(connections.id, ids));
  }

  async findConnections(criteria: Partial<TypedConnectionData>): Promise<TypedConnectionData[]> {
    let query = db.select().from(connections);
    const conditions = [];

    if (criteria.id) {
      conditions.push(eq(connections.id, criteria.id as number));
    }
    if (criteria.propertyId) {
      conditions.push(eq(connections.propertyId, criteria.propertyId as number));
    }
    if (criteria.integrationType) {
      conditions.push(eq(connections.integrationTypeId, parseInt(criteria.integrationType)));
    }
    if (criteria.name) {
      conditions.push(eq(connections.name, criteria.name));
    }

    if (conditions.length > 0) {
      const results = await query.where(and(...conditions));
      return results.map(item => this.mapToConnectionData(item));
    }

    const results = await query;
    return results.map(item => this.mapToConnectionData(item));
  }

  async countConnections(criteria?: Partial<TypedConnectionData>): Promise<number> {
    const results = await this.findConnections(criteria || {});
    return results.length;
  }

  async updateTokens(
    id: number,
    tokens: {
      accessToken?: string;
      refreshToken?: string;
      expiresAt?: Date;
    }
  ): Promise<void> {
    await db
      .update(connections)
      .set({
        oauthAccessToken: tokens.accessToken,
        oauthRefreshToken: tokens.refreshToken,
        oauthExpiresAt: tokens.expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(connections.id, id));
  }

  async updateMetadata(id: number, metadata: any): Promise<void> {
    const conn = await this.getConnection(id);
    if (!conn) {
      throw new IntegrationError('Connection not found', 'NOT_FOUND', 404);
    }

    const updatedConfig = {
      ...(conn.config || {}),
      metadata,
    };

    await db
      .update(connections)
      .set({
        config: updatedConfig,
        updatedAt: new Date(),
      })
      .where(eq(connections.id, id));
  }

  // Helper methods for mapping between DB and domain models
  private mapToConnectionData(dbRow: any): TypedConnectionData {
    return {
      id: dbRow.id,
      propertyId: dbRow.propertyId,
      integrationType: dbRow.integrationTypeId.toString(),
      name: dbRow.name || undefined,
      oauthAccessToken: dbRow.oauthAccessToken || undefined,
      oauthRefreshToken: dbRow.oauthRefreshToken || undefined,
      oauthExpiresAt: dbRow.oauthExpiresAt || undefined,
      apiKey: dbRow.config?.apiKey || undefined,
      apiSecret: dbRow.config?.apiSecret || undefined,
      config: dbRow.config || {},
      metadata: dbRow.config?.metadata || undefined,
      createdAt: dbRow.createdAt,
      updatedAt: dbRow.updatedAt,
    };
  }

  private mapToDbFormat(
    connection: TypedConnectionData,
    isPartial: boolean = false
  ): any {
    const result: any = {};

    if (!isPartial || connection.propertyId !== undefined) {
      result.propertyId = connection.propertyId as number;
    }
    if (!isPartial || connection.integrationType !== undefined) {
      result.integrationTypeId = parseInt(connection.integrationType);
    }
    if (!isPartial || connection.name !== undefined) {
      result.name = connection.name || null;
    }
    if (!isPartial || connection.oauthAccessToken !== undefined) {
      result.oauthAccessToken = connection.oauthAccessToken || null;
    }
    if (!isPartial || connection.oauthRefreshToken !== undefined) {
      result.oauthRefreshToken = connection.oauthRefreshToken || null;
    }
    if (!isPartial || connection.oauthExpiresAt !== undefined) {
      result.oauthExpiresAt = connection.oauthExpiresAt || null;
    }
    if (!isPartial || connection.config !== undefined || connection.apiKey !== undefined || connection.metadata !== undefined) {
      result.config = {
        ...(connection.config || {}),
        ...(connection.apiKey ? { apiKey: connection.apiKey } : {}),
        ...(connection.apiSecret ? { apiSecret: connection.apiSecret } : {}),
        ...(connection.metadata ? { metadata: connection.metadata } : {}),
      };
    }

    return result;
  }
}