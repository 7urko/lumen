/**
 * Approvals & Revoke — self-built (Base Sepolia). See every ERC-20 allowance the
 * wallet has granted and revoke risky/unlimited ones in a click. No third party.
 *
 * Discovery (L6): without an indexer we find spenders from on-chain Approval logs.
 * Public RPCs reject an unbounded getLogs, so we try the full range first and fall
 * back to a bounded, chunked scan of recent blocks. Very old approvals can still be
 * missed — point NEXT_PUBLIC_BASE_SEPOLIA_RPC at your own archive node for complete
 * history. Addresses are validated at load (M4).
 */
import { createWalletClient, http, parseAbiItem, getAddress, type Address, type Hex } from "viem";
import { client } from "./chain";
import { unlockedSigner } from "./account";
import { isUnlimitedApproval } from "./scam-onchain";
import { ACTIVE_CHAIN, ACTIVE_VIEM_CHAIN, ACTIVE_RPC, SWAP_ADDRS } from "./config";

const SCAN_TOKENS: { sym: string; address: Address; decimals: number }[] = [
  { sym: "WETH", address: SWAP_ADDRS.WETH, decimals: 18 },
  { sym: "USDC", address: SWAP_ADDRS.USDC, decimals: 6 },
];

const ERC20_ABI = [
  { type: "function", name: "allowance", stateMutability: "view", inputs: [{ name: "o", type: "address" }, { name: "s", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "approve", stateMutability: "nonpayable", inputs: [{ name: "s", type: "address" }, { name: "a", type: "uint256" }], outputs: [{ type: "bool" }] },
] as const;
const APPROVAL_EVENT = parseAbiItem("event Approval(address indexed owner, address indexed spender, uint256 value)");

/** Bounded recent-history scan parameters (public-RPC friendly). */
const CHUNK = 9_000n;          // most public nodes cap getLogs at ~10k blocks
const MAX_LOOKBACK = 400_000n; // ~ a few days on Base; bounded so we never hammer the RPC

export interface ApprovalRow {
  token: string;
  tokenAddress: Address;
  decimals: number;
  spender: Address;
  allowance: bigint;
  unlimited: boolean;
}

type PubClient = ReturnType<typeof client>;

/** Collect distinct spenders for `owner` on `token`, robust to public-RPC range caps. */
async function findSpenders(pub: PubClient, token: Address, owner: Address): Promise<Set<string>> {
  const spenders = new Set<string>();
  // 1) try the whole chain in one shot (works on archive/your-own nodes).
  try {
    const logs = await pub.getLogs({ address: token, event: APPROVAL_EVENT, args: { owner }, fromBlock: 0n, toBlock: "latest" });
    for (const log of logs) { const sp = log.args.spender; if (sp) spenders.add(sp.toLowerCase()); }
    return spenders;
  } catch { /* fall through to chunked recent scan */ }

  // 2) bounded, chunked scan of recent blocks.
  try {
    const latest = await pub.getBlockNumber();
    const floor = latest > MAX_LOOKBACK ? latest - MAX_LOOKBACK : 0n;
    for (let to = latest; to > floor; to -= (CHUNK + 1n)) {
      const from = to > floor + CHUNK ? to - CHUNK : floor;
      try {
        const logs = await pub.getLogs({ address: token, event: APPROVAL_EVENT, args: { owner }, fromBlock: from, toBlock: to });
        for (const log of logs) { const sp = log.args.spender; if (sp) spenders.add(sp.toLowerCase()); }
      } catch { /* skip an uncooperative window, keep scanning */ }
      if (from === floor) break;
    }
  } catch { /* RPC unavailable — return whatever we found */ }
  return spenders;
}

export async function listApprovals(owner: Address): Promise<ApprovalRow[]> {
  const pub = client(ACTIVE_CHAIN);
  const rows: ApprovalRow[] = [];
  for (const t of SCAN_TOKENS) {
    const spenders = await findSpenders(pub, t.address, owner);
    for (const sp of spenders) {
      const allowance = (await pub.readContract({ address: t.address, abi: ERC20_ABI, functionName: "allowance", args: [owner, sp as Address] })) as bigint;
      if (allowance > 0n) rows.push({ token: t.sym, tokenAddress: t.address, decimals: t.decimals, spender: getAddress(sp), allowance, unlimited: isUnlimitedApproval(allowance) });
    }
  }
  return rows;
}

/** Revoke an allowance (approve spender 0). Requires the vault unlocked. */
export async function revoke(token: Address, spender: Address): Promise<Hex> {
  const account = unlockedSigner();
  if (!account) throw new Error("Unlock your wallet first (Account screen)");
  const wallet = createWalletClient({ account, chain: ACTIVE_VIEM_CHAIN, transport: http(ACTIVE_RPC) });
  return wallet.writeContract({ address: token, abi: ERC20_ABI, functionName: "approve", args: [spender, 0n] });
}
