import type { Context, Next } from 'hono';

export interface PerformanceMetrics {
  responseTime: number;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  path: string;
  method: string;
  statusCode: number;
  timestamp: Date;
}

const SLOW_REQUEST_THRESHOLD = 1000; // 1 second
const MEMORY_WARNING_THRESHOLD = 500 * 1024 * 1024; // 500MB

export async function performanceMonitorMiddleware(c: Context, next: Next) {
  const startTime = Date.now();
  const startMemory = process.memoryUsage();
  const path = c.req.path;
  const method = c.req.method;
  
  try {
    await next();
    
    const endTime = Date.now();
    const endMemory = process.memoryUsage();
    const responseTime = endTime - startTime;
    const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;
    
    const metrics: PerformanceMetrics = {
      responseTime,
      memoryUsage: endMemory,
      path,
      method,
      statusCode: c.res.status,
      timestamp: new Date(),
    };
    
    // Log slow requests
    if (responseTime > SLOW_REQUEST_THRESHOLD) {
      console.warn(`[PERF] Slow request: ${method} ${path} - ${responseTime}ms`, {
        responseTime,
        memoryDelta: Math.round(memoryDelta / 1024) + 'KB',
        statusCode: c.res.status,
      });
    }
    
    // Log high memory usage
    if (endMemory.heapUsed > MEMORY_WARNING_THRESHOLD) {
      console.warn(`[PERF] High memory usage: ${Math.round(endMemory.heapUsed / 1024 / 1024)}MB`, {
        path,
        method,
        heapUsed: Math.round(endMemory.heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(endMemory.heapTotal / 1024 / 1024) + 'MB',
      });
    }
    
    // Add performance headers for development
    if (process.env.NODE_ENV === 'development') {
      c.res.headers.set('X-Response-Time', `${responseTime}ms`);
      c.res.headers.set('X-Memory-Usage', `${Math.round(endMemory.heapUsed / 1024)}KB`);
      c.res.headers.set('X-Memory-Delta', `${Math.round(memoryDelta / 1024)}KB`);
    }
    
    // You could emit metrics to a monitoring service here
    // Example: metricsCollector.emit('request', metrics);
    
  } catch (error) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.error(`[PERF] Request failed: ${method} ${path} - ${responseTime}ms`, {
      error: error instanceof Error ? error.message : String(error),
      responseTime,
      path,
      method,
    });
    
    throw error;
  }
}

// Helper function to get current performance stats
export function getPerformanceStats() {
  const memory = process.memoryUsage();
  const uptime = process.uptime();
  
  return {
    memory: {
      heapUsed: Math.round(memory.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memory.heapTotal / 1024 / 1024) + 'MB',
      external: Math.round(memory.external / 1024 / 1024) + 'MB',
      rss: Math.round(memory.rss / 1024 / 1024) + 'MB',
    },
    uptime: Math.round(uptime) + 's',
    timestamp: new Date().toISOString(),
  };
}