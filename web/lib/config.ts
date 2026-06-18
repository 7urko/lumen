/**
 * The single mainnet/testnet switch.
 *
 * Everything that touches the active wallet (balances, sends, swaps, approvals,
 * Scam Shield, explorer links) reads the active chain from here, so going live is
 * ONE environment variable — `NEXT_PUBLIC_CHAIN=base` — and nothing else.
 *
 * It DEFAULTS TO TESTNET. Until `NEXT_PUBLIC_CHAIN` is explicitly set to "base",
 * the app stays on Base Sepolia. Flip it only after: (1) a green build + testnet
 * smoke test, (2) the ERC-4337 bundler/paymaster is running, (3) the audit report
 * and Terms/Privacy are in place. All mainnet addresses below are verified against
 * canonical sources — see ADDRESSES.md.
 */
import { base, baseSepolia } from "viem/chains";
import { getAddress, type Address } from "viem";
import type { ChainKey } from "./chain";

export const ACTIVE_CHAIN: ChainKey = process.env.NEXT_PUBLIC_CHAIN === "base" ? "base" : "baseSepolia";
export const IS_MAINNET = ACTIVE_CHAIN === "base";

export const ACTIVE_VIEM_CHAIN = IS_MAINNET ? base : baseSepolia;

export const ACTIVE_RPC = IS_MAINNET
  ? (process.env.NEXT_PUBLIC_BASE_RPC ?? "https://mainnet.base.org")
  : (process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC ?? "https://sepolia.base.org");

export const ACTIVE_EXPLORER = IS_MAINNET ? "https://basescan.org" : "https://sepolia.basescan.org";

/** A short, user-facing label for the active network. */
export const ACTIVE_LABEL = IS_MAINNET ? "Base mainnet" : "Base Sepolia testnet";

export interface SwapAddrs { WETH: Address; USDC: Address; ROUTER: Address; QUOTER: Address; FEE: number }

// Verified deployments (Uniswap v3 docs + Circle + Chainlink). See ADDRESSES.md.
const MAINNET_SWAP: SwapAddrs = {
  WETH: getAddress("0x4200000000000000000000000000000000000006"),
  USDC: getAddress("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"),
  ROUTER: getAddress("0x2626664c2603336E57B271c5C0b26F421741e481"), // SwapRouter02 (Base)
  QUOTER: getAddress("0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a"), // QuoterV2 (Base)
  FEE: 500, // 0.05% — the deep WETH/USDC pool on Base mainnet
};
const TESTNET_SWAP: SwapAddrs = {
  WETH: getAddress("0x4200000000000000000000000000000000000006"),
  USDC: getAddress("0x036CbD53842c5426634e7929541eC2318f3dCF7e"),
  ROUTER: getAddress("0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4"), // SwapRouter02 (Base Sepolia)
  QUOTER: getAddress("0xC5290058841028F1614F3A6F0F5816cAd0df5E27"), // QuoterV2 (Base Sepolia)
  FEE: 3000, // 0.3% — the funded test pool
};

export const SWAP_ADDRS: SwapAddrs = IS_MAINNET ? MAINNET_SWAP : TESTNET_SWAP;
