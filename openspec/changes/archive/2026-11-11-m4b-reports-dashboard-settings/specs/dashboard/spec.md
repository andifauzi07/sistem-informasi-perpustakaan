## ADDED Requirements

### Requirement: Beranda Siswa dan Guru (FR-DSH-01)
Sistem SHALL menyediakan halaman beranda untuk siswa dan guru yang memuat kotak pencarian katalog cepat, status batas pinjaman aktif (X/maks), jumlah pinjaman terlambat, status pengajuan (menunggu atau siap diambil beserta batas waktu), total denda belum lunas, dan tombol pintasan navigasi.

#### Scenario: Beranda siswa menampilkan metrik akurat (TC-DSH-01)
- **WHEN** siswa membuka halaman beranda
- **THEN** sistem menyajikan kartu ringkasan berisi jumlah buku dipinjam, keterlambatan, batas ambil pengajuan, dan denda sesuai data riil

---

### Requirement: Beranda dan KPI Pustakawan (FR-DSH-02)
Sistem SHALL menyediakan halaman beranda pustakawan yang menyajikan ringkasan metrik KPI operasional (pengajuan menunggu, siap diambil, pinjaman aktif, pinjaman terlambat, pengembalian menunggu konfirmasi, dan piutang denda belum lunas) serta tombol pintasan aksi cepat ke modul operasional.

#### Scenario: Dasbor KPI pustakawan (TC-DSH-02)
- **WHEN** pustakawan membuka halaman beranda pustakawan
- **THEN** sistem menampilkan kartu-kartu KPI dengan angka akumulasi akurat dari basis data
