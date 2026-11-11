## Why

Pustakawan SMKN 1 Selayar membutuhkan ringkasan metrik KPI, pelaporan otomatis berkala yang dapat diekspor ke PDF/Excel, pengelolaan konfigurasi kebijakan pinjaman dan profil perpustakaan, serta log audit aktivitas sistem untuk akuntabilitas administrasi sekolah. Change ini merealisasikan **Milestone M4B** (PRD §18) untuk melengkapi seluruh kebutuhan manajemen dan analitik perpustakaan.

## What Changes

- **Konfigurasi & Profil Perpustakaan (`settings`)**:
  - Halaman `/pustakawan/pengaturan`: pengelolaan profil sekolah (nama, perpustakaan, alamat, upload logo ke bucket `library-assets`).
  - Pengelolaan kebijakan peminjaman `loan_policies` per peran (maks pinjaman, lama pinjam, tarif denda harian, batas hari ambil).
  - Manajemen data master jurusan (`majors`).
- **Beranda & Dasbor Metrik (`dashboard`)**:
  - Pembaruan `/beranda` untuk siswa/guru: kartu status pinjaman X/maks, jumlah buku terlambat, pengajuan siap diambil beserta batas waktu, total denda belum lunas, dan pintasan cepat.
  - Halaman `/pustakawan/beranda`: ringkasan KPI (pengajuan menunggu, siap diambil, pinjaman aktif, terlambat, denda belum lunas) dan tombol aksi cepat.
- **Laporan & Ekspor (`reports`)**:
  - Halaman `/pustakawan/laporan` dengan pemilih periode (default bulan berjalan) dan pratinjau tabel interaktif.
  - 7 jenis laporan: peminjaman, pengembalian, keterlambatan aktif, rekapitulasi denda, inventaris per kategori/status, aktivitas anggota, dan Top 10 buku sering dipinjam.
  - Ekspor dokumen PDF A4 (dengan kop resmi) via `@react-pdf/renderer` dan dokumen Excel spreadsheet via `write-excel-file` (keduanya lazy-loaded).
- **Log Aktivitas Audit Pustakawan (`activity-log`)**:
  - Halaman `/pustakawan/log-aktivitas` untuk melihat jejak audit perubahan status transaksi sirkulasi, eksemplar, denda, dan data anggota dengan filter aksi, aktor, dan tanggal.

## Cakupan PRD & Milestone

- **Milestone**: M4B — Laporan, Dasbor, Pengaturan & Log (PRD §18).
- **Kebutuhan Fungsional (FR)**: `FR-DSH-01` s.d. `FR-DSH-02`, `FR-RPT-01` s.d. `FR-RPT-09`, `FR-SET-01` s.d. `FR-SET-03`, `FR-LOG-01` s.d. `FR-LOG-02`.
- **Aturan Bisnis (BR)**: `BR-07` (kebijakan baru tidak berlaku surut), `BR-18` (format tanggal dan zona WITA).
- **Kebutuhan Non-Fungsional (NFR)**: `NFR-PE-03` (isolasi library ekspor Excel/PDF), `NFR-US-02`.
- **Di Luar Cakupan (Out of Scope)**:
  - Otomatisasi pengujian komprehensif ISO/IEC 25010 (masuk di M5).
- **Dampak Dokumen Skripsi**: Laporan otomatis menggantikan rekapitulasi manual di buku kas dan buku sirkulasi, menjadi bahan evaluasi kuantitatif pada BAB IV.

## Capabilities

### New Capabilities
- `dashboard`: Dasbor personal anggota (kuota, keterlambatan, denda) dan KPI pustakawan (antrean, stok, piutang denda).
- `reports`: Penelusuran data agregat periodik dan ekspor PDF A4 serta Excel `.xlsx`.
- `settings`: Pengaturan profil sekolah, logo, dan penyesuaian matriks kebijakan pinjaman `loan_policies`.
- `activity-log`: Pemantauan jejak audit perubahan status transaksi oleh petugas perpustakaan.

### Modified Capabilities
*(Tidak ada modifikasi pada requirement modul sebelumnya).*

## Impact

- Penambahan tabel `library_settings` dan RPC agregasi laporan di `supabase/migrations/`.
- Penambahan domain fitur di `src/features/dashboard/`, `reports/`, `settings/`, dan `activity-log/`.
- Penambahan rute laporan, pengaturan, dan log audit di `src/routes/_app/pustakawan/`.
