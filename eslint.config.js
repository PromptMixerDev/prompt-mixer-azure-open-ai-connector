/**
 * ESLint Configuration
 *
 * This configuration file follows the new flat config format introduced in ESLint v9.0.0.
 * It replaces the previous .eslintrc and .eslintignore files.
 */

import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
  // Apply ESLint recommended rules
  eslint.configs.recommended,

  // Apply TypeScript ESLint recommended rules
  {
    files: ['**/*.ts'],
    plugins: {
      '@typescript-eslint': tseslint,
      prettier: prettierPlugin,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        sourceType: 'module',
      },
      globals: {
        // Node.js global variables
        process: 'readonly',
        module: 'readonly',
        require: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        console: 'readonly',
        exports: 'writable',
        Buffer: 'readonly',
      },
    },
    rules: {
      // Disable base rule to avoid conflicts with TypeScript version
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { args: 'none' }],
      '@typescript-eslint/ban-ts-comment': 'off',
      'no-prototype-builtins': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      'prettier/prettier': 'error',
    },
  },

  // Apply Prettier config (must be last to override other configs)
  prettierConfig,

  // Ignore patterns (replacing .eslintignore)
  {
    ignores: ['node_modules/**', 'main.js'],
  },
];
