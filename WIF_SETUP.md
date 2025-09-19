# Workload Identity Federation Setup (GitHub Actions -> Google Cloud)

This document summarizes the configuration enabling GitHub Actions in this repository to impersonate the Google Cloud service account **weaverstudiovault@weaver-studios.iam.gserviceaccount.com** without storing JSON keys.

---
## Components
- **Project ID:** `weaver-studios`
- **Project Number:** `413404577713`
- **Service Account:** `weaverstudiovault@weaver-studios.iam.gserviceaccount.com`
- **Workload Identity Pool:** `weaver-ci-pool` (global)
- **OIDC Provider ID:** `github`
- **Provider Resource:** `projects/413404577713/locations/global/workloadIdentityPools/weaver-ci-pool/providers/github`
- **Condition (attributeCondition):** `attribute.repository=="wayneLytle/Weaver-Studio-Vault"`

This condition restricts tokens to workflows originating from this exact repository. (Add branch or actor restrictions later if desired.)

---
## Attribute Mapping
```
google.subject=assertion.sub
attribute.repository=assertion.repository
attribute.actor=assertion.actor
attribute.ref=assertion.ref
attribute.sha=assertion.sha
```
Mapped claims become provider attributes usable in conditions.

---
## IAM Binding
Service account granted role:
- `roles/iam.workloadIdentityUser` to principal set:
  `principalSet://iam.googleapis.com/projects/413404577713/locations/global/workloadIdentityPools/weaver-ci-pool/attribute.repository/wayneLytle/Weaver-Studio-Vault`

This allows identities whose OIDC token includes repository attribute equal to `wayneLytle/Weaver-Studio-Vault` to impersonate the service account through WIF.

---
## GitHub Actions Usage
Workflow snippet (see `.github/workflows/ci.yml`):
```yaml
permissions:
  id-token: write
  contents: read

env:
  GCP_PROJECT_ID: weaver-studios
  GCP_PROJECT_NUMBER: 413404577713

steps:
  - uses: actions/checkout@v4
  - name: Google Auth (WIF)
    uses: google-github-actions/auth@v2
    with:
      workload_identity_provider: projects/${{ env.GCP_PROJECT_NUMBER }}/locations/global/workloadIdentityPools/weaver-ci-pool/providers/github
      service_account: weaverstudiovault@${{ env.GCP_PROJECT_ID }}.iam.gserviceaccount.com
```
After this step Application Default Credentials (ADC) calls will authenticate as the service account.

---
## Optional Hardening
Examples of updating the provider condition:
1. Restrict to main branch only:
   ```bash
   gcloud iam workload-identity-pools providers update-oidc github \
     --workload-identity-pool=weaver-ci-pool --location=global \
     --attribute-condition='attribute.repository=="wayneLytle/Weaver-Studio-Vault" && attribute.ref=="refs/heads/main"' \
     --project=weaver-studios
   ```
2. Also ensure actor is the GitHub Actions system user:
   ```bash
   --attribute-condition='attribute.repository=="wayneLytle/Weaver-Studio-Vault" && attribute.ref=="refs/heads/main" && attribute.actor=="github-actions"'
   ```

---
## Granting Additional Permissions
Grant least-privilege roles to the service account only as needed, e.g.:
```bash
gcloud projects add-iam-policy-binding weaver-studios \
  --member=serviceAccount:weaverstudiovault@weaver-studios.iam.gserviceaccount.com \
  --role=roles/artifactregistry.reader
```

---
## Revocation / Cleanup
Remove WIF access if necessary:
```bash
# Remove IAM binding from service account
PROJECT_NUMBER=413404577713
SA=weaverstudiovault@weaver-studios.iam.gserviceaccount.com
gcloud iam service-accounts remove-iam-policy-binding "$SA" \
  --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/weaver-ci-pool/attribute.repository/wayneLytle/Weaver-Studio-Vault" \
  --project=weaver-studios

# (Optional) Delete provider & pool
gcloud iam workload-identity-pools providers delete github \
  --workload-identity-pool=weaver-ci-pool --location=global --project=weaver-studios --quiet

gcloud iam workload-identity-pools delete weaver-ci-pool \
  --location=global --project=weaver-studios --quiet
```

---
## Troubleshooting
| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| Auth step fails: principal not in set | Branch or repo mismatch | Check provider condition vs `github.ref` & `github.repository` |
| 403 permission denied after auth | Missing role for resource | Grant specific IAM role to service account |
| INVALID_ARGUMENT on provider creation | Org policy requires condition | Include `--attribute-condition` (as done) |
| No CI run | Wrong branch or workflow file path | Ensure push to `main` and file at `.github/workflows/` |

---
## References
- Google Cloud WIF Docs: https://cloud.google.com/iam/docs/workload-identity-federation
- GitHub Actions OIDC Docs: https://docs.github.com/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect
