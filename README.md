# Lumen Wallet — Front-End Demo

A polished, modern crypto wallet **UI demo** built with plain HTML, CSS, and vanilla
JavaScript. There is **no build step, no Node, no npm, and nothing to install**. Everything
runs in the browser against **mock, in-memory data**.

## How to open

Just open the file in any modern browser:

1. Go to the `crypto-wallet` folder.
2. Double-click **`index.html`** (or right-click → Open with → your browser).

That's it. No server, no terminal, no dependencies to download.

> The only external resource is a QR-code library loaded from a CDN via a `<script>` tag.
> If you happen to be offline, the whole app still works — the Receive screen simply shows
> your address as text instead of a QR image.

## What it does

- **Onboarding** — create a **smart account** (passkey/biometric unlock, no seed phrase —
  the recommended default), create a classic 12-word recovery phrase, or import a wallet.
- **Unlock** — a Face ID / fingerprint-style biometric prompt for returning to a locked
  smart account, with a social-recovery fallback.
- **Dashboard** — total portfolio value, 24h change, a Total/24h **P&L** strip, four quick
  actions (Send / Receive / Buy / Swap), and a sorted token list with sparklines.
- **Scam Shield** — before any send confirms, a transaction-simulation panel shows
  "you send / they receive", the network fee, and a **Safe / Caution / Danger** verdict with
  reasons. Known drainer addresses and scam usernames are blocked with a red warning.
- **Send by username / contacts** — target an ENS-style `name.lumen` username or a saved
  contact instead of a raw `0x` address; usernames resolve from a mock registry.
- **Buy** — fiat on-ramp with presets, card / Apple Pay, and a live "you receive" quote.
- **Swap** — token-to-token with a live rate, slippage control, price impact and min-received.
- **AI Copilot** — a chat assistant (local intent engine, no API key) that answers portfolio,
  P&L and safety questions, explains transactions, and pre-fills sends from natural language
  ("send $50 of ETH to alice").
- **Insights** — allocation donut, total & 24h P&L, per-token cost basis and profit/loss, and
  a CSV "tax export".
- **Price alerts** — saved "notify when BTC is above $X" rules with live distance and toggles.
- **Earn** — stakeable assets with mock APYs and a stake/confirm flow that updates balances.
- **Security / Social recovery** — add trusted guardians who can help recover the wallet.
- **Receive** — wallet username + address with a scannable QR code and copy button.
- **Activity** — transaction history with direction, counterparty, amount and timestamps.
- **Navigation** — a 5-tab bottom bar (Home · Markets · Copilot · Insights · More) with a
  "More" sheet that launches every other screen.

## Deep links (`?screen=`)

Open `index.html?screen=<name>` to jump straight to a seeded screen (used for screenshots;
works on `file://`). Supported: `dashboard`, `send`, `receive`, `activity` (alias `history`),
`chart` (alias `markets`, optional `&symbol=ETH`), `create`, `smart`, `unlock`, `recovery`
(alias `security`), `buy`, `swap`, `contacts`, `copilot`, `insights`, `alerts`, `earn`, and
`scamshield` (opens Send pre-filled with a flagged drainer so the Danger verdict is shown).

## Project structure

```
crypto-wallet/
├── index.html   — markup for all screens
├── styles.css   — dark theme, layout, components
├── app.js       — all state + logic (mock data, navigation, send/receive/history)
└── README.md    — this file
```

## ⚠️ Security notes — please read

- **This is a demo, not a real wallet.** It cannot hold, send, or receive any real
  cryptocurrency.
- **No real keys exist.** The "recovery phrase" and wallet address are randomly generated
  in your browser purely for show. They are **not** cryptographic keys, are not derived from
  any real algorithm, and control nothing.
- **Never paste a real recovery phrase or private key** into this app (or any web page).
  The import box accepts any text only to demonstrate the flow — anything you type stays in
  the page's memory and is discarded on refresh, but you should still never enter real
  secrets into demo software.
- **All balances, prices, and transactions are fake** and reset every time you reload the
  page. Nothing is persisted and nothing touches a blockchain or network.
- **Do not use this for real funds.** It is intended only as a UI / interaction prototype.
