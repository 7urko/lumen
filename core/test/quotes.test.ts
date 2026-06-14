import { test } from "node:test";
import assert from "node:assert/strict";
import { computeBuyQuote } from "../src/buy";
import { computeSwap } from "../src/swap";
import type { Token } from "../src/types";

function tk(p: Partial<Token>): Token {
  return { sym: "T", name: "T", grad: ["#000", "#fff"], balance: 0, price: 0, cost: 0, change: 0, staked: 0, apy: 0, tv: "", ...p };
}

test("computeBuyQuote: card vs apple fee", () => {
  const t = tk({ price: 100 });
  const card = computeBuyQuote(t, 100, "card");
  assert.equal(card.fee, 1.2);
  assert.ok(Math.abs(card.tokenAmt - 0.988) < 1e-9);
  const apple = computeBuyQuote(t, 100, "apple");
  assert.ok(Math.abs(apple.fee - 0.9) < 1e-9);
});

test("computeSwap: rate, impact, min-received", () => {
  const from = tk({ sym: "A", price: 200 });
  const to = tk({ sym: "B", price: 100 });
  const q = computeSwap(from, to, 1, 0.5);
  assert.equal(q.rate, 2);
  assert.ok(q.impact > 0 && q.impact < 0.8);
  assert.ok(q.toAmt <= 2 && q.toAmt > 1.99);
  assert.ok(q.minReceived < q.toAmt);
  assert.ok(Math.abs(q.fee - 0.6) < 1e-9);
});
