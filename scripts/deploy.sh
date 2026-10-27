#!/usr/bin/env bash
# Builds the web app for the real project and deploys Hosting, Functions and the Firestore rules and indexes.
# Usage: scripts/deploy.sh [project alias from .firebaserc, default: dev]
set -euo pipefail
cd "$(dirname "$0")/.."

PROJECT="${1:-dev}"

scripts/check.sh
# Without EXPO_PUBLIC_FIREBASE_EMULATORS, the build uses the real project config.
(cd frontend && env -u EXPO_PUBLIC_FIREBASE_EMULATORS npx expo export -p web)
firebase deploy --project "$PROJECT"
