import { defineConfig, devices } from '@playwright/test'

// A separate port from `npm run dev` (5173) so tests never reuse a dev server by accident.
const port = 5199

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
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    // WebKit is the closest automated stand-in for iPad Safari.
    { name: 'ipad-webkit', use: { ...devices['iPad (gen 7) landscape'] } },
  ],
  webServer: {
    command: `npx vite --port ${port} --strictPort`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
  },
})
