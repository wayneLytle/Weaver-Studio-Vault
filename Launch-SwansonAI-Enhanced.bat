@echo off
color 0A
title SwansonAI Backend Launcher

echo ================================
echo    SwansonAI Backend Launcher
echo ================================
echo.

cd /d "c:\Users\lytle\OneDrive\Desktop\SwansonAI"

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    echo.
)

REM Check if .env file exists
if not exist ".env" (
    echo WARNING: .env file not found
    echo Please copy .env.example to .env and add your API keys
    echo.
)

echo Starting SwansonAI Backend...
echo Server will be available at: http://localhost:3001
echo API Tester will be available at: http://localhost:3001/test
echo Press Ctrl+C to stop the server
echo.

npm start

echo.
echo Server stopped.
pause