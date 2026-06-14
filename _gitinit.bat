@echo off
set "PATH=C:\Program Files\Git\cmd;C:\Program Files\Git\bin;%PATH%"
cd /d D:\crypto-wallet
if exist ".git" rmdir /s /q ".git"
(
  git --version
  git init
  git config user.name "Emirhan"
  git config user.email "egbworld@gmail.com"
  git config core.autocrlf true
  git add -A
  git commit -m "Initial commit: Lumen wallet - static demo, @lumen/core, Next.js web app + PWA" -m "core/: framework-agnostic TypeScript logic (formatters, P&L, sparkline, Scam Shield) with 37 unit tests. web/: Next.js 15 + TS app (dashboard, send/Scam Shield, receive, activity, insights, markets) plus PWA (manifest, icons, service worker, offline). Legacy static demo retained. Docs (README/WORKLOG/DECISIONS/GOING-LIVE) and CI workflow included."
  echo ----HEAD----
  git log --oneline -1
  echo ----COUNT----
  git ls-files
) > D:\crypto-wallet\_git.log 2>&1
echo DONE >> D:\crypto-wallet\_git.log
