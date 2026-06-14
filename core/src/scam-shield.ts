/**
 * Scam Shield — recipient resolution + pre-send risk assessment.
 *
 * This is Lumen's differentiator, so it's the most important thing to keep
 * pure and well-tested. The demo read module-level BLOCKLIST / REGISTRY /
 * CONTACTS globals; here every function takes a `Directory` (or the relevant
 * slice) so the same logic runs against mock data today and a real
 * threat-intel / name-service / contacts backend later.
 */

import { shortAddr, fmtUsd } from "./format";
import type { Blocklist, Directory, Resolved, RiskLevel, RiskReason, RiskVerdict } from "./types";

/** A bare "<name>.lumen" username. */
const NAME_RE = /^[a-z0-9-]+\.lumen$/i;
/** A plausible on-chain address: 0x… (EVM), bc1… (bech32), or base58. */
const ADDR_RE = /^(0x[0-9a-fA-F]{6,}|bc1[a-z0-9]{6,}|[1-9A-HJ-NP-Za-km-z]{8,})$/;

/** Threat reasons for an address if it's blocklisted, else null. */
export function isFlagged(address: string | undefined | null, blocklist: Blocklist): string[] | null {
  if (!address) return null;
  return blocklist[String(address).toLowerCase()] ?? null;
}

/** Resolve a raw recipient string (address / username / contact) via a Directory. */
export function resolveRecipient(raw: string, dir: Directory): Resolved {
  const input = (raw || "").trim();
  if (!input) return { ok: false, empty: true };
  const lower = input.toLowerCase();

  // 1. saved contact by username / name / address
  const contact = dir.contacts.find(
    (c) =>
      c.username.toLowerCase() === lower ||
      c.name.toLowerCase() === lower ||
      c.address.toLowerCase() === lower,
  );
  if (contact) {
    return {
      ok: true,
      address: contact.address,
      kind: "contact",
      label: contact.name + " · " + contact.username,
      contact,
      flagReasons: isFlagged(contact.address, dir.blocklist),
    };
  }

  // 2. registered *.lumen username
  const registered = dir.registry[lower];
  if (registered) {
    return {
      ok: true,
      address: registered,
      kind: "username",
      label: lower,
      flagReasons: isFlagged(registered, dir.blocklist),
    };
  }

  // 3. looks like a *.lumen name but isn't registered
  if (NAME_RE.test(input)) {
    return { ok: false, unknownName: true, label: input };
  }

  // 4. raw address
  if (ADDR_RE.test(input)) {
    return {
      ok: true,
      address: input,
      kind: "address",
      label: shortAddr(input),
      flagReasons: isFlagged(input, dir.blocklist),
    };
  }

  return { ok: false, invalid: true };
}

/** Amount (USD) above which a transfer is flagged for an extra look. */
export const LARGE_TRANSFER_USD = 5000;

/** Build a Safe / Caution / Danger verdict for a resolved recipient + amount. */
export function assessRisk(resolved: Resolved, amountUsd: number): RiskVerdict {
  if (resolved && resolved.flagReasons) {
    return {
      level: "danger",
      title: "Danger — known malicious address",
      sub: "This recipient is on Lumen's threat list",
      reasons: resolved.flagReasons.map((r): RiskReason => ({ kind: "bad", text: r })),
    };
  }

  const reasons: RiskReason[] = [];
  let level: RiskLevel = "safe";

  if (resolved && resolved.kind === "contact") {
    reasons.push({ kind: "good", text: "Saved contact — you've trusted this address before" });
  } else if (resolved && resolved.kind === "username") {
    reasons.push({ kind: "good", text: "Verified Lumen username · resolves to " + shortAddr(resolved.address ?? "") });
  } else {
    reasons.push({ kind: "good", text: "Address is not on any known scam or drainer blocklist" });
  }
  reasons.push({ kind: "good", text: "No malicious token approvals requested" });

  if (amountUsd > LARGE_TRANSFER_USD) {
    level = "caution";
    reasons.push({ kind: "warn", text: "Large transfer (" + fmtUsd(amountUsd) + ") — double-check the recipient" });
  } else {
    reasons.push({ kind: "good", text: "Standard wallet transfer · simulated successfully" });
  }

  return {
    level,
    title: level === "caution" ? "Proceed with caution" : "Verified safe",
    sub: level === "caution" ? "No threats found, but review the amount" : "Simulation passed all security checks",
    reasons,
  };
}
