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
```

## Commands

| Command | What it does |
| --- | --- |
| `scripts/dev.sh` | Starts the Firebase emulators (offline `demo-sano` project) and Expo web. Ctrl-C stops both. |
| `scripts/check.sh` | Typecheck, lint and tests for the frontend and the Cloud Functions. |

Expo web runs on http://localhost:8081 and the Emulator UI on http://localhost:4000.
