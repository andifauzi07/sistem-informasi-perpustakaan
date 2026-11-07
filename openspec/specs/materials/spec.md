# materials Specification

## Purpose
TBD - created by archiving change m4a-materials-cards. Update Purpose after archive.
## Requirements
### Requirement: Unggah Bahan Ajar oleh Guru (FR-MAT-01, BR-19)
Pengguna dengan peran `teacher` SHALL dapat mengunggah berkas bahan ajar digital dengan metadata (judul, mata pelajaran, deskripsi, jurusan sasaran, tingkat) serta berkas pendukung (PDF, DOCX, PPTX, XLSX dengan ukuran ≤ 10 MB). Bahan ajar yang diunggah langsung terbit.

#### Scenario: Sukses unggah bahan ajar PDF (TC-MAT-01)
- **WHEN** guru mengunggah berkas bahan ajar format PDF berukuran 5 MB dengan metadata lengkap
- **THEN** sistem menyimpan berkas di bucket `materials`, mencatat rekaman di basis data, dan menerbitkan materi tersebut

#### Scenario: Gagal mengunggah berkas melebihi 10 MB atau tipe terlarang (TC-MAT-02)
- **WHEN** guru mencoba mengunggah berkas berukuran 12 MB atau berekstensi `.exe`
- **THEN** sistem menolak pengunggahan dengan pesan validasi ukuran dan jenis berkas

#### Scenario: Siswa tidak diizinkan mengunggah bahan ajar (TC-MAT-04)
- **WHEN** pengguna dengan peran siswa mencoba mengakses form unggah atau mengirim request upload
- **THEN** antarmuka menyembunyikan aksi dan kebijakan RLS/Storage menolak permintaan

---

### Requirement: Penelusuran dan Unduh Bahan Ajar (FR-MAT-02, FR-MAT-03, FR-MAT-05)
Semua pengguna terotentikasi SHALL dapat mencari dan memfilter bahan ajar yang berstatus terbit. Pengunduhan berkas menggunakan *signed URL* berumur 60 detik dan otomatis menambahkan jumlah counter unduhan.

#### Scenario: Siswa mengunduh bahan ajar via signed URL (TC-MAT-03)
- **WHEN** siswa mengklik tombol unduh pada bahan ajar yang terbit
- **THEN** sistem menghasilkan signed URL berumur 60 detik, memicu pengunduhan berkas di peramban, dan menambahkan counter unduhan

---

### Requirement: Moderasi Bahan Ajar oleh Pustakawan (FR-MAT-04)
Pustakawan SHALL dapat menyembunyikan (*hide*) bahan ajar yang bermasalah dengan alasan tertulis wajib, serta menampilkannya kembali jika sudah sesuai.

#### Scenario: Bahan ajar disembunyikan pustakawan (TC-MAT-05)
- **WHEN** pustakawan menyembunyikan bahan ajar tertentu dengan menyertakan alasan
- **THEN** bahan ajar tersebut tidak lagi tampil di katalog bahan ajar siswa dan tidak dapat diunduh

