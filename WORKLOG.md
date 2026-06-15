# Lumen Wallet — Work Log & Project Memory

> Running memory of work done on this project with the Claude (Cowork) assistant.
> Newest entries at the top. Keep this file in the repo so a fresh chat/project has context.
>
> **Source-of-truth docs:**
> - `README.md` — what the app is + security notes (it's a UI demo, mock data, no real funds).
> - `GOING-LIVE.md` — the full web-first roadmap (phases, milestones, what's real vs mock).
> - `WORKLOG.md` (this file) — what we've actually done in working sessions + environment notes.

---

## Project snapshot (as of 2026-06-14)

**What it is:** "Lumen" — a polished crypto-wallet **front-end demo**. Plain HTML/CSS/vanilla JS, no build step, no backend. All data is mock + in-memory and resets on reload. No real keys, no blockchain, no network calls (except two CDN libs: QR code + TradingView chart).

**Files:**

| File | Purpose |
|---|---|
| `index.html` | Markup for every screen + modals |
| `styles.css` | Dark theme, layout, components, animated background |
| `app.js` | All state + logic (mock data, navigation, every screen's behaviour) |
| `README.md` | Overview + security notes |
| `GOING-LIVE.md` | Web-first go-live roadmap (the real plan) |
| `WORKLOG.md` | This work log |
| `web.html` + `web.css` | Desktop **web** layout (reuses `app.js`; sidebar + wide multi-column) |
| `_serve.ps1` | Local dev server (PowerShell, no installs) → `http://localhost:8123` |
| `CLAUDE.md` | Auto-loaded project guide for a fresh chat (read-this-first index) |
| `screenshots/` | Captured UI screenshots (see below) |

**Implemented in the demo today** (all mock; see `GOING-LIVE.md` → "What exists today" for the honest breakdown): onboarding (smart-account passkey animation / 12-word recovery phrase / import), biometric unlock animation, dashboard (balance, 24h change, Total + 24h P&L, sparklines, 5 tokens BTC/ETH/SOL/USDC/MATIC), Scam Shield pre-send simulation, Send (address / `name.lumen` username / contact), Receive (QR + address), Buy (on-ramp UI), Swap (mock rate + slippage), AI Copilot (local intent engine, no API key), Insights (allocation donut, P&L, cost basis, CSV tax export), Price alerts, Earn/staking, Security/social-recovery (guardians), Markets (real TradingView embed), Activity/history, 5-tab bottom nav + "More" sheet, and `?screen=` deep links for screenshotting.

---

## Session log

### 2026-06-14 — Big upgrade pass: **motion polish + more differentiators**

**Wave 1 — motion & UI polish:** a full animation system in `globals.css` (page/route enter
transitions, staggered list-row entrance, hover-lift on cards/rows, button/chip press feedback,
toast slide-in, primary-button glow pulse, hero sheen) — all reduced-motion safe. New
`AnimatedNumber` count-up on the dashboard balance; **sparkline now draws itself on** (stroke-dash
animation); skeleton-shimmer loaders + a spinner util, used on the live/watch async screens.

**Wave 2 — more differentiators + niceties:**
- **⌘K / Ctrl-K command palette** (`CommandPalette.tsx`) — jump to any screen or run quick actions
  (lock, toggle strict privacy) from anywhere. Topbar gets a ⌘K button.
- **Live gas tracker** (`GasWidget.tsx` + `lib/gas.ts`) — real Base gas price in the topbar, polled
  every 20s from the RPC. Self-built.
- **Wallet Health** (`/health`) — a self-built **security score (/100)** aggregating: wallet
  encrypted, no unlimited approvals, passkey smart account, strict privacy — with one-click "Fix →"
  links. No other wallet scores you like this.
- **Accent theming** — pick an accent (Iris/Cyan/Emerald/Magenta) on the Privacy screen; applied
  instantly via CSS vars and persisted (`lib/theme.ts`, applied in Shell on load).
- Sidebar gains Wallet Health. Verified: typecheck + `next build` green (29 routes).

### 2026-06-14 — **Differentiator features** (safety-first, privacy-first identity)

Product wedge vs MetaMask/Rabby/Phantom: competitors' safety features are usually a paid third party
(Blockaid/Blowfish) and off by default. Lumen's are **self-built, on by default, and local**. Built
four, all client-side / on-chain, no SaaS:

- **Scam Shield 2.0** (`lib/scam-onchain.ts` + `components/RecipientRadar.tsx`) — real pre-sign
  "recipient radar": before you send, a live on-chain check of whether the recipient is a contract or
  a wallet, its outgoing-tx activity, and whether you've sent there before. Wired into the real
  `/account` send. Plus an `isUnlimitedApproval` helper.
- **Approvals & Revoke** (`lib/approvals.ts` + `/approvals`) — lists the wallet's ERC-20 allowances
  (from on-chain Approval logs), flags **UNLIMITED** ones, one-click **revoke** (approve→0). Baked in
  (people normally rely on the separate revoke.cash site). Honest limit: public-RPC getLogs range.
- **Watch any address** (`/watch`) — saved watch-list with real holdings (reuses the chain layer) +
  on-chain radar (contract/EOA, tx count). Read-only, no import.
- **Privacy mode** (`lib/privacy.ts` + `/privacy`) — verifiable "no analytics / no tracking / no KYC /
  keys never leave your device", a list of the ONLY external calls the app makes, and a **Strict mode**
  toggle that disables the cosmetic ones (the TradingView chart now respects it).
- Sidebar gains Approvals, Watch, Privacy. Verified: typecheck + `next build` green (28 routes).
  On-chain execution (revoke, radar reads) runs on the user's machine with the public RPC.

### 2026-06-14 — Real **on-chain swap** (Uniswap v3 + WETH wrap) on Base Sepolia

Added real token swapping signed by the encrypted vault. No third party — viem + the on-chain
Uniswap v3 contracts directly.

- **`web/lib/swap-onchain.ts`** — official Base Sepolia addresses (SwapRouter02
  `0x94cC0AaC…12bc4`, QuoterV2 `0xC5290058…df5E27`, WETH `0x4200…0006`, USDC `0x036C…cF7e`):
  - **ETH ⇄ WETH** = 1:1 wrap/unwrap via WETH9 (`deposit`/`withdraw`) — needs no liquidity, so it
    ALWAYS works on testnet. The reliable real-swap path.
  - **WETH ⇄ USDC** = real Uniswap v3 swap (QuoterV2 quote → approve → `exactInputSingle`). Real, but
    depends on a funded pool existing on Base Sepolia; with no liquidity it reverts and the UI shows a
    friendly "no pool / liquidity" message.
- **`components/SwapCard.tsx`** added to the unlocked `/account` screen — from/to/amount, Get quote,
  Swap, tx link, friendly errors. Signs with the unlocked vault key (`unlockedSigner` added to account.ts).
- **Verified:** typecheck + `next build` green (25 routes). Honest note: I couldn't screenshot the
  rendered card because the dev server on the machine had stopped (browser showed connection-refused) —
  the code is build-verified and delivered; restart `Start Web App.bat` to see it. On-chain execution
  is the user's step (needs faucet funds; ETH↔WETH will work, WETH↔USDC depends on testnet liquidity).

### 2026-06-14 — Hardened `/account`: **password-encrypted vault** + real send

Reworked the EOA wallet from a plaintext-key v0 into a proper encrypted vault — the no-ops, "you and
me build it" real wallet (no bundler needed; an EOA only needs an RPC to transact).

- **`web/lib/account.ts`** rewritten: key is generated in-browser and stored **AES-256-GCM encrypted**,
  key derived from the user's password via **PBKDF2-SHA256 (310k iters)** — the MetaMask vault model.
  Plaintext key exists only in memory while unlocked; wiped on lock. Wrong password fails (GCM auth).
  `createVault` / `unlock` / `lock` / `getBalance` / `sendTestEth` (signs + broadcasts via viem).
- **`/account` page** reworked into create-password → unlock → (address + QR + live Sepolia balance +
  real send + lock) stages. WebCrypto + viem only — no third party, no infra.
- **Verified live on this machine:** set a password → real wallet created (`0x711b2E…2BE49`), key stored
  encrypted, QR rendered, real Sepolia balance read (0.00000 ETH, unfunded). Send wired (needs faucet
  funds; not broadcast during verification). `next build` green (25 routes).
- **Next:** real **swap** on this account (Uniswap on-chain) — fragile on testnet (liquidity), so it's
  the immediate follow-up. Then optionally connect the main dashboard to this real account.

### 2026-06-14 — Product pivot: **non-custodial, no-KYC** wallet

Decision: Lumen is a non-custodial, **no-KYC** wallet (the MetaMask/Rabby model). Reshaped the app to
stay clearly in that lane (full reasoning in new **`COMPLIANCE.md`**).

- **Buy → "Add funds" (non-custodial).** No more fake card/Apple-Pay processing. The page now shows the
  receive address and **links out** to external on-ramps that do their *own* KYC — Lumen is never in the
  payment flow. Sidebar label "Buy" → "Add funds"; dashboard quick action too.
- **Earn → informational only.** Removed the in-app "stake" action (which implied Lumen offers yield —
  securities-adjacent). Now shows reference APYs + "you stake on the protocol, keep custody" messaging.
- **Positioning:** app-wide banner now reads "non-custodial · you hold your keys · no KYC". Copilot's
  buy answer updated to the link-out, non-KYC phrasing.
- **`COMPLIANCE.md`** records the posture, the design rules that keep us no-KYC, and the pre-launch
  to-dos that aren't code (sanctions geo-block, ToS/Privacy, a lawyer consult). `DECISIONS.md` §1.1
  updated.
- Verified: core 45/45 green, `next build` green. (The earlier bundler package commit was still pending
  and is included in this commit.)

### 2026-06-14 — Self-hosted **bundler** package (unblocks smart-account sends)

The smart account can *read* with just an RPC but needs an ERC-4337 **bundler** to *send*. Shipped a
ready-to-run, self-hosted bundler setup — the one self-run service in the stack, no SaaS.

- **`bundler/`** — Pimlico **Alto** (open-source) for Base Sepolia: `alto-config.example.json`
  (EntryPoint v0.6, `chain-type: op-stack`, `safe-mode: false`, port 4337), `Dockerfile` (build from
  source w/ Foundry) + `docker-compose.yml`, `gen-key.mjs` (mint a relay key via viem), `.env.example`,
  and a step-by-step `README.md`.
- **`web/.env.local.example`** — `NEXT_PUBLIC_BUNDLER_URL=http://localhost:4337`; once set, `/smart-account`
  flips to **Bundler: Configured** and can relay real UserOperations.
- **`.gitignore`** updated so the real `bundler/alto-config.json` (holds a relay key) and `.env.local`
  are never committed; `*.example` files are.
- Config was written against Alto's current docs (verified the flags via the Pimlico self-host guide)
  but **not executed here** — it's infra the user runs (Docker + a funded testnet relay key). Flagged
  honestly in the README.
- Next on this track: a self-hosted **paymaster** (gasless), **social recovery** wiring, then **audit**.

### 2026-06-14 — Real **ERC-4337 smart account** (passkey-owned, no seed phrase)

Started the real "no seed phrase" account — the hardened successor to the v0 EOA.

- **`web/lib/smart-account.ts`** — a passkey-owned **Coinbase Smart Wallet** (audited, open-source
  contract already on Base; using it is a standard, not a SaaS) via **viem's account-abstraction**:
  `createWebAuthnCredential` (real P-256 passkey) → `toWebAuthnAccount` → `toCoinbaseSmartAccount`.
  **No private key stored** — only the passkey's public key + id; the passkey lives in the platform
  authenticator and is verified **on-chain**. Address is counterfactual (deploys on first tx). Reads
  (address/deployment/balance) need only the RPC; sending needs a bundler.
- **`/smart-account` page** — create with a passkey, show the on-chain address + deployment status +
  balance + bundler status, faucet/explorer links. Sidebar: Manage › Smart account (and the v0 EOA is
  now "Account").
- **`BUNDLER.md`** — how to **self-host** the one piece of infra this needs: an open-source ERC-4337
  bundler (alto/rundler/silius) behind `NEXT_PUBLIC_BUNDLER_URL`. No SaaS.
- **Verified:** module typechecks against the real viem AA API; `next build` green (25 routes); page
  renders. The passkey registration (Windows Hello) → real address, and gasless sending (needs the
  self-hosted bundler), are the user/infra steps — not auto-runnable from here.
- **Before mainnet:** the smart-account + paymaster + recovery path must be **audited**. All of this
  stays on **Base Sepolia** until then.

### 2026-06-14 — Self-built **key management v0** — a real wallet on Base Sepolia

First real, self-built, non-custodial account. No third party — WebAuthn + WebCrypto are browser-
native, viem signs and broadcasts directly to the node.

- **`web/lib/account.ts`** — generates a real key in the browser (viem `generatePrivateKey`), reads
  live Sepolia balance, and **signs + broadcasts a real testnet tx** (`sendTestEth`).
- **`web/lib/passkey.ts`** — real **WebAuthn** register/verify (platform passkey, e.g. Windows Hello)
  as the unlock gate.
- **`/account` page** — create wallet, add passkey protection, address + QR, live Sepolia balance,
  faucet link, and a real "Sign & send" form. Added to sidebar (Manage › Account); `/welcome`'s
  smart-account option now points here.
- **Verified live on this machine:** created a real account (`0x3e1d…e0F8`), QR rendered, and the
  Sepolia balance read returned 0.00000 ETH (correct — unfunded). No tx was sent (left to the user).
- **Security posture (explicit):** v0 stores the key locally in the browser — **testnet only, NOT
  hardened for real funds.** Next milestone hardens it: passkey-PRF-encrypted storage, then an
  **ERC-4337 smart account** whose signer is the passkey verified on-chain (the real "no seed phrase"
  account), with gasless paymaster + social recovery. Audit before any mainnet.
- No new deps (viem already present). `next build` green (24 routes).

### 2026-06-14 — First **real, self-built** on-chain layer (viem, no SaaS)

Direction set: **self-build everything except the legally-forced pieces** (fiat on-ramp, KYC/AML).
No third-party SaaS (no Privy/Alchemy/etc.) — we run our own infra + audited open-source libraries.
Safety rule recorded: self-built ≠ home-rolled crypto — integrate audited OSS primitives, build on
testnet, audit before mainnet.

- **New `web/lib/chain.ts`** (viem) — public clients for **Base mainnet + Base Sepolia**, real native
  + ERC-20 balance reads (multicall), and **ETH/USD straight from an on-chain Chainlink feed** (an RPC
  read, not a price API). RPC endpoint is a single env var (`NEXT_PUBLIC_BASE_RPC`) → swap the public
  node for your own anytime. Read-only (signing waits for real key management).
- **New `/live` page** — paste any address, pick the network, see real balances + USD values + a
  Basescan link. Added to the sidebar (Explore › Live chain).
- **Verified live on this machine:** read vitalik.eth on Base mainnet — 3.124 ETH + real USDC/DAI,
  ≈ $5.4k total, ETH price from Chainlink, at a live block height. (Sandbox can't reach external RPCs,
  so the live check was done in-browser.)
- viem added to `web` deps; `next build` green (23 routes).
- **Note on "no third party":** a blockchain *node* is unavoidable. Public RPC now = dev convenience,
  not a product integration; the fully self-hosted version is running your own node (later ops work).

### 2026-06-14 — Web app reaches **feature parity** with the demo (8 screens ported)

The first Next.js cut had only 6 screens; ported the remaining 8 so the web app matches the demo.

- **New core modules** (pure, tested): `buy.ts` (`computeBuyQuote`), `swap.ts` (`computeSwap`),
  `portfolio.stakeTotals`, `copilot.ts` (the local intent engine — `copilotReply`/`parseSend`,
  returning **declarative route actions** instead of DOM callbacks), and mock `genSeed`/`genAddress`
  + `DEMO_ALERTS`/`DEMO_GUARDIANS` fixtures. Core test count **37 → 45, all green**.
- **WalletProvider** extended: alerts / guardians / contacts state + `addAlert`/`toggleAlert`/
  `removeAlert`/`addGuardian`/`removeGuardian`/`addContact`, and `buy`/`swap`/`stake` actions that
  mutate balances + history. `send` prefill now flows via `/send?token=&amount=&to=` query params.
- **New screens:** `/buy`, `/swap`, `/earn`, `/alerts`, `/contacts`, `/security`, `/copilot`,
  plus the entry flows `/welcome` (smart-account / recovery-phrase / import) and `/unlock` (Face-ID
  style). Sidebar reorganised into Wallet / Trade / Explore / Manage groups; topbar gains Copilot +
  Lock buttons.
- **Verified:** `tsc` clean, `next build` green (**22 routes**), every route 200. Confirmed live on
  this machine — the Copilot correctly flags `claim-airdrop.lumen` as a drainer and reports the
  portfolio value/P&L, all from `@lumen/core`.

### 2026-06-14 — PWA layer, CI, and **git** (project now under version control)

Hardened the web app and put everything under source control.

- **PWA (roadmap Phase 2.2 — "web-launch-critical"):** added `web/app/manifest.ts`
  (`/manifest.webmanifest`), generated app icons (`icon-192/512`, maskable-512, `apple-icon`,
  scalable `icon.svg`), a production **service worker** (`web/public/sw.js`: offline shell +
  cache-first assets, network-first navigations → cached `/offline`), an `/offline` page, and
  PWA metadata (theme-color `#06060c`, apple-web-app, viewport). SW registers in production only.
  Verified: `next build` green (13 routes incl. manifest/icons/offline); every PWA endpoint serves
  200 with the right content-type.
- **CI:** `.github/workflows/ci.yml` — on push/PR runs `npm ci`, core unit tests, web typecheck,
  and web build (Node 22).
- **Git initialised** (was not a repo). Initial commit `fe9b8b1` — **69 files**, `node_modules`/
  `.next` excluded. *(Note: git can't run against the sandbox mount — lock files fail there — so it
  was run on this machine via `_gitinit.bat`, using the Windows Git install.)* No remote/push.
- Minor known cruft to tidy later: `core/package-lock.json` (redundant now that the root lock is
  authoritative under workspaces) and the one-off `_gitinit.bat` got committed.

### 2026-06-14 — Built the real **Next.js web app** (`web/`), wired to `@lumen/core`

Turned the monorepo into a running product. Added a **Next.js 15 + TypeScript** app (App Router,
React 19) as the `web/` workspace, consuming `@lumen/core` via `transpilePackages`.

- **Monorepo:** root `package.json` now declares npm **workspaces** `["core", "web"]`. Added root
  `.gitignore`. `core/package.json` now exposes its TS **source** via `exports` (Next transpiles it),
  and gained a `DEMO_HISTORY` fixture + `HistoryEntry` type.
- **Screens (all real React routes, wired to core):**
  - `/` Dashboard — `totalUsd` + `computePnl` + sparklines (`buildSeries`/`sparklinePath`)
  - `/send` — **Scam Shield**: live `resolveRecipient` + `assessRisk`; the known-drainer handle
    (`claim-airdrop.lumen`) shows the red **Danger** verdict and the Send button is **Blocked**
  - `/receive` — address + live QR (`qrcode`)
  - `/activity` — history (`relTime`)
  - `/insights` — allocation bars + per-token cost-basis/P&L table
  - `/markets` — live TradingView embed + token switcher
- **Design:** ported the dark theme (tokens, aurora bg, glass, components) from `styles.css`/`web.css`
  into `web/app/globals.css`. State lives in `components/WalletProvider.tsx` (the one place to later
  swap mock data for real providers).
- **Verified in the sandbox:** `tsc --noEmit` clean, `next build` green (7 routes), all routes
  return 200 with correct content. **Then verified on this machine:** `npm install` at the root
  (58 pkgs), `npm run dev -w web` → confirmed the dashboard and the Scam Shield Danger flow render
  correctly in the browser at `http://localhost:3000`.
- **Run it:** double-click **`Start Web App.bat`** (root) — starts the dev server + opens the browser.
  Details in `web/README.md`.
- Throwaway helpers from this step (safe to delete): `_webinstall.bat`, `_webinstall.log`.

### 2026-06-14 — Milestone A kickoff: Phase 1 decisions + extracted the `core` package

Started the `GOING-LIVE.md` roadmap for real. Locked the gating **Phase 1 decisions** (recorded in
new `DECISIONS.md`): **non-custodial**, launch on **Base** (single EVM L2, multi-chain deferred),
and **extract the `core` logic first**.

- **New `core/` package** (`D:\crypto-wallet\core`) — framework-agnostic TypeScript, **zero DOM /
  zero network**. This is the "architect now so the app is cheap later" shared layer; web imports it
  today, mobile imports the same package later. Ported, behaviour-preserving, from `app.js`:
  - `format.ts` — `fmtUsd/fmtUsd0/fmtSigned/fmtAmt/shortAddr/relTime/initials/colorFor/escapeHtml/daysAgo`
  - `portfolio.ts` — `totalUsd/liquidUsd/computePnl`
  - `sparkline.ts` — `buildSeries` + `sparklinePath` (pure geometry; SVG-string rendering stays in UI)
  - `scam-shield.ts` — `resolveRecipient/assessRisk/isFlagged` (the differentiator)
  - `demo-data.ts` — the mock tokens/registry/contacts/blocklist as fixtures
  - **Key change from the demo:** no module-level globals — functions take their data
    (`Token[]` / `Directory`) as arguments, so real balances + real threat-intel drop in later.
- **Tested:** 37 unit tests (node:test + tsx), formatters / P&L invariants / sparkline geometry /
  Scam Shield incl. the known-drainer block path. **All green; both typechecks clean.**
- **Verification quirk:** the bash sandbox mount lagged behind file writes and showed half-synced
  (truncated) files; tests were run against sandbox-native copies of the exact intended content to
  get a true result. The real files on disk are intact (confirmed via the editor's file reader).
- **Node.js now installed (✓).** Installed **Node v24.16.0 / npm 11.13.0** via `winget` (interactive,
  on-screen). Ran `npm install` + `npm test` in `core/` **on this machine** — 6 dev packages added,
  **all 37 tests pass locally.** The "no Node/Python on this machine" note in `CLAUDE.md`/older logs
  is now out of date for Node. (`core/node_modules` now exists on disk; it's gitignore-able.)
  Throwaway helpers from this step: `_setup.bat`, `_setup.log` — safe to delete.
- **Also added** `Open Web Wallet.bat` — one-click launcher that starts `_serve.ps1` and opens
  `http://localhost:8123/web.html` (fixes the "Open the web build over a server" message you hit
  when double-clicking `web.html` on `file://`).

**Next:** install Node 20+; then either (a) scaffold the Next.js + monorepo shell and wire it to
`@lumen/core`, or (b) keep porting (the `ui` design tokens from `styles.css`). Consolidate the two
mirrored project folders first (see `DECISIONS.md` → open items).

### 2026-06-14 — Added a desktop **web version** (`web.html` + `web.css`)

The app was phone-styled (narrow 460px frame + bottom tab bar). Added a true desktop web layout **without touching `app.js` or the mobile app**:

- **`web.html`** — a thin shell that pulls `index.html`'s exact DOM at runtime (synchronous `XMLHttpRequest`), wraps it in a desktop shell (persistent left **sidebar** listing every destination + a content column), then loads `app.js`. Because it reuses the live DOM, it can't drift as `index.html` / `app.js` evolve. The sidebar buttons reuse the same `data-nav` hooks, so `app.js` wires them up automatically.
- **`web.css`** — desktop theme behind a `@media (min-width: 900px)` breakpoint: sidebar nav, top bar, wide hero balance card with full-width sparkline, **2-column asset grid**, centered forms, centered modals, taller chart. Below 900px it does nothing, so `web.html` still behaves as the mobile app (responsive).
- **Must be served over http.** `web.html` fetches `index.html`, which browsers block on `file://`. Run `_serve.ps1` and open `http://localhost:8123/web.html`. Deep links work too (e.g. `web.html?screen=dashboard`).
- Verified on desktop @1920px: dashboard, send, insights all render correctly. Screenshots: `screenshots/web-01-dashboard.jpg`, `web-02-send.jpg`, `web-03-insights.jpg`.

### 2026-06-14 — UI QA: walked the "Create a new wallet" flow & captured screenshots

**Goal:** open the wallet in Chrome and capture the create-wallet flow (recovery-phrase screen → dashboard).

**What was produced** — saved in `./screenshots/`:

| File | Screen |
|---|---|
| `01-landing.jpg` | Onboarding landing (Create / Import) |
| `02-recovery-phrase.jpg` | 12-word recovery phrase + "I've saved it" checkbox + "Open wallet" |
| `03-dashboard.jpg` | Dashboard after opening the wallet — total balance + token list |

*Note:* at the time these were captured the landing showed the simpler two-button layout ("Create a new wallet" / "Import existing wallet"). `index.html` has since moved to the three-button layout (Create smart account / Create with recovery phrase / Import). Re-capture if up-to-date marketing/QA shots are needed.

**How it was driven (and why):** see Environment notes below — the page had to be served over `http://localhost` and driven via the Chrome extension, because direct `file://` browser automation and view-only screen control both hit walls.

---

## Environment & tooling notes (important — saves time next session)

This machine is **Windows**. Key constraints discovered while automating the demo:

- **No Node.js and no Python are installed** on this machine. `python` only resolves to the Windows Store stub; `node` is not on PATH. So "just run a quick local server" with those is **not** available out of the box.
- **A PowerShell static server works with zero installs.** `_serve.ps1` (added this session) uses `System.Net.HttpListener` to serve this folder at **`http://localhost:8123`**. Launch it with:
  `powershell -WindowStyle Minimized -ExecutionPolicy Bypass -File D:\crypto-wallet\_serve.ps1`
  It writes `_serve.log` ("listening on 8123") once up. Close its (minimized) PowerShell window to stop it.
- **The Chrome automation extension cannot open `file://` URLs** (it lacks "Allow access to file URLs"). To automate the page, serve it over `http://localhost` instead — or enable file-URL access for the extension at `chrome://extensions`.
- **Screen-control automation treats browsers as view-only** (can screenshot, can't click/type). Browser interaction must go through the Chrome extension, not generic desktop control.
- **For manual viewing, none of the above matters:** just double-click `index.html` — the demo runs fine on `file://` (per `README.md`).

---

## Helper / temp files

- **Keep:** `_serve.ps1` — the local PowerShell dev server (`http://localhost:8123`). This is the blessed way to preview the app on this machine (no Node/Python).
- **Safe to delete** (leftover logs/helpers, harmless): `_copy_shots.bat`, `_serve.log`, `screenshots/_copy.log`. The assistant couldn't remove these automatically (delete permission was denied in-session), so delete them by hand if you want a spotless folder.
- Already removed: `_serve.js` and `_node.txt` (earlier Node-detection scaffolding).

---

## Open items / next steps

The authoritative roadmap is **`GOING-LIVE.md`**. Near-term, concrete follow-ups noted from this session:

- [ ] Decide whether `_serve.ps1` stays as the blessed local-preview server, or document a different dev-server choice (the roadmap's Phase 2 calls for migrating off static HTML to a real web-app toolchain, which would bring its own dev server).
- [ ] Re-capture onboarding screenshots against the current three-button landing if shots are used anywhere user-facing.
- [ ] Tidy the helper/temp files listed above once they're no longer needed.
- [ ] (From `GOING-LIVE.md`) Begin Phase 1 decisions — custody model, chains, key-management/smart-account approach — these gate everything else.
