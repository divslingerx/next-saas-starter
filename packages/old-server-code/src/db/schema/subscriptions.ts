import { createTable } from "../utils";
import { organization } from "./auth";
import { boolean, index, timestamp, varchar } from "drizzle-orm/pg-core";

export const subscriptions = createTable(
  "subscriptions",
  {
    id: varchar("id", { length: 15 }).primaryKey(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).$onUpdate(
      () => new Date(),
    ),
    name: varchar("title", { length: 255 }).notNull(),
    active: boolean("active").default(true).notNull(),
    priceId: varchar("price_id", { length: 255 }).notNull().unique(),
    orgId: varchar("org_id", { length: 255 })
      .references(() => organization.id)
      .notNull(),
  },
  (t) => ({
    orgIdx: index("add_on_org_idx").on(t.orgId),
  }),
);

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
