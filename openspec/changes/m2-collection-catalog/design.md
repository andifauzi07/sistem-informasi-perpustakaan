## Context

Change ini merealisasikan Milestone M2 (PRD §18) untuk modul Koleksi dan Katalog. Sebelumnya, Milestone M1 telah meletakkan pondasi autentikasi, profil pengguna, dan manajemen anggota. M2 menambahkan struktur penyimpanan buku, eksemplar fisik, label barcode, serta katalog digital yang menjadi prasyarat transaksi sirkulasi pada M3.

## Goals / Non-Goals

**Goals:**
- Menyediakan basis data relasional untuk kategori, buku, dan eksemplar fisik dengan status pelacakan individual.
- Mengimplementasikan RPC `search_catalog` dengan indeks Trigram untuk pencarian cepat judul/penulis/ISBN.
- Menyediakan view `v_book_availability` untuk ketersediaan real-time tanpa duplikasi angka stok.
- Mengunggah sampul buku WebP (≤ 600 px, ≤ 60 KB) yang dikompresi di sisi peramban.
- Menyediakan cetak label barcode PDF Code 128 untuk pustakawan dengan pemuatan lazy-load.

**Non-Goals:**
- Pembuatan transaksi sirkulasi riil (`loan_requests`, `loans`) dan perhitungan denda (dialokasikan ke M3).
- Impor massal koleksi Excel FR-COL-08.
- Kartu anggota dan bahan ajar digital (dialokasikan ke M4).

## Decisions

### 1. Model Data Eksemplar Fisik vs Stok Manual (ADR-07)
- **Keputusan**: Mengikuti PRD §7.4 (ADR-07), ketersediaan buku dihitung dari jumlah rekaman `book_copies` dengan status `available`. Tidak ada kolom `stock` integer yang disimpan manual di tabel `books`.
- **Alasan**: Mencegah inkonsistensi data stok fisik perpustakaan dan memungkinkan penempelan barcode fisik unik per buku.

### 2. Pencarian Katalog via PostgreSQL Trigram (FR-CAT-01)
- **Keputusan**: Menggunakan fungsi RPC `search_catalog` berstatus `SECURITY INVOKER` dengan ekstensi `pg_trgm` dan operator `ILIKE` yang didukung indeks GIN `gin_trgm_ops` pada kolom `title` dan `authors`.
- **Alasan**: Sangat cepat untuk pencarian parsial substring dan tidak peka huruf besar/kecil tanpa memerlukan infrastruktur Elasticsearch eksternal.

### 3. Kompresi Sampul WebP di Sisi Klien (FR-COL-03)
- **Keputusan**: Peramban mengompresi gambar ke WebP (lebar maks 600 px, target ukuran ≤ 60 KB) menggunakan HTML5 Canvas API native sebelum dikirim ke Supabase Storage bucket `covers`.
- **Alasan**: Menghemat kuota penyimpanan Supabase Storage (NFR-PE-03 / R-06) dan mempercepat loading gambar di rute katalog mobile.

### 4. Isolasi Library Berat Barcode & PDF (NFR-PE-03)
- **Keputusan**: Library `@react-pdf/renderer` dan `bwip-js` hanya dimuat secara dinamis (`await import(...)`) pada halaman pustakawan `/pustakawan/koleksi/cetak-label`.
- **Alasan**: Menjaga bundle rute katalog siswa/guru tetap di bawah batas 250 KB gzip.

## Perubahan Basis Data & Keamanan

1. **Migrasi Baru**:
   - `categories`: `id`, `name` (unique), `ddc_code`, `created_at`.
   - `books`: `id`, `title`, `authors`, `publisher`, `published_year`, `isbn` (unique partial), `category_id`, `synopsis`, `shelf_location`, `cover_url`, `created_at`, `updated_at`.
   - `copy_status` enum: `available`, `reserved`, `on_loan`, `damaged`, `lost`, `withdrawn`.
   - `copy_source` enum: `purchase`, `donation`, `government`, `other`.
   - `book_copies`: `id`, `book_id`, `code` (unique), `status`, `source`, `acquired_at`, `price`, `notes`, `created_at`.
   - View `v_book_availability` dengan `with (security_invoker = true)`.
   - RPC `search_catalog`, `add_book_copies`, `set_copy_status`, `delete_book`.
2. **Kebijakan RLS**:
   - `categories`, `books`, `book_copies`: `SELECT` diizinkan untuk semua peran terotentikasi.
   - `INSERT`, `UPDATE`, `DELETE` pada `categories` dan `books` hanya untuk pustakawan aktif (`(select private.is_librarian())`).
   - `book_copies`: perubahan status dan pembuatan eksemplar hanya melalui RPC Security Definer.
3. **Storage Bucket**:
   - Bucket `covers`: Akses baca publik; hak tulis/hapus hanya untuk pustakawan aktif.

## Ponytail

Penerapan tangga keputusan Ponytail untuk komponen dan utilitas baru:

1. **Kompresi Gambar Sampul**:
   - *Perlu ada?* Ya (FR-COL-03 & batas kuota storage).
   - *Cukup pustaka standar/native platform?* Ya, Canvas API bawaan peramban (`canvas.toBlob('image/webp', 0.8)`). Tidak perlu library kompresi gambar pihak ketiga (seperti `browser-image-compression`).
   - *Jawaban Ponytail*: Tulis fungsi utilitas murni ~40 baris di `src/features/collection/utils.ts` menggunakan native Canvas API.

2. **Pencarian Katalog & Filter**:
   - *Perlu ada?* Ya (FR-CAT-01, FR-CAT-02).
   - *Ada fitur native platform?* Ya, PostgREST + RPC Postgres `search_catalog` + TanStack Router URL search params.
   - *Jawaban Ponytail*: Gunakan `validateSearch` Zod pada TanStack Router untuk menyinkronkan filter pencarian langsung ke URL tanpa state manager tambahan.

3. **Generator Label Barcode**:
   - *Perlu ada?* Ya (FR-COL-06).
   - *Stack yang sudah ada?* `bwip-js` dan `@react-pdf/renderer` sudah ada di dev stack CLAUDE.md §2.
   - *Jawaban Ponytail*: Gunakan dynamic import komponen dialog cetak label; render PDF langsung di memori browser.

## Risks / Trade-offs

- **[Risk]** Pustakawan memasukkan buku dengan jumlah eksemplar banyak sekaligus sehingga proses batch lama → **Mitigasi**: RPC `add_book_copies` menghasilkan kode dan baris dalam satu transaksi database tunggal menggunakan `generate_series`.
- **[Risk]** Ukuran bundle JavaScript membengkak akibat `@react-pdf/renderer` → **Mitigasi**: Pemuatan lazy (`React.lazy` + dynamic `import()`) khusus pada aksi pustakawan.
- **[Risk]** Double input kode manual eksemplar → **Mitigasi**: Unique constraint pada `book_copies.code` dan validasi transactional dengan galat `CODE_TAKEN`.
