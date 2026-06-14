@echo off
REM One-click launcher for the Lumen desktop web view.
REM Starts the local PowerShell server (if not already running) and opens web.html in your browser.

REM --- start the server minimized (it serves this folder at http://localhost:8123) ---
start "" /min powershell -ExecutionPolicy Bypass -WindowStyle Minimized -File "%~dp0_serve.ps1"

REM --- give the listener a moment to come up ---
ping -n 2 127.0.0.1 >nul

REM --- open the desktop web view (over http, the way web.html needs) ---
start "" "http://localhost:8123/web.html"
