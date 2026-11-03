## 1. Basis Data & Keamanan (Backend)

- [x] 1.1 Buat migrasi SQL untuk enum `app_role`, tabel `majors`, `profiles`, `activity_logs`, `loan_policies`, helper `private.is_librarian()`, `private.today_wita()`, `private.current_app_role()`, `private.log_activity()`, RPC `complete_password_change()`, dan trigger `handle_new_user` (FR-AUTH-01, FR-AUTH-03, FR-AUTH-05, FR-AUTH-06, PRD §11, §12)
- [x] 1.2 Terapkan kebijakan RLS ketat pada `profiles`, `activity_logs`, `majors`, dan `loan_policies` (PRD §13.3)
- [x] 1.3 Buat berkas tes pgTAP di `supabase/tests/database/01-auth-members.test.sql` untuk memverifikasi kebijakan RLS dan eksekusi RPC (TC-AUTH-05, TC-AUTH-06)
- [x] 1.4 Jalankan `supabase db reset`, verifikasi pengujian `supabase test db`, dan perbarui tipe TypeScript dengan `npm run db:types`
- [x] 1.5 Siapkan data seed lokal fiktif di `supabase/seed.sql` dan buat skrip bootstrap pustakawan pertama di `scripts/bootstrap-librarian.ts` (PRD §13.1)

## 2. Edge Function Admin Members

- [x] 2.1 Buat scaffold Edge Function `supabase/functions/admin-members/index.ts` dengan Deno, pembungkus `withSupabase({ auth: 'user' })`, validasi Zod, dan guard pustakawan aktif (FR-MBR-01, PRD §12.3)
- [x] 2.2 Implementasikan aksi `create` untuk penambahan akun tunggal dengan password acak 10 karakter dan logging aktivitas (FR-MBR-02, TC-MBR-01, TC-MBR-02)
- [x] 2.3 Implementasikan aksi `reset_password` dan `set_active` pada Edge Function untuk pengelolaan status anggota (FR-MBR-04, FR-MBR-05, TC-MBR-06, TC-MBR-07)
- [x] 2.4 Implementasikan aksi `import` batch (≤ 50 baris per panggilan) dengan upsert nomor induk dan penolakan perubahan peran (FR-MBR-06, TC-MBR-03, TC-MBR-04, TC-MBR-05, BR-15)

## 3. Frontend Autentikasi

- [x] 3.1 Buat query key factory, queries, dan mutations autentikasi di `src/features/auth/api/` (FR-AUTH-01, FR-AUTH-02, FR-AUTH-03)
- [x] 3.2 Implementasikan halaman login `/login` dengan validasi nomor induk/password, pesan generik, dan deteksi akun nonaktif (FR-AUTH-01, FR-AUTH-06, TC-AUTH-01, TC-AUTH-02, TC-AUTH-03, TC-AUTH-05)
- [x] 3.3 Implementasikan route guard di layout `_app.tsx` untuk memaksa redirect ke `/ganti-password` bila `must_change_password = true`, dan redirect rute `/pustakawan/*` ke `/beranda` untuk pengguna non-librarian (FR-AUTH-03, FR-AUTH-05, TC-AUTH-04, TC-AUTH-06)
- [x] 3.4 Implementasikan halaman `/ganti-password` dan halaman `/profil` dengan form ganti password mandiri serta aksi logout (FR-AUTH-02, FR-AUTH-03, FR-AUTH-04, TC-AUTH-07)

## 4. Frontend Manajemen Anggota Pustakawan

- [x] 4.1 Buat query key factory, queries, dan mutations manajemen anggota di `src/features/members/api/` (FR-MBR-01 s.d. FR-MBR-08)
- [x] 4.2 Buat halaman daftar anggota di `src/routes/_app/pustakawan/anggota.tsx` dengan TanStack Table, pencarian, filter, dan paginasi 20 baris (FR-MBR-01)
- [x] 4.3 Implementasikan dialog Tambah Anggota Tunggal dengan form validasi Zod dan tampilan password sementara acak 10 karakter sekali pakai (FR-MBR-02, TC-MBR-01, TC-MBR-02)
- [x] 4.4 Implementasikan dialog Ubah Data Anggota (kunci nomor induk & peran sesuai BR-15), dialog Nonaktifkan/Aktifkan, dan dialog Reset Password (FR-MBR-03, FR-MBR-04, FR-MBR-05, TC-MBR-06, TC-MBR-07)
- [x] 4.5 Implementasikan dialog Impor Massal Excel dengan lazy-load `read-excel-file`, template `.xlsx` resmi, batch chunking ≤ 50 baris, dan laporan status hasil baris (FR-MBR-06, TC-MBR-03, TC-MBR-04, TC-MBR-05, NFR-PE-03)
- [x] 4.6 Implementasikan tampilan Detail Anggota untuk menampilkan data profil dan status akun secara menyeluruh (FR-MBR-07, FR-MBR-08)

## 5. Pengujian, Validasi & Verifikasi Akhir

- [x] 5.1 Buat unit test Vitest untuk fungsi validasi, generator password acak, dan utilitas parser baris Excel (FR-MBR-02, FR-MBR-06)
- [x] 5.2 Buat uji Playwright E2E untuk alur autentikasi TC-AUTH-01 sampai TC-AUTH-07 di `e2e/auth.spec.ts` (FR-AUTH-01 s.d. FR-AUTH-06)
- [x] 5.3 Buat uji Playwright E2E untuk manajemen anggota TC-MBR-01 sampai TC-MBR-07 di `e2e/members.spec.ts` (FR-MBR-01 s.d. FR-MBR-06)
- [x] 5.4 Perbarui katalog uji black-box di `docs/testing/black-box.md` untuk seluruh TC-AUTH-* dan TC-MBR-*
- [x] 5.5 Jalankan /ponytail-review pada diff change ini dan terapkan temuan yang tidak melanggar PRD/CLAUDE.md
- [x] 5.6 Penuhi Definition of Done CLAUDE.md §13
