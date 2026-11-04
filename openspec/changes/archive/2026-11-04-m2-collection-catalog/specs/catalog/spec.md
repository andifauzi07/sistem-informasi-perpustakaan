## ADDED Requirements

### Requirement: Pencarian Katalog Buku (FR-CAT-01, FR-CAT-02)
Sistem SHALL menyediakan antarmuka pencarian buku berdasarkan judul, penulis, atau ISBN yang bersifat parsial, tidak peka huruf besar/kecil (case-insensitive), menggunakan *debounce* 300 ms, dan batas minimal 2 karakter, dengan filter kategori, filter "hanya yang tersedia", serta pengurutan yang tersimpan pada URL search params.

#### Scenario: Cari judul parsial dan huruf kecil (TC-CAT-01)
- **WHEN** pengguna mengetikkan teks kueri "pemrograman" pada kolom pencarian
- **THEN** sistem memanggil `search_catalog` setelah debounce 300 ms dan menampilkan daftar buku yang cocok secara parsial

#### Scenario: Filter hanya buku yang tersedia (TC-CAT-02)
- **WHEN** pengguna mengaktifkan centang "hanya yang tersedia"
- **THEN** URL memperbarui parameter pencarian dan hasil hanya menampilkan buku dengan `available_copies > 0`

---

### Requirement: Penayangan Hasil dan Paginasi Katalog (FR-CAT-03)
Sistem SHALL menampilkan daftar hasil pencarian katalog dengan metadata mencakup sampul, judul, penulis, tahun terbit, kategori, dan rasio eksemplar tersedia terhadap total eksemplar, dengan paginasi tepat 20 hasil per halaman.

#### Scenario: Menampilkan hasil katalog dengan ketersediaan akurat
- **WHEN** pengguna membuka halaman katalog buku
- **THEN** sistem menyajikan hingga 20 kartu buku per halaman lengkap dengan jumlah eksemplar tersedia / total eksemplar

---

### Requirement: Rincian Detail Buku dan Indikator Ketersediaan (FR-CAT-04, FR-CAT-05, BR-04)
Sistem SHALL menyediakan halaman rincian detail buku yang memuat metadata lengkap, sinopsis, nomor panggil/lokasi rak, jumlah ketersediaan real-time berdasarkan status eksemplar aktif di basis data, dan tombol "Ajukan Pinjam" (beserta status alasan jika tombol tidak aktif).

#### Scenario: Rincian ketersediaan sesuai status eksemplar (TC-CAT-03)
- **WHEN** pengguna membuka halaman detail buku tertentu
- **THEN** informasi ketersediaan buku yang ditampilkan sama persis dengan kalkulasi eksemplar berstatus `available` di basis data

#### Scenario: Alasan tombol pinjam nonaktif saat stok habis (TC-CAT-04)
- **WHEN** siswa atau guru membuka detail buku yang memiliki 0 eksemplar `available`
- **THEN** sistem menonaktifkan tombol ajukan pinjam dan menampilkan pesan bahwa stok eksemplar sedang habis
