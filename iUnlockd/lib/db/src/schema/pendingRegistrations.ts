import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const pendingRegistrations = pgTable("pending_registrations", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  country: text("country"),
  mobile: text("mobile"),
  otp: text("otp").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
