# Step 3: Create GitHub OIDC Provider

# This tells Google Cloud to trust GitHub's identity tokens

gcloud iam workload-identity-pools providers create-oidc "github-provider" \
    --project="weaver-studios" \
    --location="global" \
    --workload-identity-pool="github-actions-pool" \
    --display-name="GitHub Actions OIDC Provider" \
    --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" \
    --issuer-uri="https://token.actions.githubusercontent.com"

# Verify the provider was created
gcloud iam workload-identity-pools providers list \
    --workload-identity-pool="github-actions-pool" \
    --location="global" \
    --project="weaver-studios"