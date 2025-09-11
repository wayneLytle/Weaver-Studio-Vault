# Start a Vite dev server in the background (detached) and run capture-and-compare.js
# On Windows prefer `npm.cmd` so the right shim is invoked. If that fails, fall back to cmd start.
$started = $false
try {
  $proc = Start-Process -FilePath "npm.cmd" -ArgumentList "run", "dev", "--", "--port", "5174" -WorkingDirectory "C:\Users\lytle\OneDrive\Desktop\Weavers Studio Entry" -PassThru -WindowStyle Hidden
  Write-Output "Started dev server via npm.cmd (PID=$($proc.Id))"
  $started = $true
} catch {
  Write-Output "npm.cmd start failed, falling back to cmd start..."
  try {
    $proc = Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "start", "/B", "npm", "run", "dev", "--", "--port", "5174" -WorkingDirectory "C:\Users\lytle\OneDrive\Desktop\Weavers Studio Entry" -PassThru -WindowStyle Hidden
    Write-Output "Started dev server via cmd start (PID=$($proc.Id))"
    $started = $true
  } catch {
    Write-Output "Failed to start dev server: $($_)"
    exit 3
  }
}

# Give the process a moment to spin up
Start-Sleep -Seconds 2

 # poll the dev server until it responds (timeout after 60s)
 $port = 5174
 $maxRetries = 90
 $i = 0
 $probeUrls = @("http://localhost:$port/","http://127.0.0.1:$port/","http://[::1]:$port/")
 while ($i -lt $maxRetries) {
  foreach ($u in $probeUrls) {
    try {
      # Use a short timeout and basic parsing for compatibility with PS 5.1
      $resp = Invoke-WebRequest -Uri $u -UseBasicParsing -TimeoutSec 3 -ErrorAction SilentlyContinue
      if ($resp -and $resp.StatusCode -lt 400) {
        Write-Output "Detected dev server responding at $u"
        break 2
      }
    } catch { }
  }
  Start-Sleep -Seconds 1
  $i++
  if ($i % 5 -eq 0) { Write-Output "Waiting for dev server to respond on port $port ($i/$maxRetries)..." }
 }
 if ($i -ge $maxRetries) {
  Write-Output "❌ Dev server did not become ready (HTTP probe) after $($maxRetries) seconds."; exit 2
 }
 if ($i -ge $maxRetries) {
  Write-Output "❌ Dev server did not become ready (TCP) after $($maxRetries) seconds."; exit 2
 }

cd "C:\Users\lytle\OneDrive\Desktop\Weavers Studio Entry"
# Ensure gh path is available in this session if installed
$env:Path = $env:Path + ";C:\Program Files\GitHub CLI"

node scripts/capture-and-compare.js
if ($LASTEXITCODE -eq 0) {
  Write-Output "✅ Capture and compare complete."
  Write-Output "✅ Capture complete."
  exit 0
} else {
  Write-Output "❌ Task failed with exit code $LASTEXITCODE"
  exit $LASTEXITCODE
}
