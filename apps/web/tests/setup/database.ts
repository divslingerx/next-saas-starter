import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import * as schema from '@/server/db/schema';

let container: StartedPostgreSqlContainer;
let sql: postgres.Sql;
let db: ReturnType<typeof drizzle>;

export async function setupTestDatabase() {
  // Start PostgreSQL container
  container = await new PostgreSqlContainer()
    .withDatabase('test_db')
    .withUsername('test_user')
    .withPassword('test_pass')
    .start();

  // Create connection
  const connectionString = container.getConnectionUri();
  sql = postgres(connectionString);
  db = drizzle(sql, { schema });

  // Run migrations
  await migrate(db, { migrationsFolder: './drizzle' });

  return { db, sql, container };
}

export async function cleanupTestDatabase() {
  await sql.end();
  await container.stop();
}

export async function clearDatabase() {
  // Clear all tables in reverse dependency order
  const tables = [
    'order_line_items',
    'orders',
    'cart_items',
    'carts',
    'product_variants',
    'products',
    'customer_accounts',
  ];

  for (const table of tables) {
    await sql`DELETE FROM ${sql(table)}`;
  }
}

// Test data factories
export const testFactories = {
  createTestProduct: async (overrides = {}) => {
    const product = {
      id: `PROD-${Date.now()}`,
      name: 'Test Product',
      handle: 'test-product',
      status: 'active',
      ...overrides,
    };
    
    await db.insert(schema.products).values(product);
    return product;
  },

  createTestCustomer: async (orgId: string, overrides = {}) => {
    const customer = {
      id: `CUST-${Date.now()}`,
      authOrgId: orgId,
      accountType: 'personal' as const,
      ...overrides,
    };
    
    await db.insert(schema.customerAccounts).values(customer);
    return customer;
  },

  createTestOrder: async (customerId: string, overrides = {}) => {
    const order = {
      id: `ORD-${Date.now()}`,
      customerAccountId: customerId,
      status: 'pending',
      totalAmount: 100,
      ...overrides,
    };
    
    await db.insert(schema.orders).values(order);
    return order;
  },
};