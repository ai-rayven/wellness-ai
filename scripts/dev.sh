#!/usr/bin/env bash
# Firebase emulators + Expo web together. Ctrl-C stops both.
# The demo- project id runs fully offline, with no real project or credentials.
set -euo pipefail
cd "$(dirname "$0")/.."

npm --prefix backend/functions run build
npm --prefix backend/functions run build:watch &
firebase emulators:start --project demo-sano &
EXPO_PUBLIC_FIREBASE_EMULATORS=1 npm --prefix frontend run web &

trap 'kill 0' EXIT
wait
