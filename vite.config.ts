import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // host: true exposes the dev server on the local network so the iPad can open it.
  // strictPort: the address never changes; a second copy fails instead of starting on 5174,
  // where it would be forgotten and leave open tabs talking to a dead server.
  server: { host: true, port: 5173, strictPort: true },
  preview: { host: true, port: 4173 },
  test: {
    // Playwright specs live in tests/e2e and must not be picked up by Vitest.
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
