# @lumen/core

Framework-agnostic wallet logic for Lumen. **Zero DOM, zero network, zero framework.**

This is the shared layer from the go-live roadmap's "architect now so the app is cheap later"
callout. The web app imports it today; the future mobile app imports the *same* package
(see `../GOING-LIVE.md`). Business rules live here, never inside a UI component — so they're
tested once and reused everywhere.

## What's inside

| Module | Exports | Ported from `app.js` |
|---|---|---|
| `format.ts` | `fmtUsd`, `fmtUsd0`, `fmtSigned`, `fmtAmt`, `shortAddr`, `relTime`, `initials`, `colorFor`, `escapeHtml`, `daysAgo` | the `// helpers` block |
| `portfolio.ts` | `totalUsd`, `liquidUsd`, `computePnl` | `totalUsd` / `liquidUsd` / `computePnl` |
| `sparkline.ts` | `buildSeries`, `sparklinePath` | `buildSeries` + the geometry half of `sparkSVG` |
| `scam-shield.ts` | `resolveRecipient`, `assessRisk`, `isFlagged`, `LARGE_TRANSFER_USD` | the Scam Shield section |
| `demo-data.ts` | `DEMO_TOKENS`, `DEMO_DIRECTORY`, `DEMO_REGISTRY`, `DEMO_CONTACTS`, `DEMO_BLOCKLIST`, `DRAINER_ADDR` | the mock-data block |
| `types.ts` | `Token`, `Contact`, `Directory`, `Resolved`, `RiskVerdict`, `Pnl`, … | (new) the shared shapes |

### Two deliberate design changes from the demo

1. **No globals.** The demo read module-level `TOKENS` / `BLOCKLIST` / `REGISTRY` / `CONTACTS`.
   Here every function takes its data as an argument (a `Token[]`, or a `Directory`). That's what
   lets real balances and a real threat-intel feed drop in later without touching the logic.
2. **Logic vs rendering split.** `sparkSVG` used to build the price series *and* emit an `<svg>`
   string with a gradient + CSS animation var. Only the pure parts live here (`buildSeries`,
   `sparklinePath` → points/paths). The UI layer turns `SparkGeometry` into whatever markup it wants.

The behaviour of each ported function is otherwise identical to the demo.

## Use

```ts
import { resolveRecipient, assessRisk, computePnl, DEMO_DIRECTORY, DEMO_TOKENS } from "@lumen/core";

const resolved = resolveRecipient("claim-airdrop.lumen", DEMO_DIRECTORY);
const verdict  = assessRisk(resolved, 250);   // -> { level: "danger", … }
const pnl      = computePnl(DEMO_TOKENS);      // -> { total, totalPct, day, … }
```

## Develop

Requires Node.js (this repo's first real toolchain dependency — install Node 20+ first).

```bash
npm install          # dev deps only: typescript, tsx, @types/node
npm test             # run the unit tests (node:test + tsx)
npm run typecheck    # type-check the source
npm run build        # emit dist/ (JS + .d.ts) for consumers
```

Tests cover the formatters, P&L invariants, sparkline geometry, and the Scam Shield engine
(including the known-drainer block path). All currently green.
