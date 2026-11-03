## Context

Sistem Informasi Perpustakaan SMKN 1 Selayar membutuhkan autentikasi pengguna dan manajemen data anggota pada Milestone M1 (PRD §18). Sesuai PRD §5.2 dan §13.1, registrasi publik dinonaktifkan demi privasi dan integritas data sekolah. Akun dibuat secara terpusat oleh pustakawan (baik satu per satu maupun via impor Excel) menggunakan nomor induk (NIS/NIP) yang dipetakan ke email sintetis Supabase Auth (`<login_id>@<AUTH_EMAIL_DOMAIN>`).

## Goals / Non-Goals

**Goals:**
- Mengimplementasikan skema database inti M1: `majors`, `profiles`, `activity_logs`, dan default `loan_policies` beserta RLS dan trigger `handle_new_user`.
- Mengimplementasikan RPC `complete_password_change()` dan helper `private.is_librarian()`.
- Mengimplementasikan Edge Function Deno `admin-members` untuk penambahan, pengubahan, reset password, aktivasi, dan impor batch akun anggota.
- Mengimplementasikan antarmuka autentikasi: `/login`, `/ganti-password`, `/profil`, dan route guard TanStack Router pada layout `_app`.
- Mengimplementasikan antarmuka manajemen anggota pustakawan di `/pustakawan/anggota` (tabel, filter, paginasi 20 baris, modal CRUD, dan dialog impor Excel).
- Memenuhi seluruh pengujian otomatis: pgTAP (RLS & RPC), Vitest (util & skema), dan Playwright E2E (TC-AUT-01 s.d. 07, TC-MBR-01 s.d. 07).

**Non-Goals:**
- Pembuatan kartu fisik cetak PDF ID-1 (FR-CARD-01 s.d. 04) yang dialokasikan pada Milestone M4.
- Transaksi peminjaman, pengembalian, dan denda riil yang dialokasikan pada Milestone M3.
- Impor data buku atau katalog yang dialokasikan pada Milestone M2.
- Self-registration publik atau pemulihan kata sandi via email pihak ketiga (Won't v1).

## Decisions

### 1. Struktur Migrasi Database & Keamanan RLS
- **Migrasi**: Membuat berkas migrasi SQL untuk enum `app_role`, tabel `majors`, `profiles`, `activity_logs`, dan `loan_policies`.
- **Trigger `handle_new_user`**: Dipasang pada tabel `auth.users (AFTER INSERT)` untuk memindahkan metadata (`raw_app_meta_data.role`, `raw_user_meta_data`) ke dalam `public.profiles` secara atomik.
- **Fungsi Helper Private**: Dibuat di skema `private` (tidak diekspos ke PostgREST API):
  - `private.is_librarian()`: Memeriksa apakah `auth.uid()` memiliki peran `librarian` aktif di `profiles`.
  - `private.current_app_role()`: Mengembalikan enum `app_role` pengguna aktif.
  - `private.today_wita()`: Mengembalikan tanggal hari ini zona Asia/Makassar (`(now() at time zone 'Asia/Makassar')::date`).
  - `private.log_activity(p_action, p_entity_type, p_entity_id, p_details)`: Menulis ke tabel `activity_logs`.
- **Kebijakan RLS (PRD §13.3)**:
  - `profiles`: SELECT diizinkan jika `auth.uid() = id` atau `(select private.is_librarian())`. UPDATE diizinkan untuk pustakawan (kecuali identitas terkunci) atau pengguna sendiri (hanya nomor telepon). INSERT dan DELETE dilarang untuk publik/authenticated (hanya melalui trigger auth atau Service Role).
  - `activity_logs`: SELECT hanya untuk pustakawan `(select private.is_librarian())`. INSERT/UPDATE/DELETE dilarang (hanya melalui fungsi berstatus `SECURITY DEFINER`).
  - `majors`: SELECT diizinkan untuk semua pengguna terotentikasi. INSERT/UPDATE/DELETE hanya untuk pustakawan.
  - `loan_policies`: SELECT untuk authenticated, UPDATE hanya untuk pustakawan.
- **RPC `complete_password_change()`**: Dijalankan dengan `SECURITY DEFINER` untuk mengubah `must_change_password = false` pada profil pengguna pemanggil (`auth.uid()`).

### 2. Arsitektur Edge Function `admin-members`
- **Lokasi & Runtime**: `supabase/functions/admin-members/index.ts` dengan Deno runtime.
- **Otorisasi**: Memakai pembungkus `withSupabase({ auth: 'user' })` dari `@supabase/server` versi 1.x. Memvalidasi bahwa profil pengguna pemanggil aktif dan berstatus `librarian`. Jika tidak, mengembalikan HTTP 403 `FORBIDDEN`.
- **Operasi Admin**:
  - `create`: Memanggil `ctx.supabaseAdmin.auth.admin.createUser` dengan `email_confirm: true`, password acak 10 karakter, dan metadata profil.
  - `import`: Menerima array baris (maksimal 50 baris per panggilan). Melakukan pengecekan `member_code`. Jika akun sudah ada dan perannya sama, lakukan pembaruan data profil. Jika peran berbeda, tolak baris tersebut (BR-15). Jika belum ada, buat akun baru. Mengembalikan array status per baris.
  - `reset_password`: Menghasilkan password acak baru via `crypto.getRandomValues`, mengupdate password akun di Auth, dan menyetel `must_change_password = true`.
  - `set_active`: Memperbarui `is_active` di profil dan mengubah `ban_duration` di Auth (`876000h` saat nonaktif, `'none'` saat aktif).
- **Pencatatan Audit**: Setiap aksi yang berhasil dicatat ke `activity_logs` dengan format PRD §12.2.

### 3. Route Guard & Alur Frontend
- **Normalisasi Login**: Memakai modul tunggal `src/features/auth/login-id.ts` untuk membersihkan spasi/tanda baca dan mengubah ke huruf kecil.
- **Root & App Layout (`src/routes/_app.tsx`)**:
  - `beforeLoad` memeriksa keberadaan sesi aktif. Jika tidak ada sesi, pengguna dialihkan ke `/login`.
  - Jika `profiles.must_change_password === true` dan rute saat ini bukan `/ganti-password`, pengguna dipaksa dialihkan ke `/ganti-password`.
- **Rute Pustakawan (`src/routes/_app/pustakawan/route.tsx`)**:
  - `beforeLoad` memeriksa apakah peran pengguna adalah `librarian`. Jika bukan, pengguna dialihkan ke `/beranda` dengan pesan toast galat `FORBIDDEN`.
- **Lazy Loading Impor Excel**:
  - Komponen dialog impor di `/pustakawan/anggota` memuat modul `read-excel-file` hanya saat dialog dibuka (`const { default: readXlsxFile } = await import('read-excel-file')`), menjaga agar bundle utama login/katalog tetap di bawah 250 KB gzip (NFR-PE-03).

---

## Ponytail

Penerapan tangga keputusan Ponytail untuk kode dan komponen baru pada change ini:

1. **Password Generator Acak 10 Karakter**:
   - *(1) Perlu ada?* Ya, diwajibkan oleh FR-MBR-02 dan FR-MBR-05 untuk kredensial sementara.
   - *(2) Cukup pustaka standar?* Ya. Menggunakan API bawaan `crypto.getRandomValues` dengan charset tanpa karakter ambigu `0, O, 1, l, I`.
   - *(3) Cukup satu fungsi murni ringkas?* Ya, sekitar 8 baris kode tanpa dependensi eksternal.

2. **Parser dan Pembaca Berkas Excel**:
   - *(1) Perlu ada?* Ya, diwajibkan oleh FR-MBR-06 untuk impor data siswa/guru.
   - *(2) Cukup pustaka standar?* Tidak, parsing format biner `.xlsx` membutuhkan pustaka khusus.
   - *(3) Ada dependensi terpasang?* Ya, `read-excel-file` sudah tercantum di stack CLAUDE.md §2.
   - *(4) Optimasi ukuran bundle?* Wajib lazy load dinamis (`await import('read-excel-file')`) hanya di rute pustakawan agar tidak membebani rute siswa/guru.

3. **Komponen Tabel & Form**:
   - *(1) Perlu ada?* Ya, untuk daftar anggota dan formulir penambahan.
   - *(2) Ada dependensi terpasang?* Menggunakan kombinasi TanStack Table v8, React Hook Form, Zod v4, dan komponen primitif shadcn/ui yang sudah ada. Tidak menambahkan komponen atau pustaka pihak ketiga baru.

4. **Koneksi dan State Server**:
   - *(1) Perlu ada?* Ya, untuk sinkronisasi data anggota dan profil.
   - *(2) Ada dependensi terpasang?* TanStack Query v5 dengan query key factory terpusat (`memberKeys`). Tidak menggunakan Supabase Realtime (sesuai CLAUDE.md §8).

---

## Risks / Trade-offs

- **[Risiko] Rate limit panggilan Admin API Supabase saat impor massal ratusan baris**:
  → *Mitigasi*: Frontend membatasi dan memecah berkas Excel menjadi *batch* berukuran maksimal 50 baris per pemanggilan Edge Function, dengan jeda antar-batch dan indikator progres visual.
- **[Risiko] Inkonsistensi data `profiles` bila pembuatan akun di `auth.users` gagal**:
  → *Mitigasi*: Pembuatan baris profil dikerjakan via PostgreSQL AFTER INSERT trigger di transaksi yang sama pada database Supabase.
- **[Risiko] Pembengkakan ukuran bundle JS awal pada rute umum**:
  → *Mitigasi*: Rute pustakawan dipisahkan dengan auto code-splitting TanStack Router, dan `read-excel-file` di-lazy-load di dalam event handler dialog impor.

---

## Migration Plan

1. Buat migrasi SQL baru dan terapkan ke Supabase lokal (`npx supabase db reset`).
2. Generate tipe TypeScript database (`npm run db:types`).
3. Jalankan tes pgTAP untuk memvalidasi RLS dan RPC (`npm run db:test`).
4. Implementasikan dan jalankan Deno Edge Function `admin-members` lokal.
5. Bangun API layer, skema Zod, dan komponen UI di frontend.
6. Verifikasi linting, typecheck, unit test Vitest, dan uji Playwright E2E.
