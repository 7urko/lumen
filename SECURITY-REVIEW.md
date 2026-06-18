# Lumen — Internal Security Review (pre-audit hardening)

**Reviewer:** Claude (internal, self-review). **Date:** 2026-06-15.
**Scope:** the `web/` app's value-handling surface — key storage & signing
(`account.ts`, `passkey.ts`, `smart-account.ts`, `wallet.ts`), money flows
(`send`, `swap-onchain.ts`, `approvals.ts`, `scam-onchain.ts`), network/trust
(`chain.ts`, `ens.ts`, `gas.ts`), recipient handling (`RecipientField.tsx`),
and app/front-end security (`next.config.ts`, CSP, third-party scripts).

> **What this is and isn't.** This is a genuine line-by-line review that found
> real issues and fixed the biggest one. It is **not** a substitute for an
> independent third-party audit. The value of an external auditor is that they
> didn't write the code (no blind spots), they're accountable, and their signed
> report is what users and partners trust. Treat this as *pre-audit hardening*:
> fix what we can find first, so the paid audit is faster, cheaper, and finds less.
> Still **testnet only** — do not flip to mainnet on the strength of this document.

---

## Summary

| # | Severity | Finding | Status |
|---|----------|---------|--------|
| H1 | **High** | No security headers / Content-Security-Policy | **Fixed** (nonce CSP + headers) |
| M1 | Medium | Vault password strength not enforced | **Fixed** (`account.ts` + UI meter) |
| M2 | Medium | No idle auto-lock; decrypted key lingers in memory | **Fixed** (idle + tab-hide auto-lock) |
| M3 | Medium | Address validation not checksum-strict | **Fixed** (`RecipientField` rejects bad checksum, shows full address) |
| M4 | Medium | Hardcoded contract/router/feed addresses are unverified trust anchors | **Fixed in code** (`vAddr` load-time validation + `ADDRESSES.md`); contract-identity verification remains a mainnet gate |
| M5 | Medium | Third-party script (TradingView) runs in the wallet origin, no isolation/SRI | **Fixed** (sandboxed opaque-origin iframe + nonce CSP, no `unsafe-inline`) |
| M6 | Medium | `verifyPasskey()` does no real cryptographic verification | **Fixed** (`passkey.ts` deleted) |
| L1 | Low | Swap has no transaction deadline | Documented (SwapRouter02 is deadline-less by design; minOut guards) |
| L2 | Low | Chainlink price freshness (`updatedAt`) not checked | **Fixed** (stale feed → price treated as unknown) |
| L3 | Low | Private key handled as a JS string (can't zero memory) | Mitigated (smart account = no key; EOA auto-locks) |
| L4 | Low | Slippage parameter is unbounded | **Fixed** (`clampSlippage` 0.05–50%) |
| L5 | Low | Smart-account credential in localStorage is tamperable | **Fixed** (shape-validated on load) + CSP |
| L6 | Low | Approval discovery may miss old approvals (no indexer) | **Improved** (chunked recent scan); full history still needs an indexer |

### Fixes applied — 2026-06-15 (verify with `npm run build -w web` on the machine)

All findings above the line are resolved in code. Files touched: `web/middleware.ts`
(new — nonce CSP), `web/next.config.ts` (static headers), `web/lib/account.ts`
(password strength + auto-lock), `web/app/account/page.tsx` (strength meter + auto-lock
UI), `web/components/RecipientField.tsx` (checksum + full-address confirm),
`web/lib/chain.ts` (address validation + price freshness), `web/lib/swap-onchain.ts`
(address validation + slippage clamp), `web/lib/approvals.ts` (address validation +
chunked scan), `web/lib/smart-account.ts` (credential validation), `web/app/markets/page.tsx`
(sandboxed chart), `web/lib/passkey.ts` (deleted), plus `ADDRESSES.md` (new).

> **Build-verification caveat (honest):** the Linux sandbox can't run `next build`
> (no registry access for its SWC binary) and its mount was serving stale/truncated
> copies, so I could not runtime-verify these changes here. The Windows source files
> are complete and reviewed. **Run `npm run build -w web` and a quick `npm run dev`
> smoke test on the machine** before deploying — the nonce CSP and the sandboxed
> chart iframe are the two changes most worth eyeballing in a browser (check the
> console for any CSP violations and that the Markets chart still renders).

**The good news (what's already right):** the primary wallet is the **audited
Coinbase Smart Wallet** with no extractable key; swaps **approve the exact amount**
(not unlimited); the vault uses **AES-256-GCM + PBKDF2 (310k iters)** with
authenticated decryption; Scam Shield flags **unlimited approvals**; the app makes
**no analytics/tracking calls**; TypeScript runs in **strict** mode. The
architecture is sound — the findings below are hardening, not redesign.

---

## High

### H1 — No security headers / CSP  *(FIXED in this pass)*

**Was:** `next.config.ts` set no headers at all. For a wallet this is the single
most important missing control. With no Content-Security-Policy, any injected or
compromised script (a poisoned dependency, a malicious CDN, an XSS) running on the
origin could:

- **rewrite the recipient address right before you sign** — the classic
  "address-swap" drainer, the most common way wallets lose user funds;
- **read `localStorage`** (the encrypted vault, the smart-account credential, the
  seen-recipients list) and **exfiltrate it to any server** to brute-force a weak
  password offline;
- **iframe the app** for clickjacking.

**Fix applied:** added a strict CSP plus `Strict-Transport-Security`,
`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`,
`Permissions-Policy` (camera allowed for the QR scanner; everything else denied),
and `X-DNS-Prefetch-Control: off`. The CSP locks `connect-src` to only our RPC/
bundler origins (so nothing can phone home elsewhere), `script-src` to our own code
plus TradingView, and sets `frame-ancestors 'none'`. Custom RPC/bundler URLs set via
`NEXT_PUBLIC_*` env vars are auto-added to `connect-src`. Dev mode relaxes the policy
(adds `unsafe-eval`/`ws:` for HMR); production never includes them.

**Residual / follow-up:** `script-src` still allows `'unsafe-inline'` because the
TradingView widget injects an inline `<script>`. The stronger version is a
**nonce-based CSP via middleware** — recommended before a public launch. See M5.

---

## Medium

### M1 — Vault password strength not enforced
`account.ts → createVault(password)` accepts any password, including empty or
trivial. PBKDF2 at 310k iterations is strong, but the vault blob (`salt`, `iv`,
`ct`) lives in `localStorage`; anyone who exfiltrates it (see H1) or has disk access
can brute-force a weak password offline. **Recommend:** enforce a minimum strength
in the UI (length ≥ 12 and a zxcvbn-style check), and surface a strength meter on
the create-vault screen. Defense-in-depth only — the smart account is the real
answer for funds.

### M2 — No idle auto-lock
Once unlocked, `unlockedPk` stays in memory until `lock()` or a page reload. A user
who walks away leaves a hot, signing-capable wallet. **Recommend:** an inactivity
timer (e.g. 5–15 min) and lock-on-tab-hide that calls `lock()`; optionally re-prompt
the passkey before each send.

### M3 — Address validation is not checksum-strict
`RecipientField.tsx` and other screens use viem `isAddress(v)` without strict EIP-55
checksum validation, so an all-lowercase mistyped or clipboard-swapped address can
pass. Wrong-address sends are the **#1 real-world cause of irreversible loss**.
**Recommend:** validate with EIP-55 checksum where possible, always render the full
resolved address (not just a truncation) for explicit user confirmation, and warn
clearly when an address has no checksum to verify. (Scam Shield's "first time
sending here" radar already helps — make the full-address confirm a hard step.)

### M4 — Hardcoded addresses are unverified trust anchors
Router/quoter/token/feed addresses are hardcoded in `swap-onchain.ts`, `chain.ts`,
and `approvals.ts`. A single wrong address — especially the swap **ROUTER** — could
route funds to an attacker-controlled contract. On testnet the blast radius is nil,
but **before mainnet every address must be verified against canonical, official
deployment sources** and pinned with a comment citing the source. This is exactly
the kind of thing the external audit will check; pre-verifying saves audit time.

### M5 — Third-party script in the wallet origin
The Markets screen injects TradingView's script directly into the page, so it runs
with full access to the wallet origin (DOM, and absent CSP, storage). CSP (H1) now
scopes what it can load and where it can connect, which is a big improvement.
**Stronger fix:** isolate the chart in a **sandboxed `<iframe>`** (separate origin,
no storage access), and/or self-host the QR library with Subresource Integrity. The
QR scanner itself uses the native `BarcodeDetector` (no third-party script) — good.

### M6 — `verifyPasskey()` verifies nothing
`passkey.ts → verifyPasskey()` returns `!!assertion` — it proves *a* passkey
ceremony happened but never checks a challenge or signature, so it provides **no
real authentication**. It is currently **unused** (the real account auth is the
on-chain WebAuthn verification in `smart-account.ts`), but leaving it exported is a
footgun: a future caller could gate a sensitive action on it believing it's secure.
**Recommend:** delete it (and the v0 `passkey.ts` unlock-gate) or rename + comment it
as non-security UX only.

---

## Low

- **L1 — No swap deadline.** `exactInputSingle` is called without a deadline, so a
  pending swap could execute later than intended. `amountOutMinimum` still bounds the
  value received; add a deadline for completeness.
- **L2 — Price freshness unchecked.** `getEthUsd` reads Chainlink `latestRoundData`
  but ignores `updatedAt`; a stale feed yields a wrong USD figure. Display-only today
  (price doesn't drive min-out), but check staleness before any price ever informs a
  trade decision.
- **L3 — Key as a JS string.** The decrypted private key is a JS string and can't be
  zeroed; this is an inherent limitation of the EOA model. The **smart account avoids
  it entirely** (no key) — another reason it's the primary wallet.
- **L4 — Unbounded slippage.** `swap(..., slippagePct)` doesn't clamp its input; a
  large value drives `minOut → 0` (no protection). Clamp to a sane range (e.g.
  0.1–5%) in the UI/lib.
- **L5 — Tamperable credential.** The smart-account public key/id in `localStorage`
  could be swapped by XSS, pointing the UI at a different (empty, attacker) account —
  no existing funds are stolen (the attacker can't sign without the passkey), but
  it's confusing. CSP mitigates; consider integrity-checking the stored credential.
- **L6 — Approval completeness.** `listApprovals` discovers spenders via full-range
  `getLogs` on a public RPC, which can miss very old approvals. Accepted and
  documented; a dedicated RPC/indexer fixes it.

---

## Process / supply-chain recommendations (not code bugs)

1. **Commit the lockfile and use `npm ci`** in CI so builds are reproducible and a
   dependency can't silently change under you. Add **`npm audit`** + **Dependabot**.
2. **Pin/self-host third-party scripts** (TradingView, any CDN libs) with Subresource
   Integrity, or sandbox them (M5).
3. **Add `SECURITY.md`** with a responsible-disclosure contact before any public URL.
4. **Move to nonce-based CSP** (drop `'unsafe-inline'` from `script-src`) — the H1
   follow-up.
5. **Verify all hardcoded addresses** against official sources (M4) and pin sources
   in comments.

---

## Suggested fix order

1. ~~Security headers / CSP~~ ✅ done.
2. Address-confirm hardening (M3) and idle auto-lock (M2) — cheap, high user-safety.
3. Password strength (M1) + slippage clamp (L4) — small UI changes.
4. Sandbox/SRI third-party scripts (M5) + nonce CSP — before public launch.
5. Verify every hardcoded address (M4) — gate for mainnet.
6. Remove the dead `verifyPasskey`/v0 passkey gate (M6).

When these are done, the codebase handed to an external auditor is materially
smaller-surface and cleaner — which is the whole point of this pass.
