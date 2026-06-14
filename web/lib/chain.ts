/**
 * Self-built chain layer — talks to the blockchain directly with viem.
 * No third-party SaaS: just a public RPC endpoint (swap for your own node via
 * env) and on-chain reads. Prices come from an on-chain Chainlink feed, not a
 * price API. Read-only for now; signing/sending comes with real key management.
 */
import { createPublicClient, http, formatEther, formatUnits, isAddress, type Address } from "viem";
import { base, baseSepolia } from "viem/chains";

export type ChainKey = "base" | "baseSepolia";

export const CHAIN_META: Record<ChainKey, { label: string; explorer: string }> = {
  base: { label: "Base mainnet", explorer: "https://basescan.org" },
  baseSepolia: { label: "Base Sepolia testnet", explorer: "https://sepolia.basescan.org" },
};

const RPC: Record<ChainKey, string> = {
  base: process.env.NEXT_PUBLIC_BASE_RPC ?? "https://mainnet.base.org",
  baseSepolia: process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC ?? "https://sepolia.base.org",
};

const VIEM_CHAIN = { base, baseSepolia } as const;

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

const TOKENS_BY_CHAIN: Record<ChainKey, TokenDef[]> = {
  base: [
    { sym: "USDC", name: "USD Coin", address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6, grad: ["#2775ca", "#5aa6ff"] },
    { sym: "DAI", name: "Dai", address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb", decimals: 18, grad: ["#f5ac37", "#ffd27f"] },
    { sym: "cbETH", name: "Coinbase Wrapped Staked ETH", address: "0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22", decimals: 18, grad: ["#0052ff", "#4d8bff"], pricedInEth: true },
  ],
  baseSepolia: [
    { sym: "USDC", name: "USD Coin (test)", address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", decimals: 6, grad: ["#2775ca", "#5aa6ff"] },
  ],
};

const ETH_USD_FEED: Record<ChainKey, Address | null> = {
  base: "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70", // Chainlink ETH/USD on Base
  baseSepolia: null,
};

export interface OnchainAsset { sym: string; name: string; balance: number; usd: number; grad: [string, string]; native?: boolean }
export interface OnchainPortfolio { chain: ChainKey; address: Address; assets: OnchainAsset[]; totalUsd: number; block: bigint; ethUsd: number }

export { isAddress };

/** Read ETH/USD straight from the on-chain Chainlink aggregator (no price API). */
export async function getEthUsd(key: ChainKey): Promise<number> {
  const feed = ETH_USD_FEED[key];
  if (!feed) return 0;
  const c = client(key);
  const [data, dec] = await Promise.all([
    c.readContract({ address: feed, abi: FEED_ABI, functionName: "latestRoundData" }),
    c.readContract({ address: feed, abi: FEED_ABI, functionName: "decimals" }),
  ]);
  return Number(formatUnits(data[1], dec));
}

/** Read a real portfolio (native + ERC-20 balances, USD-valued) for an address. */
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
    const usd = t.pricedInEth ? bal * ethUsd : bal; // stables ≈ $1; cbETH ≈ ETH price
    assets.push({ sym: t.sym, name: t.name, balance: bal, usd, grad: t.grad });
  });

  const totalUsd = assets.reduce((s, a) => s + a.usd, 0);
  return { chain: key, address, assets, totalUsd, block, ethUsd };
}
