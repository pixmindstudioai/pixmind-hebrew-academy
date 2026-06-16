#!/usr/bin/env bash
# Deploy the apple-iap-verify edge function + set its secrets.
#
# PREREQUISITE: a Supabase access token (Personal Access Token) with deploy rights:
#   export SUPABASE_ACCESS_TOKEN=sbp_xxxxxxxxxxxxxxxx
#
# IMPORTANT — the Apple key for APPLE_IAP_PRIVATE_KEY:
#   This function calls the App Store *Server* API (api.storekit.itunes.apple.com).
#   That API requires an **In-App Purchase** key, generated in App Store Connect at
#   Users and Access -> Integrations -> In-App Purchase (NOT a general "App Store
#   Connect API" team key). Create one if you don't have it, then fill in the 3 values
#   below from that key. (KEY_ID = the key's id, ISSUER_ID = the issuer shown on that
#   page, PRIVATE_KEY = the .p8 file contents.)
set -euo pipefail

PROJECT_REF="agodijuyujiliengmail"

# ---- FILL THESE IN (from your App Store Connect In-App Purchase key) ----
APPLE_IAP_KEY_ID="REPLACE_WITH_IAP_KEY_ID"
APPLE_IAP_ISSUER_ID="REPLACE_WITH_IAP_ISSUER_ID"
APPLE_IAP_P8_PATH="REPLACE_WITH_PATH_TO/AuthKey_XXXX.p8"
# ------------------------------------------------------------------------

cd "$(dirname "$0")/.."

echo "==> Deploying function apple-iap-verify"
supabase functions deploy apple-iap-verify --project-ref "$PROJECT_REF"

echo "==> Setting secrets"
supabase secrets set --project-ref "$PROJECT_REF" \
  APPLE_IAP_KEY_ID="$APPLE_IAP_KEY_ID" \
  APPLE_IAP_ISSUER_ID="$APPLE_IAP_ISSUER_ID" \
  APPLE_IAP_BUNDLE_ID="com.pixmind.academy" \
  APPLE_IAP_PRIVATE_KEY="$(cat "$APPLE_IAP_P8_PATH")"

echo "==> Done. Verify it responds (401 = deployed & requires auth, which is correct):"
curl -s -o /dev/null -w "apple-iap-verify HTTP %{http_code}\n" -X POST \
  "https://${PROJECT_REF}.supabase.co/functions/v1/apple-iap-verify" \
  -H "Content-Type: application/json" -d '{}'
