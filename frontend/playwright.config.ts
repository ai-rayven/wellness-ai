import { defineConfig, devices } from '@playwright/test';

// E2E tests on the production web build against the Firebase emulators.
// Run through scripts/check.sh, which starts the emulators.
const PORT = 8090;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: true,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    ...devices['iPhone 13'],
    browserName: 'chromium',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `EXPO_PUBLIC_FIREBASE_EMULATORS=1 npx expo export -p web && npx expo serve --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
