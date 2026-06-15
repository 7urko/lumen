/** Privacy mode — Lumen makes no analytics/tracking calls. This enumerates the
 *  ONLY external requests the app makes, and a Strict toggle that disables the
 *  purely-cosmetic ones (so a privacy-max user can verify nothing else leaks). */
const STRICT_KEY = "lumen.strict-privacy";

export function isStrict(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STRICT_KEY) === "1";
}
export function setStrict(on: boolean): void {
  if (typeof window !== "undefined") localStorage.setItem(STRICT_KEY, on ? "1" : "0");
}

export interface ExternalCall { name: string; purpose: string; required: boolean }
export const EXTERNAL_CALLS: ExternalCall[] = [
  { name: "Base RPC node", purpose: "Read balances and broadcast your transactions to the blockchain", required: true },
  { name: "Google Fonts", purpose: "Load the Inter / Space Grotesk fonts (cosmetic)", required: false },
  { name: "TradingView", purpose: "The live price chart on the Markets screen only", required: false },
];
