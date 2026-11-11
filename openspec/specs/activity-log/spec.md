# activity-log Specification

## Purpose
TBD - created by archiving change m4b-reports-dashboard-settings. Update Purpose after archive.
## Requirements
### Requirement: Pencatatan dan Peninjauan Log Audit Aktivitas (FR-LOG-01, FR-LOG-02)
Sistem SHALL mencatat setiap aksi transaksi sirkulasi, perubahan status eksemplar, penyelesaian denda, dan manajemen akun secara otomatis. Pustakawan SHALL dapat meninjau riwayat log aktivitas tersebut dengan filter jenis aksi, petugas, dan rentang tanggal.

#### Scenario: Pustakawan memfilter log aktivitas
- **WHEN** pustakawan membuka halaman log aktivitas dan memilih filter aksi sirkulasi dalam seminggu terakhir
- **THEN** sistem menyajikan daftar jejak audit lengkap dengan waktu WITA, nama petugas/aktor, entitas yang diubah, dan rincian perubahan

