/**
 * Shared domain types for the Lumen core layer.
 * Pure data shapes — no DOM, no framework, no network.
 */

/** A wallet asset. `cost` is the average cost basis used for P&L. */
export interface Token {
  sym: string;
  name: string;
  /** [from, to] colours for the token's gradient avatar (presentation hint). */
  grad: [string, string];
  /** Liquid (spendable) balance. */
  balance: number;
  /** Live spot price in USD. */
  price: number;
  /** Average cost basis per unit, in USD. */
  cost: number;
  /** 24h price change, as a percent (e.g. 2.8 = +2.8%). */
  change: number;
  /** Amount currently staked / earning yield. */
  staked: number;
  /** Staking APY as a percent. */
  apy: number;
  /** TradingView symbol for the markets chart. */
  tv: string;
  /** True for stablecoins (display hint). */
  stable?: boolean;
}

/** A saved contact in the address book. */
export interface Contact {
  name: string;
  username: string;
  address: string;
}

/** username (e.g. "alice.lumen") -> address */
export type RegistryMap = Record<string, string>;

/** address (lower-case) -> human-readable threat reasons */
export type Blocklist = Record<string, string[]>;

/**
 * Everything the Scam Shield / recipient resolver needs to do its job.
 * In the demo this is mock data; in production each field is backed by a
 * real service (name registry, contacts API, threat-intel provider).
 */
export interface Directory {
  contacts: Contact[];
  registry: RegistryMap;
  blocklist: Blocklist;
}

export type RecipientKind = "contact" | "username" | "address";

/** Result of resolving a raw recipient string. */
export interface Resolved {
  ok: boolean;
  /** Input was blank. */
  empty?: boolean;
  /** Looked like a *.lumen name but isn't registered. */
  unknownName?: boolean;
  /** Not a name, contact, or recognisable address. */
  invalid?: boolean;
  address?: string;
  kind?: RecipientKind;
  /** Display label for the resolved recipient. */
  label?: string;
  contact?: Contact;
  /** Threat reasons if the resolved address is blocklisted, else null. */
  flagReasons?: string[] | null;
}

export type RiskLevel = "safe" | "caution" | "danger";

export interface RiskReason {
  kind: "good" | "warn" | "bad";
  text: string;
}

/** A Scam Shield verdict shown before a send is confirmed. */
export interface RiskVerdict {
  level: RiskLevel;
  title: string;
  sub: string;
  reasons: RiskReason[];
}

/** Portfolio profit-and-loss summary. */
export interface Pnl {
  /** Unrealised P&L vs cost basis (USD). */
  total: number;
  /** Unrealised P&L as a percent of cost. */
  totalPct: number;
  /** 24h change in portfolio value (USD). */
  day: number;
  /** 24h change as a percent of current value. */
  dayPct: number;
  /** Current total value (held * price). */
  value: number;
  /** Total cost basis. */
  cost: number;
}

/** A transaction in the activity history. */
export interface HistoryEntry {
  dir: "in" | "out";
  sym: string;
  amount: number;
  /** Counterparty: an address or a *.lumen username. */
  address: string;
  /** Epoch ms. */
  ts: number;
}
