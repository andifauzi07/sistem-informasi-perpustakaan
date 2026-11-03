## Why

Sistem Informasi Perpustakaan SMKN 1 Selayar membutuhkan katalog buku digital dan pencatatan inventaris koleksi untuk menggantikan pencatatan manual di buku besar serta menyediakan informasi ketersediaan buku secara *real-time* bagi siswa dan guru. Change ini mengimplementasikan **Milestone M2** (PRD §18) sebagai prasyarat utama sebelum transaksi sirkulasi (peminjaman dan pengembalian di M3) dapat beroperasi.

## What Changes

- **Basis Data Koleksi & Katalog**:
  - Migrasi tabel `categories`, `books`, dan `book_copies`.
  - Indeks Trigram `gin_trgm_ops` pada judul, penulis, dan ISBN untuk pencarian parsial cepat.
  - View / RPC ketersediaan real-time yang menghitung eksemplar berstatus `available` tanpa angka stok manual.
  - Kebijakan RLS: pustakawan memiliki akses penuh CRUD; siswa dan guru memiliki hak baca pada buku dan eksemplar aktif.
- **Penyimpanan Berkas (Supabase Storage)**:
  - Bucket `covers` publik untuk sampul buku dengan kompresi WebP (lebar ≤ 600 px, ukuran ≤ 60 KB) di sisi peramban sebelum unggah.
- **Manajemen Koleksi Pustakawan (`/pustakawan/koleksi`, `/pustakawan/kategori`)**:
  - CRUD kategori buku (nama unik, kode DDC opsional).
  - CRUD metadata buku lengkap dan unggah sampul.
  - Penambahan eksemplar massal (N eksemplar) dengan kode otomatis (`B000001`...) atau manual (nomor induk buku lama).
  - Pengelolaan status eksemplar (`available`, `maintenance`, `lost`, `withdrawn`).
  - Cetak label barcode fisik format Code 128 (PDF A4) menggunakan `bwip-js` dan `@react-pdf/renderer` (lazy-loaded).
- **Katalog Publik & Pencarian (`/katalog`, `/katalog/$bookId`)**:
  - Antarmuka pencarian cepat (debounce 300 ms, min. 2 karakter) dengan filter kategori dan ketersediaan berbasis URL search params.
  - Halaman detail buku menampilkan metadata lengkap, lokasi rak, status ketersediaan eksemplar, dan tombol ajukan pinjam (indikator kesiapan).

## Cakupan PRD & Milestone

- **Milestone**: M2 — Koleksi & Katalog (PRD §18).
- **Kebutuhan Fungsional (FR)**: `FR-COL-01` s.d. `FR-COL-07`, `FR-CAT-01` s.d. `FR-CAT-05`.
- **Aturan Bisnis (BR)**: `BR-04` (ketersediaan tanpa antrean manual), `BR-14` (larangan alokasi eksemplar non-available), `BR-17` (proteksi hapus buku bertransaksi), `BR-18` (waktu WITA).
- **Kebutuhan Non-Fungsional (NFR)**: `NFR-PE-03` (anggaran JS awal katalog ≤ 250 KB gzip), `NFR-US-01` (mobile-first 360 px), `NFR-SE-03`.
- **Di Luar Cakupan (Out of Scope)**:
  - Transaksi peminjaman, pengajuan sirkulasi aktif, dan denda (masuk di M3).
  - Cetak kartu anggota dan bahan ajar guru (masuk di M4).
  - Impor Excel buku massal FR-COL-08 (kategori *Could Have*, dialokasikan terpisah bila ada sisa waktu).
- **Dampak Dokumen Skripsi**: Sesuai PRD Lampiran C, relasi entitas buku dan eksemplar (1:N) memfasilitasi pelacakan fisik barcode Code 128 yang menggantikan buku induk manual pada BAB III.

## Capabilities

### New Capabilities
- `collection`: Pengelolaan kategori buku, metadata bibliografi buku, eksemplar fisik buku, kompresi sampul WebP, dan cetak label barcode PDF Code 128 untuk pustakawan.
- `catalog`: Penelusuran katalog buku bagi semua peran dengan pencarian parsial, filter URL, paginasi 20 baris, dan penayangan ketersediaan eksemplar real-time.

### Modified Capabilities
*(Tidak ada modifikasi pada requirement auth maupun members yang sudah ada).*

## Impact

- Penambahan skema tabel dan kebijakan RLS baru di `supabase/migrations/` serta pembaruan `src/types/database.types.ts`.
- Penambahan domain fitur baru di `src/features/collection/` dan `src/features/catalog/`.
- Penambahan rute aplikasi TanStack Router di `src/routes/_app/katalog` dan `src/routes/_app/pustakawan/`.
