# Workload Identity Federation Setup Summary

## Your Repository Information:
- **GitHub Repository:** `wayneLytle/Weaver-Studio-Vault`
- **Google Cloud Project:** `weaver-studios`
- **Service Account:** `weaverstudiovault@weaver-studios.iam.gserviceaccount.com`

## What You Need to Do:

### 1. Get Your Project Number
```bash
gcloud projects describe weaver-studios --format="value(projectNumber)"
```
Save this number - you'll need it for the next steps.

### 2. Run the Setup Commands (in order)
Execute these commands from your terminal:

```bash
# Step 2: Create workload identity pool
gcloud iam workload-identity-pools create "github-actions-pool" \
    --project="weaver-studios" \
    --location="global" \
    --display-name="GitHub Actions Pool for Weaver Studios"

# Step 3: Create GitHub OIDC provider
gcloud iam workload-identity-pools providers create-oidc "github-provider" \
    --project="weaver-studios" \
    --location="global" \
    --workload-identity-pool="github-actions-pool" \
    --display-name="GitHub Actions OIDC Provider" \
    --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" \
    --issuer-uri="https://token.actions.githubusercontent.com"

# Step 4: Grant access (replace YOUR_PROJECT_NUMBER with the number from step 1)
gcloud iam service-accounts add-iam-policy-binding \
    "weaverstudiovault@weaver-studios.iam.gserviceaccount.com" \
    --project="weaver-studios" \
    --role="roles/iam.workloadIdentityUser" \
    --member="principalSet://iam.googleapis.com/projects/YOUR_PROJECT_NUMBER/locations/global/workloadIdentityPools/github-actions-pool/attribute.repository/wayneLytle/Weaver-Studio-Vault"
```

### 3. Update GitHub Workflow
- The workflow file `.github/workflows/deploy-with-workload-identity.yml` is ready
- Just replace `YOUR_PROJECT_NUMBER` with your actual project number

### 4. Test the Setup
- Commit and push your changes to trigger the GitHub Action
- Check the "Actions" tab in your GitHub repository
- Verify authentication works in the workflow logs

## Benefits After Setup:
- ✅ No more service account keys to manage
- ✅ Automatic token rotation
- ✅ Better security audit trail
- ✅ Reduced risk of credential leakage
- ✅ Compliance-friendly

## Troubleshooting:
- Ensure your GitHub repository has Actions enabled
- Double-check project number vs project ID
- Verify IAM bindings are correct with: `gcloud iam service-accounts get-iam-policy weaverstudiovault@weaver-studios.iam.gserviceaccount.com --project=weaver-studios`