/**
 * Real on-chain swaps on the active chain — viem + Uniswap v3 + WETH9. No third party.
 *
 *  - ETH <-> WETH: a 1:1 wrap/unwrap via WETH9. Needs no liquidity, ALWAYS works.
 *  - WETH <-> USDC: a real Uniswap v3 swap (QuoterV2 quote, SwapRouter02 trade).
 *    Needs a funded pool; with no liquidity it reverts and we surface that clearly.
 *
 * All addresses + the fee tier come from config.ts (verified per chain — ADDRESSES.md),
 * so this works on testnet today and Base mainnet behind the same switch.
 * Signed by the unlocked encrypted vault (account.ts). Quotes use the public RPC.
 */
import { createWalletClient, http, parseUnits, formatUnits, type Address, type Hex } from "viem";
import { client } from "./chain";
import { unlockedSigner } from "./account";
import { ACTIVE_CHAIN, ACTIVE_VIEM_CHAIN, ACTIVE_RPC, SWAP_ADDRS } from "./config";

const WETH = SWAP_ADDRS.WETH;
const USDC = SWAP_ADDRS.USDC;
const ROUTER = SWAP_ADDRS.ROUTER;
const QUOTER = SWAP_ADDRS.QUOTER;
const FEE = SWAP_ADDRS.FEE;

/** Clamp slippage to a sane band so a bad caller value can't drive minOut→0 (L4). */
function clampSlippage(pct: number): number {
  if (!Number.isFinite(pct)) return 1;
  return Math.min(50, Math.max(0.05, pct));
}

export type SwapSym = "ETH" | "WETH" | "USDC";
export interface SwapToken { sym: SwapSym; name: string; decimals: number; address?: Address }
export const SWAP_TOKENS: SwapToken[] = [
  { sym: "ETH", name: "Ether (native)", decimals: 18 },
  { sym: "WETH", name: "Wrapped ETH", decimals: 18, address: WETH },
  { sym: "USDC", name: "USD Coin", decimals: 6, address: USDC },
];

export type SwapKind = "wrap" | "unwrap" | "dex" | "invalid";
export function swapKind(inSym: SwapSym, outSym: SwapSym): SwapKind {
  if (inSym === outSym) return "invalid";
  if (inSym === "ETH" && outSym === "WETH") return "wrap";
  if (inSym === "WETH" && outSym === "ETH") return "unwrap";
  if (inSym === "ETH" || outSym === "ETH") return "invalid";
  return "dex";
}

const WETH9_ABI = [
  { type: "function", name: "deposit", stateMutability: "payable", inputs: [], outputs: [] },
  { type: "function", name: "withdraw", stateMutability: "nonpayable", inputs: [{ name: "wad", type: "uint256" }], outputs: [] },
] as const;
const ERC20_ABI = [
  { type: "function", name: "allowance", stateMutability: "view", inputs: [{ name: "o", type: "address" }, { name: "s", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "approve", stateMutability: "nonpayable", inputs: [{ name: "s", type: "address" }, { name: "a", type: "uint256" }], outputs: [{ type: "bool" }] },
] as const;
const ROUTER_ABI = [
  { type: "function", name: "exactInputSingle", stateMutability: "payable", outputs: [{ name: "amountOut", type: "uint256" }], inputs: [
    { name: "params", type: "tuple", components: [
      { name: "tokenIn", type: "address" }, { name: "tokenOut", type: "address" }, { name: "fee", type: "uint24" },
      { name: "recipient", type: "address" }, { name: "amountIn", type: "uint256" }, { name: "amountOutMinimum", type: "uint256" },
      { name: "sqrtPriceLimitX96", type: "uint160" }] }] },
] as const;
const QUOTER_ABI = [
  { type: "function", name: "quoteExactInputSingle", stateMutability: "nonpayable", inputs: [
    { name: "params", type: "tuple", components: [
      { name: "tokenIn", type: "address" }, { name: "tokenOut", type: "address" }, { name: "amountIn", type: "uint256" },
      { name: "fee", type: "uint24" }, { name: "sqrtPriceLimitX96", type: "uint160" }] }],
    outputs: [{ name: "amountOut", type: "uint256" }, { name: "sqrtPriceX96After", type: "uint160" }, { name: "initializedTicksCrossed", type: "uint32" }, { name: "gasEstimate", type: "uint256" }] },
] as const;

function tok(sym: SwapSym): SwapToken { return SWAP_TOKENS.find((t) => t.sym === sym)!; }
function wallet() {
  const account = unlockedSigner();
  if (!account) throw new Error("Wallet is locked — unlock first");
  return createWalletClient({ account, chain: ACTIVE_VIEM_CHAIN, transport: http(ACTIVE_RPC) });
}

export async function quote(inSym: SwapSym, outSym: SwapSym, amount: string): Promise<string> {
  const kind = swapKind(inSym, outSym);
  if (kind === "invalid") throw new Error("Pick two different tokens (ETH↔USDC: wrap to WETH first)");
  if (kind === "wrap" || kind === "unwrap") return amount;
  const tin = tok(inSym), tout = tok(outSym);
  const amountIn = parseUnits(amount, tin.decimals);
  const { result } = await client(ACTIVE_CHAIN).simulateContract({
    address: QUOTER, abi: QUOTER_ABI, functionName: "quoteExactInputSingle",
    args: [{ tokenIn: tin.address!, tokenOut: tout.address!, amountIn, fee: FEE, sqrtPriceLimitX96: 0n }],
  });
  return formatUnits(result[0], tout.decimals);
}

export async function swap(inSym: SwapSym, outSym: SwapSym, amount: string, slippagePct = 1): Promise<Hex> {
  const kind = swapKind(inSym, outSym);
  const w = wallet();
  const me = w.account.address;

  if (kind === "wrap") return w.writeContract({ address: WETH, abi: WETH9_ABI, functionName: "deposit", value: parseUnits(amount, 18) });
  if (kind === "unwrap") return w.writeContract({ address: WETH, abi: WETH9_ABI, functionName: "withdraw", args: [parseUnits(amount, 18)] });
  if (kind !== "dex") throw new Error("Pick two different tokens (ETH↔USDC: wrap to WETH first)");

  const tin = tok(inSym), tout = tok(outSym);
  const amountIn = parseUnits(amount, tin.decimals);
  const pub = client(ACTIVE_CHAIN);

  const allowance = await pub.readContract({ address: tin.address!, abi: ERC20_ABI, functionName: "allowance", args: [me, ROUTER] });
  if (allowance < amountIn) {
    const approveHash = await w.writeContract({ address: tin.address!, abi: ERC20_ABI, functionName: "approve", args: [ROUTER, amountIn] });
    await pub.waitForTransactionReceipt({ hash: approveHash });
  }

  // Quote is taken immediately before the swap; minOut (from this fresh quote, minus
  // clamped slippage) is the value-protection. SwapRouter02 is deadline-less by design
  // (deadline was removed vs the v1 router), so minOut is the guard against a stale or
  // sandwiched execution — keep slippage tight. (L1/L4)
  const slip = clampSlippage(slippagePct);
  const { result } = await pub.simulateContract({
    address: QUOTER, abi: QUOTER_ABI, functionName: "quoteExactInputSingle",
    args: [{ tokenIn: tin.address!, tokenOut: tout.address!, amountIn, fee: FEE, sqrtPriceLimitX96: 0n }],
  });
  const minOut = (result[0] * BigInt(Math.round((100 - slip) * 100))) / 10000n;

  return w.writeContract({
    address: ROUTER, abi: ROUTER_ABI, functionName: "exactInputSingle",
    args: [{ tokenIn: tin.address!, tokenOut: tout.address!, fee: FEE, recipient: me, amountIn, amountOutMinimum: minOut, sqrtPriceLimitX96: 0n }],
  });
}
