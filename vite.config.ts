import { createHash } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { voiceReview } from './scripts/voiceReviewPlugin'

/**
 * Writes sw.js from src/pwa/serviceWorker.js with the list of every file in the build,
 * so the installed game can cache all of it and play offline (PRD §12).
 */
function serviceWorker(): Plugin {
  return {
    name: 'larrutan-service-worker',
    apply: 'build',
    // After Vite has added index.html to the bundle.
    enforce: 'post',
    generateBundle(_options, bundle) {
      const hash = createHash('sha256')
      const files: string[] = []
      for (const [name, file] of Object.entries(bundle)) {
        files.push(name)
        hash.update(name).update(file.type === 'chunk' ? file.code : file.source)
      }
      const publicFiles = readdirSync('public', { recursive: true, withFileTypes: true }).filter((entry) => entry.isFile())
      for (const entry of publicFiles) {
        const path = join(entry.parentPath, entry.name)
        files.push(path.slice('public/'.length).replaceAll('\\', '/'))
        hash.update(path).update(readFileSync(path))
      }
      const source = readFileSync('src/pwa/serviceWorker.js', 'utf8')
        .replace("'__VERSION__'", JSON.stringify(hash.digest('hex').slice(0, 12)))
        .replace('__FILES__', JSON.stringify(files.sort()))
      this.emitFile({ type: 'asset', fileName: 'sw.js', source })
    },
  }
}

export default defineConfig({
  plugins: [react(), serviceWorker(), voiceReview()],
  // Relative paths, so the game works from any folder on any static host.
  base: './',
  define: {
    // Shown on the start screen of a release build, so it's easy to tell which version an iPad has.
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  // host: true exposes the dev server on the local network so the iPad can open it.
  // strictPort: the address never changes; a second copy fails instead of starting on 5174,
  // where it would be forgotten and leave open tabs talking to a dead server.
  server: { host: true, port: 5173, strictPort: true },
  preview: { host: true, port: 4173 },
  // Phaser alone is about 1.4 MB; it is loaded separately, after the start screen (src/world/loadHubGame.ts).
  build: { chunkSizeWarningLimit: 1500 },
  test: {
    // Playwright specs live in tests/e2e and must not be picked up by Vitest.
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
