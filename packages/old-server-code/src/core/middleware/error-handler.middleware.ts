import type { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { CancellationError, TimeoutError } from '../utils/cancellation';
import { AuthorizationError } from '../services/authorization-service';

export async function errorHandlerMiddleware(c: Context, next: Next) {
  try {
    await next();
  } catch (error) {
    console.error('Request error:', error);
    
    // Handle specific error types
    if (error instanceof HTTPException) {
      return error.getResponse();
    }
    
    if (error instanceof AuthorizationError) {
      return c.json({
        status: 'error',
        message: error.message,
        code: 'AUTHORIZATION_ERROR',
        meta: {
          requestId: crypto.randomUUID(),
          timestamp: new Date().toISOString()
        }
      }, 403);
    }
    
    if (error instanceof CancellationError) {
      return c.json({
        status: 'error',
        message: 'Request was cancelled',
        code: 'REQUEST_CANCELLED',
        meta: {
          requestId: crypto.randomUUID(),
          timestamp: new Date().toISOString()
        }
      }, 408);
    }
    
    if (error instanceof TimeoutError) {
      return c.json({
        status: 'error',
        message: 'Request timed out',
        code: 'REQUEST_TIMEOUT',
        meta: {
          requestId: crypto.randomUUID(),
          timestamp: new Date().toISOString()
        }
      }, 408);
    }
    
    // Database constraint errors
    if (error instanceof Error) {
      if (error.message.includes('duplicate key') || error.message.includes('UNIQUE constraint')) {
        return c.json({
          status: 'error',
          message: 'Resource already exists',
          code: 'DUPLICATE_RESOURCE',
          meta: {
            requestId: crypto.randomUUID(),
            timestamp: new Date().toISOString()
          }
        }, 409);
      }
      
      if (error.message.includes('foreign key') || error.message.includes('violates not-null')) {
        return c.json({
          status: 'error',
          message: 'Invalid data provided',
          code: 'DATA_VALIDATION_ERROR',
          meta: {
            requestId: crypto.randomUUID(),
            timestamp: new Date().toISOString()
          }
        }, 400);
      }
    }
    
    // Default server error
    return c.json({
      status: 'error',
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      meta: {
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === 'development' && { 
          debug: error instanceof Error ? error.message : String(error) 
        })
      }
    }, 500);
  }
}