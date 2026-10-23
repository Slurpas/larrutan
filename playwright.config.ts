import { defineConfig, devices } from '@playwright/test'

// Separate ports from `npm run dev` (5173) so tests never reuse a dev server by accident.
const port = 5199
// The offline tests need a release build: the service worker only runs there.
const releasePort = 4199
const offlineSpec = /offline\.spec\.ts/
// Tests never play sound out loud: Chromium is muted, and tests/e2e/fixtures.ts mutes every page (WebKit has no flag).
const muted = { args: ['--mute-audio'] }

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'], launchOptions: muted }, testIgnore: offlineSpec },
    // WebKit is the closest automated stand-in for iPad Safari.
    { name: 'ipad-webkit', use: { ...devices['iPad (gen 7) landscape'] }, testIgnore: offlineSpec },
    {
      name: 'offline-chromium',
      use: { ...devices['Desktop Chrome'], launchOptions: muted, baseURL: `http://localhost:${releasePort}` },
      testMatch: offlineSpec,
    },
    {
      name: 'offline-webkit',
      use: { ...devices['iPad (gen 7) landscape'], baseURL: `http://localhost:${releasePort}` },
      testMatch: offlineSpec,
    },
  ],
  webServer: [
    {
      command: `npx vite --port ${port} --strictPort`,
      url: `http://localhost:${port}`,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `npx vite build --outDir .e2e-dist --emptyOutDir && npx vite preview --outDir .e2e-dist --port ${releasePort} --strictPort`,
      url: `http://localhost:${releasePort}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
})
