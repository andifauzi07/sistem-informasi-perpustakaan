## Why

Saat ini terdapat masalah navigasi pada alur autentikasi aplikasi:
1. Setelah pengguna berhasil memasukkan nomor induk (NIS/NIP) dan password yang benar pada rute `/login`, notifikasi sambutan muncul namun halaman tidak berpindah ke `/beranda` dan pengguna tetap tertahan di halaman login. Hal ini disebabkan oleh perilaku `ensureQueryData` pada TanStack Query v5 yang mengembalikan nilai cache lama (`null`) yang disimpan saat inisialisasi aplikasi, sehingga guard `_app.tsx` mendeteksi sesi sebagai kosong dan membatalkan navigasi.
2. Ketika pengguna sudah memiliki sesi login aktif dan mengakses kembali rute `/login` (misalnya melalui pengetikan URL manual atau tautan), rute `/login` tetap menampilkan form login karena ketiadaan guard `beforeLoad` untuk tamu (guest guard).

Perbaikan ini penting agar alur login berjalan mulus sesuai spesifikasi PRD §8 (FR-AUTH-01) dan kasus uji `TC-AUTH-01`.

## What Changes

- **Pembaruan Cache Langsung pada `useLoginMutation`**: Mengisikan data `session` dan `profile` secara langsung ke dalam cache TanStack Query (`queryClient.setQueryData`) saat login berhasil, menghindari pembacaan data cache `null` lama oleh guard `_app.tsx`.
- **Invalidasi Router pada `LoginPage`**: Memanggil `await router.invalidate()` sesaat setelah mutasi login sukses dan sebelum navigasi ke tujuan (`/beranda` atau `/ganti-password`).
- **Penerapan Guest Guard pada `src/routes/login.tsx`**: Menambahkan hook `beforeLoad` pada rute `/login` yang memeriksa sesi aktif. Jika pengguna sudah memiliki sesi dan profil aktif, sistem langsung mengalihkan ke `/beranda` (atau `/ganti-password` jika `must_change_password = true`).
- **Sinkronisasi Pembersihan Sesi pada Logout**: Memastikan `queryClient.setQueryData(authKeys.session(), null)` dan `router.invalidate()` dijalankan secara konsisten saat logout.

## Capabilities

### New Capabilities
Tidak ada penambahan capability baru.

### Modified Capabilities
- `auth`: Menambahkan requirement guest guard pada rute `/login` agar pengguna terotentikasi otomatis dialihkan ke `/beranda` atau `/ganti-password`, serta memperjelas kepastian navigasi langsung setelah login berhasil (FR-AUTH-01, TC-AUTH-01).

## Out of Scope
- Perubahan alur form ganti password mandiri atau reset password oleh pustakawan.
- Perubahan skema basis data PostgreSQL, RLS, maupun Edge Function Supabase.
- Penambahan fitur Remember Me atau perpanjangan sesi kustom.

## Impact

- **File Terdampak**:
  - `src/features/auth/api/mutations.ts` (pembaruan cache TanStack Query)
  - `src/routes/login.tsx` (penambahan `beforeLoad` guest guard dan `router.invalidate()`)
  - `src/routes/_app.tsx` (penyempurnaan alur logout)
  - `e2e/auth.spec.ts` (penambahan kasus uji guest guard)
- **Sistem**: Navigasi SPA TanStack Router & state cache TanStack Query.
- **Kepatuhan PRD**: Memenuhi FR-AUTH-01, FR-AUTH-02, FR-AUTH-03, dan NFR-US-01 (kemudahan navigasi & konsistensi).
