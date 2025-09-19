param(
  [string]$Port = "5000"
)
$ErrorActionPreference = 'Stop'

# Ensure we operate inside the project directory
Push-Location $PSScriptRoot

# Try standard PATH first
$cmd = Get-Command dotnet -ErrorAction SilentlyContinue
$dotnet = if ($cmd) { $cmd.Source } else { $null }

function Install-LocalDotNet([string]$TargetDir) {
  Write-Warning "Installing local .NET SDK into $TargetDir (channel 8.0)…"
  New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
  $temp = Join-Path $env:TEMP 'dotnet-install.ps1'
  Invoke-WebRequest -UseBasicParsing -Uri https://dot.net/v1/dotnet-install.ps1 -OutFile $temp
  & powershell -NoProfile -ExecutionPolicy Bypass -File $temp -Channel 8.0 -InstallDir $TargetDir | Write-Host
}

if (-not $dotnet) {
  $userDotnetDir = Join-Path $env:USERPROFILE 'dotnet'
  $userDotnet = Join-Path $userDotnetDir 'dotnet.exe'
  if (Test-Path $userDotnet) { $dotnet = $userDotnet }
}

# If still no dotnet, install into workspace-local .dotnet
if (-not $dotnet) {
  $localDir = Join-Path $PSScriptRoot '.dotnet'
  Install-LocalDotNet -TargetDir $localDir
  $candidate = Join-Path $localDir 'dotnet.exe'
  if (Test-Path $candidate) { $dotnet = $candidate }
}

if (-not $dotnet) { Write-Error 'No dotnet host found after attempted installs.'; exit 1 }

# Verify SDK presence; if missing attempt local install even if host exists (could be runtime only)
$sdks = & $dotnet --list-sdks 2>$null
if (-not $sdks -or $sdks.Count -eq 0) {
  $localDir = Join-Path $PSScriptRoot '.dotnet'
  Install-LocalDotNet -TargetDir $localDir
  $dotnet = Join-Path $localDir 'dotnet.exe'
  $sdks = & $dotnet --list-sdks 2>$null
}
if (-not $sdks -or $sdks.Count -eq 0) { Write-Error 'A .NET SDK could not be installed or detected.'; exit 1 }

$dotRoot = Split-Path -Parent $dotnet
if (-not ($env:PATH -split ';' | Where-Object { $_ -eq $dotRoot })) { $env:PATH = "$dotRoot;$env:PATH" }
$env:DOTNET_ROOT = $dotRoot

Write-Host "Using dotnet: $dotnet" -ForegroundColor Cyan

# Ensure restore/build succeed before running
& $dotnet restore | Write-Host
& $dotnet build -c Debug | Write-Host

if ($LASTEXITCODE -ne 0) { Write-Error 'Build failed.'; exit 1 }

$urls = "http://localhost:$Port"  # Simplify single URL usage
Write-Host "Starting WeaverDocServer on $urls" -ForegroundColor Green

# Kill any process already listening on the port (dev convenience)
try {
  $inUse = netstat -ano | Select-String ":$Port" | Select-String LISTENING
  if ($inUse) {
    $procId = ($inUse -split '\s+')[-1]
    if ($procId -match '^[0-9]+$') {
      Write-Warning "Port $Port in use by PID $procId. Attempting to stop process."
      Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
      Start-Sleep -Milliseconds 500
    }
  }
} catch {}

# Run using built DLL explicitly (synchronous)
Write-Host 'Launching application via dotnet exec (Ctrl+C to stop)…' -ForegroundColor Yellow
$dll = Join-Path $PSScriptRoot 'bin/Debug/net8.0/WeaverDocServer.dll'
if (-not (Test-Path $dll)) { Write-Error "App DLL not found: $dll"; Pop-Location; exit 1 }
& $dotnet exec $dll --urls $urls
$code = $LASTEXITCODE
Write-Host "Application exited (code $code)" -ForegroundColor Magenta
Pop-Location
