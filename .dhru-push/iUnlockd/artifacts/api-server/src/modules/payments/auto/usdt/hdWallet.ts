import { HDNodeWallet, Mnemonic } from "ethers";
import { logger } from "../../../../lib/logger";

let _masterWallet: HDNodeWallet | null = null;

function getMasterWallet(): HDNodeWallet {
  if (_masterWallet) return _masterWallet;
  const phrase = process.env["HD_WALLET_MNEMONIC"];
  if (!phrase) throw new Error("HD_WALLET_MNEMONIC env var is not set.");
  const mnemonic = Mnemonic.fromPhrase(phrase.trim());
  _masterWallet = HDNodeWallet.fromMnemonic(mnemonic);
  return _masterWallet;
}

export function isHDWalletConfigured(): boolean {
  return !!process.env["HD_WALLET_MNEMONIC"];
}

export function deriveAddress(index: number): string {
  const master = getMasterWallet();
  const child = master.deriveChild(index);
  return child.address;
}

export function logHDWalletStatus(): void {
  if (!isHDWalletConfigured()) {
    logger.warn("HD_WALLET_MNEMONIC not set.");
    return;
  }
  try {
    const addr = deriveAddress(0);
    logger.info({ masterAddress: addr }, "HD Wallet loaded successfully");
  } catch (err) {
    logger.error({ err }, "HD Wallet failed to initialize");
  }
}
