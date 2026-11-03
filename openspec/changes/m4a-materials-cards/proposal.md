## Why

Perpustakaan SMKN 1 Selayar membutuhkan kartu anggota fisik berstandar ID-1 dengan kode QR agar proses identifikasi peminjam di meja sirkulasi berjalan cepat, serta repository digital bahan ajar dari guru yang dapat diakses oleh siswa. Change ini mengimplementasikan bagian pertama dari **Milestone M4 (M4A)** (PRD §18) yang berfokus pada aset media dan identitas anggota.

## What Changes

- **Penyimpanan Bahan Ajar Digital (Supabase Storage)**:
  - Bucket `materials` (privat, batas ukuran file ≤ 10 MB, jenis file: PDF, DOCX, PPTX, XLSX).
  - Kebijakan Storage: hanya peran `teacher` yang dapat mengunggah berkas; unduhan menggunakan *signed URL* sementara (berumur 60 detik) untuk seluruh peran terotentikasi.
- **Basis Data Bahan Ajar (`teaching_materials`)**:
  - Migrasi tabel `teaching_materials` dan RPC counter `increment_material_downloads`.
  - Filter sasaran bahan ajar berdasarkan tingkat (X, XI, XII, semua) dan jurusan.
  - Fitur moderasi: pustakawan dapat menyembunyikan (*hide*) dan menampilkan kembali berkas dengan alasan tertulis.
- **Antarmuka Bahan Ajar (`/bahan-ajar`, `/guru/bahan-ajar`)**:
  - Siswa/Guru: Penelusuran materi pelajaran, filter mapel/jurusan/tingkat, dan tombol unduh signed URL.
  - Guru: Halaman kelola bahan ajar mandiri, formulir unggah berkas, ubah metadata, dan hapus berkas.
- **Antarmuka Cetak Kartu Anggota Perpustakaan (`/pustakawan/kartu-anggota`)**:
  - Cetak kartu tunggal ukuran standar ID-1 (85,6 × 54 mm) dalam format PDF memuat logo sekolah, nama, nomor induk, peran, kelas/jurusan, dan kode QR berisi nomor induk.
  - Cetak massal per kelas di lembar A4 (10 kartu per halaman dengan garis potong pembantu) menggunakan `@react-pdf/renderer` dan `bwip-js` (lazy-loaded).

## Cakupan PRD & Milestone

- **Milestone**: M4A — Bahan Ajar & Kartu Anggota (PRD §18).
- **Kebutuhan Fungsional (FR)**: `FR-CARD-01` s.d. `FR-CARD-04`, `FR-MAT-01` s.d. `FR-MAT-05`.
- **Aturan Bisnis (BR)**: `BR-19` (batas berkas bahan ajar ≤ 10 MB), `BR-20` (standar ukuran kartu ID-1 85,6 × 54 mm).
- **Kebutuhan Non-Fungsional (NFR)**: `NFR-PE-03` (anggaran bundle rute publik/anggota), `NFR-US-01`.
- **Di Luar Cakupan (Out of Scope)**:
  - Dashboard statistik KPI, laporan peminjaman/denda, pengaturan sistem, dan log aktivitas (masuk di M4B).
  - Foto profil dinamis siswa pada kartu (FR-CARD-04 kategori *Could Have*, dievaluasi bila ada sisa waktu).
- **Dampak Dokumen Skripsi**: Kartu fisik dengan QR Code mempermudah observasi operabilitas pada pengujian karakteristik Usability (BAB IV).

## Capabilities

### New Capabilities
- `materials`: Pengelolaan berkas bahan ajar digital oleh guru, pengunduhan signed URL oleh siswa, counter statistik unduhan, dan moderasi pustakawan.
- `cards`: Generator kartu perpustakaan format PDF berstandar ID-1 dengan QR code untuk cetak tunggal maupun massal lembar A4.

### Modified Capabilities
*(Tidak ada modifikasi pada requirement modul sebelumnya).*

## Impact

- Penambahan tabel `teaching_materials` dan bucket Storage `materials` di `supabase/migrations/`.
- Penambahan domain fitur di `src/features/materials/` dan `src/features/cards/`.
- Penambahan rute di `src/routes/_app/bahan-ajar/` dan `src/routes/_app/pustakawan/kartu-anggota.tsx`.
