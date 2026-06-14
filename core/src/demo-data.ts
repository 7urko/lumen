/**
 * Demo / fixture data extracted from the original app.js mock state.
 *
 * IMPORTANT: this is fake data for development, tests, and the UI prototype —
 * no real keys, balances, or threat intel. Production code injects real data
 * (indexer balances, a real name registry, a real threat-intel feed) into the
 * same pure functions; nothing here is trusted.
 */

import { daysAgo } from "./format";
import type { Blocklist, Contact, Directory, HistoryEntry, RegistryMap, Token } from "./types";

export const DEMO_TOKENS: Token[] = [
  { sym: "BTC",   name: "Bitcoin",  grad: ["#f7931a", "#ffcf6b"], balance: 0.4821,  price: 64210.55, cost: 41800.0, change: 2.8,  staked: 0,    apy: 0,   tv: "BINANCE:BTCUSDT" },
  { sym: "ETH",   name: "Ethereum", grad: ["#627eea", "#a9b8ff"], balance: 3.927,   price: 3375.1,   cost: 2180.0,  change: 1.6,  staked: 1.5,  apy: 4.2, tv: "BINANCE:ETHUSDT" },
  { sym: "SOL",   name: "Solana",   grad: ["#14f195", "#7afcd2"], balance: 58.2,    price: 168.42,   cost: 96.4,    change: -3.1, staked: 20.0, apy: 6.8, tv: "BINANCE:SOLUSDT" },
  { sym: "USDC",  name: "USD Coin", grad: ["#2775ca", "#5aa6ff"], balance: 1250.0,  price: 1.0,      cost: 1.0,     change: 0.0,  staked: 0,    apy: 5.1, tv: "BINANCE:BTCUSDT",   stable: true },
  { sym: "MATIC", name: "Polygon",  grad: ["#8247e5", "#c79bff"], balance: 940.5,   price: 0.72,     cost: 1.18,    change: 4.4,  staked: 0,    apy: 3.9, tv: "BINANCE:MATICUSDT" },
];

/** A mock known-drainer address used to demonstrate the Danger verdict. */
export const DRAINER_ADDR = "0x9f13a4c0db4e1fb2c0dead5ef21ab77c0d1a9e55";

export const DEMO_REGISTRY: RegistryMap = {
  "alice.lumen": "0x4a8f23bd9c1e77a6f0b2d4513e8c9a2f17b6d340",
  "bob.lumen": "0x77de10b4c2a91f3e8d6045a09b8c7e21ff8043a4",
  "satoshi.lumen": "0x12abf0091c3e5d7a4b8e6f2019cd33aa07ff09b1",
  "maya.lumen": "0x6c0fae12b9d4471e2a8f53c0d9b71e44a05c8821",
  "vault.lumen": "0x3e91d7c5a0b248f16ec9034b7d52a8f0916ccaa2",
  "claim-airdrop.lumen": DRAINER_ADDR, // scam handle → known drainer
};

export const DEMO_CONTACTS: Contact[] = [
  { name: "Alice Nguyen", username: "alice.lumen", address: DEMO_REGISTRY["alice.lumen"]! },
  { name: "Bob Carter",   username: "bob.lumen",   address: DEMO_REGISTRY["bob.lumen"]! },
  { name: "Maya Okafor",  username: "maya.lumen",  address: DEMO_REGISTRY["maya.lumen"]! },
  { name: "Cold Vault",   username: "vault.lumen", address: DEMO_REGISTRY["vault.lumen"]! },
];

export const DEMO_BLOCKLIST: Blocklist = {
  [DRAINER_ADDR]: [
    "Flagged as a known wallet-drainer contract",
    "Reported by 1,284 users in the last 30 days",
    "Requests unlimited token approvals, then sweeps funds",
    "Linked to 7 phishing “airdrop claim” sites",
  ],
  "0x000000000000000000000000000000000000dead": [
    "Burn address — funds sent here are destroyed forever",
  ],
};

/** A ready-made Directory wired from the demo fixtures. */
export const DEMO_DIRECTORY: Directory = {
  contacts: DEMO_CONTACTS,
  registry: DEMO_REGISTRY,
  blocklist: DEMO_BLOCKLIST,
};


/** Seeded activity history (newest first). Timestamps are relative to load time. */
export const DEMO_HISTORY: HistoryEntry[] = [
  { dir: "in",  sym: "ETH",   amount: 1.5,    address: "0x9f4a...c21b", ts: daysAgo(1) },
  { dir: "out", sym: "USDC",  amount: 320.0,  address: "alice.lumen",  ts: daysAgo(2) },
  { dir: "in",  sym: "BTC",   amount: 0.05,   address: "bc1qx...7h2k", ts: daysAgo(4) },
  { dir: "out", sym: "SOL",   amount: 12.0,   address: "5Gw8...Qm3v",  ts: daysAgo(6) },
  { dir: "in",  sym: "MATIC", amount: 500.0,  address: "0x12ab...ff09", ts: daysAgo(9) },
];
