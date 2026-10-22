import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

export default defineConfig({
  // Plugin router wajib sebelum react() agar code splitting berjalan.
  plugins: [tanstackRouter({ target: 'react', autoCodeSplitting: true, routeFileIgnorePattern: '\\.test\\.' }), react(), tailwindcss()],
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    // Nilai palsu: tes unit tidak pernah menghubungi Supabase.
    env: { VITE_SUPABASE_URL: 'http://localhost:54321', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test' },
  },
})
