import type { BuyMethod, BuyQuote, Token } from "./types";

/** Fiat on-ramp quote: card 1.2% fee, Apple Pay 0.9% (mock, ported from the demo). */
export function computeBuyQuote(token: Token, fiat: number, method: BuyMethod): BuyQuote {
  const feeRate = method === "apple" ? 0.009 : 0.012;
  const fee = fiat * feeRate;
  const net = Math.max(0, fiat - fee);
  const tokenAmt = token.price ? net / token.price : 0;
  return { feeRate, fee, net, tokenAmt };
}
