@echo off
rem Double-click to run the Seasoned demo on Windows.
rem Installs what it needs the first time, starts the app, and opens your browser.
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 goto nonode

if not exist node_modules (
  echo First run: installing the app. This takes a minute or two...
  call npm install
  if errorlevel 1 goto failed
)

echo.
echo Starting Seasoned. Your browser will open in a few seconds.
echo Keep this window open while you use the demo. Close it to stop.
echo.
start "" cmd /c "timeout /t 8 /nobreak >nul & start http://localhost:3000"
call npm run dev
goto end

:nonode
echo Node.js is not installed yet.
echo Opening the download page. Install the LTS version, then double-click this file again.
start https://nodejs.org
pause
goto end

:failed
echo Something went wrong during install. Check your internet connection and try again.
pause

:end
