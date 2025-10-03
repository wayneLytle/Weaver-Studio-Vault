@echo off
cd /d "%~dp0"

REM Kill existing servers
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001 2^>nul') do taskkill /F /PID %%a >nul 2>&1

REM Start server and open test interface
start "" "http://localhost:3001/test"
echo SwansonAI starting at http://localhost:3001
node backend.js