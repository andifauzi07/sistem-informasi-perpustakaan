## Context

Saat pengguna berhasil login di `/login`, fungsi mutasi `useLoginMutation` berhasil memverifikasi kredensial ke Supabase dan memperoleh data sesi serta profil. Namun, `onSuccess` hanya memanggil `queryClient.invalidateQueries({ queryKey: authKeys.all })`. Di TanStack Query v5, `ensureQueryData(sessionQueryOptions())` pada guard rute induk `src/routes/_app.tsx` tetap mengembalikan nilai cache lama (`null`) yang diinisialisasi saat awal membuka aplikasi karena nilai tersebut ada di memori (`null !== undefined`), mengabaikan status stale query. Akibatnya, guard `_app.tsx` melempar `redirect({ to: '/login' })` yang membatalkan perpindahan ke `/beranda`.

Selain itu, berkas `src/routes/login.tsx` belum memiliki hook `beforeLoad`, sehingga pengguna yang sudah masuk ke sistem tetap dapat melihat dan mengakses formulir login ketika membuka URL `/login`.

## Goals / Non-Goals

**Goals:**
- Memastikan navigasi dari `/login` ke `/beranda` (atau `/ganti-password`) berlangsung seketika dan andal begitu login sukses.
- Memastikan pengguna yang sudah memiliki sesi aktif otomatis dialihkan saat mengakses URL `/login`.
- Memastikan cache TanStack Query tersinkronisasi tanpa dependensi pembacaan data basi (`stale null`).
- Menambahkan pengujian otomatis (unit dan E2E Playwright) untuk memvalidasi kedua alur navigasi.

**Non-Goals:**
- Mengubah struktur rute TanStack Router atau skema tabel Supabase.
- Mengubah alur ganti password akun baru yang sudah berjalan dengan baik di `_app/ganti-password.tsx`.
- Memodifikasi mekanisme autentikasi di luar rute login SPA.

## Decisions

### 1. Sinkronisasi Cache Langsung (`setQueryData`) di `useLoginMutation`
- **Pilihan**: Mengisi cache TanStack Query langsung dengan data respons login:
  ```ts
  queryClient.setQueryData(authKeys.session(), data.session)
  queryClient.setQueryData(authKeys.profile(data.user.id), data.profile)
  ```
- **Alternatif yang ditolak**: Menggunakan `fetchQuery` di guard `_app.tsx`. Hal ini menambah latency round-trip network tambahan ke Supabase padahal data sudah ada di tangan saat mutasi login selesai.
- **Rasional**: Mirip dengan pola yang diterapkan pada `useChangePasswordMutation`, pengisian cache sinkron menjamin guard `ensureQueryData` langsung membaca data terbaru tanpa penundaan atau risiko pembacaan stale data.

### 2. Evaluasi Ulang Router State dengan `router.invalidate()`
- **Pilihan**: Memanggil `await router.invalidate()` di `LoginPage.onSubmit` sebelum `navigate(...)`.
- **Rasional**: TanStack Router meng-cache status kecocokan rute. Menginvalidasi router menjamin seluruh guard rute membaca context auth dan cache query yang baru.

### 3. Penambahan Guest Guard pada `src/routes/login.tsx`
- **Pilihan**: Menambahkan `beforeLoad` pada rute `/login`:
  ```ts
  export const Route = createFileRoute('/login')({
    beforeLoad: async ({ context }) => {
      const session = await context.queryClient.ensureQueryData(sessionQueryOptions())
      if (session?.user) {
        const profile = await context.queryClient.ensureQueryData(profileQueryOptions(session.user.id))
        if (profile && profile.is_active) {
          if (profile.must_change_password) {
            throw redirect({ to: '/ganti-password' })
          }
          throw redirect({ to: '/beranda' })
        }
      }
    },
    component: LoginPage,
  })
  ```
- **Rasional**: Mencegah tampilan ganda pada pengguna terotentikasi dan konsisten dengan guard yang ada pada `src/routes/index.tsx`.

## Risks / Trade-offs

- [Risk] Sesi kedaluwarsa di Supabase tetapi masih tersimpan di memory cache. → **Mitigasi**: Stale time sesi diatur 30 detik (PRD §8/§14) dan `useLogoutMutation` membersihkan query cache secara total (`queryClient.clear()`).
- [Risk] Siklus pengalihan (redirect loop) antara `/login` dan `/beranda`. → **Mitigasi**: Pengecekan profil aktif `profile.is_active` dan `must_change_password` selaras 100% antara guard `_app.tsx` dan `login.tsx`.

## Ponytail

Penerapan tangga keputusan Ponytail:
1. **Perlu ada? (YAGNI)**: Ya, bug navigasi login dan ketiadaan guest guard langsung merusak pengalaman pengguna (UX) dan melanggar FR-AUTH-01 / TC-AUTH-01.
2. **Cukup pustaka standar?**: Menggunakan kapabilitas bawaan TanStack Query dan TanStack Router yang sudah ada di stack proyek.
3. **Ada fitur native platform?**: Supabase Auth sudah menyimpan sesi di `localStorage`, sinkronisasi hanya di layer manajemen state React.
4. **Ada dependency yang sudah terpasang?**: Memanfaatkan `@tanstack/react-query` (`setQueryData`), `@tanstack/react-router` (`beforeLoad`, `redirect`, `router.invalidate()`), dan `sonner`. Tidak ada penambahan library baru sama sekali.
5. **Cukup satu baris?**: `setQueryData` masing-masing satu baris di `onSuccess`, dan penambahan guard ringkas di `login.tsx`.
6. **Tulis kode minimum**: Perubahan total tidak melebihi 20 baris kode efektif, tanpa abstraksi tambahan.
