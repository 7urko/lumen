# Lumen self-hosted bundler (Base Sepolia)

This stands up **Alto**, Pimlico's open-source ERC-4337 bundler, so Lumen's passkey smart account
(`/smart-account`) can actually send transactions. It's the **one self-run service** in the stack —
open-source software on your box, **no SaaS**. (Background: `../BUNDLER.md`.)

A bundler accepts a signed `UserOperation` from the wallet, then submits it on-chain through the
EntryPoint contract, paying gas from a **relay key** that you fund with testnet ETH.

## Quick start

From the **repo root** (`D:\crypto-wallet`):

```bash
# 1. Generate a relay key (prints a private key + address)
node bundler/gen-key.mjs

# 2. Fund the printed ADDRESS with Base Sepolia test ETH:
#    https://docs.base.org/tools/network-faucets

# 3. Create the bundler config and paste the PRIVATE KEY into it
cd bundler
copy alto-config.example.json alto-config.json   # (Windows; use cp on macOS/Linux)
#   -> set "executor-private-keys" and "utility-private-key" to your funded key

# 4. Launch the bundler (Docker)
docker compose up --build
#   -> serves the bundler at http://localhost:4337

# 5. Point the web app at it: create web/.env.local with
#    NEXT_PUBLIC_BUNDLER_URL=http://localhost:4337
#    then restart `npm run dev -w web`
```

Now `/smart-account` shows **Bundler: Configured**, and a gasless send becomes a real UserOperation.

## Config that matters (already set in `alto-config.example.json`)

- **EntryPoint** `0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789` — v0.6, what the Coinbase Smart Wallet uses.
- **`chain-type: op-stack`** — Base is an OP-Stack chain; Alto needs this.
- **`safe-mode: false`** — skips ERC-7562 trace checks (the public RPC doesn't expose `debug_traceCall`).
  For full validation, point `rpc-url` at your own node with `debug_traceCall` and set `safe-mode: true`.
- **`port: 4337`** — kept off 3000 so it doesn't clash with `next dev`.

## Without Docker

You can run Alto directly instead (needs Node 20, pnpm, and Foundry):

```bash
git clone https://github.com/pimlicolabs/alto.git && cd alto
pnpm install && pnpm build:all
./alto run --config /path/to/alto-config.json
```

## Going to mainnet (Base)

Use **`alto-config.mainnet.example.json`** instead of the Sepolia one. What changes:

- **`rpc-url`** → `https://mainnet.base.org` (or, strongly recommended, **your own Base node** so you
  get `debug_traceCall` and can keep `safe-mode: true`).
- **Relay key holds REAL ETH.** The bundler fronts gas for every UserOperation out of this key and is
  reimbursed by the op. Fund it with real ETH on Base and keep it topped up (`min-balance` is set to
  0.1 ETH so it warns/stops before running dry). Treat this key like an operational hot wallet:
  dedicated, minimally funded, monitored, rotatable.
- **EntryPoint is unchanged** — `0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789` (v0.6) is the same address
  on Base mainnet.
- Point the app at it: set `NEXT_PUBLIC_BUNDLER_URL=https://your-bundler-host` in the web app's
  environment (alongside `NEXT_PUBLIC_CHAIN=base`). Put the bundler behind HTTPS + a domain you control.

```bash
cd bundler
copy alto-config.mainnet.example.json alto-config.json   # cp on macOS/Linux
#   -> paste your FUNDED mainnet relay key into executor-private-keys + utility-private-key
docker compose up --build
```

**Gasless onboarding** still additionally needs a **paymaster** (a contract you deploy + fund with
ETH). Basic sending works without it — the user just pays their own gas. Add the paymaster after
sending is proven on mainnet.

## Notes / honesty

- **Unverified here:** this setup was written against Alto's current docs but not run in this
  environment. Check `./alto help` for the exact flag names if a key was renamed upstream, and **pin the
  `git clone` / Docker image to a known commit for production.**
- The relay key is the one piece of real operational risk in the self-hosted path — secure it
  accordingly (secrets manager, not a committed file; the `.gitignore` already excludes `alto-config.json`).
