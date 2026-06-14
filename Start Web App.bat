@echo off
title Lumen Web App (dev server)
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d D:\crypto-wallet\web
echo Starting the Lumen web app on http://localhost:3000 ...
echo (Keep this window open. Close it to stop the server.)
start "" "http://localhost:3000"
call npm run dev
