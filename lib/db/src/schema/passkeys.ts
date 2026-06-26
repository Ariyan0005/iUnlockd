import { pgTable, serial, integer, text, varchar, bigint, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

export const passkeys = pgTable("passkeys", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  credentialId: text("credential_id").notNull().unique(),
  publicKey: text("public_key").notNull(),
  counter: bigint("counter", { mode: "number" }).notNull().default(0),
  deviceName: varchar("device_name", { length: 100 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Passkey = typeof passkeys.$inferSelect;
