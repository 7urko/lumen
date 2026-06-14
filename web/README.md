# Lumen — Web App (`web`)

The real Lumen wallet, as a **Next.js 15 + TypeScript** app (App Router, React 19). This is the
production-track successor to the static `index.html` demo: every screen is a React route, and all
wallet logic comes from the shared **`@lumen/core`** package (so the future mobile app reuses it).

> Still a **UI demo** for now — non-custodial by design, but data is mock (from `@lumen/core`'s
> demo fixtures) and nothing touches a blockchain yet. See `../GOING-LIVE.md` for what becomes real.

## Run it

From the **repo root** (`D:\crypto-wallet`), this is an npm workspace, so install once at the root:

```bash
npm install            # installs core + web (root workspaces)
npm run dev -w web     # dev server → http://localhost:3000
```

Or just double-click **`Start Web App.bat`** in the repo root (sets PATH, starts the dev server,
opens the browser).

Other scripts (run inside `web/`, or with `-w web` from the root):

```bash
npm run build -w web   # production build
npm run start -w web   # serve the production build
npm run typecheck -w web
```

## How it's wired

- **`app/`** — routes: `/` (Dashboard), `/send`, `/receive`, `/activity`, `/insights`, `/markets`,
  `/buy`, `/swap`, `/earn`, `/alerts`, `/contacts`, `/security`, `/copilot`, plus the entry flows
  `/welcome` (onboarding) and `/unlock`. Each is a client component that reads wallet state from a
  context and calls `@lumen/core`. (Full feature parity with the original static demo.)
- **`components/WalletProvider.tsx`** — in-memory wallet state (tokens, history, directory, toast,
  a mock `send`). The single place to later swap mock data for real provider/indexer calls.
- **`components/Sparkline.tsx`** — renders `@lumen/core`'s `sparklinePath` geometry as SVG (the
  rendering half that deliberately stayed out of core).
- **`app/globals.css`** — the dark theme ported from the prototype's `styles.css` / `web.css`.
- **`next.config.ts`** — `transpilePackages: ["@lumen/core"]` so Next compiles the core TS source.

## What each screen uses from `@lumen/core`

| Screen | core functions |
|---|---|
| Dashboard | `totalUsd`, `computePnl`, `buildSeries`/`sparklinePath`, `fmtUsd`/`fmtSigned`/`fmtAmt` |
| Send | `resolveRecipient`, `assessRisk` (Scam Shield), `fmtUsd`/`fmtAmt`/`shortAddr` |
| Receive | wallet address + `qrcode` |
| Activity | `relTime`, `fmtAmt` |
| Insights | `computePnl`, `totalUsd`, `fmtUsd`/`fmtSigned` |
| Markets | TradingView embed (token `tv` symbol) |

## Next on the roadmap

These are still mock and tracked in `../GOING-LIVE.md` Phase 4: real smart-account onboarding +
passkeys, real balances/prices (indexer + market data), real Scam Shield threat-intel, real send
(build/sign/broadcast on Base), fiat on-ramp, swap. The UI and the `core` contracts are already in
place — making a feature real means swapping its data source, not rewriting the screen.
