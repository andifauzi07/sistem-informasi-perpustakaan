# settings Specification

## Purpose
TBD - created by archiving change m4b-reports-dashboard-settings. Update Purpose after archive.
## Requirements
### Requirement: Pengaturan Kebijakan Pinjaman (FR-SET-01, BR-07)
Pustakawan SHALL dapat menyesuaikan kebijakan peminjaman per peran (`loan_policies`) meliputi batas maksimal pinjaman aktif, lama pinjam dalam hari kalender, tarif denda per hari, dan batas hari pengambilan. Perubahan kebijakan tidak memengaruhi peminjaman yang sedang aktif.

#### Scenario: Perubahan tarif denda hanya berlaku untuk pinjaman baru (TC-SET-01)
- **WHEN** pustakawan menaikkan tarif denda harian peran siswa
- **THEN** tarif baru tersimpan di kebijakan, sedangkan pinjaman yang sudah berjalan tetap mempertahankan snapshot tarif lama

---

### Requirement: Profil Perpustakaan dan Data Master Jurusan (FR-SET-02, FR-SET-03)
Pustakawan SHALL dapat mengelola identitas perpustakaan (nama sekolah, alamat, upload logo ke bucket `library-assets`) yang otomatis menjadi kop resmi dokumen laporan dan kartu anggota, serta mengelola data master jurusan.

#### Scenario: Pembaruan profil perpustakaan dan logo (TC-SET-02)
- **WHEN** pustakawan memperbarui nama sekolah dan mengunggah berkas logo baru
- **THEN** informasi profil tersimpan dan otomatis muncul pada kop dokumen cetak laporan dan kartu

#### Scenario: Kelola data master jurusan (TC-SET-03)
- **WHEN** pustakawan menambahkan jurusan baru atau menonaktifkan jurusan lama
- **THEN** pilihan jurusan aktif muncul pada form pendaftaran anggota, sedangkan jurusan nonaktif disembunyikan dari pilihan baru

