/**
 * Portfolio valuation and profit-and-loss math.
 * Pure functions over a token list — no globals (the demo read a module-level
 * TOKENS array; here the caller passes it in so real balances can be injected).
 */

import type { Token, Pnl } from "./types";

/** Total value including staked holdings: Σ (balance + staked) * price. */
export function totalUsd(tokens: Token[]): number {
  return tokens.reduce((s, t) => s + (t.balance + t.staked) * t.price, 0);
}

/** Liquid (spendable) value only: Σ balance * price. */
export function liquidUsd(tokens: Token[]): number {
  return tokens.reduce((s, t) => s + t.balance * t.price, 0);
}

/** Compute total and 24h P&L across a token list. */
export function computePnl(tokens: Token[]): Pnl {
  let value = 0;
  let cost = 0;
  let day = 0;
  for (const t of tokens) {
    const held = t.balance + t.staked;
    const v = held * t.price;
    value += v;
    cost += held * t.cost;
    const prev = v / (1 + t.change / 100);
    day += v - prev;
  }
  return {
    total: value - cost,
    totalPct: cost ? ((value - cost) / cost) * 100 : 0,
    day,
    dayPct: value ? (day / value) * 100 : 0,
    value,
    cost,
  };
}
