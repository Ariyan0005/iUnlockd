import { pgTable, serial, integer, varchar, decimal, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

export const cryptoDeposits = pgTable("crypto_deposits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  network: varchar("network", { length: 50 }).notNull(),
  method: varchar("method", { length: 50 }).notNull().default("crypto"),
  walletAddress: varchar("wallet_address", { length: 255 }).notNull(),
  txHash: varchar("tx_hash", { length: 255 }),
  addressIndex: integer("address_index"),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type CryptoDeposit = typeof cryptoDeposits.$inferSelect;
