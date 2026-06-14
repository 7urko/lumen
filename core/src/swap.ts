import type { SwapQuote, Token } from "./types";

/** Token-to-token swap quote with mock price impact + slippage (ported from the demo). */
export function computeSwap(from: Token, to: Token, fromAmt: number, slippagePct: number): SwapQuote {
  const rate = to.price ? from.price / to.price : 0;
  const gross = fromAmt * rate;
  // mock price impact: scales with notional, capped at 0.8%
  const impact = fromAmt > 0 ? Math.min(0.8, (fromAmt * from.price) / 250000) : 0;
  const toAmt = gross * (1 - impact / 100);
  const minReceived = toAmt * (1 - slippagePct / 100);
  const fee = fromAmt * from.price * 0.003;
  return { rate, toAmt, impact, minReceived, fee, fromUsd: fromAmt * from.price, toUsd: toAmt * to.price };
}
