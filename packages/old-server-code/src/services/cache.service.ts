/**
 * Cache Service Layer
 * Handles caching operations using Bun's native Redis client
 */

import { redis, cacheKeys, cacheTTL, cachePatterns } from '../lib/redis';

export class CacheService {
  // Generic cache operations
  static async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  static async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    try {
      const stringValue = JSON.stringify(value);
      if (ttlSeconds) {
        await redis.set(key, stringValue);
        await redis.expire(key, ttlSeconds);
      } else {
        await redis.set(key, stringValue);
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  static async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  static async exists(key: string): Promise<boolean> {
    try {
      return await redis.exists(key);
    } catch (error) {
      console.error('Cache exists check error:', error);
      return false;
    }
  }

  // Bulk operations
  static async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const values = await redis.send('MGET', keys);
      return (values as (string | null)[]).map(value => 
        value ? JSON.parse(value) : null
      );
    } catch (error) {
      console.error('Cache mget error:', error);
      return new Array(keys.length).fill(null);
    }
  }

  static async mset(keyValuePairs: Array<[string, any, number?]>): Promise<void> {
    try {
      // Set all keys first
      const setArgs: string[] = [];
      for (const [key, value] of keyValuePairs) {
        setArgs.push(key, JSON.stringify(value));
      }
      
      if (setArgs.length > 0) {
        await redis.send('MSET', setArgs);
        
        // Set expiration for keys that need it
        for (const [key, , ttl] of keyValuePairs) {
          if (ttl) {
            await redis.expire(key, ttl);
          }
        }
      }
    } catch (error) {
      console.error('Cache mset error:', error);
    }
  }

  // Pattern-based operations
  static async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.send('KEYS', [pattern]) as string[];
      if (keys.length > 0) {
        await redis.send('DEL', keys);
      }
    } catch (error) {
      console.error('Cache pattern invalidation error:', error);
    }
  }

  // Increment operations (useful for counters)
  static async incr(key: string): Promise<number> {
    try {
      return await redis.incr(key);
    } catch (error) {
      console.error('Cache increment error:', error);
      return 0;
    }
  }

  static async incrBy(key: string, increment: number): Promise<number> {
    try {
      return await redis.send('INCRBY', [key, increment.toString()]) as number;
    } catch (error) {
      console.error('Cache increment by error:', error);
      return 0;
    }
  }

  // Domain-specific cache methods for the platform

  // Record caching
  static async cacheRecordProperties(recordId: number, orgId: string, data: any): Promise<void> {
    const key = cacheKeys.recordProperties(recordId, orgId);
    await this.set(key, data, cacheTTL.recordProperties);
  }

  static async getCachedRecordProperties(recordId: number, orgId: string): Promise<any | null> {
    const key = cacheKeys.recordProperties(recordId, orgId);
    return this.get(key);
  }

  static async cacheRecordWithProperties(recordId: number, orgId: string, data: any): Promise<void> {
    const key = cacheKeys.recordWithProperties(recordId, orgId);
    await this.set(key, data, cacheTTL.record);
  }

  static async getCachedRecordWithProperties(recordId: number, orgId: string): Promise<any | null> {
    const key = cacheKeys.recordWithProperties(recordId, orgId);
    return this.get(key);
  }

  // Association caching
  static async cacheRecordAssociations(recordId: number, associations: any): Promise<void> {
    const key = cacheKeys.associations(recordId);
    await this.set(key, associations, cacheTTL.associations);
  }

  static async getCachedRecordAssociations(recordId: number): Promise<any | null> {
    const key = cacheKeys.associations(recordId);
    return this.get(key);
  }

  // List membership caching
  static async cacheListMembers(listId: number, memberIds: number[]): Promise<void> {
    const key = cacheKeys.listMembers(listId);
    await this.set(key, memberIds, cacheTTL.listMembers);
  }

  static async getCachedListMembers(listId: number): Promise<number[] | null> {
    const key = cacheKeys.listMembers(listId);
    return this.get(key);
  }

  static async cacheListMemberCount(listId: number, count: number): Promise<void> {
    const key = cacheKeys.listMemberCount(listId);
    await this.set(key, count, cacheTTL.listMembers);
  }

  static async getCachedListMemberCount(listId: number): Promise<number | null> {
    const key = cacheKeys.listMemberCount(listId);
    return this.get(key);
  }

  // Pipeline caching
  static async cachePipelineStages(pipelineId: number, stages: any[]): Promise<void> {
    const key = cacheKeys.pipelineStages(pipelineId);
    await this.set(key, stages, cacheTTL.pipelineStages);
  }

  static async getCachedPipelineStages(pipelineId: number): Promise<any[] | null> {
    const key = cacheKeys.pipelineStages(pipelineId);
    return this.get(key);
  }

  // Organization schema caching
  static async cacheOrgSchema(orgId: string, objectType: string, schema: any): Promise<void> {
    const key = cacheKeys.orgSchema(orgId, objectType);
    await this.set(key, schema, cacheTTL.orgSchema);
  }

  static async getCachedOrgSchema(orgId: string, objectType: string): Promise<any | null> {
    const key = cacheKeys.orgSchema(orgId, objectType);
    return this.get(key);
  }

  static async cacheObjectDefinition(objectType: string, definition: any): Promise<void> {
    const key = cacheKeys.objectDefinition(objectType);
    await this.set(key, definition, cacheTTL.objectDefinition);
  }

  static async getCachedObjectDefinition(objectType: string): Promise<any | null> {
    const key = cacheKeys.objectDefinition(objectType);
    return this.get(key);
  }

  // Search result caching
  static async cacheSearchResults(query: string, orgId: string, results: any[]): Promise<void> {
    const key = cacheKeys.searchResults(query, orgId);
    await this.set(key, results, cacheTTL.searchResults);
  }

  static async getCachedSearchResults(query: string, orgId: string): Promise<any[] | null> {
    const key = cacheKeys.searchResults(query, orgId);
    return this.get(key);
  }

  // Cache invalidation helpers
  static async invalidateRecordCache(recordId: number, orgId: string): Promise<void> {
    await Promise.all([
      this.del(cacheKeys.record(recordId)),
      this.del(cacheKeys.recordProperties(recordId, orgId)),
      this.del(cacheKeys.recordWithProperties(recordId, orgId)),
      this.del(cacheKeys.associations(recordId)),
      this.del(cacheKeys.recordStages(recordId)),
    ]);
  }

  static async invalidateListCache(listId: number): Promise<void> {
    await Promise.all([
      this.del(cacheKeys.listMembers(listId)),
      this.del(cacheKeys.listMemberCount(listId)),
    ]);
  }

  static async invalidatePipelineCache(pipelineId: number): Promise<void> {
    await Promise.all([
      this.del(cacheKeys.pipelineStages(pipelineId)),
      this.del(cacheKeys.pipelineRecords(pipelineId)),
      this.invalidatePattern(cacheKeys.pipelineMetrics(pipelineId, '*')),
    ]);
  }

  static async invalidateOrgCache(orgId: string): Promise<void> {
    await this.invalidatePattern(cachePatterns.organization(orgId));
  }

  static async invalidateSearchCache(orgId: string): Promise<void> {
    await this.invalidatePattern(cachePatterns.search(orgId));
  }

  // Health check
  static async ping(): Promise<boolean> {
    try {
      const result = await redis.send('PING', []);
      return result === 'PONG';
    } catch (error) {
      console.error('Redis ping failed:', error);
      return false;
    }
  }

  // Cache statistics
  static async getStats() {
    try {
      const info = await redis.send('INFO', ['memory', 'stats']) as string;
      return info;
    } catch (error) {
      console.error('Failed to get Redis stats:', error);
      return null;
    }
  }
}