import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

const connectionString = process.env.POSTGRES_URL;
if (!connectionString) {
  throw new Error("POSTGRES_URL is not defined");
}

const client = postgres(connectionString);
export const db = drizzle({
  client,
  schema,
  casing: "snake_case",
});