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

$files = git ls-files | Where-Object { -not ($_ -match 'node_modules|dist|build|bin|obj') }
$hits = @()
foreach ($f in $files) {
  $content = Get-Content $f -Raw -ErrorAction SilentlyContinue
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
exit 2
