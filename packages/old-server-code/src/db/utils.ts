// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration
import { pgTableCreator } from "drizzle-orm/pg-core";
export const createTable = pgTableCreator((name) => `cl_${name}`);
