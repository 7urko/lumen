@echo off
REM Verifies the app compiles. Double-click, wait for it to finish, then tell Claude.
setlocal
set "PATH=C:\Program Files\nodejs;C:\Program Files\Git\cmd;%PATH%"
cd /d D:\crypto-wallet

echo ==== versions ==== > _build.log 2>&1
call node -v >> _build.log 2>&1
call npm -v >> _build.log 2>&1

echo. >> _build.log 2>&1
echo ==== npm install ==== >> _build.log 2>&1
call npm install >> _build.log 2>&1
echo install exit code: %ERRORLEVEL% >> _build.log 2>&1

echo. >> _build.log 2>&1
echo ==== build core ==== >> _build.log 2>&1
call npm run build -w core >> _build.log 2>&1
echo core exit code: %ERRORLEVEL% >> _build.log 2>&1

echo. >> _build.log 2>&1
echo ==== build web ==== >> _build.log 2>&1
call npm run build -w web >> _build.log 2>&1
echo web exit code: %ERRORLEVEL% >> _build.log 2>&1

echo. >> _build.log 2>&1
echo ==== DONE ==== >> _build.log 2>&1
endlocal
