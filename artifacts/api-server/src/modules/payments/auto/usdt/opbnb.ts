import { logger } from "../../../../lib/logger";

export const CHAIN_KEY = "opbnb";
export const CHAIN_LABEL = "opBNB";
export const CHAIN_DESCRIPTION = "BNB Chain Layer 2";

export function getWalletAddress(): string {
  const addr = process.env["WALLET_OPBNB"];
  if (!addr || addr === "0x0000000000000000000000000000000000000000") {
    logger.warn("WALLET_OPBNB env var not configured — set it in environment");
    return process.env["WALLET_OPBNB"] ?? "0x0000000000000000000000000000000000000000";
  }
  return addr;
}

export function isConfigured(): boolean {
  const addr = process.env["WALLET_OPBNB"];
  return !!addr && addr !== "0x0000000000000000000000000000000000000000";
}
