/**
 * Redis Client Configuration
 * Using Bun's native Redis client for optimal performance
 */

import { redis, RedisClient } from "bun";

// Use Bun's default redis client with environment configuration
// Reads from REDIS_URL environment variable, defaults to redis://localhost:6379
const redisClient = redis;

// For custom configuration if needed:
// const redisClient = new RedisClient(process.env.REDIS_URL || "redis://localhost:6379", {
//   connectionTimeout: 10000,
//   autoReconnect: true,
//   maxRetries: 10,
//   enableAutoPipelining: true,
// });

export { redisClient as redis };

// Cache key generators for consistent naming
export const cacheKeys = {
  // Record-related caches
  record: (id: number) => `record:${id}`,
  recordProperties: (id: number, orgId: string) => `record:props:${orgId}:${id}`,
  recordWithProperties: (id: number, orgId: string) => `record:full:${orgId}:${id}`,
  
  // Association caches
  associations: (recordId: number) => `assoc:${recordId}`,
  associationsFrom: (recordId: number) => `assoc:from:${recordId}`,
  associationsTo: (recordId: number) => `assoc:to:${recordId}`,
  
  // List and membership caches
  listMembers: (listId: number) => `list:members:${listId}`,
  listMemberCount: (listId: number) => `list:count:${listId}`,
  listMembership: (recordId: number) => `list:membership:${recordId}`,
  
  // Pipeline and stage caches
  pipelineStages: (pipelineId: number) => `pipeline:stages:${pipelineId}`,
  pipelineRecords: (pipelineId: number) => `pipeline:records:${pipelineId}`,
  recordStages: (recordId: number) => `record:stages:${recordId}`,
  
  // Organization schema caches
  orgSchema: (orgId: string, objectType: string) => `org:schema:${orgId}:${objectType}`,
  objectDefinition: (objectType: string) => `objdef:${objectType}`,
  
  // Search and filter caches
  searchResults: (query: string, orgId: string) => `search:${orgId}:${Buffer.from(query).toString('base64')}`,
  filterResults: (filterId: number) => `filter:${filterId}`,
  
  // Metrics and aggregation caches
  orgMetrics: (orgId: string) => `metrics:org:${orgId}`,
  pipelineMetrics: (pipelineId: number, period: string) => `metrics:pipeline:${pipelineId}:${period}`,
};

// Cache TTL configurations (in seconds)
export const cacheTTL = {
  // Frequently updated data - shorter TTL
  record: 300,              // 5 minutes - records change often
  recordProperties: 300,    // 5 minutes - properties change often
  associations: 600,        // 10 minutes - associations change moderately
  listMembers: 180,         // 3 minutes - dynamic list membership
  
  // Moderately stable data
  pipelineStages: 1800,     // 30 minutes - stages rarely change
  recordStages: 900,        // 15 minutes - record stages change moderately
  searchResults: 600,       // 10 minutes - search results can become stale
  
  // Very stable data - longer TTL
  orgSchema: 3600,          // 1 hour - organization schemas are stable
  objectDefinition: 7200,   // 2 hours - object definitions very stable
  filterResults: 1800,      // 30 minutes - saved filters stable
  
  // Metrics and aggregations
  orgMetrics: 1800,         // 30 minutes - metrics updated periodically
  pipelineMetrics: 3600,    // 1 hour - pipeline metrics calculated periodically
};

// Cache patterns for bulk invalidation
export const cachePatterns = {
  record: (recordId: number) => `*:${recordId}*`,
  organization: (orgId: string) => `*:${orgId}:*`,
  list: (listId: number) => `list:*:${listId}*`,
  pipeline: (pipelineId: number) => `pipeline:*:${pipelineId}*`,
  search: (orgId: string) => `search:${orgId}:*`,
};