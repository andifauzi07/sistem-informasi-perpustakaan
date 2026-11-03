// Skrip bootstrap untuk membuat akun pustakawan pertama (PRD §13.1)
// Pemakaian: node --env-file=.env.local scripts/bootstrap-librarian.ts [--code PUSTAKAWAN01] [--name "Pustakawan Utama"] [--password "Perpus123!"] [--position "Kepala Perpustakaan"]
import { parseArgs } from 'node:util'
import { createClient } from '@supabase/supabase-js'
import { toAuthEmail } from '../src/features/auth/login-id.ts'

const { SUPABASE_URL, SUPABASE_SECRET_KEY, AUTH_EMAIL_DOMAIN, VITE_AUTH_EMAIL_DOMAIN } = process.env

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error('Galat: SUPABASE_URL dan SUPABASE_SECRET_KEY wajib diisi di environment/.env.local')
  process.exit(1)
}

const domain = AUTH_EMAIL_DOMAIN || VITE_AUTH_EMAIL_DOMAIN || 'anggota.sip.local'

const { values } = parseArgs({
  options: {
    code: { type: 'string', default: 'PUSTAKAWAN01' },
    name: { type: 'string', default: 'Pustakawan Utama' },
    password: { type: 'string', default: 'Perpus123!' },
    position: { type: 'string', default: 'Kepala Perpustakaan' },
  },
})

const memberCode = values.code
const fullName = values.name
const password = values.password
const position = values.position
const email = toAuthEmail(memberCode, domain)

if (password.length < 8) {
  console.error('Galat: Password minimal 8 karakter (BR-21)')
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

console.log(`Membuat akun pustakawan untuk: ${fullName} (${memberCode})...`)

const res = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  app_metadata: { role: 'librarian' },
  user_metadata: {
    member_code: memberCode,
    full_name: fullName,
    role: 'librarian',
    position,
    must_change_password: true,
  },
})

if (res.error) {
  console.error(`Gagal membuat akun pustakawan: [${res.error.code}] ${res.error.message}`)
  process.exit(1)
}

console.log('✓ Akun pustakawan pertama berhasil dibuat!')
console.log(`  User ID       : ${res.data.user.id}`)
console.log(`  Nomor Induk   : ${memberCode}`)
console.log(`  Email Sintetis: ${email}`)
console.log(`  Password Awal : ${password}`)
console.log(`  Peran         : librarian`)
console.log(`  Jabatan       : ${position}`)
console.log('\nSilakan login ke aplikasi dengan Nomor Induk dan password tersebut.')
