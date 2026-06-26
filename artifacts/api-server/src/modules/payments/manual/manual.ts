import { db } from "@workspace/db";
import { cryptoDeposits } from "@workspace/db";
import { logger } from "../../../lib/logger";

export interface ManualDepositResult {
  id: number;
  orderId: string;
  amount: string;
  status: string;
}

export async function createManualDeposit(
  userId: number,
  amount: number
): Promise<ManualDepositResult> {
  if (!amount || isNaN(amount) || amount < 10) {
    throw new Error("Minimum deposit amount is $10");
  }

  const [deposit] = await db
    .insert(cryptoDeposits)
    .values({
      userId,
      amount: amount.toFixed(2),
      network: "Manual",
      method: "manual",
      walletAddress: "manual-payment",
      status: "pending",
    })
    .returning();

  const orderId = String(deposit.id).padStart(6, "0");

  logger.info({ userId, amount, depositId: deposit.id }, "Manual deposit created");

  return {
    id: deposit.id,
    orderId,
    amount: deposit.amount,
    status: deposit.status,
  };
}
