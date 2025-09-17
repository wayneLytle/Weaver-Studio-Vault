# Credential Handling & Google Cloud Service Accounts

A Google Cloud service account key file was previously committed and has been removed. Treat any exposed key as compromised.

## Immediate Required Actions (Maintainers)
1. Revoke the old key in Google Cloud Console (IAM & Admin > Service Accounts > Keys).  
2. If needed, create a new key ONLY for local development. Prefer Workload Identity Federation for CI/CD.
3. Distribute new keys out-of-band (never via Git).  
4. Ensure all contributors pull the rewritten history after the key purge.

## Local Developer Setup
Place your key outside the repository:
```
%USERPROFILE%\secrets\gcp-weaver.json
```
Set environment variable (PowerShell):
```
$env:GOOGLE_APPLICATION_CREDENTIALS = "$env:USERPROFILE\secrets\gcp-weaver.json"
```
Persist for future sessions:
```
setx GOOGLE_APPLICATION_CREDENTIALS "%USERPROFILE%\secrets\gcp-weaver.json"
```
Restart the terminal to pick up `setx` changes.

## Git Ignore Protections
Patterns added in `.gitignore` block typical secret file names:
- `weaver-studios-*.json`  
- `**/secrets/*.json`  
- `*-key.json`, `*service-account*.json`  
- Generic: `*.pem`, `*.key`, `.env*` (except `.env.example`)

## Rotating Keys
When rotation is required:
1. Revoke old key first.
2. Generate new key.
3. Update local secret file path if name changes.
4. Avoid committing the key by keeping it outside the repo.

## CI/CD Recommendation
Use Workload Identity Federation (GCP) instead of JSON keys. See:  
https://cloud.google.com/iam/docs/workload-identity-federation

## Auditing For Secrets
Run manual scans periodically:
```
git grep -I "private_key" || true
git grep -I "AIza" || true
git grep -I "sk-" || true
```
Consider adding automated secret scanning (e.g., GitHub Advanced Security, trufflehog, gitleaks) in CI.

## Automated Secret Scanning (Local)

We provide a configurable scanning script plus VS Code tasks.

### Script
`scan-secrets.ps1` supports two modes:
```
powershell -NoProfile -ExecutionPolicy Bypass -File ./scan-secrets.ps1          # Full repo
powershell -NoProfile -ExecutionPolicy Bypass -File ./scan-secrets.ps1 -Staged # Only staged changes
```
If `gitleaks` is installed it will be used with `.gitleaks.toml`; otherwise a fallback regex heuristic runs.

### Exit Codes
- `0` = Clean (no findings)
- `2` = Potential secrets detected (review output; rotate/rewrite if confirmed)
- Any other non‑zero = Execution error (tool missing, permission issue, etc.)

### VS Code Tasks
Tasks added in `.vscode/tasks.json`:
- `Security: Scan Secrets (All)`
- `Security: Scan Secrets (Staged)`

Invoke via Command Palette: `Tasks: Run Task`.

### Adding Gitleaks
Install (Windows PowerShell):
```
winget install --id zricethezav.gitleaks -e
```
Or download from: https://github.com/gitleaks/gitleaks/releases

### Custom Rules
Edit `.gitleaks.toml` to extend or tune detection (add allowlist entries for false positives rather than deleting rules).

### Developer Workflow Recommendation
1. Run staged scan before each commit.
2. If findings appear: validate, move any real secret out of repo, rotate the credential, amend commit.
3. Only commit after a clean staged scan.

## Automated Secret Scanning (CI)
GitHub Actions workflow `.github/workflows/secret-scan.yml` runs on pushes and PRs to `main`/`master`:
- Primary step: `gitleaks` with repository `.gitleaks.toml` (fails build on findings with exit code 2).
- Fallback step: basic regex grep executes if primary job fails (provides minimal visibility even if tool update breaks).

Developer responsibilities when CI fails:
1. Review workflow log for redacted findings.
2. Reproduce locally with `scan-secrets.ps1 -Staged` or raw `gitleaks detect`.
3. If true secret: purge (history rewrite if already merged), rotate credential, document remediation.
4. If false positive: add a targeted allowlist entry in `.gitleaks.toml` rather than disabling the rule globally.

Security note: Do not blanket ignore patterns that could hide future real secrets (avoid ignoring entire directories containing source code).

## Future: Capability Signaling
Server currently returns `X-Export-Status: disabled` for document conversions (DOCX/PDF) while conversion library support is incomplete. Frontend can check headers to decide whether to use client-side export fallbacks.

## Incident Remediation Log
| Date (UTC) | Item | Action | Notes |
|------------|------|--------|-------|
| 2025-09-17 | GCP service account key (private_key_id=1b4ae4...) | Revoked | Old project / key discarded; new project created. |
| 2025-09-17 | Repo scan | Confirmed removal | File absent; patterns in `.gitignore` block re-add. |
| 2025-09-17 | Secret scanning | CI + local scripts active | `.gitleaks.toml` rule detects JSON key pattern. |

Follow‑up (Recommended): migrate fully to Workload Identity Federation; avoid reintroducing JSON keys unless strictly necessary for local offline development.

## Contact
Report any accidental exposure immediately to the project maintainers.
