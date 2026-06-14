# Self-hosting an ERC-4337 bundler (the one piece of infra to run yourself)

Lumen's smart account (`/smart-account`) is a **passkey-owned Coinbase Smart Wallet** — an audited,
open-source contract already deployed on Base. Reading its address, deployment status, and balance
needs only an RPC. **Sending** a transaction from it needs an ERC-4337 **bundler**: a service that
accepts a signed `UserOperation`, wraps it, and submits it on-chain through the EntryPoint contract.

This is the only backend service in the whole self-built stack. It is **not a SaaS** — it's
open-source software you run on your own box. Set `NEXT_PUBLIC_BUNDLER_URL` to your bundler's RPC URL
and the `/smart-account` send path lights up.

## Pick an open-source bundler

| Bundler | Lang | Notes |
|---|---|---|
| **alto** (Pimlico) | TypeScript | Easy to run, good docs, actively maintained. Good first choice. |
| **rundler** (Alchemy) | Rust | Fast, production-grade. |
| **silius** | Rust | Independent, fully OSS. |
| **skandha** (Etherspot) | TypeScript | Lightweight. |

## What a bundler needs

1. A **chain RPC** for Base Sepolia (your own node, or the public endpoint for now).
2. A funded **relay EOA** (the bundler's own key) — it pays gas to submit UserOps, then gets repaid by
   the account or a paymaster. Fund it with Base Sepolia test ETH from a faucet.
3. The standard **EntryPoint** address (v0.6 for the Coinbase Smart Wallet Lumen uses) — bundlers ship
   with these built in.

## Rough shape (alto example)

```bash
# install
npm i -g @pimlico/alto    # or run via docker

# run against Base Sepolia
alto \
  --entrypoints 0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789 \
  --rpc-url https://sepolia.base.org \
  --executor-private-keys 0x<your_funded_relay_key> \
  --port 4337
```

Then in the web app's environment:

```
NEXT_PUBLIC_BUNDLER_URL=http://localhost:4337
```

Restart the dev server; `/smart-account` will use it to relay real UserOperations.

## Gasless (paymaster) — optional, later

To make onboarding gasless (the demo's pitch), add a **paymaster** (also self-hostable / a contract you
deploy and fund) and pass it to the bundler client. That's a follow-up once basic sending works.

## Reminder

Smart-contract accounts, paymasters, and recovery logic that hold real funds **must be audited before
mainnet**. Build and exercise all of this on **Base Sepolia** first.
