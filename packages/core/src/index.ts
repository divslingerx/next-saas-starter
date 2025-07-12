export * from './types';
export * from './plugin';

// Auth exports
export { auth } from './auth/auth';
export { authClient, authClient as client, oneTap } from './auth/auth-client';
export type { AuthSession } from './auth/auth-types';