/**
 * Unified active-wallet layer.
 *
 * The PRIMARY, recommended wallet is the passkey **smart account** (ERC-4337):
 * its signer is a WebAuthn passkey verified on-chain, so there is NO extractable
 * private key anywhere — the prerequisite for safely holding real funds.
 *
 * The password-encrypted EOA (account.ts) remains as a clearly-labelled "advanced /
 * dev" fallback for quick testnet use; its key lives (encrypted) in the browser and
 * is NOT safe for real money.
 */
import type { Address, Hex } from "viem";
import * as eoa from "./account";
import * as smart from "./smart-account";

export type WalletKind = "smart" | "eoa";

export function activeKind(): WalletKind | null {
  if (smart.hasSmartWallet()) return "smart";
  if (eoa.hasVault()) return "eoa";
  return null;
}

/** Active wallet address (smart account preferred; derived via RPC for smart). */
export async function activeAddress(): Promise<Address | null> {
  const kind = activeKind();
  if (kind === "smart") { try { return await smart.getSmartAddress(); } catch { return null; } }
  if (kind === "eoa") return eoa.getAddress();
  return null;
}

export function bundlerReady(): boolean { return smart.bundlerConfigured(); }

/** Whether the active wallet can sign right now (EOA must be unlocked; smart prompts the passkey). */
export function canSign(): boolean {
  const kind = activeKind();
  if (kind === "smart") return true;       // passkey prompts at send time
  if (kind === "eoa") return eoa.isUnlocked();
  return false;
}

/** Send native ETH from the active wallet. Smart account requires a self-hosted bundler. */
export async function sendNative(to: Address, amountEth: string): Promise<Hex> {
  const kind = activeKind();
  if (kind === "smart") {
    if (!smart.bundlerConfigured()) throw new Error("Smart-account sends need your self-hosted bundler running (set NEXT_PUBLIC_BUNDLER_URL — see BUNDLER.md).");
    const { parseEther } = await import("viem");
    return smart.sendSmartTx(to, parseEther(amountEth));
  }
  if (kind === "eoa") return eoa.sendTestEth(to, amountEth);
  throw new Error("No wallet yet — create one first.");
}
