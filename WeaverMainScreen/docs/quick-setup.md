# Quick Setup Instructions

## Set Environment Variable (Windows PowerShell)

# Option 1: Set from file path
$env:GOOGLE_APPLICATION_CREDENTIALS = "C:\path\to\your\service-account-key.json"

# Option 2: Set JSON content directly (single line, escaped quotes)
$env:GEMINI_SERVICE_ACCOUNT_JSON = '{"type":"service_account",...your JSON content...}'

## Test the setup
cd server
npm run dev

## For permanent setup, add to your .env file:
# GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\your\service-account-key.json
# or
# GEMINI_SERVICE_ACCOUNT_JSON={"type":"service_account",...}