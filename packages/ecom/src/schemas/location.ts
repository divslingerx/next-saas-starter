import { text, bigint, boolean, timestamp, index, pgTableCreator } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Create table with prefix
export const createTable = pgTableCreator((name) => `agency-app_${name}`);

// Location table
export const location = createTable("location", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  
  // Basic information
  name: text("name"),
  phone: text("phone"),
  
  // Address
  address1: text("address1"),
  address2: text("address2"),
  city: text("city"),
  province: text("province"),
  provinceCode: text("province_code"),
  country: text("country"),
  countryCode: text("country_code"),
  countryName: text("country_name"),
  zip: text("zip"),
  
  // Localized names
  localizedCountryName: text("localized_country_name"),
  localizedProvinceName: text("localized_province_name"),
  
  // Flags
  active: boolean("active"),
  legacy: boolean("legacy"),
  
  // Timestamps
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
}, (table) => [
  index("location_active_idx").on(table.active),
  index("location_country_code_idx").on(table.countryCode),
]);

// Create Zod schemas for validation
export const insertLocationSchema = createInsertSchema(location, {
  active: z.boolean().optional(),
  legacy: z.boolean().optional(),
});
export const selectLocationSchema = createSelectSchema(location);

// Type exports
export type Location = typeof location.$inferSelect;
export type NewLocation = typeof location.$inferInsert;