import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema/index";

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://crawler_user:crawler_password@localhost:5432/crawler_db",
});

export const db = drizzle(pool, { schema });
export { schema };
