# Deploying Lumen to a real URL

Lumen's web app (`web/`) is a standard Next.js app, so it deploys anywhere that runs Next. The
easiest, free path is **Vercel** (Next.js's maker) — near-zero ops, a real `https://` URL, auto-deploy
on every git push. Hosting the site is *not* custody and *not* KYC; it's just where the app lives.

## Option A — Vercel (recommended, free)

1. **Put the repo on GitHub** (or GitLab/Bitbucket): create an empty repo, then from `D:\crypto-wallet`:
   ```
   git branch -M main
   git remote add origin https://github.com/<you>/lumen.git
   git push -u origin main
   ```
   *(Pushing is the one action you do yourself — I don't push on your behalf.)*
2. Go to **vercel.com**, sign in with GitHub, **Add New → Project**, import the repo.
3. In the import screen set **Root Directory = `web`**. Vercel auto-detects Next.js and, because this
   is an npm-workspaces monorepo, installs `@lumen/core` from the repo root automatically.
4. (Optional) **Environment Variables** — all optional; sensible public defaults are built in:
   - `NEXT_PUBLIC_BASE_RPC`, `NEXT_PUBLIC_BASE_SEPOLIA_RPC`, `NEXT_PUBLIC_MAINNET_RPC` — point at your
     own nodes instead of the public RPCs.
   - `NEXT_PUBLIC_BUNDLER_URL` — only if you run the ERC-4337 bundler (see `BUNDLER.md`).
5. **Deploy.** You get a live URL like `https://lumen-<you>.vercel.app`. Every push auto-deploys.

That's it — it'll work on your phone and anyone you share the link with. To use a custom domain, add it
in Vercel → Settings → Domains.

## Option B — any static/Node host

`npm run build -w web` produces a normal Next build you can run with `npm run start -w web`, or host on
Netlify, Cloudflare Pages, a VPS, etc. (Same env vars apply.)

## Before a *public* launch (reminders — not code)

These are the operational/legal items from `COMPLIANCE.md`, none of which block a private/testnet deploy:

- **Strict CSP + security headers** (allow-list the RPC, fonts, TradingView). Crypto sites are prime
  phishing-clone targets.
- **Sanctions geo-block** of prohibited jurisdictions.
- **Terms of Service + Privacy Policy** stating the non-custodial, no-KYC, "we can't recover your keys"
  nature.
- A short **crypto/fintech lawyer** consult for your jurisdiction(s).
- Keep it on **testnet** until the smart-account/paymaster path is audited (see `GOING-LIVE.md`).
