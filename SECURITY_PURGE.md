# Repository History Purge Guide

This project previously contained committed secrets (service account JSON + API key). Although removed from the working tree, the blobs still exist in Git history until rewritten.

## 1. Prerequisites
- Ensure all keys are revoked/rotated BEFORE rewriting history.
- Communicate to collaborators: they must stop pushing until purge completes.
- Install `git-filter-repo` (preferred) or use BFG as fallback.

### Install git-filter-repo (PowerShell)
```
pip install git-filter-repo
```
Verify:
```
git filter-repo --help | Select-String "usage"
```

## 2. Identify Sensitive Paths
Already removed:
- `weaver-studios-1b4ae433618e.json`
- `WeaverMainScreen/server/.env` (old secret-bearing versions)

Optionally also purge any stray commits containing `sk-` or `private_key`.

Scan current tree (should return none or placeholder only):
```
git grep -I "sk-" || echo None
git grep -I "private_key" || echo None
```

## 3. Rewrite History
Run from repo root:
```
# Remove specific files entirely from history
git filter-repo --invert-paths \
  --path weaver-studios-1b4ae433618e.json \
  --path WeaverMainScreen/server/.env
```
If additional secreted file paths are discovered, append more `--path` entries.

## 4. Force Push Updated History
```
git push --force --all
git push --force --tags
```

## 5. Invalidate Old Clones
Instruct all collaborators:
1. Archive or delete their local clone (DO NOT merge old refs back).
2. Re-clone fresh.
3. Regenerate personal `.env` from `.env.example`.

## 6. Post-Purge Verification
```
git clone <repo-url> fresh-clone
cd fresh-clone
git grep -I "sk-" || echo OK
git grep -I "private_key" || echo OK
```

## 7. Add Continuous Protection
- Enable a secret scanning tool (e.g., GitHub Advanced Security, Gitleaks in CI).
- Add a pre-commit hook using `detect-secrets` or `git-secrets`.
- Periodically rotate high-impact credentials (every 90 days recommended).

## 8. Document Rotation Events
Maintain a changelog entry (internal) listing:
- Date rotated
- Secret type (no actual value)
- Reason (initial purge / routine / incident)

## 9. Remove This File (Optional)
After execution and team acknowledgment, you may delete this guide or keep it for institutional memory.

---
Prepared: 2025-09-17
