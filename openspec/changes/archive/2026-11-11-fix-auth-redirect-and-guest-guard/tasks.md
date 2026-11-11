## 1. Pembaruan Lapisan API & Mutasi Autentikasi

- [x] 1.1 Perbarui mutasi `useLoginMutation` di `src/features/auth/api/mutations.ts` untuk langsung mengeset `authKeys.session()` dan `authKeys.profile(...)` ke query cache secara sinkron saat login berhasil (FR-AUTH-01, TC-AUTH-01)
- [x] 1.2 Pastikan `useLogoutMutation` membersihkan query cache sesi dan profil secara konsisten (FR-AUTH-02, TC-AUTH-07)

## 2. Pembaruan Rute & Navigasi

- [x] 2.1 Tambahkan hook `beforeLoad` (guest guard) pada `src/routes/login.tsx` untuk mengalihkan pengguna yang telah memiliki sesi dan profil aktif ke `/beranda` atau `/ganti-password` (FR-AUTH-01, FR-AUTH-03)
- [x] 2.2 Tambahkan `await router.invalidate()` pada handler `onSubmit` di `src/routes/login.tsx` sebelum eksekusi navigasi (FR-AUTH-01, TC-AUTH-01)
- [x] 2.3 Tambahkan `await router.invalidate()` pada penanganan logout di `src/routes/_app.tsx` (FR-AUTH-02, TC-AUTH-07)

## 3. Pengujian & Verifikasi

- [x] 3.1 Perbarui dan tambahkan skenario uji Playwright di `e2e/auth.spec.ts` untuk memverifikasi navigasi langsung dari `/login` ke `/beranda` dan pencegahan akses `/login` saat sesi aktif (TC-AUTH-01, TC-AUTH-07)
- [x] 3.2 Jalankan /ponytail-review pada diff change ini dan terapkan temuan yang tidak melanggar PRD/CLAUDE.md
- [x] 3.3 Penuhi Definition of Done CLAUDE.md §13
