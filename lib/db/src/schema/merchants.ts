import { pgTable, serial, varchar, boolean, timestamp, text } from "drizzle-orm/pg-core";

export const merchants = pgTable("merchants", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  apiEndpoint: varchar("api_endpoint", { length: 500 }).notNull(),
  apiKey: varchar("api_key", { length: 500 }).notNull(),
  apiUser: varchar("api_user", { length: 255 }),
  apiFormat: varchar("api_format", { length: 50 }).notNull().default("rest"),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Merchant = typeof merchants.$inferSelect;
