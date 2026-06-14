import { test } from "node:test";
import assert from "node:assert/strict";
import { totalUsd, liquidUsd, computePnl } from "../src/portfolio";
import { DEMO_TOKENS } from "../src/demo-data";
import type { Token } from "../src/types";

function tk(p: Partial<Token>): Token {
  return {
    sym: "TST",
    name: "Test",
    grad: ["#000", "#fff"],
    balance: 0,
    price: 0,
    cost: 0,
    change: 0,
    staked: 0,
    apy: 0,
    tv: "",
    ...p,
  };
}

test("totalUsd includes staked, liquidUsd does not", () => {
  const tokens = [tk({ balance: 1, staked: 2, price: 10 })];
  assert.equal(liquidUsd(tokens), 10);
  assert.equal(totalUsd(tokens), 30);
});

test("computePnl: simple doubled position", () => {
  // bought 1 @ $100, now $200, flat on the day
  const pnl = computePnl([tk({ balance: 1, staked: 0, price: 200, cost: 100, change: 0 })]);
  assert.equal(pnl.value, 200);
  assert.equal(pnl.cost, 100);
  assert.equal(pnl.total, 100);
  assert.equal(pnl.totalPct, 100);
  assert.equal(pnl.day, 0);
  assert.equal(pnl.dayPct, 0);
});

test("computePnl: 24h change backs out yesterday's value", () => {
  // price doubled today (+100%): prev value = 200 / 2 = 100, so day gain = 100
  const pnl = computePnl([tk({ balance: 1, price: 200, cost: 50, change: 100 })]);
  assert.equal(pnl.value, 200);
  assert.equal(pnl.day, 100);
  assert.equal(pnl.dayPct, 50);
});

test("computePnl: empty portfolio is all zeros (no divide-by-zero)", () => {
  const pnl = computePnl([]);
  assert.equal(pnl.value, 0);
  assert.equal(pnl.totalPct, 0);
  assert.equal(pnl.dayPct, 0);
});

test("computePnl.value equals totalUsd over the same tokens", () => {
  assert.equal(computePnl(DEMO_TOKENS).value, totalUsd(DEMO_TOKENS));
});

test("computePnl.total equals value minus cost", () => {
  const pnl = computePnl(DEMO_TOKENS);
  assert.ok(Math.abs(pnl.total - (pnl.value - pnl.cost)) < 1e-9);
});
