# Security History Purge

(Placeholder)

## Purpose
If a secret (e.g., a cloud service account key, API token, private key) was ever committed, simply deleting the file in a new commit is NOT enough. The sensitive material remains in prior commits and can be recovered by anyone who cloned or fetches the repository history. A history purge rewrites Git objects to remove those blobs entirely.

## Decision Checklist
Before starting a destructive rewrite answer these:
1. Was the credential revoked/rotated already? (If not, rotate FIRST.)
2. Do you control all downstream forks? If not, assume they still have the secret forever.
3. Are there large binary files you also want to prune (opportunistic cleanup)?
4. Do you need to preserve commit SHAs for ongoing automation (release tags, CI caches)? If yes, consider leaving history intact and relying on rotation only.

If SHA stability is less critical than removing the risk, proceed.

## High-Level Steps
1. Identify offending paths / patterns.
2. Create a FRESH bare mirror clone.
3. Run a rewrite tool (BFG Repo-Cleaner or git filter-repo) to strip secrets.
4. Force-push ALL branches + tags.
5. Invalidate caches (GitHub Actions, dependency caches) if they reference old SHAs.
6. Notify collaborators to re-clone (NOT pull) or hard reset with care.

## 1. Offending Patterns
For previous incident (example):
```
weaver-studios-*.json
*.pem
*.pfx
```
Add any other specific filenames that contained secrets.

## 2. Fresh Mirror Clone
Use a separate temporary directory.
```bash
git clone --mirror https://github.com/wayneLytle/Weaver-Studio-Vault.git vault-cleanup.git
cd vault-cleanup.git
```

## 3A. BFG Repo-Cleaner Approach (Simpler)
Install BFG: https://rtyley.github.io/bfg-repo-cleaner/
```bash
# Remove the tracked secret JSON files (by name pattern)
java -jar bfg.jar --delete-files 'weaver-studios-*.json'

# Remove any PEM/PKCS12 keys ever committed
java -jar bfg.jar --delete-files '*.pem'
java -jar bfg.jar --delete-files '*.pfx'

# Remove literal strings (if small tokens appeared inline)
java -jar bfg.jar --replace-text ../bfg-replacements.txt
```
Create `../bfg-replacements.txt` containing lines like:
```
password==>***REMOVED***
PRIVATE KEY==>***REMOVED***
```
Then run Git’s cleanup + expire old objects:
```bash
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

## 3B. git filter-repo Approach (More Control)
Install: https://github.com/newren/git-filter-repo
```bash
git filter-repo --path-glob 'weaver-studios-*.json' --invert-paths --force
git filter-repo --path-glob '*.pem' --invert-paths --force
git filter-repo --path-glob '*.pfx' --invert-paths --force
```
For string scrubbing inside files (rare; usually rotate instead), create a replace spec:
```bash
printf 'OLD_SECRET_STRING==>REDACTED\n' > replacements.txt
git filter-repo --replace-text replacements.txt --force
```

## 4. Force Push Rewritten History
Double‑check you are in the mirror / cleanup clone.
```bash
git push --force --tags origin refs/heads/*
```
If repository has protected branches, temporarily disable protection in GitHub settings before force push (re‑enable afterwards).

## 5. Post-Purge Validation
In a NEW directory:
```bash
git clone https://github.com/wayneLytle/Weaver-Studio-Vault.git fresh-clone
cd fresh-clone
grep -R "BEGIN PRIVATE KEY" -n . || echo "No private key markers found"
grep -R "weaver-studios-" -n . || echo "No service account JSON remnants"
```

## 6. Collaborator Notice Template
```
Subject: ACTION REQUIRED – Repository History Rewritten to Remove Secrets

We performed a force-push rewriting Git history to eradicate previously committed secrets. Old commit SHAs are no longer canonical.

Required steps:
1. Move any uncommitted local changes aside (git stash / patch).
2. Re-clone fresh: git clone https://github.com/wayneLytle/Weaver-Studio-Vault.git
  (Alternative: git fetch origin; git reset --hard origin/main; git clean -fd)
3. Delete any old local clones or forks holding the removed data.

Do NOT push old rebased branches – they reintroduce removed objects.

If you maintain forks: repeat purge or recreate fork from scratch.

Thanks.
```

## 7. GitHub Actions & Caches
Purge caches referencing old SHAs (optional but cleaner):
```bash
gh cache list | awk '{print $1}' | xargs -n1 gh cache delete
```
If you don’t rely on cache API, simply let old caches age out.

## 8. Artifact & Release Review
If any release assets (GitHub Releases, container images) embedded the secret, revoke/rotate credentials again and rebuild fresh artifacts.

## 9. Prevent Recurrence
Already in place:
- Local & CI secret scanning (gitleaks)
- Ignore patterns for key material

Additional recommendations:
- Enforce branch protection requiring secret-scan job success.
- Adopt pre-commit hook running gitleaks (optional).

## 10. Rollback Contingency
If something critical was inadvertently removed:
1. Clone a pre-purge ref from someone’s local clone.
2. Cherry-pick required safe commits into the new history (avoid re-adding secret files).
3. NEVER force-push the old entire history again.

---
*Last updated: 2025-09-17*
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
