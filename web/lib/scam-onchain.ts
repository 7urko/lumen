/**
 * Scam Shield 2.0 — real, self-built pre-sign safety checks (Base Sepolia).
 *
 * No third-party threat API. Everything here is a direct on-chain read (viem) +
 * a local "have I sent here before" memory. The differentiator: most wallets
 * either show nothing about a recipient or outsource this to a paid service.
 */
import type { Address } from "viem";
import { client } from "./chain";
import { ACTIVE_CHAIN } from "./config";

const SEEN_KEY = "lumen.seen-recipients";

export type RadarLevel = "ok" | "caution" | "danger";
export interface Radar {
  isContract: boolean;
  txCount: number;     // outgoing nonce — an activity signal
  seenBefore: boolean; // you've sent to this address before (local memory)
  level: RadarLevel;
  notes: string[];
}

function seenList(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(SEEN_KEY) || "[]") as string[]; } catch { return []; }
}
export function recordRecipient(addr: string): void {
  if (typeof window === "undefined") return;
  const list = seenList();
  const a = addr.toLowerCase();
  if (!list.includes(a)) { list.push(a); localStorage.setItem(SEEN_KEY, JSON.stringify(list)); }
}

/** Inspect a recipient before you send to it. */
export async function inspectRecipient(address: Address): Promise<Radar> {
  const pub = client(ACTIVE_CHAIN);
  const [code, nonce] = await Promise.all([
    pub.getCode({ address }),
    pub.getTransactionCount({ address }),
  ]);
  const isContract = !!code && code !== "0x";
  const seenBefore = seenList().includes(address.toLowerCase());

  const notes: string[] = [];
  let level: RadarLevel = "ok";

  if (isContract) {
    notes.push("This address is a smart contract, not a personal wallet — only continue if you mean to interact with a contract.");
    level = "caution";
  } else {
    notes.push("Regular wallet (EOA), not a contract.");
  }
  if (seenBefore) {
    notes.push("You've sent to this address before.");
  } else {
    notes.push("First time sending here — double-check the address is correct.");
    if (level === "ok") level = "caution";
  }
  if (!isContract) {
    notes.push(nonce === 0 ? "Brand-new address with no outgoing activity yet." : `Has ${nonce} outgoing transaction${nonce === 1 ? "" : "s"}.`);
  }
  return { isContract, txCount: nonce, seenBefore, level, notes };
}

const MAX_UINT256 = 2n ** 256n - 1n;
/** True if an approval amount is effectively unlimited (a common drainer vector). */
export function isUnlimitedApproval(value: bigint): boolean {
  return value > MAX_UINT256 / 2n;
}
