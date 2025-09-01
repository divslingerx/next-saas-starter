import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

config({ path: ".dev.vars" });

// Production-optimized connection pool for 5K users
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  
  // Connection pool settings optimized for 5K concurrent users
  min: 5,                    // Always keep 5 connections ready
  max: 25,                   // Max 25 concurrent connections (sufficient for 5K users with caching)
  idleTimeoutMillis: 30000,     // Close idle connections after 30s
  
  // Connection reliability  
  connectionTimeoutMillis: 10000,  // 10s to establish connection
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  
  // Query optimization
  statement_timeout: 30000,         // 30s max query time
  idle_in_transaction_session_timeout: 60000,  // 60s max idle in transaction
  
  // Application-level settings
  application_name: 'atkv2-server',
});

// Connection monitoring
pool.on('error', (err) => {
  console.error('Database pool error:', err);
});

pool.on('connect', (client) => {
  console.log('New database connection established');
  
  // Set connection-level optimizations
  client.query(`
    SET work_mem = '32MB';
    SET maintenance_work_mem = '128MB';
    SET effective_cache_size = '1GB';
    SET random_page_cost = 1.1;
  `);
});

pool.on('acquire', () => {
  // Connection acquired from pool - could add metrics here
});

pool.on('release', () => {
  // Connection returned to pool - could add metrics here
});

const db = drizzle(pool, { 
  schema,
  // Enable query logging in development
  logger: process.env.NODE_ENV === 'development'
});

export { db, pool, schema };
