# SwansonAI PowerShell Launcher
param([switch]$NoOpen)

$Host.UI.RawUI.WindowTitle = "SwansonAI Launcher"
Clear-Host

Write-Host "🚀 SwansonAI One-Click Launcher" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Change to script directory
Set-Location $PSScriptRoot

# Stop any existing servers
Write-Host "🔄 Stopping existing servers..." -ForegroundColor Yellow
try {
    $processes = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | 
                 Select-Object -ExpandProperty OwningProcess -Unique
    
    foreach ($pid in $processes) {
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        Write-Host "   Stopped process $pid" -ForegroundColor Green
    }
} catch {
    # No processes to stop
}

Start-Sleep -Seconds 1

# Check Node.js
Write-Host "🔍 Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js $nodeVersion detected" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found! Please install from https://nodejs.org/" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check dependencies
Write-Host "📦 Checking dependencies..." -ForegroundColor Yellow
if (!(Test-Path "node_modules")) {
    Write-Host "   Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies!" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}
Write-Host "✅ Dependencies ready" -ForegroundColor Green

# Check configuration
Write-Host "🔧 Checking configuration..." -ForegroundColor Yellow
if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match "OPENAI_API_KEY=sk-") {
        Write-Host "✅ OpenAI API configured" -ForegroundColor Green
    } else {
        Write-Host "⚠️  OpenAI API key may need configuration" -ForegroundColor Yellow
    }
    
    if ($envContent -match "GOOGLE_APPLICATION_CREDENTIALS=") {
        Write-Host "✅ BigQuery credentials configured" -ForegroundColor Green
    } else {
        Write-Host "⚠️  BigQuery credentials may need configuration" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  .env file not found - check .env.example" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🚀 Starting SwansonAI Backend..." -ForegroundColor Cyan
Write-Host ""
Write-Host "   Server: http://localhost:3001" -ForegroundColor White
Write-Host "   Test UI: http://localhost:3001/test" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host ""

# Open browser unless -NoOpen parameter is used
if (!$NoOpen) {
    Start-Sleep -Seconds 2
    Start-Process "http://localhost:3001/test"
}

# Start the server
try {
    node backend.js
} catch {
    Write-Host ""
    Write-Host "❌ Server stopped with error: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    Write-Host ""
    Write-Host "🛑 SwansonAI server stopped" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
}