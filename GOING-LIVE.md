# Lumen Wallet — Going-Live Roadmap (Web-First)

**Strategy: ship the WEBSITE first (most cost-effective), validate traction, then build the native mobile app (iOS + Android) as a clearly separated later phase.**

> **What this document is.** A phased, checkbox to-do list for taking the Lumen demo currently in `D:\crypto-wallet` (one `index.html`, `app.js`, `styles.css`, all mock in-memory data) into a real product — **web first, app later.** It references the *actual* features that exist today and, for each, says what it is now (mock) and what's needed to make it real, including the *category* of third-party service/SDK that usually powers it.
>
> **Vendor mentions are examples, not endorsements.** Names like "Privy / Turnkey," "Stripe / MoonPay," "0x / 1inch," "Blockaid / Blowfish" show the *category* of service. Evaluate, price, and security-review your own picks.
>
> **This is not legal or financial advice.** The crypto/money-movement sections are informational. **Consult a qualified lawyer** before handling other people's money or funds.

---

## Why web-first (the cost rationale)

Launching the website first is the cheapest, fastest way to get a real product in front of users and validate demand before committing to a second platform.

- **One codebase, not two.** A native iOS + Android app is effectively a second (and third) product to build, test, and maintain. Web-first defers that entire cost until you have traction.
- **No store fees or gatekeepers yet.** Native means an **Apple Developer account ($99/yr)** + **Google Play ($25 one-time)**, plus ongoing signing/build infrastructure. Web has none of that.
- **No app-store crypto-review friction during validation.** Apple and Google both have strict, slow, rejection-prone crypto-wallet review processes. Web lets you launch and iterate *today* without that gate.
- **Faster iteration.** Web ships in minutes (deploy) vs. days (store review). During the validation phase — when you're changing things constantly — that loop speed is worth a lot.
- **A PWA captures most of the "app feel"** (installable, home-screen icon, offline, push on Android) without any native code. See Phase 2.

### Honest caveat (don't pretend web is the end state)
Crypto users skew heavily mobile, and a segment of them **trusts a native app more than a website** for holding funds ("is this site a phishing clone?"). So treat the website as **launch + validation**, not the finish line. The native app in Phase 7 is how you win that trust segment and the mobile-native majority — you're just sequencing it *after* you've proven people want the product.

---

## 🧱 Architect now so the app is cheap later (do this from day one)

The single biggest lever for making the future mobile app cheap is **keeping a shared CORE layer decoupled from the UI.** If wallet logic lives in framework-agnostic TypeScript, the native app reuses it instead of a rewrite.

- [ ] **Create a `core` package** (pure TypeScript, **zero DOM / zero React**) that the web app imports today and the mobile app will import later.
- [ ] **Put all non-UI logic in `core`:** wallet/account operations, **Scam-Shield risk checks**, **P&L / cost-basis math**, **recipient resolution** (address / `name.lumen` / contact), fee/quote math, and all **formatters**.
- [ ] **Good news — much of the current `app.js` is already portable, near-pure logic** that ports almost directly: `resolveRecipient`, `assessRisk`, `computePnl`, `buildSeries`/sparkline math, `fmtUsd`/`fmtAmt`/`fmtSigned`. Extract these first; they need only light cleanup and unit tests.
- [ ] **Abstract platform services behind interfaces** so `core` never touches them directly: storage (localStorage ↔ Keychain/Keystore), biometrics (WebAuthn ↔ native), notifications, clipboard, QR. Web provides one implementation now; mobile drops in another later.
- [ ] **Keep UI thin.** Components call into `core`; business rules never live inside a React component. The thinner the UI layer, the smaller the eventual mobile build.
- [ ] **Use a monorepo from the start** (e.g. pnpm + Turborepo): `core`, `ui`, `web`, `api`, and a placeholder `mobile` you'll fill in Phase 7.

> Done right, the mobile app in Phase 7 is "new screens over existing logic," not "rewrite the wallet." Skip this and you'll pay for the wallet twice.

---

## What exists today (the demo, honestly)

Everything below is **mock, in-memory, resets on reload**, runs on `file://` with no build step. Per the README, no real keys exist and nothing touches a blockchain.

| Area | In the demo today |
|---|---|
| Onboarding | "Create smart account" (passkey animation, no real passkey), 12-word recovery phrase (randomly generated, controls nothing), import (accepts any text) |
| Unlock | Face ID / fingerprint *animation*; social-recovery fallback button |
| Dashboard | Total balance, 24h change, Total/24h **P&L** strip, Send/Receive/Buy/Swap, sorted token list with sparklines (5 hard-coded tokens: BTC/ETH/SOL/USDC/MATIC) |
| Scam Shield | Pre-send transaction-simulation panel ("you send / they receive", fee, Safe/Caution/Danger) driven by a hard-coded blocklist + simple rules |
| Send | By `0x` address, `name.lumen` username (mock registry), or saved contact; client-side resolution |
| Receive | Username + address + QR (QR via CDN lib) |
| Buy | Fiat on-ramp UI with presets, Card/Apple Pay toggle, live "you receive" quote — **no real payments** |
| Swap | Token-to-token with mock rate, slippage chips, price impact, min-received — **no real DEX** |
| AI Copilot | Chat assistant with a **local intent engine, no API key** — answers portfolio/P&L/safety questions, pre-fills sends |
| Insights | Allocation donut, Total & 24h P&L, per-token cost basis, CSV "tax export" (computed from mock data) |
| Price alerts | "Notify when BTC above $X" rules with live distance + toggles — **no real notifications** |
| Earn | Stakeable assets, mock APYs, stake/confirm flow that mutates in-memory balances |
| Security | Social recovery — add trusted guardians (stored in memory) |
| Markets | TradingView embed (real chart via CDN) + token switcher |
| Activity | Transaction history (seeded + appended on mock actions) |
| Nav | 5-tab bottom bar (Home · Markets · Copilot · Insights · More) + More sheet; `?screen=` deep links |

---

## ⚠️ Long-lead items — start these on day one regardless of phase

These dominate timeline/budget and gate launch. Begin early even though some only fully apply later.

- [ ] **Security audit** of app + any smart contracts (recovery, account-abstraction, paymaster). **Weeks–months, $20k–$150k+.** Required before holding real funds — web launch included.
- [ ] **Legal / licensing posture** — driven by one decision: *do you ever take custody of funds or fiat?* This is a **lawyer question** and affects the web launch too (see Phase 6). Non-custodial is far lighter.
- [ ] **App-store crypto policy review** — only blocks the *app phase*, but read the policies before building the app so you don't architect into a rejection.

---

# MILESTONE A — Ship the Website 🌐
### Phases 1–6. The first launchable product. Everything here is **web-launch-critical** unless marked.

---

## Phase 1 — Foundations & decisions

> Decide these *before* writing production code. They cascade into every later phase.

### 1.1 Custody model (the decision that drives everything) — **web-launch-critical**
- [ ] **Choose non-custodial vs custodial.** Non-custodial (users hold keys; you never touch funds) = far lighter licensing, lower risk → **strongly recommended to start.** Custodial = money-transmitter/MSB-class obligations.
- [ ] Decide whether *fiat* ever flows through your accounts (even briefly). If yes, that alone can trigger money-transmission rules — prefer routing fiat entirely through a licensed on-ramp partner.
- [ ] Document the custody decision in writing — it anchors the Compliance phase.

### 1.2 Chains & networks — **web-launch-critical**
- [ ] **Pick ONE launch chain** — an EVM L2 (Base / Arbitrum / Polygon / Optimism) for low fees + mature tooling. Add chains later.
- [ ] Defer multi-chain (and non-EVM like Solana/Bitcoin) — each multiplies key-management, RPC, and indexing work. The demo lists SOL/BTC; be deliberate about cutting them from v1.
- [ ] Choose the chain's testnet (e.g. Base Sepolia) for QA and beta.

### 1.3 Key management & smart-account approach — **web-launch-critical**
- [ ] **Decide how "no seed phrase" becomes real.** Recommended: **account abstraction (ERC-4337) + passkeys (WebAuthn)** — matches the demo's pitch and works great on web. Alternatives: MPC/TSS embedded wallets; classic EOA+seed (contradicts the headline feature).
- [ ] **Pick a smart-account / embedded-wallet provider** (category: account-abstraction / smart-wallet infra) — e.g. Privy, Turnkey, Web3Auth, Dynamic, Magic, Coinbase Smart Wallet, ZeroDev/Safe/Alchemy AA. This delivers the passkey UX without rolling your own key management.
- [ ] Define the **WebAuthn passkey** flow for web now; the same provider should later expose native passkeys/biometrics for mobile (Phase 7) — confirm that before choosing.
- [ ] Define **social recovery** for real (guardian threshold, on-chain vs provider-managed, recovery delay/timelock).
- [ ] Decide **gas sponsorship / paymaster** strategy for the "gasless onboarding" the demo advertises.
- [ ] Write a **key-loss / device-loss / recovery-abuse** threat model (feeds Phase 5).

### 1.4 Tech stack & repo — **web-launch-critical (and the app-later foundation)**
- [ ] **Web framework:** React + TypeScript, **Next.js recommended** (SSR/SEO for marketing pages, client-rendered app behind auth).
- [ ] **Mobile-ready choice:** plan for **React Native + Expo** later so it shares the `core` package — but **do not build it now.**
- [ ] **Monorepo** with `core` / `ui` / `web` / `api` (+ placeholder `mobile`). See the "architect now" callout — this is where it pays off.
- [ ] **Data layer:** TanStack Query + a light store (Zustand/Redux).
- [ ] **Design system:** port the dark theme + components from `styles.css` into reusable tokens/components.
- [ ] Linting, formatting, type-checking, commit hooks from day one.

---

## Phase 2 — Turn the front-end into a real web app (incl. PWA for "app feel")

> The demo is one HTML file + one IIFE in `app.js`. Migrate deliberately; the PWA work here is what lets the website feel like an app *without* native code.

### 2.1 Migrate from static HTML/JS to a maintainable web app — **web-launch-critical**
- [ ] Stand up the Next.js + TypeScript web app.
- [ ] **Port logic into `core`, not just markup** — `resolveRecipient`, `assessRisk`, `computePnl`, sparkline builder, formatters become pure, unit-tested functions (see "architect now").
- [ ] Recreate each screen as a component/route: Onboarding, Unlock, Dashboard, Send, Receive, Buy, Swap, Contacts, Insights, Security/Recovery, Markets/Chart, Activity. (Copilot + Earn deferred — see Phase 4.)
- [ ] Replace the manual `navigate()` + `.view.active` system with a real router; preserve `?screen=` as real shareable routes.
- [ ] Replace in-memory globals (`TOKENS`, `HISTORY`, `CONTACTS`, `ALERTS`, `GUARDIANS`) with real data sources behind the data layer.
- [ ] Replace mock generators (`genAddress`, `genSeed`) with real provider SDK calls.

### 2.2 Launch as a PWA — installable, home-screen, offline, Android push — **web-launch-critical**
> This is how the website captures most of the native "app feel" before any Phase 7 work.
- [ ] **Web App Manifest** — name, icons (all sizes), theme color (demo already sets `#06060b`), `display: standalone`, start URL → installable with a real home-screen icon, no browser chrome.
- [ ] **Service worker** — offline shell + caching. The demo already degrades gracefully offline (QR + chart fallbacks); build on that.
- [ ] **"Add to Home Screen"** prompt/education on Android + desktop Chrome.
- [ ] **Push notifications on Android / desktop** via the Web Push API (powers price alerts without a native app on those platforms).
- [ ] **Offline-aware UX** — cached balances/last-known state, clear offline indicators.
- [ ] **Know the iOS PWA limits and design around them:** on iOS, installed PWAs are more constrained — **Web Push works only for PWAs added to the Home Screen on recent iOS and is less reliable**, background behavior is limited, storage can be evicted, and there's no App Store presence. Treat iOS push/offline as best-effort; **full iOS push + trust = the native app in Phase 7.** Don't promise iOS users native-grade behavior from the PWA.

### 2.3 Keep mobile reuse in mind (no mobile build yet) — **architecture, not a deliverable**
- [ ] Ensure `core` stays DOM-free so React Native can import it later.
- [ ] Keep platform services (storage/biometrics/push/QR) behind interfaces.

---

## Phase 3 — Backend & infrastructure

> Even non-custodial needs backend: indexing, prices, alerts, username registry, analytics, AI proxy. **The backend must never hold private keys.**

### 3.1 APIs & services — **web-launch-critical** (subset)
- [ ] Stand up an API (Node/TS — Fastify/NestJS or serverless) for: username/contact registry, price-alert rules, push registration + fan-out, on-ramp/swap session brokering, tax-export generation. *(AI Copilot proxy = later.)*
- [ ] Define a clean API contract (OpenAPI/tRPC) shared with web (and later mobile) via the monorepo.

### 3.2 Database — **web-launch-critical**
- [ ] Postgres recommended. Store: users (**no keys!**), usernames, contacts, alert rules, push tokens, audit logs, support tickets.
- [ ] **Never store private keys or seed phrases.** Encrypt any sensitive data at rest; minimize PII.

### 3.3 Auth — **web-launch-critical**
- [ ] App-level auth: passkey/WebAuthn sessions or wallet-signature sign-in, tied to the smart-account identity. Session management, refresh, device binding, rate limiting.

### 3.4 RPC / nodes / indexing / market data — **web-launch-critical**
- [ ] **RPC node provider** per chain (Alchemy / Infura / QuickNode / Ankr) — don't run your own nodes initially.
- [ ] **Indexer / portfolio data** (Alchemy/Covalent/Moralis/The Graph, or Zerion/0x) — powers Dashboard balances, token list, Activity.
- [ ] **Market data** (CoinGecko / CoinMarketCap / Chainlink feeds) — spot prices, 24h change, sparkline + P&L data.

### 3.5 Hosting, secrets, config, CI/CD — **web-launch-critical**
- [ ] Host web app (Vercel/Netlify/Cloudflare) + API (managed platform/cloud).
- [ ] **Secrets management** — vault/KMS; never commit keys; separate keys per environment.
- [ ] **Env config** — clean `dev`/`staging`/`prod` separation; testnet in non-prod.
- [ ] **CI/CD** — lint/typecheck/test on PR, preview deploys, staged prod rollout.
- [ ] **Error tracking + observability** early (Sentry + logs/metrics).

---

## Phase 4 — Make each feature real (mock → real)

> Each item is tagged **[WEB MVP]** (do for website launch), **[WEB v1.x]** (web, post-launch iteration), or **[APP PHASE]** (defer to mobile or later).

### 4.1 Onboarding / smart account / passkey / recovery — **[WEB MVP]**
- **Today:** passkey *animation*; seed randomly generated, controls nothing; import accepts any text.
- [ ] Real account creation via the smart-account/embedded-wallet provider.
- [ ] Real **WebAuthn passkey** registration + unlock (web).
- [ ] Real **social recovery** wired to a recovery contract/provider with guardian thresholds + timelock.
- [ ] Real import (if kept) using audited crypto libs; never log/transmit secrets.
- **Category:** account-abstraction / smart-wallet infra; WebAuthn.

### 4.2 Unlock (biometric) — **[WEB MVP]** (web), deeper native unlock **[APP PHASE]**
- **Today:** Face ID animation only.
- [ ] Bind unlock to the real passkey/biometric gating key access; lock state must really restrict signing.
- **Category:** WebAuthn (web) / platform biometrics (later, native).

### 4.3 Dashboard (balances, P&L, token list, sparklines) — **[WEB MVP]**
- **Today:** 5 hard-coded tokens, mock prices/balances; P&L from `cost` constants.
- [ ] Real balances from indexer; real prices/metadata from market-data API.
- [ ] Real P&L needs **real cost basis** — derive from on-chain history + buy/swap records (non-trivial).
- [ ] Sparkline/history from historical price API.
- **Category:** indexer + market data.

### 4.4 Scam Shield (transaction simulation + risk) — **[WEB MVP]**
- **Today:** hard-coded `BLOCKLIST`/`REGISTRY`, simple `assessRisk` rules.
- [ ] Real **transaction simulation** (actual balance changes, approvals) + **address/contract threat intel**.
- [ ] Real drainer / malicious-approval detection; surface real verdicts. **Differentiator — invest here.**
- **Category:** transaction-simulation / wallet-security API (Blockaid, Blowfish, Tenderly simulation, GoPlus). *(Lives in `core` — reused by the app for free.)*

### 4.5 Send (by address / username / contact) — **[WEB MVP]**
- **Today:** client-side resolution; mutates in-memory balance; mock `name.lumen` registry.
- [ ] Real tx build + sign (provider) + broadcast (RPC); real fee estimation (gas oracle).
- [ ] Decide what `*.lumen` is: your own registry service, or adopt ENS/existing name service. If kept, build a real backend registry (uniqueness, ownership, resolution).
- [ ] Real contacts persisted per user; per-chain address validation.
- **Category:** RPC/broadcast + name service + gas oracle.

### 4.6 Receive — **[WEB MVP]**
- **Today:** username + address + QR (real QR lib).
- [ ] Use the user's real address; keep QR. Multi-chain address handling later.
- **Category:** mostly client-side; needs real addresses.

### 4.7 Buy (fiat on-ramp) — **[WEB MVP]**
- **Today:** quote UI, Card/Apple Pay toggle, no real payment.
- [ ] Embed a **licensed fiat on-ramp** that handles KYC + payments + payout to the user's wallet — so **they** are the regulated entity. Handle order status, webhooks, errors/refunds.
- **Category:** fiat on-ramp (MoonPay, Stripe Crypto, Transak, Ramp, Coinbase Onramp).

### 4.8 Swap — **[WEB MVP]** (or fast-follow **[WEB v1.x]**)
- **Today:** mock rate, slippage chips, price impact, min-received.
- [ ] Integrate a **DEX aggregator** for real quotes/routing/slippage + the swap tx (non-custodial, on-chain). Handle token approvals safely (Scam Shield inspects them).
- **Category:** DEX/swap aggregator (0x, 1inch, LI.FI).

### 4.9 AI Copilot — **[WEB v1.x — deferred from MVP]**
- **Today:** local intent engine, no API key.
- [ ] Back with a real **LLM API** (e.g. Claude API / Anthropic SDK; current Claude model). Key stays **server-side** behind the AI proxy.
- [ ] Read-only tool access to portfolio/market data; any action keeps the existing **Scam Shield confirmation** — model proposes, user signs. Never autonomous fund movement.
- [ ] Guardrails: prompt-injection defense, rate limits, cost controls, abuse logging.
- **Category:** LLM API (server-proxied). *Keep the working local engine as the MVP fallback.*

### 4.10 Insights / P&L / tax export — **[WEB MVP]** for P&L; tax export **[WEB v1.x]**
- **Today:** donut + P&L + cost basis + CSV from mock data.
- [ ] Real cost-basis tracking from real history; correct lot/fee accounting.
- [ ] Real tax export — consider a crypto-tax integration (CoinTracker/Koinly-style) over DIY. Informational, not tax advice.
- **Category:** indexer/history + (optional) crypto-tax provider.

### 4.11 Price alerts — **[WEB MVP]** (Android/desktop push), full iOS push **[APP PHASE]**
- **Today:** rules in memory, no notifications.
- [ ] Persist rules in backend; server-side **price-watch worker** evaluates + triggers.
- [ ] Delivery via **Web Push** (Android/desktop) now; reliable iOS push comes with the native app.
- **Category:** market data + push/notification infra (Web Push / FCM / OneSignal; APNs later).

### 4.12 Earn / staking — **[WEB v1.x — deferred from MVP]**
- **Today:** mock APYs, in-memory stake.
- [ ] Integrate real **staking providers/protocols**; real APYs, stake/unstake tx, reward accrual, unbonding.
- [ ] Heightened disclosure (contract risk, slashing, lockups). **May have its own regulatory implications — check with the lawyer.**
- **Category:** staking providers / DeFi protocols (Lido/Rocket Pool-style, validator/exchange staking).

### 4.13 Security / social recovery screen — **[WEB MVP]**
- **Today:** add guardians (in memory).
- [ ] Wire to the real recovery mechanism (1.3/4.1): guardian invites/acceptance, threshold config, recovery initiation + timelock + cancel.
- **Category:** smart-wallet infra / recovery.

### 4.14 Markets / chart — **[WEB MVP]** (already real)
- **Today:** real TradingView embed + token switcher.
- [ ] Keep it, but verify TradingView **licensing/ToS for commercial production use**; keep offline fallback; CSP allow-list.
- **Category:** charting (TradingView) + market data.

### 4.15 Activity / history — **[WEB MVP]**
- **Today:** seeded list + appends on mock actions.
- [ ] Real on-chain history from indexer; pending/confirmed/failed states; explorer links.
- **Category:** indexer.

---

## Phase 5 — Security & trust (for the web launch)

> A wallet is a security product first. Budget real money/time here **before** the website holds real funds.

- [ ] **Threat model** the system: custody, recovery abuse, phishing, malicious dapps/approvals, supply-chain (deps/CDN), API abuse, device compromise. *(Web-launch-critical.)*
- [ ] **Remove CDN runtime dependencies** for security-sensitive paths — the demo loads QR + TradingView from CDNs; vendor/pin/SRI-hash anything shipped in the wallet, and lock CSP. *(Web-launch-critical.)*
- [ ] **Secure key handling** — keys never leave secure enclave/provider boundary; never logged, never in analytics, never sent to your backend. *(Web-launch-critical.)*
- [ ] **Secure web storage** — minimize sensitive data in the browser; rely on the provider's secure boundary. *(Web-launch-critical.)*
- [ ] **Professional security audit** — app + any smart contracts (recovery/AA/paymaster). **Schedule early; required before real funds.** *(Web-launch-critical.)*
- [ ] **Penetration test** — web app + APIs. *(Web-launch-critical.)*
- [ ] **Dependency / supply-chain security** — lockfiles, vuln scanning, minimal deps, SRI for any remaining CDN assets. *(Web-launch-critical.)*
- [ ] **Anti-phishing** — official-domain education, in-app warnings, watch for clone sites. *(Web-launch-critical — clones are the #1 web-wallet threat.)*
- [ ] **Incident response plan** — vuln/drain/key-compromise handling. *(Web-launch-critical.)*
- [ ] **Bug bounty program** — once stable (can start during web phase, expand later).

---

## Phase 6 — Compliance & legal (for the web launch)

> **Crypto + money movement = regulated.** Informational only. **Engage a crypto/fintech lawyer early** — the right structure saves licensing you don't need. This applies to the *website* launch, not just the app.

- [ ] **Determine licensing posture with counsel.** Pivot: *do you ever take custody of crypto or fiat?* Non-custodial + fiat via licensed on-ramp partners = lightest path. Custodial → likely **money-transmitter / MSB** (US: FinCEN MSB + state MTLs; EU: MiCA/CASP; UK: FCA) — slow + expensive. *(Web-launch-critical.)*
- [ ] **KYC/AML** — if required, prefer that your licensed on-ramp/exchange partner runs it. If you ever custody, you likely need your own AML program (KYC vendor, OFAC/sanctions screening, monitoring, SAR). *(Web-launch-critical.)*
- [ ] **Sanctions / geo-restrictions** — geofence prohibited jurisdictions; sanctions screening where applicable. *(Web-launch-critical.)*
- [ ] **Privacy Policy & Terms of Service** — required by law (and later by both stores); drafted/reviewed by counsel. *(Web-launch-critical.)*
- [ ] **GDPR / CCPA** — lawful basis, data-subject rights, deletion, minimization (hold minimal PII), vendor DPAs, analytics consent. *(Web-launch-critical.)*
- [ ] **Earn/staking & "yield"** — possible securities/financial-promotion implications; legal sign-off; careful APY marketing. *(Applies when you ship Earn — Phase 4.12.)*
- [ ] **Disclaimers** — "not financial/tax advice," risk disclosures, clear non-custodial language (users own their keys). *(Web-launch-critical.)*
- [ ] **Entity, insurance, vendor contracts** — legal entity, insurance, signed agreements/DPAs with on-ramp/RPC/security vendors. *(Web-launch-critical.)*
- [ ] **App-store crypto policies** — **deferred to the app phase**, but skim them now so you don't architect into a future rejection (see Phase 7).

---

## Phase 6.5 — Website testing, QA & launch

### Testing & QA — **web-launch-critical**
- [ ] **Unit tests** for the pure `core` logic (formatters, `resolveRecipient`, `assessRisk`, `computePnl`, swap/quote math) — easy wins, and they protect the layer the app will reuse.
- [ ] **Integration tests** for API + provider integrations (mock the chain where possible).
- [ ] **E2E tests** (Playwright/Cypress) for: onboard → receive → buy → send (with Scam Shield) → swap → activity.
- [ ] **Testnet first** — run *every* money path on testnet; never first-test send/swap with real mainnet funds.
- [ ] **Scam Shield test suite** — known-bad addresses must be blocked.
- [ ] **PWA testing** — install flow, offline, Android push, **iOS install caveats verified** (don't ship broken iOS push expectations).
- [ ] **Accessibility + reduced-motion** — demo already respects `prefers-reduced-motion`; keep it, add a11y tests.
- [ ] **Cross-browser/device matrix**, slow-network behavior.

### Website launch — **the Milestone A finish line**
- [ ] **Domain + DNS + TLS**, subdomains (`app.` vs `www.`).
- [ ] **SEO** for marketing pages — SSR/SSG, metadata, Open Graph, sitemap, structured data (app stays client-rendered behind auth).
- [ ] **Security headers** — strict CSP (allow-list TradingView, fonts, RPC, on-ramp), HSTS. Crypto sites are prime phishing/clone targets.
- [ ] **Analytics + funnels** — onboarding completion, first-deposit, first-send; privacy-respecting + consent.
- [ ] **Monitoring/observability** — Sentry, uptime + alerting, provider health, tx success-rate, cost monitoring (RPC/on-ramp/LLM).
- [ ] **Support** — help center, in-app support, clear "we can't recover your keys" messaging, scam-report channel.
- [ ] **Launch checklist** — prod secrets rotated, rate limits on, rollback rehearsed, on-call set, status page.
- [ ] 🎉 **Ship the website. This is your first real milestone.**

---

# ⏸️ VALIDATION GATE — decide before building the app

Don't start the native app until the website earns it. Use real signal, not vibes.

- [ ] Define success metrics *before* launch (e.g. activated wallets, retained users, first-send rate, deposit volume, organic growth).
- [ ] **Watch for the mobile signal specifically:** high mobile-web traffic, install-to-home-screen rate, and users *asking for a native app* (and citing trust) → the case for Phase 7.
- [ ] Confirm unit economics + provider costs work at small scale before doubling the surface area.
- [ ] Only when validated: greenlight Milestone B.

---

# MILESTONE B — Build the Mobile App 📱
### Phase 7+. Native iOS + Android, **after** web launch + validation. This is where you win the mobile-native + trust-sensitive crypto users.

> **Reminder on why this is later, not never:** crypto users skew mobile and many trust a native app more for holding funds. Web was launch + validation; native is how you scale into that majority — now justified by real traction, and **cheap because `core` already exists.**

## Phase 7 — The native mobile app (iOS + Android)

> **Recommendation: React Native + Expo**, importing the same `core` package the web app uses.

**Pros:** one codebase for both stores, **reuses your `core` logic** (wallet ops, Scam Shield, P&L, resolution, formatters), fast iteration, strong biometrics/secure-storage/push libraries, OTA updates.
**Cons:** some native modules needed (passkeys/secure enclave, WalletConnect); slightly less polish than fully native; store-review nuance.
**Alternatives:** *fully native* (Swift + Kotlin) = best polish/security control, ~2× work; *webview wrapper* (Capacitor) = fastest but weakest for secure key handling → **not recommended for a wallet.**

### 7.1 Build
- [ ] Fill in the `mobile` Expo app in the monorepo; **import shared `core` (the payoff from day-one architecture).**
- [ ] Rebuild screens natively over existing logic — **new UI, not new wallet.**
- [ ] **Secure storage** — iOS Keychain / Android Keystore (Expo SecureStore / react-native-keychain).
- [ ] **Biometrics** — Face ID / Touch ID / Android biometric prompt (expo-local-authentication) wired to real unlock/signing.
- [ ] **Native passkeys** — platform passkey APIs (may need a custom native module / config plugin).
- [ ] **Full push notifications** — APNs + FCM (Expo push or direct) — including the **reliable iOS push** the PWA couldn't deliver.
- [ ] **Deep links / universal links** — map the `?screen=` concept to app links.
- [ ] **WalletConnect / dapp connectivity** if desired.

### 7.2 App-store compliance & review — **the app-phase gate**
- [ ] **Apple Developer account ($99/yr)** + **Google Play ($25 one-time)**.
- [ ] **Read & design around crypto policies:** Apple wallet/crypto guidelines (licensing display, IAP-vs-crypto purchase rules, approved on-ramps — rejections common, leave buffer); Google Play crypto/financial-services policy + declarations + regional restrictions (Earn/staking draws extra scrutiny).
- [ ] **Store listings** — screenshots, descriptions, Apple privacy labels / Play Data Safety, age ratings, support URL.
- [ ] Submit early; budget extra review cycles for crypto.

### 7.3 Build pipelines & mobile QA
- [ ] **Build pipelines** — EAS Build (or Fastlane); code signing, provisioning profiles, keystores stored securely.
- [ ] **OTA updates** (Expo Updates) for JS-only fixes — within store rules.
- [ ] **Mobile E2E** (Detox/Maestro) for the critical flows.
- [ ] **Beta channels** — TestFlight (iOS) + Google Play internal/closed testing.
- [ ] Real-device testing across OS versions + screen sizes.
- [ ] **Mobile security pass** — re-audit native key handling, secure storage, biometrics; pen-test the apps.

### 7.4 Mobile launch
- [ ] App-store launch checklist; phased rollout; monitoring extended to mobile.
- [ ] 🎉 **Ship iOS + Android. Milestone B complete.**

---

## Phase 8 — Post-launch iteration & growth (both platforms)

- [ ] Staged rollouts, feature flags, A/B where sensible.
- [ ] Revisit deferred items: AI Copilot (real LLM), Earn/staking, full tax export, **multi-chain**, more on-ramp methods.
- [ ] Regular dependency + security updates; **scheduled re-audits** after major changes.
- [ ] Expand bug bounty; keep anti-phishing/anti-clone vigilance on both web and stores.
- [ ] Grow: referrals, content/SEO, partnerships; let mobile + web reinforce each other.

---

## Quick reference — feature → service category

| Feature | Service category to integrate |
|---|---|
| Smart account / passkey / recovery | Account-abstraction / embedded-wallet infra (+ WebAuthn, native biometrics) |
| Balances / portfolio / activity | RPC node provider + indexer / portfolio data API |
| Prices / 24h / sparklines / P&L | Market / price data API |
| Scam Shield | Transaction-simulation / wallet-security & threat-intel API |
| Buy | Licensed fiat on-ramp (handles KYC + payments) |
| Swap | DEX / swap aggregator |
| AI Copilot | LLM API (server-proxied; e.g. Claude API) |
| Tax export | Indexer/history (+ optional crypto-tax provider) |
| Price alerts | Market data + push/notification infra (Web Push now, APNs/FCM later) |
| Earn / staking | Staking providers / DeFi protocols |
| Chart | Charting (TradingView) + market data |
| Send by username | Name service (ENS or your own registry) |

---

## Reality check on effort & sequencing

- **Milestone A — Website MVP (non-custodial PWA, one chain):** weeks → a couple of months for a small team, *excluding* a full external audit. **This is your launch.**
- **Web v1.x (Copilot, Earn, tax export, more chains):** rolling, post-launch.
- **Validation gate:** as long as it takes to get real signal — don't rush into the app.
- **Milestone B — Native iOS + Android:** because `core` is reused, this is **new UI + native modules + store review**, not a rewrite — but still budget months including store-review cycles and a mobile security pass.
- **Custodial and/or multi-jurisdiction licensing:** adds **many months + significant legal spend** — the path that turns a project into a regulated company.

**Start on day one regardless of phase:** security audit scheduling, legal/licensing consultation, and the day-one `core`/monorepo architecture (so the app is cheap later). **Read app-store crypto policies before Phase 7**, not after submitting.

---

*Generated as an engineering/product roadmap for the Lumen wallet demo — sequenced web-first, app-later. Not legal, financial, or tax advice; consult qualified professionals for the compliance, licensing, and audit items.*
