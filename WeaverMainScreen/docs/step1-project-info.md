# Step 1: Get Project Information

# You'll need both project ID and project NUMBER (they're different!)
# Project ID: weaver-studios (you already have this)
# Project Number: You need to get this

# Run this command to get your project number:
gcloud projects describe weaver-studios --format="value(projectNumber)"

# Or find it in the Google Cloud Console:
# 1. Go to https://console.cloud.google.com
# 2. Select your "weaver-studios" project
# 3. Go to "Project Settings" 
# 4. Copy the "Project number" (it's a long number like 123456789012)