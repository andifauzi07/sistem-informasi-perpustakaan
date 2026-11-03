## Why

Sistem Informasi Perpustakaan SMKN 1 Selayar membutuhkan fondasi autentikasi pengguna dan manajemen data anggota sebelum modul katalog, sirkulasi, dan pelaporan dapat berjalan. Change ini merealisasikan **Milestone M1** (PRD §18) untuk menggantikan pencatatan buku besar manual dan menyediakan akses berbasis peran (Siswa, Guru, Pustakawan) secara aman tanpa registrasi publik.

## What Changes

- **Skema Database & Keamanan**:
  - Migrasi tabel `majors`, `profiles`, `activity_logs`, dan konfigurasi dasar `loan_policies`.
  - Fungsi keamanan `private.is_librarian()`, `private.today_wita()`, dan trigger `handle_new_user` saat akun dibuat di `auth.users`.
  - Kebijakan RLS ketat pada `profiles` dan `activity_logs` (PRD §13.3).
  - RPC `complete_password_change()` untuk menonaktifkan bendera `must_change_password`.
- **Backend Admin & Edge Function**:
  - Edge Function Deno `admin-members` untuk operasi admin (buat akun tunggal, ubah data, setel status aktif, reset password, dan batch impor).
  - Skrip bootstrap pustakawan pertama (`scripts/bootstrap-librarian.ts`) dan data seed lokal fiktif (`supabase/seed.sql`).
- **Antarmuka Autentikasi (Frontend)**:
  - Halaman login (`/login`) dengan nomor induk (NIS/NIP) + password, pesan galat generik, dan deteksi akun nonaktif.
  - Route guard `_app` untuk pemaksaan ganti password (`/ganti-password`) dan pembatasan rute pustakawan (`/pustakawan/*`).
  - Halaman profil anggota (`/profil`) untuk melihat data diri dan form ganti password mandiri.
- **Antarmuka Manajemen Anggota (Frontend)**:
  - Halaman daftar anggota (`/pustakawan/anggota`) dengan pencarian, filter peran/kelas/jurusan/status, dan paginasi 20 baris.
  - Dialog tambah anggota dengan generator password sementara 10 karakter acak sekali tampil.
  - Form ubah data anggota dengan nomor induk dan peran terkunci (BR-15).
  - Dialog reset password dan tombol toggle aktif/nonaktif.
  - Dialog impor massal Excel dengan lazy-load `read-excel-file` (NFR-PE-03).

## Cakupan PRD & Milestone

- **Milestone**: M1 — Implementasi Auth & Anggota (PRD §18).
- **Kebutuhan Fungsional**: FR-AUTH-01 s.d. FR-AUTH-06, FR-MBR-01 s.d. FR-MBR-08.
- **Aturan Bisnis**: BR-01, BR-15, BR-16, BR-21.
- **Kebutuhan Non-Fungsional**: NFR-PE-03 (anggaran JS awal login ≤ 250 KB gzip), NFR-SE-01, NFR-US-02.
- **Di Luar Cakupan (Out of Scope)**:
  - Cetak kartu anggota PDF ID-1 (FR-CARD-01 s.d. 04, masuk di M4).
  - Sirkulasi dan transaksi peminjaman/denda riil (masuk di M3).
  - Impor dan katalog koleksi buku (masuk di M2).
  - Fitur Won't v1: registrasi publik mandiri, alur pemulihan email, dan multi-peran.
- **Dampak Dokumen Skripsi**: Sesuai PRD Lampiran C, entitas `IDENTITAS`, `USER`, dan `PUSTAKAWAN` dari proposal disatukan menjadi `profiles` dengan kredensial di Supabase Auth (`auth.users`).

## Capabilities

### New Capabilities
- `members`: Manajemen siklus hidup anggota perpustakaan (siswa, guru, pustakawan), operasi CRUD admin, aktivasi akun, reset password, dan impor massal format Excel melalui Edge Function `admin-members`.

### Modified Capabilities
- `auth`: Menambahkan antarmuka login NIS/NIP, mekanisme paksa ganti password pertama kali, rute profil anggota, route guard TanStack Router, dan RPC `complete_password_change()`.

## Impact

- Penambahan migrasi baru di `supabase/migrations/` dan update `src/types/database.types.ts`.
- Penyediaan Edge Function `supabase/functions/admin-members/index.ts`.
- Pembentukan rute TanStack Router: `/login`, `_app` layout, `/ganti-password`, `/profil`, `/beranda` (placeholder), dan `/pustakawan/anggota`.
- Pustaka `read-excel-file` hanya dimuat secara lazy di rute pustakawan tanpa membebani rute anggota.
