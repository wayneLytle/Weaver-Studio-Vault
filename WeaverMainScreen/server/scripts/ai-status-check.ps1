param(
  [string]$BaseUrl = 'http://localhost:4101'
)
Write-Host "[ai-check] Base URL: $BaseUrl"

function Get-Json($path){
  try { return Invoke-RestMethod -UseBasicParsing -Uri $path -Method Get -TimeoutSec 15 } catch { return @{ error = $_.Exception.Message } }
}

$status = Get-Json "$BaseUrl/api/ai/status"
Write-Host "[ai-check] /api/ai/status =>" ($status | ConvertTo-Json -Depth 6)

if($status.error){ Write-Warning "Status endpoint error: $($status.error)" }

if(-not $status.engines.openai.configured){ Write-Warning "OpenAI not configured (OPENAI_API_KEY missing)" }
else {
  $openai = Get-Json "$BaseUrl/selftest/openai"
  Write-Host "[ai-check] /selftest/openai =>" ($openai | ConvertTo-Json -Depth 4)
}

if($status.engines.gemini.configured){
  $gemini = Get-Json "$BaseUrl/selftest/gemini"
  Write-Host "[ai-check] /selftest/gemini =>" ($gemini | ConvertTo-Json -Depth 4)
}
else { Write-Host "[ai-check] Gemini not configured (GOOGLE_PROJECT_ID missing)" }

$fail = @()
if($status.engines.openai.configured -and $openai.error){ $fail += "OpenAI selftest failed" }
if($status.engines.gemini.configured -and $gemini.error){ $fail += "Gemini selftest failed" }

if($fail.Count -gt 0){
  Write-Error ("AI validation failed: " + ($fail -join ', '))
  exit 1
}
Write-Host "[ai-check] Success: AI configuration validated"
exit 0
