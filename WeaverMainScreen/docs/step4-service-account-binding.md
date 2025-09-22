# Step 4: Grant Workload Identity Access to Service Account

# Replace YOUR_PROJECT_NUMBER with the project number from Step 1
# GitHub Repository: wayneLytle/Weaver-Studio-Vault

# Grant the workload identity pool permission to impersonate your service account
gcloud iam service-accounts add-iam-policy-binding \
    "weaverstudiovault@weaver-studios.iam.gserviceaccount.com" \
    --project="weaver-studios" \
    --role="roles/iam.workloadIdentityUser" \
    --member="principalSet://iam.googleapis.com/projects/YOUR_PROJECT_NUMBER/locations/global/workloadIdentityPools/github-actions-pool/attribute.repository/wayneLytle/Weaver-Studio-Vault"

# For production-only access (restricts to main branch):
# gcloud iam service-accounts add-iam-policy-binding \
#     "weaverstudiovault@weaver-studios.iam.gserviceaccount.com" \
#     --project="weaver-studios" \
#     --role="roles/iam.workloadIdentityUser" \
#     --member="principalSet://iam.googleapis.com/projects/YOUR_PROJECT_NUMBER/locations/global/workloadIdentityPools/github-actions-pool/attribute.repository/wayneLytle/Weaver-Studio-Vault/ref/refs/heads/main"

# For more restrictive access, you can limit to specific branches:
# --member="principalSet://iam.googleapis.com/projects/YOUR_PROJECT_NUMBER/locations/global/workloadIdentityPools/github-actions-pool/attribute.repository/YOUR_GITHUB_USERNAME/YOUR_REPOSITORY_NAME/ref/refs/heads/main"