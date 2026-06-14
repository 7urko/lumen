# Lumen — Phase 1 Decisions Record

> The go-live roadmap (`GOING-LIVE.md`) opens with decisions that "cascade into every later
> phase." This file records the ones that have been made, with their rationale, so a fresh
> session (or a lawyer, or a new teammate) can see what's locked and what's still open.
>
> **Not legal advice.** The custody/compliance items still need sign-off from a qualified
> crypto/fintech lawyer before launch — see `GOING-LIVE.md` Phase 6.

## Decided (2026-06-14)

### 1.1 Custody model → **Non-custodial**
Users hold their own keys; Lumen never takes custody of crypto or fiat. This is the lightest
licensing path (avoids money-transmitter / MSB-class obligations) and matches Lumen's product
pitch. Fiat, when added (Buy), must flow entirely through a **licensed on-ramp partner** so the
partner — not Lumen — is the regulated entity.
*Still required:* written confirmation of posture with counsel before holding real funds.

### 1.2 Launch chain → **Base** (single chain for v1)
One EVM L2 to start: Base (Coinbase's L2). Low fees, mature tooling, strong smart-wallet +
fiat on-ramp support. **Multi-chain is explicitly deferred** — the demo lists BTC/SOL/MATIC,
but v1 targets Base only; other chains come post-validation (roadmap Phase 8). Testnet for QA:
**Base Sepolia**.

### 1.3 First build step → **Extract the `core` logic first**
Before standing up any framework, pull the pure, framework-agnostic logic out of `app.js` into a
shared `core` package (zero DOM). Lowest-risk, highest-leverage move and it needs no toolchain on
the dev machine yet. **Done** — see `core/` (formatters, P&L, sparkline math, Scam Shield), fully
unit-tested (37 tests green).

### 1.5 Build posture → **self-built, no third-party SaaS** (decided 2026-06-14)
Build everything in-house with our own infrastructure + **audited open-source libraries** (viem for
chain access, Uniswap contracts for swaps, WebAuthn + ERC-4337/Safe contracts for smart accounts).
**No** SaaS middlemen (Privy, Alchemy, Blockaid, etc.). The **only** third parties are the ones the
law forces: **fiat on-ramp (cards→crypto) and KYC/AML** — both regulated, both deferred.
- **Hard rule:** self-built ≠ home-rolled cryptography. We *integrate and run* audited OSS primitives;
  we do not invent key handling. Build/test on **testnet**, get a **security audit** before mainnet.
- **Node:** talking to the chain needs a node. Public RPC for now (one env var, `NEXT_PUBLIC_BASE_RPC`);
  swap for a self-hosted node later. Not a product integration.
- **Started:** `web/lib/chain.ts` + `/live` — real Base balances & on-chain Chainlink prices via viem,
  zero SaaS. (See WORKLOG.)
- **Key management v0 (testnet):** `web/lib/account.ts` + `web/lib/passkey.ts` + `/account` — a real
  browser-generated EOA on Base Sepolia, WebAuthn passkey unlock, real sign+broadcast. **Testnet only,
  not hardened.** (Now the legacy fallback.)
- **Key management v1 — ERC-4337 smart account (started):** `web/lib/smart-account.ts` + `/smart-account`
  — a **passkey-owned Coinbase Smart Wallet** via viem account-abstraction. No private key stored; the
  passkey is the on-chain signer. The real "no seed phrase" account. **Needs a self-hosted bundler** to
  send (`NEXT_PUBLIC_BUNDLER_URL`, see `BUNDLER.md`) — the one self-run infra piece. Still to do:
  gasless paymaster, social-recovery wiring, and a **security audit before mainnet**.

## Implied by the above (recommended defaults, not yet ratified)

These follow from the roadmap + the decisions above. Flagged here so they're easy to confirm or
change before code depends on them:

- **Key management (1.3):** account abstraction (ERC-4337) + **passkeys / WebAuthn** for the
  "no seed phrase" smart-account UX, via an embedded-wallet provider (e.g. Privy / Turnkey /
  Coinbase Smart Wallet / ZeroDev — to be evaluated). Social recovery via guardian threshold.
- **Stack (1.4):** React + TypeScript, **Next.js** ✓ (scaffolded — `web/` workspace, App Router,
  React 19, consuming `@lumen/core`). Monorepo via **npm workspaces** (`core` ✓ / `web` ✓; `api` +
  placeholder `mobile` still to come). **PWA** ✓ (manifest, icons, service worker, offline — Phase 2.2).
  **Git** ✓ (initial commit) + **CI** ✓ (GitHub Actions: core tests + web typecheck + build).
  Still to add: TanStack Query + a light store.
- **Name service:** decide whether `*.lumen` is Lumen's own registry or maps to ENS.

## Open / blocked decisions

- [ ] Pick the embedded-wallet / account-abstraction provider (gates onboarding, unlock, recovery).
- [ ] Confirm custody/compliance posture with a lawyer (gates launch).
- [ ] Decide gas-sponsorship / paymaster strategy for gasless onboarding.
- [ ] Choose RPC, indexer, market-data, and on-ramp vendors (roadmap Phase 3 / 4).
- [ ] **Repo hygiene:** the project currently exists as two mirrored folders
  (`C:\Users\…\crypto wallet` and `D:\crypto-wallet`) that have begun to drift. Pick ONE canonical
  location before the monorepo grows. (The new `core/` package was added under `D:\crypto-wallet`.)

## Environment prerequisite — RESOLVED

**Node.js is now installed** on the dev machine (v24.16.0 / npm 11.13.0, via winget). The web app
runs locally: `npm install` at the root, then `npm run dev -w web` (or `Start Web App.bat`).
