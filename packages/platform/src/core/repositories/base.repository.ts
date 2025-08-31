/**
 * Base Repository
 * Abstract class providing common database operations for all entities
 */

import { and, eq, gte, lte, desc, asc, sql, type SQL, inArray } from 'drizzle-orm';
import type { PgTable, PgSelect } from 'drizzle-orm/pg-core';
import type { db as Database } from '@charmlabs/db/client';

export interface PaginationOptions {
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface FindOptions {
  where?: SQL;
  orderBy?: SQL;
  limit?: number;
  offset?: number;
}

export interface BatchResult<T> {
  success: T[];
  failed: Array<{ data: any; error: string }>;
  total: number;
}

/**
 * Abstract base repository providing common database operations
 * Extend this class for entity-specific repositories
 */
export abstract class BaseRepository<TEntity, TInsert = TEntity, TUpdate = Partial<TEntity>> {
  constructor(
    protected readonly table: PgTable,
    protected readonly db: typeof Database
  ) {}

  /**
   * Find a single record by ID
   */
  async findById(id: number | string): Promise<TEntity | null> {
    const [result] = await this.db
      .select()
      .from(this.table)
      .where(eq((this.table as any).id, id))
      .limit(1);
    
    return (result as TEntity) || null;
  }

  /**
   * Find all records
   */
  async findAll(): Promise<TEntity[]> {
    const results = await this.db
      .select()
      .from(this.table);
    
    return results as TEntity[];
  }

  /**
   * Find records with conditions
   */
  async findMany(options: FindOptions = {}): Promise<TEntity[]> {
    let query = this.db.select().from(this.table);
    
    if (options.where) {
      query = query.where(options.where) as any;
    }
    
    if (options.orderBy) {
      query = query.orderBy(options.orderBy) as any;
    }
    
    if (options.limit) {
      query = query.limit(options.limit) as any;
    }
    
    if (options.offset) {
      query = query.offset(options.offset) as any;
    }
    
    const results = await query;
    return results as TEntity[];
  }

  /**
   * Find a single record with conditions
   */
  async findOne(where: SQL): Promise<TEntity | null> {
    const [result] = await this.db
      .select()
      .from(this.table)
      .where(where)
      .limit(1);
    
    return (result as TEntity) || null;
  }

  /**
   * Find records with pagination
   */
  async findPaginated(
    options: PaginationOptions = {},
    where?: SQL
  ): Promise<PaginatedResult<TEntity>> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const offset = (page - 1) * limit;
    
    // Build query
    let query = this.db.select().from(this.table);
    
    if (where) {
      query = query.where(where) as any;
    }
    
    // Add ordering
    if (options.orderBy) {
      const column = (this.table as any)[options.orderBy];
      if (column) {
        const orderFn = options.orderDirection === 'desc' ? desc : asc;
        query = query.orderBy(orderFn(column)) as any;
      }
    } else {
      // Default to ID desc
      query = query.orderBy(desc((this.table as any).id)) as any;
    }
    
    // Get total count
    const countQuery = this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(this.table);
    
    if (where) {
      (countQuery as any).where(where);
    }
    
    const [{ count: total }] = await countQuery;
    
    // Get paginated data
    const data = await query.limit(limit).offset(offset);
    
    const totalPages = Math.ceil(total / limit);
    
    return {
      data: data as TEntity[],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }

  /**
   * Count records
   */
  async count(where?: SQL): Promise<number> {
    const query = this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(this.table);
    
    if (where) {
      (query as any).where(where);
    }
    
    const [result] = await query;
    return result.count;
  }

  /**
   * Check if record exists
   */
  async exists(where: SQL): Promise<boolean> {
    const count = await this.count(where);
    return count > 0;
  }

  /**
   * Create a new record
   */
  async create(data: TInsert): Promise<TEntity> {
    const [result] = await this.db
      .insert(this.table)
      .values(data as any)
      .returning();
    
    return result as TEntity;
  }

  /**
   * Create multiple records
   */
  async createMany(data: TInsert[]): Promise<TEntity[]> {
    if (data.length === 0) return [];
    
    const results = await this.db
      .insert(this.table)
      .values(data as any)
      .returning();
    
    return results as TEntity[];
  }

  /**
   * Update a record by ID
   */
  async update(id: number | string, data: TUpdate): Promise<TEntity | null> {
    const [result] = await this.db
      .update(this.table)
      .set(data as any)
      .where(eq((this.table as any).id, id))
      .returning();
    
    return (result as TEntity) || null;
  }

  /**
   * Update multiple records
   */
  async updateMany(where: SQL, data: TUpdate): Promise<TEntity[]> {
    const results = await this.db
      .update(this.table)
      .set(data as any)
      .where(where)
      .returning();
    
    return results as TEntity[];
  }

  /**
   * Delete a record by ID
   */
  async delete(id: number | string): Promise<boolean> {
    const result = await this.db
      .delete(this.table)
      .where(eq((this.table as any).id, id));
    
    return (result as any).rowCount > 0;
  }

  /**
   * Delete multiple records
   */
  async deleteMany(where: SQL): Promise<number> {
    const result = await this.db
      .delete(this.table)
      .where(where);
    
    return (result as any).rowCount || 0;
  }

  /**
   * Soft delete a record (if supported)
   */
  async softDelete(id: number | string): Promise<TEntity | null> {
    if (!(this.table as any).deletedAt) {
      throw new Error('Soft delete not supported for this entity');
    }
    
    return this.update(id, { deletedAt: new Date() } as any);
  }

  /**
   * Restore a soft-deleted record
   */
  async restore(id: number | string): Promise<TEntity | null> {
    if (!(this.table as any).deletedAt) {
      throw new Error('Soft delete not supported for this entity');
    }
    
    return this.update(id, { deletedAt: null } as any);
  }

  /**
   * Batch operation with error handling
   */
  async batch<T>(
    items: T[],
    operation: (item: T) => Promise<any>,
    options: { concurrency?: number } = {}
  ): Promise<BatchResult<any>> {
    const concurrency = options.concurrency || 10;
    const results: BatchResult<any> = {
      success: [],
      failed: [],
      total: items.length,
    };
    
    // Process in chunks
    for (let i = 0; i < items.length; i += concurrency) {
      const chunk = items.slice(i, i + concurrency);
      const promises = chunk.map(async (item) => {
        try {
          const result = await operation(item);
          results.success.push(result);
        } catch (error) {
          results.failed.push({
            data: item,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      });
      
      await Promise.all(promises);
    }
    
    return results;
  }

  /**
   * Find records by IDs
   */
  async findByIds(ids: (number | string)[]): Promise<TEntity[]> {
    if (ids.length === 0) return [];
    
    const results = await this.db
      .select()
      .from(this.table)
      .where(inArray((this.table as any).id, ids));
    
    return results as TEntity[];
  }

  /**
   * Transaction wrapper
   */
  async transaction<T>(
    callback: (tx: typeof Database) => Promise<T>
  ): Promise<T> {
    return await this.db.transaction(async (tx) => {
      return await callback(tx);
    });
  }
}