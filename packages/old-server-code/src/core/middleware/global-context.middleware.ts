import type { Context, Next } from 'hono';
import { globalContext } from '../context/global-context';

export async function globalContextMiddleware(c: Context, next: Next) {
  // Get auth data from context (assuming auth middleware runs before this)
  const user = c.get('user');
  const session = c.get('session');
  const organizationId = c.get('organizationId') || 'default-org';
  
  // Create abort controller for this request
  const abortController = new AbortController();
  
  // Set up request timeout if needed
  const requestTimeout = 30000; // 30 seconds default
  const timeoutId = setTimeout(() => {
    abortController.abort(new Error('Request timeout'));
  }, requestTimeout);
  
  try {
    // Run the request within global context
    await globalContext.run({
      userId: user?.id,
      organizationId: organizationId,
      userPermissions: [], // TODO: Get from session when implemented
      userRoles: [], // TODO: Get from session when implemented
      abortController,
      requestTimeout,
    }, async () => {
      await next();
    });
  } finally {
    clearTimeout(timeoutId);
  }
}