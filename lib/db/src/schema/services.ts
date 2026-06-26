import { pgTable, serial, varchar, text, decimal, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull().default("imei"),
  serviceType: varchar("service_type", { length: 50 }).notNull().default("imei"),
  description: text("description"),
  deliveryTime: varchar("delivery_time", { length: 100 }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  apiServiceId: varchar("api_service_id", { length: 100 }),
  merchantId: integer("merchant_id"),
  identifierType: varchar("identifier_type", { length: 20 }).notNull().default("imei"),
  fieldLabel: varchar("field_label", { length: 100 }),
  requireQuantity: boolean("require_quantity").notNull().default(false),
  requireUsername: boolean("require_username").notNull().default(false),
  requireEmail: boolean("require_email").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertServiceSchema = createInsertSchema(services).omit({ id: true, createdAt: true });
export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;
