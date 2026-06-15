/**
 * Approvals & Revoke — self-built (Base Sepolia). See every ERC-20 allowance the
 * wallet has granted and revoke risky/unlimited ones in a click. No third party.
 *
 * Limitation (honest): without an indexer we discover spenders from on-chain
 * Approval logs over the public RPC, which caps the block range, so very old
 * approvals may be missed. Point NEXT_PUBLIC_BASE_SEPOLIA_RPC at your own node
 * for complete history.
 */
import { createWalletClient, http, parseAbiItem, type Address, type Hex } from "viem";
import { baseSepolia } from "viem/chains";
import { client } from "./chain";
import { unlockedSigner } from "./account";
import { isUnlimitedApproval } from "./scam-onchain";

const RPC = process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC ?? "https://sepolia.base.org";

const SCAN_TOKENS: { sym: string; address: Address; decimals: number }[] = [
  { sym: "WETH", address: "0x4200000000000000000000000000000000000006", decimals: 18 },
  { sym: "USDC", address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", decimals: 6 },
];

const ERC20_ABI = [
  { type: "function", name: "allowance", stateMutability: "view", inputs: [{ name: "o", type: "address" }, { name: "s", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "approve", stateMutability: "nonpayable", inputs: [{ name: "s", type: "address" }, { name: "a", type: "uint256" }], outputs: [{ type: "bool" }] },
] as const;
const APPROVAL_EVENT = parseAbiItem("event Approval(address indexed owner, address indexed spender, uint256 value)");

export interface ApprovalRow {
  token: string;
  tokenAddress: Address;
  decimals: number;
  spender: Address;
  allowance: bigint;
  unlimited: boolean;
}

export async function listApprovals(owner: Address): Promise<ApprovalRow[]> {
  const pub = client("baseSepolia");
  const rows: ApprovalRow[] = [];
  for (const t of SCAN_TOKENS) {
    let spenders = new Set<string>();
    try {
      const logs = await pub.getLogs({ address: t.address, event: APPROVAL_EVENT, args: { owner }, fromBlock: 0n, toBlock: "latest" });
      for (const log of logs) { const sp = log.args.spender; if (sp) spenders.add(sp.toLowerCase()); }
    } catch {
      // public RPC may reject a full-range getLogs; skip this token gracefully
      continue;
    }
    for (const sp of spenders) {
      const allowance = (await pub.readContract({ address: t.address, abi: ERC20_ABI, functionName: "allowance", args: [owner, sp as Address] })) as bigint;
      if (allowance > 0n) rows.push({ token: t.sym, tokenAddress: t.address, decimals: t.decimals, spender: sp as Address, allowance, unlimited: isUnlimitedApproval(allowance) });
    }
  }
  return rows;
}

/** Revoke an allowance (approve spender 0). Requires the vault unlocked. */
export async function revoke(token: Address, spender: Address): Promise<Hex> {
  const account = unlockedSigner();
  if (!account) throw new Error("Unlock your wallet first (Account screen)");
  const wallet = createWalletClient({ account, chain: baseSepolia, transport: http(RPC) });
  return wallet.writeContract({ address: token, abi: ERC20_ABI, functionName: "approve", args: [spender, 0n] });
}
