import { logger } from "../../../../lib/logger";

export const CHAIN_KEY = "plasma";
export const CHAIN_LABEL = "Plasma";
export const CHAIN_DESCRIPTION = "Plasma NextGen Network";

export function getWalletAddress(): string {
  const addr = process.env["WALLET_PLASMA"];
  if (!addr || addr === "0x0000000000000000000000000000000000000000") {
    logger.warn("WALLET_PLASMA env var not configured — set it in environment");
    return process.env["WALLET_PLASMA"] ?? "0x0000000000000000000000000000000000000000";
  }
  return addr;
}

export function isConfigured(): boolean {
  const addr = process.env["WALLET_PLASMA"];
  return !!addr && addr !== "0x0000000000000000000000000000000000000000";
}
