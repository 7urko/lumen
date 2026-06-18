/**
 * Self-built chain layer — viem, no SaaS. Base + Base Sepolia + Ethereum mainnet.
 * Prices come from on-chain Chainlink feeds (an RPC read, not a price API).
 *
 * Address policy (security review M4): every hardcoded address is wrapped in
 * `vAddr()`, which runs it through viem `getAddress` at module load. A mistyped or
 * miscopied address (wrong EIP-55 checksum) throws immediately — we fail closed
 * rather than ever read/route against a wrong contract. Each address cites its
 * canonical source; **the contract identities themselves must be re-verified
 * against official sources before any mainnet value flows** (see ADDRESSES.md).
 */
import { createPublicClient, http, formatEther, formatUnits, getAddress, isAddress, type Address } from "viem";
import { base, baseSepolia, mainnet } from "viem/chains";

/** Validate a hardcoded address at load; throw loudly on a typo (fail closed). */
function vAddr(a: string): Address {
  return getAddress(a); // throws on invalid/!checksum → surfaces the bug at startup
}

export type ChainKey = "base" | "baseSepolia" | "ethereum";

export const CHAIN_META: Record<ChainKey, { label: string; explorer: string }> = {
  base: { label: "Base mainnet", explorer: "https://basescan.org" },
  baseSepolia: { label: "Base Sepolia testnet", explorer: "https://sepolia.basescan.org" },
  ethereum: { label: "Ethereum mainnet", explorer: "https://etherscan.io" },
};

const RPC: Record<ChainKey, string> = {
  base: process.env.NEXT_PUBLIC_BASE_RPC ?? "https://mainnet.base.org",
  baseSepolia: process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC ?? "https://sepolia.base.org",
  ethereum: process.env.NEXT_PUBLIC_MAINNET_RPC ?? "https://ethereum-rpc.publicnode.com",
};

const VIEM_CHAIN = { base, baseSepolia, ethereum: mainnet } as const;

export function client(key: ChainKey) {
  return createPublicClient({ chain: VIEM_CHAIN[key], transport: http(RPC[key]) });
}

const ERC20_ABI = [
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ name: "a", type: "address" }], outputs: [{ type: "uint256" }] },
] as const;
const FEED_ABI = [
  { type: "function", name: "latestRoundData", stateMutability: "view", inputs: [], outputs: [
    { name: "roundId", type: "uint80" }, { name: "answer", type: "int256" }, { name: "startedAt", type: "uint256" },
    { name: "updatedAt", type: "uint256" }, { name: "answeredInRound", type: "uint80" }] },
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
] as const;

interface TokenDef { sym: string; name: string; address: Address; decimals: number; grad: [string, string]; pricedInEth?: boolean }

// Canonical token addresses. Sources: Circle (USDC), MakerDAO (DAI), Coinbase (cbETH),
// OP-Stack predeploy (WETH 0x42..06). Re-verify before mainnet value (ADDRESSES.md).
const TOKENS_BY_CHAIN: Record<ChainKey, TokenDef[]> = {
  base: [
    { sym: "USDC", name: "USD Coin", address: vAddr("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"), decimals: 6, grad: ["#2775ca", "#5aa6ff"] },
    { sym: "DAI", name: "Dai", address: vAddr("0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb"), decimals: 18, grad: ["#f5ac37", "#ffd27f"] },
    { sym: "cbETH", name: "Coinbase Wrapped Staked ETH", address: vAddr("0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22"), decimals: 18, grad: ["#0052ff", "#4d8bff"], pricedInEth: true },
  ],
  baseSepolia: [
    { sym: "USDC", name: "USD Coin (test)", address: vAddr("0x036CbD53842c5426634e7929541eC2318f3dCF7e"), decimals: 6, grad: ["#2775ca", "#5aa6ff"] },
  ],
  ethereum: [
    { sym: "USDC", name: "USD Coin", address: vAddr("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"), decimals: 6, grad: ["#2775ca", "#5aa6ff"] },
    { sym: "DAI", name: "Dai", address: vAddr("0x6B175474E89094C44Da98b954EedeAC495271d0F"), decimals: 18, grad: ["#f5ac37", "#ffd27f"] },
    { sym: "WETH", name: "Wrapped Ether", address: vAddr("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"), decimals: 18, grad: ["#627eea", "#a9b8ff"], pricedInEth: true },
  ],
};

// Chainlink ETH/USD aggregators. Sources: Chainlink data.chain.link feed registry.
const ETH_USD_FEED: Record<ChainKey, Address | null> = {
  base: vAddr("0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70"),
  baseSepolia: null,
  ethereum: vAddr("0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419"),
};

/** Reject a Chainlink answer older than this (display would be misleading). L2. */
const PRICE_STALE_AFTER_S = 6 * 60 * 60; // 6 hours

export interface OnchainAsset { sym: string; name: string; balance: number; usd: number; grad: [string, string]; native?: boolean }
export interface OnchainPortfolio { chain: ChainKey; address: Address; assets: OnchainAsset[]; totalUsd: number; block: bigint; ethUsd: number }

export { isAddress };

export async function getEthUsd(key: ChainKey): Promise<number> {
  const feed = ETH_USD_FEED[key];
  if (!feed) return 0;
  const c = client(key);
  const [data, dec] = await Promise.all([
    c.readContract({ address: feed, abi: FEED_ABI, functionName: "latestRoundData" }),
    c.readContract({ address: feed, abi: FEED_ABI, functionName: "decimals" }),
  ]);
  // L2 — guard against a stale/misreporting feed before trusting the price.
  const updatedAt = Number(data[3]);
  const ageS = Math.floor(Date.now() / 1000) - updatedAt;
  if (data[1] <= 0n || ageS > PRICE_STALE_AFTER_S) {
    if (typeof console !== "undefined") console.warn(`ETH/USD feed on ${key} looks stale (age ${ageS}s) — treating price as unknown.`);
    return 0;
  }
  return Number(formatUnits(data[1], dec));
}

export async function getPortfolio(key: ChainKey, address: Address): Promise<OnchainPortfolio> {
  const c = client(key);
  const tokens = TOKENS_BY_CHAIN[key];
  const [block, wei, ethUsd, balances] = await Promise.all([
    c.getBlockNumber(),
    c.getBalance({ address }),
    getEthUsd(key).catch(() => 0),
    c.multicall({ contracts: tokens.map((t) => ({ address: t.address, abi: ERC20_ABI, functionName: "balanceOf", args: [address] } as const)) }),
  ]);
  const ethBal = Number(formatEther(wei));
  const assets: OnchainAsset[] = [
    { sym: "ETH", name: "Ethereum", balance: ethBal, usd: ethBal * ethUsd, grad: ["#627eea", "#a9b8ff"], native: true },
  ];
  tokens.forEach((t, i) => {
    const res = balances[i];
    const raw = res && res.status === "success" ? (res.result as bigint) : 0n;
    const bal = Number(formatUnits(raw, t.decimals));
    const usd = t.pricedInEth ? bal * ethUsd : bal;
    assets.push({ sym: t.sym, name: t.name, balance: bal, usd, grad: t.grad });
  });
  const totalUsd = assets.reduce((s, a) => s + a.usd, 0);
  return { chain: key, address, assets, totalUsd, block, ethUsd };
}

export interface NetWorth { totalUsd: number; parts: Array<{ chain: ChainKey; label: string; usd: number }> }

/** Combined net worth across Base + Ethereum mainnet for an address. */
export async function getNetWorth(address: Address): Promise<NetWorth> {
  const keys: ChainKey[] = ["base", "ethereum"];
  const settled = await Promise.allSettled(keys.map((k) => getPortfolio(k, address)));
  const parts = settled.map((r, i) => ({
    chain: keys[i]!,
    label: CHAIN_META[keys[i]!].label,
    usd: r.status === "fulfilled" ? r.value.totalUsd : 0,
  }));
  return { totalUsd: parts.reduce((s, p) => s + p.usd, 0), parts };
}
