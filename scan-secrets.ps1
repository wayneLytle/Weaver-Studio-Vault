param(
  [switch]$Staged,
  [switch]$Unstaged
)
$ErrorActionPreference = 'Stop'
Write-Host "[scan-secrets] Starting secret scan..." -ForegroundColor Cyan

function Test-CommandExists {
  param([string]$Name)
  Get-Command $Name -ErrorAction SilentlyContinue
}

$gitArgs = @()
if ($Staged) { $gitArgs += '--staged' }
if ($Unstaged) { $gitArgs += '--unstaged' }

if (Test-CommandExists -Name gitleaks) {
  Write-Host "[scan-secrets] Using gitleaks" -ForegroundColor Green
  if ($gitArgs.Count -gt 0) {
    gitleaks detect --config .gitleaks.toml --no-banner --verbose @gitArgs
  } else {
    gitleaks detect --config .gitleaks.toml --no-banner --verbose
  }
  exit $LASTEXITCODE
}

Write-Warning "gitleaks not found; using basic grep-style fallback (less accurate)."
$patterns = @(
  'sk-[A-Za-z0-9]{20,}',
  'API[_-]?KEY["''=: \t]{0,10}[A-Za-z0-9_\-]{16,64}',
  '-----BEGIN (RSA |EC |)PRIVATE KEY-----',
  '"type"\s*:\s*"service_account"',
  '(AccountKey|SharedAccessKey)=[A-Za-z0-9+/=]{32,}'
)

$files = git ls-files | Where-Object { -not ($_ -match 'node_modules|dist|build|bin|obj|\.gitleaks\.toml') }
$hits = @()
foreach ($f in $files) {
  # -Raw not available in Windows PowerShell 5.1, emulate
  $content = (Get-Content $f -ErrorAction SilentlyContinue) -join "`n"
  foreach ($p in $patterns) {
    if ($content -match $p) {
      $hits += [pscustomobject]@{ File=$f; Pattern=$p }
    }
  }
}
if ($hits.Count -eq 0) {
  Write-Host "[scan-secrets] No potential secrets found in fallback scan." -ForegroundColor Green
  exit 0
}
Write-Warning "[scan-secrets] Potential secrets detected (fallback heuristic):"
$hits | Format-Table -AutoSize | Out-String | Write-Host

# Treat matches only in config patterns as informational (currently none expected beyond .gitleaks exclusion)
exit 2
