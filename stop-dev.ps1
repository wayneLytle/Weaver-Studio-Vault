param([switch]$Force)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$pidFile = Join-Path $root '.dev-pids.json'
if (-not (Test-Path $pidFile)) { Write-Warning 'No .dev-pids.json found (nothing to stop?)'; exit 0 }
$pids = Get-Content $pidFile | ConvertFrom-Json
foreach ($p in $pids) {
  try {
    Get-Process -Id $p.pid -ErrorAction Stop | Out-Null
    Stop-Process -Id $p.pid -Force:$Force
    Write-Host "Stopped $($p.name) (PID $($p.pid))" -ForegroundColor Cyan
  } catch {
    Write-Host "Already stopped: $($p.name) (PID $($p.pid))" -ForegroundColor DarkGray
  }
}
Remove-Item $pidFile -Force
Write-Host 'All tracked dev processes stopped.' -ForegroundColor Green
exit 0