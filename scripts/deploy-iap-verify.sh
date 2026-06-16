#!/usr/bin/env bash
# Deploy the apple-iap-verify edge function + set its secrets.
#
# WHERE TO RUN: Terminal on this Mac, from the project root. Just two steps:
#
#   export SUPABASE_ACCESS_TOKEN=sbp_xxxxxxxxxxxxxxxx     # your Supabase Personal Access Token
#   ./scripts/deploy-iap-verify.sh
#
# Get the token at: https://supabase.com/dashboard/account/tokens  ("Generate new token").
#
# Apple key: this uses the App Store Connect key already staged at
#   ~/.appstoreconnect/private_keys/AuthKey_QL644HRXHD.p8
# which was verified to authenticate against the App Store *Server* API in the
# Sandbox environment (what App Review uses). For long-term production robustness
# you may later switch APPLE_IAP_* to a dedicated "In-App Purchase" key, but it is
# NOT required to pass review.
set -euo pipefail

PROJECT_REF="agodijuyujiliengmail"
APPLE_IAP_KEY_ID="QL644HRXHD"
APPLE_IAP_ISSUER_ID="7bf7e9b1-7f73-416d-afa8-28fabb6c29c4"
APPLE_IAP_P8_PATH="${HOME}/.appstoreconnect/private_keys/AuthKey_QL644HRXHD.p8"

if [ -z "${SUPABASE_ACCESS_TOKEN:-}" ]; then
  echo "ERROR: export SUPABASE_ACCESS_TOKEN=sbp_... first (https://supabase.com/dashboard/account/tokens)" >&2
  exit 1
fi
if [ ! -f "$APPLE_IAP_P8_PATH" ]; then
  echo "ERROR: Apple key not found at $APPLE_IAP_P8_PATH" >&2
  exit 1
fi

cd "$(dirname "$0")/.."

echo "==> Deploying function apple-iap-verify"
supabase functions deploy apple-iap-verify --project-ref "$PROJECT_REF"

echo "==> Setting secrets"
supabase secrets set --project-ref "$PROJECT_REF" \
  APPLE_IAP_KEY_ID="$APPLE_IAP_KEY_ID" \
  APPLE_IAP_ISSUER_ID="$APPLE_IAP_ISSUER_ID" \
  APPLE_IAP_BUNDLE_ID="com.pixmind.academy" \
  APPLE_IAP_PRIVATE_KEY="$(cat "$APPLE_IAP_P8_PATH")"

echo "==> Done. Verifying (401 = deployed & requires auth = correct):"
curl -s -o /dev/null -w "apple-iap-verify HTTP %{http_code}\n" -X POST \
  "https://${PROJECT_REF}.supabase.co/functions/v1/apple-iap-verify" \
  -H "Content-Type: application/json" -d '{}'
