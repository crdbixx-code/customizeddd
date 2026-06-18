import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Standard "fetch data in an effect, setState on resolve" pattern is used
      // intentionally throughout this app's data-loading pages.
      'react-hooks/set-state-in-effect': 'off',
      // Several context files intentionally export a hook alongside the provider component.
      'react-refresh/only-export-components': 'off',
    },
  },
])
