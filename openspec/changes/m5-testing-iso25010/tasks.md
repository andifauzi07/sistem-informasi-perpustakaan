## 1. Otomasi Pengujian Portability (Playwright Multi-Browser)

- [ ] 1.1 Konfigurasi `playwright.config.ts` untuk 5 target: desktop Chromium, Firefox, WebKit, Pixel 7, dan iPhone 14 (NFR-PO-01)
- [ ] 1.2 Buat skrip pengujian E2E alur autentikasi dan ganti password wajib di `e2e/auth.spec.ts`
- [ ] 1.3 Buat skrip pengujian E2E alur pencarian katalog dan detail buku di `e2e/catalog.spec.ts`
- [ ] 1.4 Buat skrip pengujian E2E alur sirkulasi (pengajuan pinjam, verifikasi meja sirkulasi, check-in) di `e2e/circulation.spec.ts`
- [ ] 1.5 Buat skrip pengujian E2E alur unduh bahan ajar guru/siswa di `e2e/materials.spec.ts`
- [ ] 1.6 Jalankan `npm run test:e2e` dan pastikan seluruh pengujian lulus di kelima target peramban

## 2. Pengujian Menyeluruh Basis Data (pgTAP)

- [ ] 2.1 Satukan dan lengkapi suite tes pgTAP di `supabase/tests/database/` untuk menguji RLS isolation seluruh tabel
- [ ] 2.2 Uji seluruh fungsi RPC sirkulasi dan denda untuk setiap kode galat P0001 (PRD §12.4)
- [ ] 2.3 Jalankan `npm run db:test` dan pastikan 100% tes basis data lulus

## 3. Otomasi Performance Efficiency (Lighthouse) & Bundle Budget

- [ ] 3.1 Verifikasi anggaran bundle awal JavaScript produksi (`npm run build`) ≤ 250 KB gzip pada rute publik dan anggota (NFR-PE-03)
- [ ] 3.2 Siapkan skrip pengukuran audit performa Lighthouse DevTools (median 3 kali) pada halaman Login, Beranda, Katalog, Detail Buku, dan Sirkulasi
- [ ] 3.3 Catat tabel hasil pengukuran skor performa di `docs/testing/performance.md` sebagai bukti BAB IV

## 4. Finalisasi Instrumen Kasus Uji Black-Box untuk Reviewer

- [ ] 4.1 Lengkapi seluruh tabel kasus uji `TC-*` di `docs/testing/black-box.md` mencakup seluruh FR dari PRD §8
- [ ] 4.2 Pastikan format tabel memiliki kolom ID, FR terkait, Prasyarat, Langkah Pengujian, Data Uji, Hasil yang Diharapkan, Hasil Aktual, dan Status
- [ ] 4.3 Sediakan panduan bagi reviewer manusia untuk mengeksekusi uji manual dan mencatat hasil aktualnya

## 5. Review Kualitas & Penutupan Rilis

- [ ] 5.1 Jalankan /ponytail-review pada diff change ini dan terapkan temuan yang tidak melanggar PRD/CLAUDE.md
- [ ] 5.2 Penuhi Definition of Done CLAUDE.md §13 (`typecheck` + `lint` + `test` + `build` lulus)
- [ ] 5.3 Arsipkan change dengan perintah `openspec archive m5-testing-iso25010` sebelum push ke remote branch GitHub
