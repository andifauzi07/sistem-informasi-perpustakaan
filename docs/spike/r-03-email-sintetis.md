# Spike R-03 — Email sintetis untuk login NIS/NIP

| | |
|---|---|
| Tanggal | 2026-10-22 |
| Tujuan | Memastikan Supabase Auth menerima email sintetis `<login_id>@<AUTH_EMAIL_DOMAIN>` (ADR-03, R-03, PRD §17.1) |
| Supabase CLI | 2.121.0 (GoTrue lokal v2.197.0) |
| `@supabase/supabase-js` | 2.118.0 |
| Skrip | `scripts/spike-auth-domain.ts` |
| Kesimpulan | **Diterima.** ADR-03 tetap berlaku; tidak ada perubahan baseline PRD. |

## Langkah per domain

1. `admin.createUser` dengan nomor induk `21.10.0456` (→ `21100456@<domain>`), `email_confirm: true`, dan password acak.
2. `signInWithPassword` dengan input `2110 0456` (format berbeda, login_id sama) memakai publishable key.
3. `admin.updateUserById(…, { ban_duration: '24h' })`, lalu login ulang dengan password benar.
4. `admin.deleteUser` di blok `finally`.

Jalankan ulang dengan `node --env-file=<berkas env> scripts/spike-auth-domain.ts <domain> [domain…]`.

## Hasil

| Lingkungan | Domain | Buat akun | Login (`2110 0456`) | Login setelah ban | Hapus |
|---|---|---|---|---|---|
| Lokal | `anggota.sip.local` | OK | OK | Ditolak `400 user_banned` | OK |
| Lokal | `sip-smkn1-selayar.vercel.app` | OK | OK | Ditolak `400 user_banned` | OK |
| Lokal | `example.com` (kontrol) | OK | OK | Ditolak `400 user_banned` | OK |
| `sip-dev` | `sip-smkn1-selayar.vercel.app` | OK | OK | Ditolak `400 user_banned` | OK |
| `sip-dev` | `example.com` (kontrol) | OK | OK | Ditolak `400 user_banned` | OK |

- Hosted GoTrue di `sip-dev` menerima kedua domain. Tidak ada pemeriksaan DNS/MX yang menolak, sehingga asumsi "cukup izin penamaan" (Open Question design) tetap berlaku.
- Kontrol `example.com` juga diterima. Artinya, tidak ada daftar domain terlarang yang memengaruhi alur ini.
- Setelah spike, `auth.users` di lokal maupun `sip-dev` berisi 0 akun uji.

## Bahan FR-AUTH-06 (akun nonaktif)

Login akun yang di-ban mengembalikan `AuthApiError` dengan `status = 400`, `code = 'user_banned'`, dan pesan `User is banned`. Pemetaan pesan Indonesia di `src/lib/errors.ts` (M1) memakai `error.code === 'user_banned'`, bukan teks pesan.

## Temuan konfigurasi

`[auth.email] enable_signup = false` di `config.toml` **mematikan provider email**. Akibatnya, login password ikut gagal dengan `422 email_provider_disabled`. Pendaftaran publik cukup dimatikan lewat `[auth] enable_signup = false` (hasil uji: `422 signup_disabled`). Di Dashboard cloud, yang dimatikan hanya "Allow new users to sign up", sedangkan provider Email tetap Enabled. Design D6 sudah diperbarui.

## Tindak lanjut

- Domain final belum diputuskan (PRD §20.4). Jalankan ulang spike dengan domain final ke `sip-dev` sebelum impor akun asli (M6).
