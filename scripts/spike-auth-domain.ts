// Spike R-03: apakah Supabase Auth menerima email sintetis <login_id>@<domain>?
// Pakai: node --env-file=.env.local scripts/spike-auth-domain.ts <domain> [domain…]
import { parseArgs } from 'node:util'
import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { toAuthEmail } from '../src/features/auth/login-id.ts'

const { SUPABASE_URL, SUPABASE_SECRET_KEY, VITE_SUPABASE_PUBLISHABLE_KEY } = process.env
if (!SUPABASE_URL || !SUPABASE_SECRET_KEY || !VITE_SUPABASE_PUBLISHABLE_KEY) {
  throw new Error('SUPABASE_URL, SUPABASE_SECRET_KEY, dan VITE_SUPABASE_PUBLISHABLE_KEY wajib diisi')
}
const { positionals: domains } = parseArgs({ allowPositionals: true })
if (domains.length === 0) throw new Error('Sebutkan minimal satu domain kandidat')

const noSession = { auth: { persistSession: false, autoRefreshToken: false } }
const admin = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, noSession)

for (const domain of domains) {
  const password = randomUUID()
  // Klien baru per domain agar sesi login sebelumnya tidak terbawa.
  const anon = createClient(SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, noSession)
  console.log(`\n== ${domain}`)
  const created = await admin.auth.admin.createUser({
    email: toAuthEmail('21.10.0456', domain),
    password,
    email_confirm: true,
  })
  if (created.error) {
    console.log(`  buat akun : DITOLAK ${created.error.status} ${created.error.code} — ${created.error.message}`)
    continue
  }
  const userId = created.data.user.id
  try {
    console.log(`  buat akun : OK ${created.data.user.email}`)
    const login = await anon.auth.signInWithPassword({ email: toAuthEmail('2110 0456', domain), password })
    console.log(`  login     : ${login.error ? `GAGAL ${login.error.status} ${login.error.code} — ${login.error.message}` : 'OK, sesi terbentuk'}`)

    const ban = await admin.auth.admin.updateUserById(userId, { ban_duration: '24h' })
    if (ban.error) throw ban.error
    const banned = await anon.auth.signInWithPassword({ email: toAuthEmail('2110 0456', domain), password })
    console.log(`  login ban : ${banned.error ? `DITOLAK ${banned.error.status} ${banned.error.code} — ${banned.error.message}` : 'LOLOS (tidak diharapkan!)'}`)
  } finally {
    const del = await admin.auth.admin.deleteUser(userId)
    console.log(`  hapus     : ${del.error ? `GAGAL ${del.error.message}` : 'OK'}`)
  }
}
