# Lumen Wallet — project guide for Claude

Read this first. It orients you; the details live in the linked docs.

**What this is:** "Lumen", a front-end **crypto-wallet UI demo** — plain HTML/CSS/vanilla
JS, no build step, no backend. All data is **mock / in-memory and resets on reload**. No real
keys, no blockchain, no network calls except two CDN libs (QR code + TradingView chart). It is
a UI / interaction prototype, **not** a real wallet — never treat balances, addresses, or the
"recovery phrase" as real.

## Read these, in order
1. **`WORKLOG.md`** — what's been built/changed, decisions, environment quirks, what's next. *Most current; update it as you work.*
2. **`README.md`** — feature overview + security notes.
3. **`GOING-LIVE.md`** — the full web-first go-live roadmap (phases, milestones, what's real vs mock).

## Files
| File | What it is |
|---|---|
| `index.html` | The **mobile / app** layout — markup for every screen + modals |
| `styles.css` | Shared dark theme + mobile layout |
| `app.js` | All logic + mock data (~1500 lines). Binds to exact IDs in `index.html` |
| `web.html` + `web.css` | The **desktop web** layout. `web.html` reuses `index.html`'s DOM at runtime and adds a sidebar; `web.css` is the desktop theme (≥900px) |
| `screenshots/` | UI reference shots — `01–03` mobile, `web-01–03` desktop |
| `_serve.ps1` | Tiny local dev server (PowerShell, no installs) |
| `_copy_shots.bat`, `_serve.log` | Throwaway helpers — safe to delete |

## How to run it (environment quirks — learned the hard way)
- This Windows machine has **no Node.js and no Python**. Don't assume a dev server exists.
- **Start the server:** `powershell -ExecutionPolicy Bypass -File D:\crypto-wallet\_serve.ps1`
  → serves this folder at `http://localhost:8123`.
- **Mobile / app view:** open `index.html` directly (works on `file://`).
- **Desktop web view:** open `http://localhost:8123/web.html` — it **must** be served over
  **http**, because it fetches `index.html` (browsers block that on `file://`).
- **Deep links** (for screenshots / testing): append `?screen=dashboard` — also `send`,
  `receive`, `swap`, `buy`, `insights`, `chart`, `activity`, `earn`, `alerts`, `contacts`, `recovery`.

## Conventions / gotchas
- Keep the **no-build, vanilla** stack unless the roadmap's Phase 2 migration is explicitly underway.
- `app.js` fails fatally if an element it binds to is missing — keep `index.html`'s IDs intact.
  `web.html` deliberately reuses those IDs, so changes to `index.html` flow through automatically.
- To add a new screen to the web sidebar, add a `data-nav` button in `web.html`'s sidebar list
  (it's auto-wired by `app.js`'s nav handler).
