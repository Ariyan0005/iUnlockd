import { pgTable, serial, varchar, boolean, timestamp, text } from "drizzle-orm/pg-core";

export const checkProviders = pgTable("check_providers", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  apiEndpoint: varchar("api_endpoint", { length: 500 }).notNull(),
  apiKey: varchar("api_key", { length: 500 }).notNull(),
  apiUser: varchar("api_user", { length: 255 }),
  apiFormat: varchar("api_format", { length: 30 }).notNull().default("rest"),
  httpMethod: varchar("http_method", { length: 10 }).notNull().default("GET"),
  identifierParam: varchar("identifier_param", { length: 100 }).notNull().default("imei"),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type CheckProvider = typeof checkProviders.$inferSelect;