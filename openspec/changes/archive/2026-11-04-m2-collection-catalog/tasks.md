## 1. Basis Data & RPC Koleksi & Katalog

- [x] 1.1 Buat migrasi SQL tabel `categories`, `books`, `book_copies`, view `v_book_availability`, dan bucket storage `covers` lengkap dengan RLS (FR-COL-01, FR-COL-02, FR-COL-03)
- [x] 1.2 Buat fungsi RPC `add_book_copies`, `set_copy_status`, dan `delete_book` dengan kode galat P0001 standar (FR-COL-04, FR-COL-05, FR-COL-07, BR-14, BR-17)
- [x] 1.3 Buat fungsi RPC `search_catalog` dengan indeks Trigram pada judul, penulis, dan ISBN (FR-CAT-01, FR-CAT-02)
- [x] 1.4 Tulis tes pgTAP untuk kebijakan RLS, validasi `CODE_TAKEN`, `BOOK_HAS_HISTORY`, dan `INVALID_STATUS_TRANSITION` (TC-COL-02, TC-COL-04, TC-COL-06, TC-COL-07)
- [x] 1.5 Terapkan migrasi lokal (`supabase db reset`), perbarui tipe TypeScript (`npm run db:types`), dan verifikasi dengan `npm run db:test`

## 2. Lapisan API & Skema Zod Frontend

- [x] 2.1 Buat skema validasi Zod untuk kategori, buku, dan eksemplar di `src/features/collection/schemas.ts` serta skema parameter pencarian di `src/features/catalog/schemas.ts`
- [x] 2.2 Buat utilitas kompresi sampul WebP di `src/features/collection/utils.ts` menggunakan native Canvas API (FR-COL-03, TC-COL-01)
- [x] 2.3 Buat query key factory, queryOptions, dan mutations untuk koleksi pustakawan di `src/features/collection/api/`
- [x] 2.4 Buat query key factory dan queryOptions untuk katalog buku di `src/features/catalog/api/`

## 3. Antarmuka Koleksi Pustakawan

- [x] 3.1 Buat halaman dan dialog CRUD kategori buku di `src/routes/_app/pustakawan/kategori.tsx` (FR-COL-01)
- [x] 3.2 Buat halaman daftar buku pustakawan dengan pencarian, filter, dan tabel di `src/routes/_app/pustakawan/koleksi/index.tsx` (FR-COL-02)
- [x] 3.3 Buat form tambah/ubah buku beserta komponen upload & kompresi sampul WebP (FR-COL-02, FR-COL-03, TC-COL-01)
- [x] 3.4 Buat dialog tambah N eksemplar (otomatis/manual) dan kelola status eksemplar (FR-COL-04, FR-COL-05, TC-COL-03, TC-COL-04)
- [x] 3.5 Buat komponen cetak label barcode PDF Code 128 dengan pemuatan lazy `bwip-js` dan `@react-pdf/renderer` (FR-COL-06, TC-COL-05)

## 4. Antarmuka Katalog Siswa & Guru

- [x] 4.1 Buat halaman katalog publik di `src/routes/_app/katalog/index.tsx` dengan kotak pencarian debounce 300 ms, filter kategori, dan paginasi 20 kartu (FR-CAT-01, FR-CAT-02, FR-CAT-03, TC-CAT-01, TC-CAT-02)
- [x] 4.2 Buat halaman detail buku di `src/routes/_app/katalog/$bookId.tsx` dengan metadata lengkap, lokasi rak, dan indikator ketersediaan eksemplar real-time (FR-CAT-04, FR-CAT-05, TC-CAT-03, TC-CAT-04)
- [x] 4.3 Verifikasi tampilan mobile-first 360 px tanpa scroll horizontal dan penanganan state loading/empty/error (NFR-US-01, NFR-PE-03)

## 5. Pengujian & Penyiapan Bukti Reviewer

- [x] 5.1 Tulis tes unit Vitest untuk utilitas kompresi WebP, generator kode eksemplar, dan skema Zod
- [x] 5.2 Tulis tes E2E Playwright dasar untuk penelusuran katalog dan penambahan buku pustakawan
- [x] 5.3 Catat entri kasus uji `TC-COL-01` s.d. `TC-COL-07` dan `TC-CAT-01` s.d. `TC-CAT-04` di `docs/testing/black-box.md` agar siap diuji oleh reviewer manusia
- [x] 5.4 Jalankan /ponytail-review pada diff change ini dan terapkan temuan yang tidak melanggar PRD/CLAUDE.md
- [x] 5.5 Penuhi Definition of Done CLAUDE.md §13 (`typecheck` + `lint` + `test` + `build` lulus)
- [x] 5.6 Arsipkan change dengan perintah `openspec archive m2-collection-catalog` sebelum push ke remote branch GitHub
