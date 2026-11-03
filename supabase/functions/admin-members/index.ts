// Edge Function: admin-members (PRD §12.3)
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

function toLoginId(input: string): string {
  return input.replace(/[^A-Za-z0-9]/g, '').toLowerCase()
}

function toAuthEmail(input: string, domain: string): string {
  return `${toLoginId(input)}@${domain}`
}

// 10 karakter acak tanpa karakter ambigu 0, O, 1, l, I (FR-MBR-02)
function generateTempPassword(length = 10): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  const randomBytes = new Uint8Array(length)
  crypto.getRandomValues(randomBytes)
  return Array.from(randomBytes, (b) => chars[b % chars.length]).join('')
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ code: 'AUTH_REQUIRED', message: 'Sesi berakhir. Silakan login kembali.' }),
        { status: 401, headers: corsHeaders }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const adminKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SECRET_KEY') || ''
    const authEmailDomain = Deno.env.get('AUTH_EMAIL_DOMAIN') || Deno.env.get('VITE_AUTH_EMAIL_DOMAIN') || 'anggota.sip.local'

    // 1. Klien dengan scope pengguna pemanggil
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ code: 'AUTH_REQUIRED', message: 'Sesi berakhir. Silakan login kembali.' }),
        { status: 401, headers: corsHeaders }
      )
    }

    // 2. Pastikan pemanggil adalah pustakawan aktif (Guard Pustakawan)
    const { data: callerProfile, error: profileError } = await userClient
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single()

    if (profileError || !callerProfile || callerProfile.role !== 'librarian' || !callerProfile.is_active) {
      return new Response(
        JSON.stringify({ code: 'FORBIDDEN', message: 'Anda tidak memiliki akses untuk tindakan ini.' }),
        { status: 403, headers: corsHeaders }
      )
    }

    // 3. Klien Admin untuk eksekusi operasi backend
    const adminClient = createClient(supabaseUrl, adminKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const body = await req.json()
    const { action } = body

    if (!action) {
      return new Response(
        JSON.stringify({ code: 'VALIDATION_ERROR', message: 'Aksi (action) wajib disertakan.' }),
        { status: 400, headers: corsHeaders }
      )
    }

    // -------------------------------------------------------------
    // AKSI: create (Tambah Anggota Tunggal)
    // -------------------------------------------------------------
    if (action === 'create') {
      const { member_code, full_name, role, class_name, major_id, subject, position, phone } = body

      if (!member_code || !full_name || !role) {
        return new Response(
          JSON.stringify({ code: 'VALIDATION_ERROR', message: 'Nomor induk, nama, dan peran wajib diisi.' }),
          { status: 400, headers: corsHeaders }
        )
      }

      if (role === 'student' && !class_name) {
        return new Response(
          JSON.stringify({ code: 'VALIDATION_ERROR', message: 'Kelas wajib diisi untuk siswa.' }),
          { status: 400, headers: corsHeaders }
        )
      }

      const loginId = toLoginId(member_code)
      if (loginId.length < 3 || loginId.length > 30) {
        return new Response(
          JSON.stringify({ code: 'VALIDATION_ERROR', message: 'Panjang nomor induk ternormalisasi harus 3–30 karakter.' }),
          { status: 400, headers: corsHeaders }
        )
      }

      // Cek apakah nomor induk sudah terdaftar
      const { data: existing } = await adminClient
        .from('profiles')
        .select('id')
        .eq('login_id', loginId)
        .maybeSingle()

      if (existing) {
        return new Response(
          JSON.stringify({ code: 'MEMBER_CODE_TAKEN', message: 'Nomor induk sudah terdaftar.' }),
          { status: 400, headers: corsHeaders }
        )
      }

      const tempPassword = generateTempPassword(10)
      const email = toAuthEmail(member_code, authEmailDomain)

      const createRes = await adminClient.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        app_metadata: { role },
        user_metadata: {
          member_code,
          full_name,
          role,
          class_name: class_name || null,
          major_id: major_id ? Number(major_id) : null,
          subject: subject || null,
          position: position || null,
          phone: phone || null,
          must_change_password: true,
        },
      })

      if (createRes.error) {
        return new Response(
          JSON.stringify({ code: 'VALIDATION_ERROR', message: createRes.error.message }),
          { status: 400, headers: corsHeaders }
        )
      }

      const createdUserId = createRes.data.user.id

      // Catat log aktivitas
      await adminClient.from('activity_logs').insert({
        actor_id: user.id,
        action: 'member.created',
        entity_type: 'member',
        entity_id: createdUserId,
        details: { member_code, full_name, role },
      })

      return new Response(
        JSON.stringify({ user_id: createdUserId, temp_password: tempPassword }),
        { status: 200, headers: corsHeaders }
      )
    }

    // -------------------------------------------------------------
    // AKSI: reset_password (Reset Password oleh Pustakawan)
    // -------------------------------------------------------------
    if (action === 'reset_password') {
      const { user_id } = body
      if (!user_id) {
        return new Response(
          JSON.stringify({ code: 'VALIDATION_ERROR', message: 'user_id wajib disertakan.' }),
          { status: 400, headers: corsHeaders }
        )
      }

      const { data: memberProfile } = await adminClient
        .from('profiles')
        .select('id, member_code')
        .eq('id', user_id)
        .maybeSingle()

      if (!memberProfile) {
        return new Response(
          JSON.stringify({ code: 'MEMBER_NOT_FOUND', message: 'Anggota tidak ditemukan.' }),
          { status: 404, headers: corsHeaders }
        )
      }

      const tempPassword = generateTempPassword(10)

      const updateRes = await adminClient.auth.admin.updateUserById(user_id, {
        password: tempPassword,
      })

      if (updateRes.error) {
        return new Response(
          JSON.stringify({ code: 'VALIDATION_ERROR', message: updateRes.error.message }),
          { status: 400, headers: corsHeaders }
        )
      }

      await adminClient
        .from('profiles')
        .update({ must_change_password: true })
        .eq('id', user_id)

      await adminClient.from('activity_logs').insert({
        actor_id: user.id,
        action: 'member.password_reset',
        entity_type: 'member',
        entity_id: user_id,
        details: { member_code: memberProfile.member_code },
      })

      return new Response(
        JSON.stringify({ temp_password: tempPassword }),
        { status: 200, headers: corsHeaders }
      )
    }

    // -------------------------------------------------------------
    // AKSI: set_active (Nonaktifkan / Aktifkan Anggota)
    // -------------------------------------------------------------
    if (action === 'set_active') {
      const { user_id, active } = body
      if (!user_id || typeof active !== 'boolean') {
        return new Response(
          JSON.stringify({ code: 'VALIDATION_ERROR', message: 'user_id dan active (boolean) wajib disertakan.' }),
          { status: 400, headers: corsHeaders }
        )
      }

      const { data: memberProfile } = await adminClient
        .from('profiles')
        .select('id, member_code')
        .eq('id', user_id)
        .maybeSingle()

      if (!memberProfile) {
        return new Response(
          JSON.stringify({ code: 'MEMBER_NOT_FOUND', message: 'Anggota tidak ditemukan.' }),
          { status: 404, headers: corsHeaders }
        )
      }

      const banDuration = active ? 'none' : '876000h'
      const banRes = await adminClient.auth.admin.updateUserById(user_id, {
        ban_duration: banDuration,
      })

      if (banRes.error) {
        return new Response(
          JSON.stringify({ code: 'VALIDATION_ERROR', message: banRes.error.message }),
          { status: 400, headers: corsHeaders }
        )
      }

      await adminClient
        .from('profiles')
        .update({ is_active: active })
        .eq('id', user_id)

      await adminClient.from('activity_logs').insert({
        actor_id: user.id,
        action: active ? 'member.activated' : 'member.deactivated',
        entity_type: 'member',
        entity_id: user_id,
        details: { member_code: memberProfile.member_code },
      })

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: corsHeaders }
      )
    }

    // -------------------------------------------------------------
    // AKSI: import (Impor Batch Anggota ≤ 50 baris)
    // -------------------------------------------------------------
    if (action === 'import') {
      const { rows } = body
      if (!Array.isArray(rows) || rows.length === 0 || rows.length > 50) {
        return new Response(
          JSON.stringify({ code: 'VALIDATION_ERROR', message: 'rows harus berupa array 1–50 baris data.' }),
          { status: 400, headers: corsHeaders }
        )
      }

      const results = []

      for (const row of rows) {
        const { member_code, full_name, role, class_name, major_id, subject, phone } = row

        if (!member_code || !full_name || !role) {
          results.push({
            row: member_code || 'Tanpa Kode',
            status: 'gagal',
            message: 'Field wajib tidak lengkap',
          })
          continue
        }

        const loginId = toLoginId(member_code)

        // Cek akun yang sudah ada
        const { data: existingProfile } = await adminClient
          .from('profiles')
          .select('id, role')
          .eq('login_id', loginId)
          .maybeSingle()

        if (existingProfile) {
          // Periksa aturan BR-15: peran tidak boleh diubah
          if (existingProfile.role !== role) {
            results.push({
              row: member_code,
              status: 'gagal',
              message: 'Perubahan peran tidak diizinkan (BR-15)',
            })
            continue
          }

          // Perbarui data yang ada (upsert)
          const { error: updateError } = await adminClient
            .from('profiles')
            .update({
              full_name,
              class_name: class_name || null,
              major_id: major_id ? Number(major_id) : null,
              subject: subject || null,
              phone: phone || null,
            })
            .eq('id', existingProfile.id)

          if (updateError) {
            results.push({
              row: member_code,
              status: 'gagal',
              message: updateError.message,
            })
          } else {
            await adminClient.from('activity_logs').insert({
              actor_id: user.id,
              action: 'member.updated',
              entity_type: 'member',
              entity_id: existingProfile.id,
              details: { member_code, full_name, source: 'import' },
            })

            results.push({
              row: member_code,
              status: 'diperbarui',
            })
          }
        } else {
          // Akun baru: buat akun Auth dan password sementara
          const tempPassword = generateTempPassword(10)
          const email = toAuthEmail(member_code, authEmailDomain)

          const createRes = await adminClient.auth.admin.createUser({
            email,
            password: tempPassword,
            email_confirm: true,
            app_metadata: { role },
            user_metadata: {
              member_code,
              full_name,
              role,
              class_name: class_name || null,
              major_id: major_id ? Number(major_id) : null,
              subject: subject || null,
              phone: phone || null,
              must_change_password: true,
            },
          })

          if (createRes.error) {
            results.push({
              row: member_code,
              status: 'gagal',
              message: createRes.error.message,
            })
          } else {
            await adminClient.from('activity_logs').insert({
              actor_id: user.id,
              action: 'member.imported',
              entity_type: 'member',
              entity_id: createRes.data.user.id,
              details: { member_code, full_name, role },
            })

            results.push({
              row: member_code,
              status: 'dibuat',
              temp_password: tempPassword,
            })
          }
        }
      }

      return new Response(
        JSON.stringify({ results }),
        { status: 200, headers: corsHeaders }
      )
    }

    return new Response(
      JSON.stringify({ code: 'VALIDATION_ERROR', message: `Aksi tidak dikenal: ${action}` }),
      { status: 400, headers: corsHeaders }
    )
  } catch (err: unknown) {
    const error = err as Error
    return new Response(
      JSON.stringify({ code: 'SERVER_ERROR', message: error.message }),
      { status: 500, headers: corsHeaders }
    )
  }
})
