import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { libAliases } from './vite.config';
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [react()],
  // Resolve the vendored lib packages (mlblocks, shared-ui, the vimium stub) to
  // their source under ./lib, same as the app build — see vite.config.ts.
  resolve: {
    alias: libAliases,
  },
  test: {
    projects: [{
      extends: true,
      test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./tests/setup.ts'],
        include: ['tests/**/*.test.{ts,tsx}'],
        // These jsdom tests run concurrently with the storybook browser
        // project, whose chromium workers saturate the CPU; a file's first
        // render (antd + the full flow page) can then blow the 5s default.
        testTimeout: 15000
      }
    }, {
      extends: true,
      plugins: [
      // The plugin will run tests for the stories defined in your Storybook config
      // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
      storybookTest({
        configDir: path.join(dirname, '.storybook')
      })],
      // aria-query (pulled in by the addon's @testing-library setup) is CJS;
      // without pre-bundling, Vite serves it raw to the browser and its named
      // exports (elementRoles) fail to resolve. Surfaced by the npm-hoisted
      // layout after the app left the pnpm monorepo.
      optimizeDeps: {
        include: ['aria-query', '@testing-library/dom', '@testing-library/jest-dom'],
      },
      test: {
        name: 'storybook',
        browser: {
          enabled: true,
          headless: true,
          provider: playwright({}),
          instances: [{
            browser: 'chromium'
          }]
        }
      }
    }]
  }
});