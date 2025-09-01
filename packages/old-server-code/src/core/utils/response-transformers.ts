import type { Context } from 'hono';
import type { Record as PlatformRecord } from '@/db/schema/platform/types';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface StandardResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  meta: {
    requestId: string;
    timestamp: string;
    pagination?: PaginationMeta;
  };
}

export class ResponseTransformers {
  /**
   * Transform a platform record to API response format
   */
  static transformRecord(record: PlatformRecord): any {
    if (!record) return null;
    
    return {
      id: record.id,
      ...(record.properties || {}),
      displayName: record.displayName,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      archived: record.isArchived,
      externalId: record.externalId,
    };
  }

  /**
   * Transform multiple records
   */
  static transformRecords(records: PlatformRecord[]): any[] {
    return records.map(record => this.transformRecord(record));
  }

  /**
   * Create standardized success response
   */
  static success<T>(
    c: Context,
    data: T,
    message?: string,
    pagination?: PaginationMeta
  ): Response {
    const response: StandardResponse<T> = {
      status: 'success',
      data,
      message,
      meta: {
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        ...(pagination && { pagination })
      }
    };

    return c.json(response);
  }

  /**
   * Create standardized paginated response
   */
  static paginated<T>(
    c: Context,
    data: T[],
    pagination: {
      page: number;
      limit: number;
      total: number;
    },
    message?: string
  ): Response {
    const totalPages = Math.ceil(pagination.total / pagination.limit);
    
    const paginationMeta: PaginationMeta = {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages,
      hasNext: pagination.page < totalPages,
      hasPrev: pagination.page > 1,
    };

    return this.success(c, data, message, paginationMeta);
  }

  /**
   * Create standardized error response
   */
  static error(
    c: Context,
    message: string,
    statusCode: number = 500,
    code?: string
  ): Response {
    const response: StandardResponse<never> = {
      status: 'error',
      message,
      meta: {
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        ...(code && { code })
      }
    };

    return c.json(response, statusCode as any);
  }

  /**
   * Transform HubSpot-style search results
   */
  static transformSearchResults(results: {
    total: number;
    results: PlatformRecord[];
    paging?: { next?: { after: string } };
  }): {
    total: number;
    results: any[];
    paging?: { next?: { after: string } };
  } {
    return {
      total: results.total,
      results: this.transformRecords(results.results),
      paging: results.paging,
    };
  }

  /**
   * Transform bulk operation results
   */
  static transformBulkResults<T>(results: {
    status: string;
    results: T[];
  }): {
    status: string;
    results: T[];
    summary: {
      total: number;
      successful: number;
      failed: number;
    };
  } {
    return {
      status: results.status,
      results: results.results,
      summary: {
        total: results.results.length,
        successful: results.results.filter((r: any) => !r.error).length,
        failed: results.results.filter((r: any) => r.error).length,
      }
    };
  }
}