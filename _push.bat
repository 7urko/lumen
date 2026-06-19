@echo off
REM ====================================================================
REM  EDIT THE NEXT LINE: paste YOUR GitHub repo URL between the quotes,
REM  save the file, then double-click it.
set "REPO_URL=https://github.com/7urko/lumen.git"
REM ====================================================================
set "PATH=C:\Program Files\Git\cmd;C:\Program Files\Git\bin;%PATH%"
cd /d D:\crypto-wallet
git branch -M main
git remote remove origin 2>nul
git remote add origin %REPO_URL%
echo Pushing to %REPO_URL% ...
git push -u origin main
echo.
echo If a GitHub sign-in window appeared, complete it and re-run if needed.
pause
