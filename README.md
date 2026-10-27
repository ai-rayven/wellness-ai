# Sano

Nutrition and weight logging app. Expo (React Native) PWA on Firebase.
See [docs/mvp.md](docs/mvp.md) for scope, decisions and the data model.

## Requirements

- Node 22 or later
- Firebase CLI (`npm install -g firebase-tools`)
- Java 11 or later (for the Firestore emulator)

## Setup

```sh
npm --prefix frontend install
npm --prefix backend/functions install
npx --prefix frontend playwright install chromium   # for the E2E tests
```

## Commands

| Command | What it does |
| --- | --- |
| `scripts/dev.sh` | Starts the Firebase emulators (offline `demo-sano` project) and Expo web. Ctrl-C stops both. |
| `scripts/deploy.sh [alias]` | Runs the gate, builds the web app for the real project and deploys Hosting, Functions and the Firestore rules. The alias comes from `.firebaserc` (default `dev`). |
| `scripts/check.sh` | Typecheck, lint and tests for the frontend and the Cloud Functions. The functions and E2E tests run in the emulators, so stop `dev.sh` first. |

Expo web runs on http://localhost:8081 and the Emulator UI on http://localhost:4000.

## Edamam keys

Without keys, `searchFoods` in the emulator answers with mock foods, and the emulator logs that it cannot find the secrets.
To use real Edamam data on your machine, create `backend/functions/.secret.local` (git ignores it):

```sh
EDAMAM_APP_ID=...
EDAMAM_APP_KEY=...
```

For production, store them in Secret Manager with `firebase functions:secrets:set EDAMAM_APP_ID` and `EDAMAM_APP_KEY`.
