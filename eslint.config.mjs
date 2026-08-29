import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

/**
 * One config for both workspaces. The server had no linter at all before this;
 * the client's rules are unchanged, just scoped to client files now that the
 * server shares the config.
 */
export default defineConfig([
  globalIgnores(['**/dist/**', '**/node_modules/**', 'client/src/assets/**']),

  // Client — browser globals plus the React rules.
  {
    files: ['client/**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: { ecmaVersion: 2020, globals: globals.browser },
    rules: {
      // This repo had no linter until now, so these two land on a lot of working
      // code. Kept as warnings: they are worth seeing and worth burning down, but
      // failing CI on pre-existing style would just mean nobody runs the linter.
      // Anything genuinely broken is still an error.
      '@typescript-eslint/no-explicit-any': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
    },
  },

  // Server — Node globals, no React.
  {
    files: ['server/**/*.ts', 'api/**/*.ts'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: { ecmaVersion: 2022, globals: globals.node },
    rules: {
      // Express error middleware and Mongoose lean objects make a handful of
      // `any`s pragmatic. Flagged as warnings so they are visible without
      // failing the build; Phase 8 types AuthRequest properly.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          // `const { password, ...user } = doc.toObject()` is how the auth routes
          // strip the hash before responding. The discarded binding is the point.
          ignoreRestSiblings: true,
        },
      ],
    },
  },
]);
