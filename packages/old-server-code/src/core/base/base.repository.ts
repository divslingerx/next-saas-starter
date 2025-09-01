/**
 * Base Repository
 * Abstract class providing common database operations
 */

import { and, eq, gte, lte, desc, asc, sql, type SQL } from 'drizzle-orm';
import type { PgTable, PgSelect } from 'drizzle-orm/pg-core';
import type { db as Database } from '@/db';

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
   * Find one record with conditions
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
   * Find with pagination
   */
  async findPaginated(
    options: PaginationOptions & { where?: SQL } = {}
  ): Promise<PaginatedResult<TEntity>> {
    const { 
      page = 1, 
      limit = 10, 
      orderBy = 'id', 
      orderDirection = 'desc',
      where
    } = options;
    
    const offset = (page - 1) * limit;
    
    // Build count query
    let countQuery = this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(this.table);
    
    if (where) {
      countQuery = countQuery.where(where) as any;
    }
    
    // Get total count
    const result = await countQuery;
    const count = result[0]?.count ?? 0;
    
    // Build data query
    let dataQuery = this.db
      .select()
      .from(this.table)
      .limit(limit)
      .offset(offset);
    
    if (where) {
      dataQuery = dataQuery.where(where) as any;
    }
    
    // Apply ordering if column exists
    if (orderBy && (this.table as any)[orderBy]) {
      const orderSql = orderDirection === 'asc' 
        ? asc((this.table as any)[orderBy]) 
        : desc((this.table as any)[orderBy]);
      dataQuery = dataQuery.orderBy(orderSql) as any;
    }
    
    const data = await dataQuery;
    
    return {
      data: data as TEntity[],
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
        hasNext: page * limit < count,
        hasPrevious: page > 1,
      },
    };
  }

  /**
   * Create a new record
   */
  async create(data: TInsert): Promise<TEntity> {
    const [result] = await this.db
      .insert(this.table)
      .values(data as any)
      .returning();
    
    if (!result) {
      throw new Error('Failed to create record');
    }
    
    return result as TEntity;
  }

  /**
   * Create multiple records
   */
  async createMany(data: TInsert[]): Promise<TEntity[]> {
    if (data.length === 0) {
      return [];
    }
    
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
   * Update records with conditions
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
   * Delete records with conditions
   */
  async deleteMany(where: SQL): Promise<number> {
    const result = await this.db
      .delete(this.table)
      .where(where);
    
    return (result as any).rowCount || 0;
  }

  /**
   * Count records
   */
  async count(where?: SQL): Promise<number> {
    let query = this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(this.table);
    
    if (where) {
      query = query.where(where) as any;
    }
    
    const result = await query;
    return result[0]?.count ?? 0;
  }

  /**
   * Check if a record exists by ID
   */
  async exists(id: number | string): Promise<boolean> {
    const count = await this.count(eq((this.table as any).id, id));
    return count > 0;
  }

  /**
   * Check if records exist with conditions
   */
  async existsWhere(where: SQL): Promise<boolean> {
    const count = await this.count(where);
    return count > 0;
  }

  /**
   * Execute a transaction
   * Useful for complex operations that need to be atomic
   */
  async transaction<R>(
    callback: (tx: typeof Database) => Promise<R>
  ): Promise<R> {
    return await (this.db as any).transaction(callback);
  }

  /**
   * Find or create a record
   */
  async findOrCreate(
    where: SQL,
    data: TInsert
  ): Promise<{ entity: TEntity; created: boolean }> {
    // Try to find existing
    const existing = await this.findOne(where);
    
    if (existing) {
      return { entity: existing, created: false };
    }
    
    // Create new
    const entity = await this.create(data);
    return { entity, created: true };
  }

  /**
   * Upsert (update or insert) a record
   */
  async upsert(
    where: SQL,
    insertData: TInsert,
    updateData: TUpdate
  ): Promise<TEntity> {
    const existing = await this.findOne(where);
    
    if (existing) {
      // Update existing
      const updated = await this.updateMany(where, updateData);
      if (updated.length === 0) {
        throw new Error('Failed to update record');
      }
      return updated[0]!;
    }
    
    // Insert new
    return await this.create(insertData);
  }

  /**
   * Batch operations with transaction
   */
  async batch<R>(operations: Array<() => Promise<any>>): Promise<R[]> {
    return await this.transaction(async (tx) => {
      const results: R[] = [];
      
      for (const operation of operations) {
        const result = await operation();
        results.push(result);
      }
      
      return results;
    });
  }

  /**
   * Get table name (useful for raw SQL)
   */
  getTableName(): string {
    return (this.table as any).name || this.table.constructor.name;
  }
}