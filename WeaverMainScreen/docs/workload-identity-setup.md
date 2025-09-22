# Workload Identity Federation Setup Guide

## Overview
This guide helps you replace service account keys with Workload Identity Federation for enhanced security.

## Prerequisites
- Google Cloud project: `weaver-studios`
- Service account: `weaverstudiovault@weaver-studios.iam.gserviceaccount.com`
- gcloud CLI installed and configured

## Step 1: Create Workload Identity Pool

```bash
# Create the workload identity pool
gcloud iam workload-identity-pools create "github-pool" \
    --project="weaver-studios" \
    --location="global" \
    --display-name="GitHub Actions Pool"

# Create a provider for GitHub Actions
gcloud iam workload-identity-pools providers create-oidc "github-provider" \
    --project="weaver-studios" \
    --location="global" \
    --workload-identity-pool="github-pool" \
    --display-name="GitHub Actions Provider" \
    --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
    --issuer-uri="https://token.actions.githubusercontent.com"
```

## Step 2: Grant Access to Service Account

```bash
# Allow the workload identity pool to impersonate your service account
gcloud iam service-accounts add-iam-policy-binding \
    "weaverstudiovault@weaver-studios.iam.gserviceaccount.com" \
    --project="weaver-studios" \
    --role="roles/iam.workloadIdentityUser" \
    --member="principalSet://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/attribute.repository/YOUR_GITHUB_REPO"
```

## Step 3: Update GitHub Actions Workflow

```yaml
name: Deploy
on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write  # Required for OIDC

    steps:
    - uses: actions/checkout@v4
    
    - id: 'auth'
      name: 'Authenticate to Google Cloud'
      uses: 'google-github-actions/auth@v2'
      with:
        workload_identity_provider: 'projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/providers/github-provider'
        service_account: 'weaverstudiovault@weaver-studios.iam.gserviceaccount.com'
    
    - name: 'Set up Cloud SDK'
      uses: 'google-github-actions/setup-gcloud@v2'
    
    - name: 'Deploy application'
      run: |
        # Your deployment commands here
        # No need to set GOOGLE_APPLICATION_CREDENTIALS
```

## Step 4: Update Application Code

The application code remains the same - Google's auth libraries automatically detect and use Workload Identity when available.

## Security Benefits
- ✅ No long-lived secrets to manage
- ✅ Automatic token rotation
- ✅ Scoped access per repository/environment
- ✅ Full audit trail in Google Cloud
- ✅ No risk of key leakage

## Troubleshooting
- Ensure GitHub repo has OIDC permissions enabled
- Verify project number vs project ID in configurations
- Check IAM bindings are correct
- Review Google Cloud audit logs for auth failures