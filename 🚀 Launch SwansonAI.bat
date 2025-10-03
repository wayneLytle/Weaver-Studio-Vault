@echo off
color 0A
title SwansonAI - One-Click Launcher
cls

echo ========================================
echo         SwansonAI One-Click Launcher
echo ========================================
echo.

REM Change to the project directory
cd /d "%~dp0"

REM Kill any existing Node.js processes on port 3001
echo 🔄 Checking for existing servers...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
    echo    Stopping existing server (PID: %%a)...
    taskkill /F /PID %%a >nul 2>&1
)

REM Wait a moment for port to be freed
timeout /t 2 /nobreak >nul

echo ✅ Port 3001 is now available
echo.

REM Check if Node.js is installed
echo 🔍 Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: Node.js is not installed!
    echo    Please install Node.js from https://nodejs.org/
    echo    Then run this launcher again.
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js %NODE_VERSION% detected
echo.

REM Check if dependencies are installed
echo 🔍 Checking dependencies...
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies!
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed successfully
) else (
    echo ✅ Dependencies already installed
)
echo.

REM Check if .env file exists
echo 🔍 Checking environment configuration...
if not exist ".env" (
    echo ⚠️  WARNING: .env file not found!
    echo    Your API keys may not be configured.
    echo    Check .env.example for setup instructions.
    echo.
) else (
    echo ✅ Environment file found
)

REM Check if API keys are configured
findstr /C:"OPENAI_API_KEY=sk-" ".env" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ OpenAI API key configured
) else (
    echo ⚠️  OpenAI API key may not be configured
)

findstr /C:"GOOGLE_APPLICATION_CREDENTIALS=" ".env" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ BigQuery credentials configured
) else (
    echo ⚠️  BigQuery credentials may not be configured
)
echo.

echo 🚀 Starting SwansonAI Backend...
echo.
echo    Server URL: http://localhost:3001
echo    Test Interface: http://localhost:3001/test
echo    API Documentation: See README.md
echo.
echo 📝 Press Ctrl+C to stop the server
echo 🌐 The server will automatically open your test interface
echo.
echo ========================================
echo.

REM Start the server
start "" "http://localhost:3001/test"
node backend.js

REM This runs when the server stops
echo.
echo ========================================
echo         Server Stopped
echo ========================================
echo.
echo The SwansonAI backend has been stopped.
echo You can run this launcher again to restart.
echo.
pause