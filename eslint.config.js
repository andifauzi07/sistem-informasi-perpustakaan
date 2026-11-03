import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import pluginQuery from '@tanstack/eslint-plugin-query'
import pluginRouter from '@tanstack/eslint-plugin-router'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores([
    'dist',
    'playwright-report',
    'test-results',
    'src/routeTree.gen.ts',
    'src/types/database.types.ts',
    'supabase/functions/**',
  ]),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      pluginQuery.configs['flat/recommended'],
      pluginRouter.configs['flat/recommended'],
    ],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      // Berkas rute TanStack wajib mengekspor `Route`, dan komponen shadcn mengekspor varian konstan.
      'react-refresh/only-export-components': [
        'warn',
        { allowExportNames: ['Route'], allowConstantExport: true },
      ],
      // TanStack Router memakai throw redirect(...) yang melempar objek Redirect.
      '@typescript-eslint/only-throw-error': [
        'error',
        { allow: ['Redirect', 'NotFoundError'] },
      ],
    },
  },
])
