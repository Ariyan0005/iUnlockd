import cron from "node-cron";
import { syncMerchantProducts } from "./sync";
import { checkPendingDeposits } from "../payments/auto/usdt/monitor";
import { logger } from "../../lib/logger";
import { db } from "@workspace/db";
import { orders, users } from "@workspace/db";
import { eq, and, isNotNull, inArray } from "drizzle-orm";
import { checkMerchantOrderStatus } from "./order";


async function checkOrderStatuses(): Promise<void> {
  try {
    const pending = await db.select().from(orders)
      .where(and(
        inArray(orders.status, ["processing", "pending"]),
        isNotNull(orders.apiOrderId)
      ))
      .limit(50);
    if (pending.length === 0) return;
    logger.info({ count: pending.length }, "Checking merchant order statuses");
    for (const order of pending) {
      try {
        if (!order.apiOrderId) continue;
        const result = await checkMerchantOrderStatus({
          apiOrderId: order.apiOrderId,
          merchantId: order.merchantId ?? null,
        });
        const s = result.status.toLowerCase();
        let newStatus: string | null = null;
        if (s === "completed" || s === "complete" || s === "delivered") {
          newStatus = "completed";
        } else if (s === "cancelled" || s === "canceled" || s === "rejected" || s === "failed" || s === "error") {
          newStatus = "failed";
          // Refund balance
          if (order.userId && order.price) {
            const [user] = await db.select().from(users).where(eq(users.id, order.userId)).limit(1);
            if (user) {
              const newBal = (parseFloat(user.balance ?? "0") + parseFloat(order.price)).toFixed(2);
              await db.update(users).set({ balance: newBal }).where(eq(users.id, order.userId));
              logger.info({ orderId: order.id, refunded: order.price }, "Auto-refunded failed order");
            }
          }
        } else if (s === "in_progress" || s === "inprogress") {
          newStatus = "processing";
        }
        if (newStatus && newStatus !== order.status) {
          await db.update(orders).set({ status: newStatus }).where(eq(orders.id, order.id));
          logger.info({ orderId: order.id, old: order.status, new: newStatus }, "Order status updated");
        }
      } catch (err) {
        logger.warn({ err, orderId: order.id }, "Failed to check order status");
      }
    }
  } catch (err) {
    logger.error({ err }, "Order status check cron error");
  }
}

export function startMerchantCron(): void {
  const endpoint = process.env["MERCHANT_API_ENDPOINT"];
  if (!endpoint) {
    logger.info("MERCHANT_API_ENDPOINT not configured — product sync cron disabled");
  } else {
    cron.schedule("0 */6 * * *", async () => {
      try {
        const result = await syncMerchantProducts();
        if (result.skipped) logger.info("Merchant cron: skipped");
        else logger.info({ synced: result.synced, total: result.total }, "Merchant cron: sync complete");
      } catch (err) {
        logger.error({ err }, "Merchant cron: sync failed");
      }
    });
    logger.info("Merchant product sync cron started (every 6 hours)");
  }
  cron.schedule("*/2 * * * *", async () => {
    try {
      await checkPendingDeposits();
    } catch (err) {
      logger.error({ err }, "Payment monitor cron: unexpected error");
    }
  });
  logger.info("Payment monitor cron started (every 2 minutes)");
  // Auto-process orders every 5 minutes
  cron.schedule("*/5 * * * *", async () => {
    try { await checkOrderStatuses(); }
    catch (err) { logger.error({ err }, "Order status cron error"); }
  });
  logger.info("Order status check cron started (every 5 minutes)");
}
