## 1. Basis Data, RPC Transaksi & Keamanan Sirkulasi

- [ ] 1.1 Buat migrasi SQL tabel `loan_requests`, `loans`, `fines`, view `v_loans`, dan kebijakan RLS (FR-CIR-01, FR-CIR-02, FR-FIN-01, FR-FIN-05)
- [ ] 1.2 Buat RPC `request_loan` dan `cancel_loan_request` dengan validasi BR-01 s.d. BR-04 (FR-CIR-01, FR-CIR-03, TC-CIR-01, TC-CIR-02, TC-CIR-03, TC-CIR-04, TC-CIR-11)
- [ ] 1.3 Buat RPC `approve_loan_request` (dengan `for update skip locked`) dan `reject_loan_request` (FR-CIR-07, FR-CIR-08, TC-CIR-05, TC-CIR-06)
- [ ] 1.4 Buat RPC `checkout_loan` (mode pengajuan dan walk-in) serta snapshot tarif denda (FR-CIR-09, BR-07, BR-08, TC-CIR-07, TC-CIR-08, TC-CIR-09)
- [ ] 1.5 Buat RPC `checkin_loan` dengan kalkulasi denda keterlambatan WITA dan denda kerusakan (FR-CIR-10, BR-09, BR-10, BR-11, TC-CIR-13, TC-CIR-14, TC-CIR-15)
- [ ] 1.6 Buat RPC `mark_loan_lost`, `pay_fine`, dan `waive_fine` (FR-CIR-14, FR-FIN-03, FR-FIN-04, BR-13, TC-CIR-16, TC-FIN-01, TC-FIN-02)
- [ ] 1.7 Buat fungsi `private.expire_overdue_pickups()` untuk pembatalan otomatis lewat batas ambil (FR-CIR-13, BR-06, TC-CIR-10)
- [ ] 1.8 Tulis tes komprehensif pgTAP untuk seluruh RPC sirkulasi dan denda, jalankan `db reset`, `db:types`, dan `db:test`

## 2. Lapisan API & Skema Zod Frontend

- [ ] 2.1 Buat skema validasi Zod untuk sirkulasi dan denda di `src/features/circulation/schemas.ts` dan `src/features/fines/schemas.ts`
- [ ] 2.2 Buat query key factory, queryOptions, dan mutations untuk sirkulasi anggota dan pustakawan di `src/features/circulation/api/`
- [ ] 2.3 Buat query key factory, queryOptions, dan mutations untuk denda di `src/features/fines/api/`
- [ ] 2.4 Buat komponen pemindai `CodeInput` (autofocus + Enter) dan `CameraScanner` (lazy-load) di `src/components/` (FR-CIR-15, TC-CIR-17)

## 3. Antarmuka Sirkulasi Anggota (Siswa & Guru)

- [ ] 3.1 Sambungkan tombol "Ajukan Pinjam" di halaman detail buku ke mutasi `request_loan` (FR-CIR-01)
- [ ] 3.2 Buat halaman "Pinjaman Saya" di `src/routes/_app/pinjaman.tsx` menampilkan pengajuan terbuka, pinjaman aktif, tombol batalkan pengajuan, dan tombol ajukan pengembalian (FR-CIR-02, FR-CIR-03, FR-CIR-04, TC-CIR-12)
- [ ] 3.3 Buat halaman riwayat peminjaman di `src/routes/_app/riwayat.tsx` dengan filter periode (FR-CIR-05)
- [ ] 3.4 Buat halaman denda anggota di `src/routes/_app/denda.tsx` menampilkan daftar denda dan total belum lunas (FR-FIN-05, TC-FIN-04)

## 4. Antarmuka Sirkulasi & Denda Pustakawan

- [ ] 4.1 Buat halaman antrean pengajuan di `src/routes/_app/pustakawan/pengajuan.tsx` dengan aksi persetujuan (pilih/otomatis eksemplar) dan penolakan beralasan (FR-CIR-06, FR-CIR-07, FR-CIR-08)
- [ ] 4.2 Buat antarmuka Meja Sirkulasi di `src/routes/_app/pustakawan/sirkulasi.tsx` dengan Mode Pinjam dan Mode Kembali (FR-CIR-09, FR-CIR-10, FR-CIR-11)
- [ ] 4.3 Tampilkan kotak peringatan denda belum lunas anggota saat verifikasi pengajuan dan checkout meja sirkulasi (FR-FIN-07, BR-12, TC-FIN-03)
- [ ] 4.4 Buat halaman daftar pinjaman aktif di `src/routes/_app/pustakawan/pinjaman.tsx` dengan filter keterlambatan dan dialog tandai buku hilang (FR-CIR-12, FR-CIR-14)
- [ ] 4.5 Buat halaman daftar denda di `src/routes/_app/pustakawan/denda.tsx` dengan dialog catat pembayaran tunai dan dialog pembebasan denda (FR-FIN-03, FR-FIN-04, FR-FIN-06, TC-FIN-05)

## 5. Pengujian & Penyiapan Bukti Reviewer

- [ ] 5.1 Tulis tes unit Vitest untuk kalkulasi denda hari terlambat dan validasi form sirkulasi
- [ ] 5.2 Tulis tes E2E Playwright untuk alur lengkap: Ajukan pinjam -> Verifikasi pustakawan -> Checkout -> Check-in -> Denda
- [ ] 5.3 Catat entri kasus uji `TC-CIR-01` s.d. `TC-CIR-17` dan `TC-FIN-01` s.d. `TC-FIN-05` di `docs/testing/black-box.md` agar siap diuji oleh reviewer manusia
- [ ] 5.4 Jalankan /ponytail-review pada diff change ini dan terapkan temuan yang tidak melanggar PRD/CLAUDE.md
- [ ] 5.5 Penuhi Definition of Done CLAUDE.md §13 (`typecheck` + `lint` + `test` + `build` lulus)
- [ ] 5.6 Arsipkan change dengan perintah `openspec archive m3-circulation-fines` sebelum push ke remote branch GitHub
