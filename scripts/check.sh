#!/usr/bin/env bash
# Full gate: typecheck, lint and tests for the frontend and the Cloud Functions.
set -euo pipefail
cd "$(dirname "$0")/.."

npm --prefix frontend run check
npm --prefix backend/functions run check
