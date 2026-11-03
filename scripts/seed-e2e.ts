// Skrip penyiapan data pengguna uji untuk Playwright E2E
import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { toAuthEmail } from '../src/features/auth/login-id.ts'

function ensureEnvLoaded() {
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
}

export async function seedE2E() {
  ensureEnvLoaded()

  const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321'
  const secretKey = process.env.SUPABASE_SECRET_KEY
  const domain = process.env.AUTH_EMAIL_DOMAIN || process.env.VITE_AUTH_EMAIL_DOMAIN || 'anggota.sip.local'

  if (!secretKey) {
    console.error('Galat: SUPABASE_SECRET_KEY wajib diisi')
    process.exit(1)
  }

  const admin = createClient(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  async function getOrCreateUser(opts: {
    memberCode: string
    fullName: string
    role: 'librarian' | 'student' | 'teacher'
    password: string
    mustChangePassword: boolean
    isActive: boolean
    className?: string
    position?: string
  }) {
    const email = toAuthEmail(opts.memberCode, domain)
    
    // Periksa apakah user sudah ada
    const { data: listData } = await admin.auth.admin.listUsers()
    const existing = listData?.users.find((u) => u.email === email)

    let userId: string
    if (existing) {
      userId = existing.id
      await admin.auth.admin.updateUserById(userId, {
        password: opts.password,
        app_metadata: { role: opts.role },
        user_metadata: {
          member_code: opts.memberCode,
          full_name: opts.fullName,
          role: opts.role,
          class_name: opts.className,
          position: opts.position,
          must_change_password: opts.mustChangePassword,
        },
      })
    } else {
      const res = await admin.auth.admin.createUser({
        email,
        password: opts.password,
        email_confirm: true,
        app_metadata: { role: opts.role },
        user_metadata: {
          member_code: opts.memberCode,
          full_name: opts.fullName,
          role: opts.role,
          class_name: opts.className,
          position: opts.position,
          must_change_password: opts.mustChangePassword,
        },
      })
      if (res.error) throw res.error
      userId = res.data.user.id
    }

    // Update profil langsung via admin
    const { error: profileErr } = await admin
      .from('profiles')
      .update({
        full_name: opts.fullName,
        is_active: opts.isActive,
        must_change_password: opts.mustChangePassword,
        class_name: opts.className,
        position: opts.position,
      })
      .eq('id', userId)

    if (profileErr) throw profileErr

    console.log(`✓ User siap: ${opts.memberCode} (${opts.role})`)
  }

  console.log('Menyiapkan data pengguna E2E...')

  // 1. Pustakawan Utama
  await getOrCreateUser({
    memberCode: 'PUSTAKAWAN01',
    fullName: 'Pustakawan Utama',
    role: 'librarian',
    password: 'Perpus123!',
    mustChangePassword: false,
    isActive: true,
    position: 'Kepala Perpustakaan',
  })

  // 2. Siswa Aktif Normal
  await getOrCreateUser({
    memberCode: 'SISWA01',
    fullName: 'Ahmad Siswa',
    role: 'student',
    password: 'Password123!',
    mustChangePassword: false,
    isActive: true,
    className: 'X TKJ 1',
  })

  // 3. Siswa Baru (Wajib ganti password)
  await getOrCreateUser({
    memberCode: 'SISWABARU01',
    fullName: 'Siswa Baru',
    role: 'student',
    password: 'Password123!',
    mustChangePassword: true,
    isActive: true,
    className: 'X RPL 1',
  })

  // 4. Siswa Nonaktif
  await getOrCreateUser({
    memberCode: 'NONAKTIF01',
    fullName: 'Siswa Nonaktif',
    role: 'student',
    password: 'Password123!',
    mustChangePassword: false,
    isActive: false,
    className: 'XI AKL 1',
  })

  console.log('✓ Data pengguna E2E selesai disiapkan.')
}

// Jalankan jika dieksekusi langsung
if (import.meta.url.endsWith(process.argv[1]?.replace(/\\/g, '/') || '')) {
  seedE2E().catch((err) => {
    console.error('Galat seed E2E:', err)
    process.exit(1)
  })
}
