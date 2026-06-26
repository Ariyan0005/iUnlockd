import { Router } from "express";
import { db } from "@workspace/db";
import { cryptoDeposits, settings, users } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { authenticate, type AuthRequest } from "../middleware/authenticate";
import { deriveAddress, isHDWalletConfigured } from "../modules/payments/auto/usdt/hdWallet";
import { isConfigured as isOpbnbConfigured } from "../modules/payments/auto/usdt/opbnb";

function getStaticWallet(network: string): string | null {
  if (network === "opbnb" && process.env["WALLET_OPBNB"] && process.env["WALLET_OPBNB"] !== "0x0000000000000000000000000000000000000000") {
    return process.env["WALLET_OPBNB"]!;
  }
  if (network === "bsc" && process.env["WALLET_BSC"] && process.env["WALLET_BSC"] !== "0x0000000000000000000000000000000000000000") {
    return process.env["WALLET_BSC"]!;
  }
  return null;
}

const router = Router();

const PLATFORM_FEE = 0.1;
const SUPPORTED_NETWORKS = ["opbnb", "bsc"] as const;
type SupportedNetwork = typeof SUPPORTED_NETWORKS[number];

// Public endpoint — frontend checks this before showing crypto button
router.get("/config", async (_req, res) => {
  try {
    const rows = await db.select().from(settings).where(eq(settings.key, "crypto_enabled")).limit(1);
    res.json({ enabled: rows[0]?.value !== "false" });
  } catch {
    res.json({ enabled: true });
  }
});

async function getNextAddressIndex(): Promise<number> {
  const result = await db
    .select({ maxIndex: sql<number>`coalesce(max(address_index), -1)` })
    .from(cryptoDeposits)
    .where(sql`address_index IS NOT NULL`);
  return (result[0]?.maxIndex ?? -1) + 1;
}

router.post("/create-order", authenticate, async (req: AuthRequest, res) => {
  try {
    const { amount, network } = req.body as { amount: number; network: string };

    // Check global admin toggle — 2FA users can bypass
    const [cryptoSetting] = await db.select().from(settings).where(eq(settings.key, "crypto_enabled")).limit(1);
    if (cryptoSetting?.value === "false") {
      const [caller] = await db.select({ totpEnabled: users.totpEnabled }).from(users).where(eq(users.id, req.userId!)).limit(1);
      if (!caller?.totpEnabled) {
        res.status(503).json({ error: "Crypto deposits are currently suspended. Please use manual payment." });
        return;
      }
    }

    if (!amount || amount < 10) {
      res.status(400).json({ error: "Minimum deposit is $10 USDT" });
      return;
    }
    if (!(SUPPORTED_NETWORKS as readonly string[]).includes(network)) {
      res.status(400).json({ error: `Invalid network. Supported: ${SUPPORTED_NETWORKS.join(", ")}` });
      return;
    }

    let walletAddress: string;
    let addressIndex: number | null = null;

    if (isHDWalletConfigured()) {
      addressIndex = req.userId!;
      walletAddress = deriveAddress(req.userId!);
    } else {
      const staticWallet = getStaticWallet(network);
      if (staticWallet) {
        walletAddress = staticWallet;
        // addressIndex stays null — manual/polling confirmation
      } else {
        res.status(503).json({ error: "Payment wallet not configured for this network. Please contact support." });
        return;
      }
    }

    const invoiceAmount = parseFloat(amount.toFixed(2));
    const payableAmount = parseFloat((invoiceAmount + PLATFORM_FEE).toFixed(2));
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const [deposit] = await db.insert(cryptoDeposits).values({
      userId: req.userId!,
      amount: invoiceAmount.toFixed(2),
      network,
      method: "crypto",
      walletAddress,
      addressIndex,
      status: "pending",
      expiresAt,
    }).returning();

    res.json({
      id: deposit.id,
      amount: deposit.amount,
      invoiceAmount: deposit.amount,
      payableAmount: payableAmount.toFixed(2),
      platformFee: PLATFORM_FEE.toFixed(2),
      walletAddress: deposit.walletAddress,
      network: deposit.network,
      status: deposit.status,
      expiresAt: deposit.expiresAt,
      autoDetection: isHDWalletConfigured(),
      note: `Please send exactly ${payableAmount.toFixed(2)} USDT (includes $${PLATFORM_FEE} platform fee)`,
    });
  } catch (err) {
    req.log.error({ err }, "Create crypto order error");
    res.status(500).json({ error: "Failed to create order" });
  }
});

router.get("/status/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params["id"]);
    const [deposit] = await db.select().from(cryptoDeposits).where(eq(cryptoDeposits.id, id)).limit(1);
    if (!deposit || deposit.userId !== req.userId) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    if (deposit.status === "pending" && deposit.expiresAt && new Date() > new Date(deposit.expiresAt)) {
      await db.update(cryptoDeposits).set({ status: "rejected" }).where(eq(cryptoDeposits.id, id));
      res.json({ ...deposit, status: "rejected" });
      return;
    }
    res.json({
      ...deposit,
      payableAmount: (parseFloat(deposit.amount) + PLATFORM_FEE).toFixed(2),
      platformFee: PLATFORM_FEE.toFixed(2),
    });
  } catch (err) {
    req.log.error({ err }, "Get crypto status error");
    res.status(500).json({ error: "Failed to get status" });
  }
});

router.get("/my-deposits", authenticate, async (req: AuthRequest, res) => {
  try {
    const deposits = await db.select().from(cryptoDeposits)
      .where(eq(cryptoDeposits.userId, req.userId!))
      .orderBy(desc(cryptoDeposits.createdAt));
    const now = new Date();
    const expiredIds: number[] = [];
    for (const dep of deposits) {
      if (dep.status === "pending" && dep.method !== "manual" && dep.expiresAt && dep.expiresAt < now) {
        expiredIds.push(dep.id);
        dep.status = "rejected";
      }
    }
    for (const id of expiredIds) {
      await db.update(cryptoDeposits).set({ status: "rejected" }).where(eq(cryptoDeposits.id, id));
    }
    res.json(deposits.map(d => ({
      ...d,
      payableAmount: d.method === "crypto" ? (parseFloat(d.amount) + PLATFORM_FEE).toFixed(2) : d.amount,
      platformFee: d.method === "crypto" ? PLATFORM_FEE.toFixed(2) : "0.00",
    })));
  } catch (err) {
    req.log.error({ err }, "Get deposits error");
    res.status(500).json({ error: "Failed to get deposits" });
  }
});

export default router;
