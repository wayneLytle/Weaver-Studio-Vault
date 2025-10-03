@echo off
title SwansonAI Launcher
cd /d "%~dp0"

echo ========================================
echo         SwansonAI Launcher
echo ========================================
echo.

REM Stop existing servers
netstat -ano | findstr :3001 >nul 2>&1
if %errorlevel% equ 0 (
    echo Stopping existing server...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do taskkill /F /PID %%a >nul 2>&1
    timeout /t 2 /nobreak >nul
)

echo Starting SwansonAI...
echo.
echo J.B. Chat App: http://localhost:3001
echo API Tester: http://localhost:3001/test
echo.
echo Press Ctrl+C to stop
echo.

start "" "http://localhost:3001"
node backend.js

echo.
echo Server stopped. Press any key to exit.
pause >nul