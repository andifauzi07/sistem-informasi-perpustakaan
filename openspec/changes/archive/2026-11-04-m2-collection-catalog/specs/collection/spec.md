## ADDED Requirements

### Requirement: Pengelolaan Kategori Buku (FR-COL-01)
Pustakawan SHALL dapat melakukan operasi CRUD pada kategori buku dengan nama yang unik dan kode DDC opsional. Kategori yang masih terhubung ke satu atau lebih buku tidak dapat dihapus.

#### Scenario: Sukses menambah kategori baru
- **WHEN** pustakawan menginput nama kategori unik "Teknologi Informasi" dan kode DDC "004"
- **THEN** sistem menyimpan kategori baru dan menampilkannya di daftar kategori pustakawan

#### Scenario: Gagal menghapus kategori yang masih digunakan
- **WHEN** pustakawan mencoba menghapus kategori yang masih memiliki relasi buku di tabel `books`
- **THEN** sistem menolak penghapusan dengan galat relasi basis data dan menampilkan pesan bahwa kategori sedang digunakan

---

### Requirement: Pengelolaan Metadata Buku dan Sampul (FR-COL-02, FR-COL-03)
Pustakawan SHALL dapat mengelola metadata buku (judul, penulis, penerbit, tahun terbit, ISBN, kategori, sinopsis, bahasa, jumlah halaman, edisi, nomor panggil/rak) dan mengunggah sampul buku yang telah dikompresi ke WebP (lebar ≤ 600 px, ukuran ≤ 60 KB) pada bucket `covers`. ISBN unik jika diisi.

#### Scenario: Sukses menambah buku baru dengan sampul (TC-COL-01)
- **WHEN** pustakawan mengisi metadata buku wajib secara lengkap dan mengunggah gambar sampul
- **THEN** peramban mengompresi gambar ke WebP (≤ 600 px, ≤ 60 KB), mengunggah ke bucket `covers`, dan menyimpan rekaman buku baru

#### Scenario: Gagal menyimpan ISBN duplikat (TC-COL-02)
- **WHEN** pustakawan menyimpan buku dengan nomor ISBN yang sudah terdaftar pada buku lain
- **THEN** sistem menolak penyimpanan dengan pesan galat ISBN duplikat

---

### Requirement: Penambahan Eksemplar Buku (FR-COL-04)
Pustakawan SHALL dapat menambahkan satu atau beberapa eksemplar buku sekaligus melalui RPC `add_book_copies` dengan pilihan kode otomatis berurutan (`B000001`...) atau kode manual dari buku induk lama, serta informasi sumber perolehan, tanggal masuk, dan harga opsional.

#### Scenario: Tambah N eksemplar otomatis (TC-COL-03)
- **WHEN** pustakawan menambahkan 5 eksemplar dengan mode otomatis
- **THEN** sistem membuat 5 eksemplar berstatus `available` dengan kode berurutan yang belum pernah digunakan

#### Scenario: Gagal menambah eksemplar dengan kode manual yang sudah terpakai (TC-COL-04)
- **WHEN** pustakawan menambahkan eksemplar menggunakan kode manual yang sudah ada di basis data
- **THEN** sistem membatalkan transaksi dan melempar galat `CODE_TAKEN`

---

### Requirement: Pengelolaan Status Eksemplar Fisik (FR-COL-05, BR-14)
Pustakawan SHALL dapat melihat daftar eksemplar buku dan memperbarui status eksemplar secara manual hanya melalui RPC `set_copy_status` sesuai diagram transisi status (§10.4). Eksemplar yang sedang `reserved` atau `on_loan` tidak dapat diubah secara manual.

#### Scenario: Tandai eksemplar rusak (TC-COL-06)
- **WHEN** pustakawan mengubah status eksemplar dari `available` menjadi `damaged`
- **THEN** status eksemplar diperbarui menjadi `damaged` dan eksemplar tersebut tidak dapat dipinjam maupun dialokasikan

#### Scenario: Gagal melakukan transisi status ilegal
- **WHEN** pustakawan mencoba memanggil `set_copy_status` pada eksemplar yang berstatus `on_loan`
- **THEN** sistem menolak aksi dan melempar galat `INVALID_STATUS_TRANSITION`

---

### Requirement: Cetak Label Barcode Eksemplar (FR-COL-06)
Pustakawan SHALL dapat mencetak label barcode fisik dalam format dokumen PDF A4 untuk eksemplar terpilih atau seluruh eksemplar pada suatu buku. Label memuat barcode Code 128, teks kode eksemplar, dan judul buku singkat.

#### Scenario: Cetak label barcode terbaca (TC-COL-05)
- **WHEN** pustakawan memilih eksemplar buku dan mengklik cetak label
- **THEN** sistem me-render dokumen PDF A4 berisi barcode Code 128 yang dapat dipindai oleh scanner USB maupun kamera

---

### Requirement: Penghapusan Buku Bertransaksi (FR-COL-07, BR-17)
Pustakawan hanya SHALL dapat menghapus judul buku melalui RPC `delete_book` bila tidak ada satu pun eksemplarnya yang pernah muncul dalam riwayat transaksi sirkulasi (`loan_requests` atau `loans`).

#### Scenario: Hapus buku tanpa riwayat transaksi
- **WHEN** pustakawan menghapus buku yang belum pernah dipinjam atau diajukan
- **THEN** data buku beserta seluruh eksemplarnya berhasil dihapus dari sistem

#### Scenario: Gagal menghapus buku yang memiliki riwayat transaksi (TC-COL-07)
- **WHEN** pustakawan mencoba memanggil `delete_book` pada buku yang pernah tercatat di riwayat sirkulasi
- **THEN** sistem membatalkan penghapusan dan melempar galat `BOOK_HAS_HISTORY`
