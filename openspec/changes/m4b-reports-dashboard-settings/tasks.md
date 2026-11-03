## 1. Basis Data, RPC Laporan & Pengaturan

- [ ] 1.1 Buat migrasi SQL tabel `library_settings`, bucket storage `library-assets`, dan kebijakan RLS (FR-SET-02)
- [ ] 1.2 Buat RPC fungsi agregasi laporan sirkulasi, pengembalian, keterlambatan, dan denda di PostgreSQL (FR-RPT-01 s.d. FR-RPT-04, TC-RPT-01, TC-RPT-03, TC-RPT-04)
- [ ] 1.3 Buat RPC fungsi agregasi inventaris dan Top 10 buku paling sering dipinjam (FR-RPT-05, FR-RPT-07, TC-RPT-05)
- [ ] 1.4 Tulis tes pgTAP untuk fungsi agregasi laporan dan verifikasi isolasi akses pustakawan
- [ ] 1.5 Jalankan `supabase db reset`, perbarui tipe TypeScript (`npm run db:types`), dan verifikasi dengan `npm run db:test`

## 2. Lapisan API & Skema Zod Frontend

- [ ] 2.1 Buat skema validasi Zod untuk pengaturan profil sekolah dan kebijakan pinjaman di `src/features/settings/schemas.ts`
- [ ] 2.2 Buat query key factory dan queryOptions untuk dasbor metrik di `src/features/dashboard/api/`
- [ ] 2.3 Buat query key factory dan fungsi penarik data laporan di `src/features/reports/api/`
- [ ] 2.4 Buat utilitas pembantu ekspor dokumen PDF (`@react-pdf/renderer`) dan Excel (`write-excel-file`) dengan lazy load di `src/features/reports/utils.ts` (FR-RPT-09, TC-RPT-02)

## 3. Antarmuka Dasbor & Log Aktivitas

- [ ] 3.1 Perbarui halaman beranda siswa/guru di `src/routes/_app/beranda.tsx` dengan kartu metrik pinjaman, keterlambatan, batas ambil, dan total denda (FR-DSH-01, TC-DSH-01)
- [ ] 3.2 Buat antarmuka beranda pustakawan di `src/routes/_app/pustakawan/beranda.tsx` (atau root pustakawan) memuat kartu KPI operasional dan aksi cepat (FR-DSH-02, TC-DSH-02)
- [ ] 3.3 Buat antarmuka log audit aktivitas di `src/routes/_app/pustakawan/log-aktivitas.tsx` dengan filter aksi, petugas, dan rentang tanggal (FR-LOG-01, FR-LOG-02)

## 4. Antarmuka Laporan & Pengaturan Sistem

- [ ] 4.1 Buat halaman laporan di `src/routes/_app/pustakawan/laporan/index.tsx` dengan pemilih jenis laporan, pemilih periode tanggal WITA, dan tabel pratinjau (FR-RPT-01 s.d. FR-RPT-08)
- [ ] 4.2 Pasang aksi tombol ekspor PDF dan Excel pada halaman laporan dengan verifikasi integritas data (FR-RPT-09, TC-RPT-02)
- [ ] 4.3 Buat halaman pengaturan di `src/routes/_app/pustakawan/pengaturan.tsx` dengan form ubah kebijakan pinjam `loan_policies` (FR-SET-01, TC-SET-01)
- [ ] 4.4 Buat form profil perpustakaan (nama, alamat, logo) dan manajemen data master jurusan (FR-SET-02, FR-SET-03, TC-SET-02, TC-SET-03)

## 5. Pengujian & Penyiapan Bukti Reviewer

- [ ] 5.1 Tulis tes unit Vitest untuk kalkulasi rekapitulasi laporan dan fungsi format ekspor
- [ ] 5.2 Tulis tes E2E Playwright untuk alur buka laporan, ganti periode, dan navigasi dasbor
- [ ] 5.3 Catat entri kasus uji `TC-DSH-01`, `TC-DSH-02`, `TC-RPT-01` s.d. `TC-RPT-05`, dan `TC-SET-01` s.d. `TC-SET-03` di `docs/testing/black-box.md` agar siap diuji oleh reviewer manusia
- [ ] 5.4 Jalankan /ponytail-review pada diff change ini dan terapkan temuan yang tidak melanggar PRD/CLAUDE.md
- [ ] 5.5 Penuhi Definition of Done CLAUDE.md §13 (`typecheck` + `lint` + `test` + `build` lulus)
- [ ] 5.6 Arsipkan change dengan perintah `openspec archive m4b-reports-dashboard-settings` sebelum push ke remote branch GitHub
