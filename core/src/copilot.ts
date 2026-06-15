/**
 * Lumen Copilot — a local, no-API intent engine (ported from the demo).
 *
 * Pure: takes the wallet context, returns an HTML snippet + an optional route
 * action. The demo returned DOM callbacks; here actions are declarative
 * ({ route, prefill }) so any UI can wire them up. This is the MVP fallback the
 * roadmap keeps even after a real LLM is added (GOING-LIVE Phase 4.9).
 */

import { escapeHtml, fmtUsd, fmtAmt, fmtSigned, shortAddr, relTime } from "./format";
import { computePnl } from "./portfolio";
import { resolveRecipient, isFlagged } from "./scam-shield";
import type { CopilotReply, Directory, HistoryEntry, Token } from "./types";

export interface CopilotContext {
  tokens: Token[];
  history: HistoryEntry[];
  directory: Directory;
}

export const COPILOT_SUGGESTIONS = [
  "What's my portfolio worth?",
  "How am I doing? (P&L)",
  "Is claim-airdrop.lumen safe?",
  "Explain my last transaction",
  "Send $50 of ETH to alice",
  "What can you do?",
];

function findTokenInText(q: string, tokens: Token[]): Token | null {
  const byName = tokens.find(
    (t) => new RegExp("\\b" + t.sym + "\\b", "i").test(q) || new RegExp("\\b" + t.name + "\\b", "i").test(q),
  );
  if (byName) return byName;
  const get = (sym: string) => tokens.find((t) => t.sym === sym) ?? null;
  if (/bitcoin/i.test(q)) return get("BTC");
  if (/ether/i.test(q)) return get("ETH");
  if (/\bsol\b|solana/i.test(q)) return get("SOL");
  if (/polygon|matic/i.test(q)) return get("MATIC");
  return null;
}

interface SendIntent {
  token: Token;
  recipient: string;
  fiat?: number;
  amount?: number;
}

/** Parse "send $50 of ETH to alice" / "send 0.2 BTC to bob.lumen". */
export function parseSend(q: string, tokens: Token[]): SendIntent | null {
  if (!/\bsend\b|\btransfer\b|\bpay\b/.test(q)) return null;
  if (!/\bto\b/.test(q)) return null;
  const t = findTokenInText(q, tokens);
  if (!t) return null;
  const recMatch = q.match(/to\s+([a-z0-9.\-]+)/i);
  if (!recMatch) return null;
  let recipient = recMatch[1]!;
  if (/^[a-z0-9-]+$/.test(recipient) && !recipient.includes(".") && !/^0x/.test(recipient)) recipient += ".lumen";
  const fiatMatch = q.match(/\$\s?([\d,]+(?:\.\d+)?)/) || q.match(/([\d,]+(?:\.\d+)?)\s*(?:dollars|usd|bucks)/);
  const amtMatch = q.match(/([\d,]+(?:\.\d+)?)/);
  if (fiatMatch) return { token: t, recipient, fiat: parseFloat(fiatMatch[1]!.replace(/,/g, "")) };
  if (amtMatch) return { token: t, recipient, amount: parseFloat(amtMatch[1]!.replace(/,/g, "")) };
  return null;
}

/** Answer a Copilot prompt using only local wallet context. */
export function copilotReply(text: string, ctx: CopilotContext): CopilotReply {
  const q = text.toLowerCase().trim();
  const { tokens, history, directory } = ctx;
  const tok = (sym: string) => tokens.find((t) => t.sym === sym);

  // ----- natural-language SEND -----
  const sendIntent = parseSend(q, tokens);
  if (sendIntent) {
    const r = resolveRecipient(sendIntent.recipient, directory);
    const t = sendIntent.token;
    if (!r.ok) {
      return { html: "I couldn't find a wallet for <b>" + escapeHtml(sendIntent.recipient) + "</b>. Add them as a contact, or give me a username like <b>alice.lumen</b>." };
    }
    const amt = sendIntent.fiat != null ? (t.price ? sendIntent.fiat / t.price : 0) : (sendIntent.amount ?? 0);
    const flagged = isFlagged(r.address, directory.blocklist);
    const safetyLine = flagged
      ? ' &#9888;&#65039; <span class="chat-neg">Heads up: Scam Shield has this address flagged as a drainer.</span>'
      : " Scam Shield will run a safety check before you confirm.";
    return {
      html:
        "Got it — I'll set up a send of <b>" + fmtAmt(amt) + " " + t.sym + "</b>" +
        (sendIntent.fiat != null ? " (&#8776; " + fmtUsd(sendIntent.fiat) + ")" : "") +
        " to <b>" + escapeHtml(r.kind === "address" ? shortAddr(r.address ?? "") : (r.label ?? "")) + "</b>." + safetyLine,
      action: { label: "Review this send", route: "/send", prefill: { sym: t.sym, amount: fmtAmt(amt), recipient: sendIntent.recipient } },
    };
  }

  // ----- portfolio worth -----
  if (/(portfolio|net ?worth|total).*(worth|value|balance)|how much.*(have|worth)|what.*worth/.test(q) || q === "balance" || /my balance/.test(q)) {
    const pnl = computePnl(tokens);
    const top = tokens.slice().sort((a, b) => (b.balance + b.staked) * b.price - (a.balance + a.staked) * a.price)[0]!;
    return { html: "Your portfolio is worth <b>" + fmtUsd(pnl.value) + "</b> across " + tokens.length + " assets. Biggest holding is <b>" + top.name + "</b> at " + fmtUsd((top.balance + top.staked) * top.price) + ". Total P&amp;L is <span class=\"" + (pnl.total >= 0 ? "chat-pos" : "chat-neg") + "\">" + fmtSigned(pnl.total) + " (" + (pnl.totalPct >= 0 ? "+" : "") + pnl.totalPct.toFixed(1) + "%)</span>." };
  }

  // ----- P&L / performance -----
  if (/p&l|pnl|profit|loss|how am i doing|performance|gains?|up or down/.test(q)) {
    const pnl = computePnl(tokens);
    const winners = tokens.filter((t) => t.price > t.cost).sort((a, b) => b.price / b.cost - a.price / a.cost);
    const losers = tokens.filter((t) => t.price < t.cost);
    let html = "Total unrealized P&amp;L: <span class=\"" + (pnl.total >= 0 ? "chat-pos" : "chat-neg") + "\">" + fmtSigned(pnl.total) + " (" + (pnl.totalPct >= 0 ? "+" : "") + pnl.totalPct.toFixed(1) + "%)</span>. Today you're <span class=\"" + (pnl.day >= 0 ? "chat-pos" : "chat-neg") + "\">" + fmtSigned(pnl.day) + "</span>.";
    if (winners[0]) html += " Best performer: <b>" + winners[0].sym + "</b> (+" + ((winners[0].price / winners[0].cost - 1) * 100).toFixed(0) + "%).";
    if (losers[0]) html += " " + losers[0].sym + " is currently below cost basis.";
    html += " Open <b>Insights</b> for the full breakdown.";
    return { html, action: { label: "View Insights", route: "/insights" } };
  }

  // ----- safety / scam check -----
  if (/safe|scam|legit|trust|risk|drain|phish/.test(q)) {
    const m = q.match(/(0x[0-9a-f]{6,}|[a-z0-9-]+\.lumen)/i);
    if (m) {
      const r = resolveRecipient(m[1]!, directory);
      if (r.ok && isFlagged(r.address, directory.blocklist)) {
        return { html: '<span class="chat-neg">&#9888;&#65039; Do not send to ' + escapeHtml(m[1]!) + '.</span> Scam Shield has it flagged as a known wallet drainer — it requests unlimited token approvals and sweeps funds. Reported by 1,284 users.' };
      }
      if (r.ok) {
        return { html: "<b>" + escapeHtml(m[1]!) + "</b> looks <span class=\"chat-pos\">clean</span> — it's not on any scam or drainer blocklist, and resolves to " + shortAddr(r.address ?? "") + ". I'll still simulate the transaction before you confirm." };
      }
      return { html: "I don't recognize " + escapeHtml(m[1]!) + ". If it's a username it isn't registered; treat unknown addresses with caution." };
    }
    const t = findTokenInText(q, tokens);
    if (t) return { html: "<b>" + t.name + " (" + t.sym + ")</b> is a verified, well-known asset in your wallet — not a risky contract. Scam Shield only blocks unverified or flagged contracts." };
    return { html: "Paste an address or username (e.g. <b>claim-airdrop.lumen</b>) and I'll screen it with Scam Shield. Every send is also simulated and risk-scored before you confirm." };
  }

  // ----- explain last transaction -----
  if (/explain|what was|last|recent|latest/.test(q) && /transaction|tx|transfer|activity|send|payment/.test(q)) {
    const tx = history[0];
    if (!tx) return { html: "You don't have any transactions yet." };
    const t = tok(tx.sym);
    const usd = t ? fmtUsd(tx.amount * t.price) : "";
    const verb = tx.dir === "out" ? "sent" : "received";
    return { html: "Your most recent activity: you <b>" + verb + " " + fmtAmt(tx.amount) + " " + tx.sym + "</b> (" + usd + ") " + (tx.dir === "out" ? "to" : "from") + " <b>" + escapeHtml(tx.address) + "</b>, " + relTime(tx.ts) + ". It cleared successfully.", action: { label: "Open Activity", route: "/activity" } };
  }

  // ----- price of a token -----
  if (/price|worth|cost|how much is|value of|trading/.test(q)) {
    const t = findTokenInText(q, tokens);
    if (t) return { html: "<b>" + t.name + "</b> is trading at <b>" + fmtUsd(t.price) + "</b>, " + (t.change >= 0 ? '<span class="chat-pos">up ' : '<span class="chat-neg">down ') + Math.abs(t.change).toFixed(1) + "%</span> in 24h. You hold " + fmtAmt(t.balance + t.staked) + " " + t.sym + " (" + fmtUsd((t.balance + t.staked) * t.price) + ").", action: { label: "Open chart", route: "/markets" } };
  }

  // ----- balance of a token -----
  if (/how much|balance of|do i have|holding/.test(q)) {
    const t = findTokenInText(q, tokens);
    if (t) return { html: "You hold <b>" + fmtAmt(t.balance + t.staked) + " " + t.sym + "</b> (" + fmtUsd((t.balance + t.staked) * t.price) + ")" + (t.staked > 0 ? ", of which " + fmtAmt(t.staked) + " is staked at " + t.apy + "% APY" : "") + "." };
  }

  // ----- staking / earn -----
  if (/stake|staking|earn|yield|apy|interest|passive/.test(q)) {
    const best = tokens.filter((t) => t.apy > 0).sort((a, b) => b.apy - a.apy)[0];
    if (best) return { html: "You can earn yield on several assets — highest is <b>" + best.sym + " at " + best.apy + "% APY</b>. Staking is liquid, so you can unstake anytime.", action: { label: "Open Earn", route: "/earn" } };
  }

  // ----- buy / swap / alerts / recovery / fees -----
  if (/\bbuy\b|on.?ramp|purchase|top up/.test(q)) return { html: "Lumen is non-custodial and doesn't process payments. Buy on any exchange or on-ramp you trust (they do their own checks), then send it to your address.", action: { label: "Add funds", route: "/buy" } };
  if (/\bswap\b|exchange|convert|trade/.test(q)) return { html: "Use Swap to convert between tokens with a live rate and slippage control. I'll show price impact and run a safety check first.", action: { label: "Open Swap", route: "/swap" } };
  if (/alert|notify|remind/.test(q)) return { html: "Set price alerts to get notified when a coin crosses a target — for example BTC above $70,000.", action: { label: "Open Alerts", route: "/alerts" } };
  if (/recover|guardian|seed|phrase|backup|lost/.test(q)) return { html: "Your wallet is a smart account — no seed phrase. If you lose access, your trusted <b>guardians</b> can help you recover it.", action: { label: "Open Security", route: "/security" } };
  if (/fee|gas|network cost/.test(q)) return { html: "Network fees are shown on every transaction review before you confirm — typically a fraction of the amount. Smart-account onboarding itself is gasless." };

  // ----- help / greetings -----
  if (/help|what can you|how do you|capabilit|commands?/.test(q)) {
    return { html: "I can help with:<br>&bull; <b>Portfolio &amp; P&amp;L</b> — “what's my portfolio worth?”<br>&bull; <b>Scam checks</b> — “is this address safe?”<br>&bull; <b>Explaining activity</b> — “explain my last transaction”<br>&bull; <b>Sending</b> — “send $50 of ETH to alice”<br>&bull; <b>Prices, staking, alerts</b> and more. Just ask." };
  }
  if (/^(hi|hey|hello|yo|sup|gm)\b/.test(q)) return { html: "Hey! Want a portfolio snapshot, a scam check, or to send something? Just tell me." };
  if (/thank/.test(q)) return { html: "Anytime. Stay safe out there &#128737;&#65039;" };

  return { html: "I can check your portfolio value &amp; P&amp;L, screen addresses for scams, explain transactions, and set up sends/swaps. Try “what's my portfolio worth?” or “is claim-airdrop.lumen safe?”." };
}
