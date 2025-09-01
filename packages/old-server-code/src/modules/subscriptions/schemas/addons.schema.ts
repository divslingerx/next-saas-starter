import { pgTable } from "drizzle-orm/pg-core";
import { organization } from "../../../db/schema/auth";
import { boolean, index, timestamp, varchar } from "drizzle-orm/pg-core";

export const addOns = pgTable(
  "add_ons",
  {
    id: varchar("id", { length: 15 }).primaryKey(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).$onUpdate(
      () => new Date()
    ),
    name: varchar("title", { length: 255 }).notNull(),
    active: boolean("active").default(true).notNull(),
    priceId: varchar("price_id", { length: 255 }).notNull().unique(),
    orgId: varchar("org_id", { length: 255 })
      .references(() => organization.id)
      .notNull(),
  },
  (t) => ({
    addOnOrgIdx: index("add_on_org_idx").on(t.orgId)
  })
);

export type AddOn = typeof addOns.$inferSelect;
export type NewAddOn = typeof addOns.$inferInsert;
