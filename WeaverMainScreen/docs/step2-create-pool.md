# Step 2: Create Workload Identity Pool

# This creates a "pool" that external identities can use to authenticate

# 1. Create the workload identity pool
gcloud iam workload-identity-pools create "github-actions-pool" \
    --project="weaver-studios" \
    --location="global" \
    --display-name="GitHub Actions Pool for Weaver Studios"

# 2. Verify it was created
gcloud iam workload-identity-pools list --location="global" --project="weaver-studios"

# Expected output should show your new pool