import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', '.e2e-dist', 'test-results', 'playwright-report', 'blob-report']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
  },
  {
    // Browser tests must use the muted `test` from fixtures.ts, so they never play sound out loud.
    files: ['tests/e2e/**/*.ts'],
    ignores: ['tests/e2e/fixtures.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        { paths: [{ name: '@playwright/test', importNames: ['test'], message: "Import `test` from './fixtures' (it mutes all audio)." }] },
      ],
    },
  },
])
