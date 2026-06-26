import { pgTable, serial, integer, varchar, text, decimal, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";
import { services } from "./services";

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  serviceId: integer("service_id").notNull().references(() => services.id),
  identifier: varchar("identifier", { length: 255 }).notNull(),
  additionalInfo: text("additional_info"),
  quantity: integer("quantity").default(1),
  orderUsername: varchar("order_username", { length: 255 }),
  orderEmail: varchar("order_email", { length: 255 }),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  result: text("result"),
  apiOrderId: varchar("api_order_id", { length: 100 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Order = typeof orders.$inferSelect;
