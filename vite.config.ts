import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // host: true exposes the dev server on the local network so the iPad can open it.
  server: { host: true, port: 5173 },
  preview: { host: true, port: 4173 },
  test: {
    // Playwright specs live in tests/e2e and must not be picked up by Vitest.
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
