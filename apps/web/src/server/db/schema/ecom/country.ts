import { text, bigint, doublePrecision, integer, index, pgTableCreator } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Create table with prefix
export const createTable = pgTableCreator((name) => `agency-app_${name}`);

// Country table
export const country = createTable("country", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  code: text("code"),
  name: text("name"),
  tax: doublePrecision("tax"),
}, (table) => [
  index("country_code_idx").on(table.code),
]);

// Country provinces table
export const countryProvinces = createTable("country_provinces", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  countryId: bigint("country_id", { mode: "number" }).notNull(),
  
  code: text("code"),
  name: text("name"),
  index: integer("index"),
  
  // Tax information
  tax: doublePrecision("tax"),
  taxName: text("tax_name"),
  taxPercentage: doublePrecision("tax_percentage"),
  taxType: text("tax_type"),
}, (table) => [
  index("country_provinces_country_id_idx").on(table.countryId),
  index("country_provinces_code_idx").on(table.code),
]);

// Create Zod schemas for validation
export const insertCountrySchema = createInsertSchema(country);
export const selectCountrySchema = createSelectSchema(country);

export const insertCountryProvincesSchema = createInsertSchema(countryProvinces);
export const selectCountryProvincesSchema = createSelectSchema(countryProvinces);

// Type exports
export type Country = typeof country.$inferSelect;
export type NewCountry = typeof country.$inferInsert;

export type CountryProvinces = typeof countryProvinces.$inferSelect;
export type NewCountryProvinces = typeof countryProvinces.$inferInsert;