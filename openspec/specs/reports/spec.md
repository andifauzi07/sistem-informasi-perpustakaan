# reports Specification

## Purpose
TBD - created by archiving change m4b-reports-dashboard-settings. Update Purpose after archive.
## Requirements
### Requirement: Pratinjau Laporan Sirkulasi, Denda, dan Inventaris (FR-RPT-01 s.d. FR-RPT-08, BR-18)
Pustakawan SHALL dapat memilih periode pelaporan (default: bulan berjalan) dan melihat pratinjau tabel untuk 7 jenis laporan: peminjaman, pengembalian, keterlambatan aktif, rekapitulasi denda, inventaris eksemplar per kategori/status, aktivitas peminjaman anggota, dan Top 10 buku paling sering dipinjam.

#### Scenario: Pratinjau laporan peminjaman dengan filter periode (TC-RPT-01)
- **WHEN** pustakawan memilih jenis laporan peminjaman dan mengubah rentang tanggal periode
- **THEN** tabel pratinjau langsung memperbarui baris data sesuai periode kalender WITA yang dipilih

#### Scenario: Laporan keterlambatan memuat estimasi denda (TC-RPT-03)
- **WHEN** pustakawan membuka laporan keterlambatan
- **THEN** sistem menyajikan daftar pinjaman aktif yang melewati jatuh tempo lengkap dengan perhitungan hari terlambat dan estimasi denda harian

#### Scenario: Rekapitulasi denda seimbang (TC-RPT-04)
- **WHEN** pustakawan membuka laporan rekapitulasi denda
- **THEN** sistem menyajikan ringkasan keuangan di mana total denda ditagih sama dengan jumlah denda lunas + belum lunas + dibebaskan

#### Scenario: Laporan inventaris eksemplar per kategori (TC-RPT-05)
- **WHEN** pustakawan membuka laporan inventaris
- **THEN** sistem menyajikan rekap jumlah eksemplar untuk setiap status fisik dan per kelompok kategori buku

---

### Requirement: Ekspor Laporan ke PDF dan Excel (FR-RPT-09)
Pustakawan SHALL dapat mengekspor data laporan yang sedang ditinjau ke dalam format PDF A4 (dengan kop resmi sekolah) dan spreadsheet Excel `.xlsx` dengan isi dan format data yang sama persis dengan tabel pratinjau.

#### Scenario: Ekspor PDF dan Excel identik dengan pratinjau (TC-RPT-02)
- **WHEN** pustakawan menekan tombol ekspor ke PDF atau Excel
- **THEN** sistem mengunduh dokumen yang isinya sama persis dengan tabel pratinjau tanpa perbedaan desimal nominal atau format tanggal

