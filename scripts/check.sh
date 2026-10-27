#!/usr/bin/env bash
# Full gate: typecheck, lint and tests for the frontend and the Cloud Functions,
# then the E2E tests on the web build against the emulators.
set -euo pipefail
cd "$(dirname "$0")/.."

npm --prefix frontend run check
npm --prefix backend/functions run check
firebase emulators:exec --project demo-sano --only auth,firestore,functions,storage "npm --prefix frontend run e2e"
