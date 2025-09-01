import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { ecomSchema } from "@charmlabs/ecom";

/**
 * Server app's database connection
 * This is completely isolated from other apps
 */

// Cache the database connection in development
const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
};

const getDatabaseUrl = () => {
  // Use SERVER_DATABASE_URL to distinguish from other apps
  const dbUrl = process.env.SERVER_DATABASE_URL || process.env.DATABASE_URL;

  if (!dbUrl) {
    throw new Error("SERVER_DATABASE_URL or DATABASE_URL is not defined");
  }

  return dbUrl;
};

const conn = globalForDb.conn ?? postgres(getDatabaseUrl());

if (process.env.NODE_ENV !== "production") {
  globalForDb.conn = conn;
}

// Create the Drizzle instance with your app's schema
export const db = drizzle(conn, { ...ecomSchema });
