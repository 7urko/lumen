/**
 * Pure formatters and small string/number helpers.
 * Ported verbatim (behaviour-preserving) from the demo's app.js.
 */

const MS_PER_DAY = 86_400_000;

/** Epoch ms for `n` days before `now` (default: real now). */
export function daysAgo(n: number, now: number = Date.now()): number {
  return now - n * MS_PER_DAY;
}

/** Format a USD value with adaptive precision for sub-dollar amounts. */
export function fmtUsd(n: number): string {
  const abs = Math.abs(n);
  const dp = abs > 0 && abs < 1 ? (abs < 0.01 ? 6 : 4) : 2;
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: dp });
}

/** Format a USD value rounded to whole dollars. */
export function fmtUsd0(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-US");
}

/** Format a signed USD delta, e.g. "+$1,200.00" / "−$5.00" (true minus sign). */
export function fmtSigned(n: number): string {
  return (n >= 0 ? "+" : "−") + fmtUsd(Math.abs(n));
}

/** Format a token amount with up to 6 decimals, trailing zeros trimmed. */
export function fmtAmt(n: number): string {
  const s = Number(n).toFixed(6).replace(/\.?0+$/, "");
  return s === "" ? "0" : s;
}

/** Shorten a long address to "0x4a8f23…b6d340"; pass through short strings. */
export function shortAddr(a: string): string {
  if (!a) return "";
  if (a.length <= 14) return a;
  return a.slice(0, 8) + "…" + a.slice(-6);
}

/** Human-relative timestamp, e.g. "just now", "5m ago", "3d ago", or a date. */
export function relTime(ts: number, now: number = Date.now()): string {
  const diff = now - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return mins + "m ago";
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + "h ago";
  const days = Math.floor(hrs / 24);
  if (days < 30) return days + "d ago";
  return new Date(ts).toLocaleDateString();
}

/** Up-to-two-letter initials from a name, e.g. "Alice Nguyen" -> "AN". */
export function initials(name: string): string {
  const p = name.trim().split(/\s+/);
  return ((p[0] || "")[0] || "") + ((p[1] || "")[0] || "");
}

/** Deterministic gradient (CSS) derived from a string — for avatar colours. */
export function colorFor(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
  return "linear-gradient(135deg,hsl(" + h + " 70% 55%),hsl(" + ((h + 40) % 360) + " 75% 62%))";
}

/** Escape the HTML-significant characters in a string. */
export function escapeHtml(s: unknown): string {
  const map: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
  return String(s).replace(/[&<>"]/g, (c) => map[c] ?? c);
}
