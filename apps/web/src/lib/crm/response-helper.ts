import type { Context } from 'hono';

export class ResponseHelper {
  static success<T>(c: Context, data: T, message?: string) {
    return c.json({
      status: 'success',
      data,
      message,
      meta: {
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString()
      }
    });
  }
  
  static error(c: Context, message: string, statusCode: number = 500) {
    return c.json({
      status: 'error',
      message,
      meta: {
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString()
      }
    }, statusCode as any);
  }
  
  static transformRecord(record: any): any {
    if (!record) return null;
    return {
      id: record.id,
      ...record.properties,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      archived: record.isArchived
    };
  }
}