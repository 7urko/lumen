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
