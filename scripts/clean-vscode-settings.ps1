param(
  [switch]$DryRun
)
$ErrorActionPreference = 'Stop'
$settingsPath = Join-Path $env:APPDATA 'Code/User/settings.json'
if (-not (Test-Path $settingsPath)) { Write-Error "VS Code settings not found at $settingsPath" }
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupPath = "${settingsPath}.${timestamp}.bak"
Copy-Item $settingsPath $backupPath -Force
Write-Host "Backup created: $backupPath"

# Load existing JSON (some comments may be stripped if present; VS Code settings typically comment-free)
$jsonText = Get-Content -Path $settingsPath -Raw
try { $obj = $jsonText | ConvertFrom-Json -ErrorAction Stop } catch { Write-Error "Failed to parse existing settings.json: $($_.Exception.Message)" }

# Ensure we operate on a PSCustomObject
if ($null -eq $obj) { $obj = [pscustomobject]@{} }

# Apply enforced / recommended keys (dotted keys treated as literal in VS Code settings)
$enforced = @{
  "chat.tools.terminal.autoApprove" = @(
    "runInTerminal",
    "runTask",
    "python",
    "applyPatch"
  );
  "chat.tools.terminal.confirmOnFailure" = $true;
  "chat.tools.terminal.safeMode" = "restricted";
  "weaver.settings.lastCleanup" = (Get-Date).ToString('o');
}

foreach ($k in $enforced.Keys) { $obj | Add-Member -NotePropertyName $k -NotePropertyValue $enforced[$k] -Force }

# Sort keys alphabetically for readability
$ordered = [ordered]@{}
$obj.PSObject.Properties.Name | Sort-Object | ForEach-Object { $ordered[$_] = $obj.PSObject.Properties[$_].Value }

$newJson = $ordered | ConvertTo-Json -Depth 12

if ($DryRun) {
  Write-Host "--- DRY RUN (no write) ---" -ForegroundColor Yellow
  Write-Output $newJson
  exit 0
}

# Validate generated JSON by round-trip
try {
  $null = $newJson | ConvertFrom-Json -ErrorAction Stop
} catch { Write-Error "Generated JSON invalid: $($_.Exception.Message)" }

$newJson | Out-File -Encoding UTF8 -FilePath $settingsPath
Write-Host "settings.json sanitized & updated." -ForegroundColor Green
Write-Host "(Original stored at $backupPath)" -ForegroundColor DarkGreen
