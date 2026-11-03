import fs from 'node:fs'
import path from 'node:path'
import { seedE2E } from '../scripts/seed-e2e.ts'

export default async function globalSetup() {
  if (!process.env.SUPABASE_SECRET_KEY) {
    const envPath = path.resolve(process.cwd(), '.env.local')
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8')
      for (const line of content.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        const eqIdx = trimmed.indexOf('=')
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim()
          const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '')
          if (!process.env[key]) {
            process.env[key] = val
          }
        }
      }
    }
  }

  await seedE2E()
}
