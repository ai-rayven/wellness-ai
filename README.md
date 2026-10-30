# Sano

Nutrition and weight logging app. Expo (React Native) PWA on Firebase.
See [docs/mvp.md](docs/mvp.md) for scope, decisions and the data model.

## Requirements

- Node 22 or later
- Firebase CLI: pinned in the root `package.json`, installed by `npm ci` at the repo root
- Java 11 or later (for the Firestore emulator)

## Setup

```sh
npm ci                                              # Firebase CLI
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

## CI

GitHub Actions runs `scripts/check.sh` on every PR and on `main` (`.github/workflows/check.yml`).
On `main`, once the gate passes, it deploys to the `dev` project with the service account key in the `FIREBASE_SERVICE_ACCOUNT` secret.
On a PR, it also posts phone screenshots of the main screens (`frontend/e2e/screens.spec.ts`) in one comment.
The images are on the `ci-screens` branch, because GitHub has no API to attach images to a comment.

## Edamam keys

Without keys, `searchFoods` in the emulator answers with mock foods, and the emulator logs that it cannot find the secrets.
To use real Edamam data on your machine, create `backend/functions/.secret.local` (git ignores it):

```sh
EDAMAM_APP_ID=...
EDAMAM_APP_KEY=...
```

For production, store them in Secret Manager with `firebase functions:secrets:set EDAMAM_APP_ID` and `EDAMAM_APP_KEY`.

## GitHub token

`reportIssue` creates the issues that users send from the Profile tab in this repo. In the emulator without a token, it answers with a fake issue #1 and creates nothing.
For production, create a fine-grained personal access token with access to only this repo and the permission **Issues: Read and write**. Then store it with `firebase functions:secrets:set GITHUB_ISSUES_TOKEN`.
Screenshots go to Cloud Storage, so the project needs its default bucket (Firebase console > Storage). The issue shows them by their download URL, which anyone with the link can open: the repo is public, so the screenshots are too.

## Invites

Only invited emails can create an account. The `checkInvite` function (a Firebase Auth blocking function) reads the list from the Firestore document `config/access`, field `emails` (an array of strings). Edit it in the Firebase console. Without the document, no one can create an account. Accounts that exist already are not affected, so to remove access, also delete the account in Authentication.
Blocking functions need Firebase Authentication with Identity Platform. The E2E tests invite `ana@example.com`.
