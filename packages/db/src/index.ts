export * from './schema';
export * from './auth-schema';
export { db } from './client';
export { posts, createTable } from './schema';
export type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';