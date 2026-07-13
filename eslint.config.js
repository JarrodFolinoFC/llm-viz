import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

// Inlined from the ai monorepo's @repo/eslint-config when this app went
// standalone; the rule choices and their rationale are unchanged.
export default defineConfig([
  globalIgnores(['dist', 'storybook-static', 'node_modules', 'coverage']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // Stylistic Vite-fast-refresh hint and the new (React-19) react-hooks
      // "compiler" rules surface long-standing intentional patterns across the
      // apps. Keep them visible as warnings rather than hard CI failures; the
      // genuine-correctness rules (rules-of-hooks, the typescript-eslint set)
      // stay errors.
      'react-refresh/only-export-components': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      // Intentional special spaces (e.g. an en-space for indentation) inside
      // strings/templates are fine; still catch stray ones in code.
      'no-irregular-whitespace': ['error', { skipStrings: true, skipTemplates: true }],
    },
  },
  {
    // Storybook story `render` functions legitimately call hooks and use
    // expression statements; they aren't production components.
    files: ['**/*.stories.{ts,tsx}'],
    rules: {
      'react-hooks/rules-of-hooks': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
    },
  },
]);
