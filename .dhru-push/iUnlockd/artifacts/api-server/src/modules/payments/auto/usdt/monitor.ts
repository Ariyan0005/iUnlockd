import { JsonRpcProvider, Contract, formatUnits } from "ethers";
import { db } from "@workspace/db";
import { cryptoDeposits, users } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { logger } from "../../../../lib/logger";

const PLATFORM_FEE = 0.1;

const NETWORKS: Record<string, { rpc: string; usdt: string }> = {
  opbnb: {
    rpc: "https://opbnb-mainnet-rpc.bnbchain.org",
    usdt: "0x9e5AAC1Ba1a2e6aEd6b32689DFcF62A509Ca96f",
  },
  bsc: {
    rpc: "https://bsc-dataseed1.binance.org",
    usdt: "0x55d398326f99059fF775485246999027B3197955",
  },
};

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

async function getUsdtBalance(rpc: string, contractAddr: string, wallet: string): Promise<number> {
  const provider = new JsonRpcProvider(rpc);
  const contract = new Contract(contractAddr, ERC20_ABI, provider);
  const decimals: bigint = await contract.decimals();
  const balance: bigint = await contract.balanceOf(wallet);
  return parseFloat(formatUnits(balance, decimals));
}

export async function checkPendingDeposits(): Promise<void> {
  const pending = await db.select().from(cryptoDeposits).where(
    and(eq(cryptoDeposits.status, "pending"), eq(cryptoDeposits.method, "crypto"))
  );

  const monitorable = pending.filter(
    (d) => d.addressIndex !== null && (d.network === "opbnb" || d.network === "bsc")
  );
  if (monitorable.length === 0) return;

  for (const deposit of monitorable) {
    try {
      if (deposit.expiresAt && new Date() > new Date(deposit.expiresAt)) {
        await db.update(cryptoDeposits).set({ status: "rejected" }).where(eq(cryptoDeposits.id, deposit.id));
        logger.info({ depositId: deposit.id }, "Payment monitor: expired, rejected");
        continue;
      }

      const net = NETWORKS[deposit.network];
      if (!net) continue;

      const balance = await getUsdtBalance(net.rpc, net.usdt, deposit.walletAddress);
      const invoiceAmount = parseFloat(deposit.amount);
      const requiredAmount = parseFloat((invoiceAmount + PLATFORM_FEE).toFixed(2));

      if (balance >= requiredAmount) {
        await db.update(cryptoDeposits).set({ status: "completed" }).where(eq(cryptoDeposits.id, deposit.id));

        const [user] = await db.select().from(users).where(eq(users.id, deposit.userId)).limit(1);
        if (user) {
          const newBalance = (parseFloat(user.balance ?? "0") + invoiceAmount).toFixed(2);
          await db.update(users).set({ balance: newBalance }).where(eq(users.id, deposit.userId));
          logger.info(
            { depositId: deposit.id, userId: deposit.userId, paid: balance, credited: invoiceAmount, fee: PLATFORM_FEE },
            "Payment confirmed — fee deducted, invoice amount credited"
          );
        }
      }
    } catch (err) {
      logger.warn({ err, depositId: deposit.id }, "Payment monitor: error checking deposit");
    }
  }
}
