@echo off
set SRC=C:\Users\emira\AppData\Roaming\Claude\local-agent-mode-sessions\983f3902-e6dc-4e68-b420-a5b4d0bfdd76\421e40d0-fd38-4222-b3c6-9946e652b626\agent\local_ditto_421e40d0-fd38-4222-b3c6-9946e652b626\outputs
set DST=D:\crypto-wallet\screenshots
if not exist "%DST%" mkdir "%DST%"
copy /Y "%SRC%\screenshot-1781412638319.jpg" "%DST%\web-01-dashboard.jpg"
copy /Y "%SRC%\screenshot-1781412655917.jpg" "%DST%\web-02-send.jpg"
copy /Y "%SRC%\screenshot-1781412679518.jpg" "%DST%\web-03-insights.jpg"
echo DONE > "%DST%\_copy.log"
