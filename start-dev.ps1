param(
  [switch]$Prod,
  [switch]$SkipInstall,
  [switch]$SkipBuild,
  [switch]$Verbose,
  [switch]$KillExisting,
  [switch]$ChatOnly,
  [switch]$FrontendOnly
)
$ErrorActionPreference = 'Stop'
function Log { param([string]$Msg,[string]$Level='INFO'); $ts=(Get-Date).ToString('HH:mm:ss'); Write-Host "[$ts][$Level] $Msg" -ForegroundColor Cyan }
function Warn { param([string]$Msg) Write-Warning $Msg }
if ($KillExisting) {
  Log 'Killing existing node processes on dev ports (4101, 5173, 6006)'
  $ports = 4101,5173,6006
  foreach ($p in $ports) {
    $conns = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue
    if ($conns) {
      $pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique
      foreach ($processId in $pids) {
        try {
          Stop-Process -Id $processId -Force -ErrorAction Stop
          Log "Stopped PID $processId (port $p)"
        } catch {
          $msg = $_.Exception.Message
          Warn "Failed to stop PID $processId (port $p) :: $msg"
        }
      }
    }
  }
}
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root
$pidFile = Join-Path $root '.dev-pids.json'
if (Test-Path $pidFile) { Remove-Item $pidFile -Force }
$processList = @()
function Invoke-NpmInstall { param([string]$Dir) if ($SkipInstall) { return }; if (-not (Test-Path (Join-Path $Dir 'package.json'))) { return }; if (-not (Test-Path (Join-Path $Dir 'node_modules'))) { Log "Installing dependencies in $Dir"; Push-Location $Dir; npm install | Out-Null; Pop-Location } elseif ($Verbose) { Log "Skipping install in $Dir (node_modules present)" } }
function Start-NpmScriptDetached { param([string]$Name,[string]$Dir,[string]$Script); Push-Location $Dir; $proc = Start-Process -FilePath npm -ArgumentList @('run',$Script) -WindowStyle Hidden -PassThru; Pop-Location; Log "Started $Name (PID $($proc.Id))"; $processList += [pscustomobject]@{ name=$Name; pid=$proc.Id; dir=$Dir; mode='npm-script'; script=$Script } }
function Start-NodeDetached { param([string]$Name,[string]$Dir,[string]$Entry,[string]$Mode='node'); Push-Location $Dir; $proc = Start-Process -FilePath node -ArgumentList $Entry -WindowStyle Hidden -PassThru; Pop-Location; Log "Started $Name (PID $($proc.Id)) -> $Entry"; $processList += [pscustomobject]@{ name=$Name; pid=$proc.Id; dir=$Dir; mode=$Mode; entry=$Entry } }
$frontendDir = Join-Path $root 'WeaverMainScreen'
$chatServerDir = Join-Path $frontendDir 'server'
if (-not (Test-Path $chatServerDir)) { throw "Chat server directory not found: $chatServerDir" }
Invoke-NpmInstall -Dir $chatServerDir
Invoke-NpmInstall -Dir $frontendDir
if (-not $FrontendOnly) { if (-not $SkipBuild -and (Test-Path (Join-Path $chatServerDir 'tsconfig.json'))) { if ($Prod) { Log 'Building chat server (tsc)'; Push-Location $chatServerDir; npm run build | Out-Null; Pop-Location } elseif ($Verbose) { Log 'Skipping build (dev watch mode)' } } }
if (-not $ChatOnly) { if (Test-Path (Join-Path $frontendDir 'package.json')) { Start-NpmScriptDetached -Name 'frontend-vite' -Dir $frontendDir -Script 'dev' } else { Warn 'Frontend package.json not found; skipping frontend.' } }
if (-not $FrontendOnly) { if ($Prod) { $compiled = Join-Path $chatServerDir 'dist/server/src/index.js'; if (-not (Test-Path $compiled)) { throw "Compiled server entry missing: $compiled (build may have failed)" }; Start-NodeDetached -Name 'chat-server' -Dir $chatServerDir -Entry 'dist/server/src/index.js' -Mode 'prod' } else { Start-NpmScriptDetached -Name 'chat-server-dev' -Dir $chatServerDir -Script 'dev' } }
$processList | ConvertTo-Json | Set-Content -Encoding UTF8 $pidFile
Log "PID manifest written: $pidFile"
Log 'Waiting for primary ports (4101, 5173) up to 30s'
$deadline = (Get-Date).AddSeconds(30)
$portsNeeded = @()
if (-not $FrontendOnly) { $portsNeeded += 4101 }
if (-not $ChatOnly) { $portsNeeded += 5173 }
while ($portsNeeded.Count -gt 0 -and (Get-Date) -lt $deadline) { $portsNeeded = $portsNeeded | Where-Object { -not (Get-NetTCPConnection -LocalPort $_ -State Listen -ErrorAction SilentlyContinue) }; Start-Sleep -Milliseconds 500 }
if ($portsNeeded.Count -gt 0) { Warn ("Some ports not listening within timeout: " + ($portsNeeded -join ',')) } else { Log 'All required ports are listening.' }
Write-Host ''
Write-Host '=== Dev Environment Started ===' -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host "API/Chat: http://localhost:4101" -ForegroundColor Yellow
Write-Host "Stop Script: .\stop-dev.ps1" -ForegroundColor Yellow
Write-Host ''
if ($Verbose) { Write-Host 'Processes:' -ForegroundColor Magenta; $processList | Format-Table | Out-String | Write-Host }
exit 0